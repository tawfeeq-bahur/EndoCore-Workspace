import { prisma } from "../../db.js";
import {
  githubService,
  GitHubAuthError,
  GitHubRateLimitError
} from "./githubService.js";
import { decryptToken } from "../utils/encryption.js";
import { integrationHealthService } from "./integrationHealthService.js";

export interface SyncResult {
  success: boolean;
  synced: number;
  created: number;
  updated: number;
  skipped: number;
  repositories: number;
  lastSyncedAt: string;
  warning?: string;
  error?: string;
  inProgress?: boolean;
}

export class GitHubActivityService {
  /**
   * Synchronizes GitHub activity (commits, pull requests, issues, reviews)
   * for the specified EndoCore user.
   */
  public async syncUserGitHubActivity(
    userId: string,
    source: "MANUAL" | "POLLING" = "MANUAL",
    onNewActivity?: (createdRecord: any) => void
  ): Promise<SyncResult> {
    const integration = await prisma.userIntegration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: "GITHUB"
        }
      }
    });

    if (!integration || !integration.isConnected || !integration.accessToken) {
      return {
        success: false,
        synced: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        repositories: 0,
        lastSyncedAt: new Date().toISOString(),
        error: "GitHub integration is not connected for this user."
      };
    }

    // Acquire centralized sync lock
    const acquired = integrationHealthService.acquireSyncLock(integration.id);
    if (!acquired) {
      return {
        success: false,
        synced: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        repositories: 0,
        lastSyncedAt: integration.lastSyncedAt ? integration.lastSyncedAt.toISOString() : new Date().toISOString(),
        error: "Synchronization is already in progress for this integration.",
        inProgress: true
      };
    }

    const logId = await integrationHealthService.createSyncLog(integration.id, "GITHUB", source);

    let accessToken = "";
    try {
      accessToken = decryptToken(integration.accessToken);
    } catch (err: any) {
      await integrationHealthService.finishSyncLog(logId, integration.id, {
        status: "FAILED",
        errorMessage: "Failed to decrypt GitHub credentials."
      });
      integrationHealthService.releaseSyncLock(integration.id);
      return {
        success: false,
        synced: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        repositories: 0,
        lastSyncedAt: integration.lastSyncedAt ? integration.lastSyncedAt.toISOString() : new Date().toISOString(),
        error: "Failed to decrypt GitHub credentials."
      };
    }

    try {
      // Verify token & retrieve authenticated GitHub profile
      let githubUser;
      try {
        githubUser = await githubService.getAuthenticatedUser(accessToken);
      } catch (err: any) {
        if (err instanceof GitHubAuthError) {
          await integrationHealthService.recordAuthFailure(integration.id, err.message);
          await integrationHealthService.finishSyncLog(logId, integration.id, {
            status: "AUTH_REQUIRED",
            errorMessage: err.message
          });
          return {
            success: false,
            synced: 0,
            created: 0,
            updated: 0,
            skipped: 0,
            repositories: 0,
            lastSyncedAt: new Date().toISOString(),
            error: "GitHub access token has expired or been revoked. Please reconnect your account."
          };
        } else if (err instanceof GitHubRateLimitError) {
          const rateErr = err as any;
          const resetAt = rateErr.resetAt || new Date(Date.now() + 60 * 60 * 1000);
          await integrationHealthService.recordRateLimit(integration.id, rateErr.remaining || 0, resetAt);
          await integrationHealthService.finishSyncLog(logId, integration.id, {
            status: "RATE_LIMITED",
            errorMessage: err.message
          });
          return {
            success: false,
            synced: 0,
            created: 0,
            updated: 0,
            skipped: 0,
            repositories: 0,
            lastSyncedAt: new Date().toISOString(),
            warning: `GitHub rate limit hit. Resets at ${resetAt.toISOString()}`
          };
        } else if (err?.name === "TypeError" || err?.code === "ENOTFOUND" || err?.message?.includes("fetch failed")) {
          await integrationHealthService.finishSyncLog(logId, integration.id, {
            status: "FAILED",
            errorMessage: "Network error connecting to GitHub API."
          });
          return {
            success: false,
            synced: 0,
            created: 0,
            updated: 0,
            skipped: 0,
            repositories: 0,
            lastSyncedAt: integration.lastSyncedAt ? integration.lastSyncedAt.toISOString() : new Date().toISOString(),
            warning: "Unable to reach GitHub API due to network error."
          };
        }
        throw err;
      }

    const connectedUsername = (integration.username || githubUser.login).trim().toLowerCase();
    const connectedEmail = (integration.accountEmail || githubUser.email || "").trim().toLowerCase();

    // Fetch user repository IntegrationResource records
    let repoResources = await prisma.integrationResource.findMany({
      where: {
        integrationId: integration.id,
        provider: "GITHUB",
        resourceType: "REPOSITORY"
      }
    });

    if (repoResources.length === 0) {
      try {
        await githubService.syncUserRepositories(userId, integration.id, accessToken);
        repoResources = await prisma.integrationResource.findMany({
          where: {
            integrationId: integration.id,
            provider: "GITHUB",
            resourceType: "REPOSITORY"
          }
        });
      } catch (err) {
        console.warn("Could not sync GitHub repository list prior to activity sync:", err);
      }
    }

    // Incremental sync window: lastSyncedAt minus 15 min overlap (or default 7 days)
    let sinceDate: Date;
    if (integration.lastSyncedAt) {
      sinceDate = new Date(integration.lastSyncedAt.getTime() - 15 * 60 * 1000);
    } else {
      sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    let syncedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let rateLimitWarning: string | undefined = undefined;

    for (const repoResource of repoResources) {
      const identifierParts = (repoResource.identifier || "").split("/");
      if (identifierParts.length < 2) continue;

      const [owner, repoName] = identifierParts;

      try {
        // -------------------------------------------------------------
        // 1. COMMITS INGESTION
        // -------------------------------------------------------------
        try {
          const commits = await githubService.getCommitsForRepo(
            accessToken,
            owner,
            repoName,
            githubUser.login,
            sinceDate
          );

          for (const commit of commits) {
            // Identity Verification for Privacy/Ownership Security
            const authorLogin = commit.author?.login?.toLowerCase() || "";
            const committerLogin = commit.committer?.login?.toLowerCase() || "";
            const authorEmail = (commit.commit?.author?.email || "").toLowerCase();
            const committerEmail = (commit.commit?.committer?.email || "").toLowerCase();

            const isMatch =
              authorLogin === connectedUsername ||
              committerLogin === connectedUsername ||
              (connectedEmail && (authorEmail === connectedEmail || committerEmail === connectedEmail));

            if (!isMatch) {
              skippedCount++;
              continue;
            }

            const externalActivityId = `commit:${repoResource.externalId}:${commit.sha}`;
            const firstLineMsg = commit.commit.message.split("\n")[0];
            const occurredAt = new Date(
              commit.commit?.author?.date || commit.commit?.committer?.date || Date.now()
            );

            const metadata = {
              who: `${githubUser.login} (GitHub)`,
              what: `Committed '${firstLineMsg}'`,
              where: repoResource.identifier,
              when: occurredAt.toISOString(),
              link: commit.html_url,
              sha: commit.sha,
              commitMessage: commit.commit.message,
              author: commit.commit?.author?.name || githubUser.login
            };

            const existing = await prisma.externalActivity.findUnique({
              where: {
                integrationId_externalActivityId: {
                  integrationId: integration.id,
                  externalActivityId
                }
              }
            });

            const saved = await prisma.externalActivity.upsert({
              where: {
                integrationId_externalActivityId: {
                  integrationId: integration.id,
                  externalActivityId
                }
              },
              create: {
                userId,
                integrationId: integration.id,
                resourceId: repoResource.id,
                provider: "GITHUB",
                externalActivityId,
                activityType: "GITHUB_COMMIT",
                resourceType: "REPOSITORY",
                resourceName: repoResource.name,
                resourceIdentifier: repoResource.identifier,
                externalUrl: commit.html_url,
                metadata: JSON.stringify(metadata),
                occurredAt,
                receivedAt: new Date(),
                source
              },
              update: {
                externalUrl: commit.html_url,
                metadata: JSON.stringify(metadata),
                occurredAt
              }
            });

            if (existing) {
              updatedCount++;
            } else {
              createdCount++;
              if (onNewActivity) onNewActivity(saved);
            }
            syncedCount++;
          }
        } catch (commitErr) {
          if (commitErr instanceof GitHubRateLimitError) throw commitErr;
          console.warn(`Error fetching commits for ${repoResource.identifier}:`, commitErr);
        }

        // -------------------------------------------------------------
        // 2. PULL REQUESTS INGESTION
        // -------------------------------------------------------------
        try {
          const prs = await githubService.getPullRequestsForRepo(
            accessToken,
            owner,
            repoName,
            sinceDate
          );

          for (const pr of prs) {
            const prUserLogin = (pr.user?.login || "").toLowerCase();
            if (prUserLogin !== connectedUsername) {
              skippedCount++;
              continue;
            }

            const externalActivityId = `pr:${repoResource.externalId}:${pr.id}`;
            const occurredAt = new Date(pr.updated_at || pr.created_at);
            const actionText = pr.merged_at
              ? "Merged pull request"
              : pr.state === "closed"
              ? "Closed pull request"
              : "Opened pull request";

            const metadata = {
              who: `${githubUser.login} (GitHub)`,
              what: `${actionText} #${pr.number}: '${pr.title}'`,
              where: repoResource.identifier,
              when: occurredAt.toISOString(),
              link: pr.html_url,
              prNumber: pr.number,
              prTitle: pr.title,
              state: pr.state,
              merged: !!pr.merged_at
            };

            const existing = await prisma.externalActivity.findUnique({
              where: {
                integrationId_externalActivityId: {
                  integrationId: integration.id,
                  externalActivityId
                }
              }
            });

            const savedPr = await prisma.externalActivity.upsert({
              where: {
                integrationId_externalActivityId: {
                  integrationId: integration.id,
                  externalActivityId
                }
              },
              create: {
                userId,
                integrationId: integration.id,
                resourceId: repoResource.id,
                provider: "GITHUB",
                externalActivityId,
                activityType: "GITHUB_PULL_REQUEST",
                resourceType: "REPOSITORY",
                resourceName: repoResource.name,
                resourceIdentifier: repoResource.identifier,
                externalUrl: pr.html_url,
                metadata: JSON.stringify(metadata),
                occurredAt,
                receivedAt: new Date(),
                source
              },
              update: {
                externalUrl: pr.html_url,
                metadata: JSON.stringify(metadata),
                occurredAt
              }
            });

            if (existing) {
              updatedCount++;
            } else {
              createdCount++;
              if (onNewActivity) onNewActivity(savedPr);
            }
            syncedCount++;

            // -------------------------------------------------------------
            // 3. PULL REQUEST REVIEWS INGESTION
            // -------------------------------------------------------------
            try {
              const reviews = await githubService.getReviewsForPullRequest(
                accessToken,
                owner,
                repoName,
                pr.number
              );

              for (const review of reviews) {
                const reviewerLogin = (review.user?.login || "").toLowerCase();
                if (reviewerLogin !== connectedUsername) {
                  skippedCount++;
                  continue;
                }

                const reviewActivityId = `review:${repoResource.externalId}:${review.id}`;
                const reviewTime = new Date(review.submitted_at || pr.updated_at);
                const reviewMeta = {
                  who: `${githubUser.login} (GitHub)`,
                  what: `Reviewed pull request #${pr.number} (${review.state.toLowerCase()})`,
                  where: repoResource.identifier,
                  when: reviewTime.toISOString(),
                  link: review.html_url || pr.html_url,
                  prNumber: pr.number,
                  reviewState: review.state,
                  reviewSnippet: review.body ? review.body.slice(0, 150) : null
                };

                const existingReview = await prisma.externalActivity.findUnique({
                  where: {
                    integrationId_externalActivityId: {
                      integrationId: integration.id,
                      externalActivityId: reviewActivityId
                    }
                  }
                });

                const savedReview = await prisma.externalActivity.upsert({
                  where: {
                    integrationId_externalActivityId: {
                      integrationId: integration.id,
                      externalActivityId: reviewActivityId
                    }
                  },
                  create: {
                    userId,
                    integrationId: integration.id,
                    resourceId: repoResource.id,
                    provider: "GITHUB",
                    externalActivityId: reviewActivityId,
                    activityType: "GITHUB_REVIEW",
                    resourceType: "REPOSITORY",
                    resourceName: repoResource.name,
                    resourceIdentifier: repoResource.identifier,
                    externalUrl: review.html_url || pr.html_url,
                    metadata: JSON.stringify(reviewMeta),
                    occurredAt: reviewTime,
                    receivedAt: new Date(),
                    source
                  },
                  update: {
                    externalUrl: review.html_url || pr.html_url,
                    metadata: JSON.stringify(reviewMeta),
                    occurredAt: reviewTime
                  }
                });

                if (existingReview) {
                  updatedCount++;
                } else {
                  createdCount++;
                  if (onNewActivity) onNewActivity(savedReview);
                }
                syncedCount++;
              }
            } catch (reviewErr) {
              if (reviewErr instanceof GitHubRateLimitError) throw reviewErr;
            }
          }
        } catch (prErr) {
          if (prErr instanceof GitHubRateLimitError) throw prErr;
          console.warn(`Error fetching PRs for ${repoResource.identifier}:`, prErr);
        }

        // -------------------------------------------------------------
        // 4. ISSUES INGESTION
        // -------------------------------------------------------------
        try {
          const issues = await githubService.getIssuesForRepo(
            accessToken,
            owner,
            repoName,
            sinceDate
          );

          for (const issue of issues) {
            const issueUserLogin = (issue.user?.login || "").toLowerCase();
            if (issueUserLogin !== connectedUsername) {
              skippedCount++;
              continue;
            }

            const externalActivityId = `issue:${repoResource.externalId}:${issue.id}`;
            const occurredAt = new Date(issue.updated_at || issue.created_at);
            const actionText = issue.state === "closed" ? "Closed issue" : "Created issue";

            const metadata = {
              who: `${githubUser.login} (GitHub)`,
              what: `${actionText} #${issue.number}: '${issue.title}'`,
              where: repoResource.identifier,
              when: occurredAt.toISOString(),
              link: issue.html_url,
              issueNumber: issue.number,
              issueTitle: issue.title,
              state: issue.state
            };

            const existing = await prisma.externalActivity.findUnique({
              where: {
                integrationId_externalActivityId: {
                  integrationId: integration.id,
                  externalActivityId
                }
              }
            });

            const savedIssue = await prisma.externalActivity.upsert({
              where: {
                integrationId_externalActivityId: {
                  integrationId: integration.id,
                  externalActivityId
                }
              },
              create: {
                userId,
                integrationId: integration.id,
                resourceId: repoResource.id,
                provider: "GITHUB",
                externalActivityId,
                activityType: "GITHUB_ISSUE",
                resourceType: "REPOSITORY",
                resourceName: repoResource.name,
                resourceIdentifier: repoResource.identifier,
                externalUrl: issue.html_url,
                metadata: JSON.stringify(metadata),
                occurredAt,
                receivedAt: new Date(),
                source
              },
              update: {
                externalUrl: issue.html_url,
                metadata: JSON.stringify(metadata),
                occurredAt
              }
            });

            if (existing) {
              updatedCount++;
            } else {
              createdCount++;
              if (onNewActivity) onNewActivity(savedIssue);
            }
            syncedCount++;
          }
        } catch (issueErr) {
          if (issueErr instanceof GitHubRateLimitError) throw issueErr;
          console.warn(`Error fetching issues for ${repoResource.identifier}:`, issueErr);
        }
      } catch (repoErr) {
        if (repoErr instanceof GitHubRateLimitError) {
          rateLimitWarning = `Rate limit reached during repository synchronization (${repoResource.identifier}). Synchronization paused safely.`;
          console.warn(rateLimitWarning);
          break; // Stop repository loop on rate limit to protect API quota
        }
        console.warn(`Error processing repository ${repoResource.identifier}:`, repoErr);
      }
    }

    const now = new Date();
    await integrationHealthService.finishSyncLog(logId, integration.id, {
      status: rateLimitWarning ? "RATE_LIMITED" : "SUCCESS",
      itemsIngested: createdCount + updatedCount,
      errorMessage: rateLimitWarning
    });

    return {
      success: true,
      synced: syncedCount,
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      repositories: repoResources.length,
      lastSyncedAt: now.toISOString(),
      warning: rateLimitWarning
    };
    } catch (err: any) {
      await integrationHealthService.finishSyncLog(logId, integration.id, {
        status: "FAILED",
        errorMessage: err.message || "Synchronization failed."
      });
      throw err;
    } finally {
      integrationHealthService.releaseSyncLock(integration.id);
    }
  }
}

export const githubActivityService = new GitHubActivityService();
