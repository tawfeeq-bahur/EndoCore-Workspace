import crypto from "crypto";
import { prisma } from "../../db.js";
import { goalVerificationService } from "./goalVerificationService.js";
import { integrationHealthService } from "./integrationHealthService.js";

/**
 * EndoCore Privacy Statement:
 * EndoCore does not monitor local terminal or Git commands.
 * GitHub activity is ingested exclusively from GitHub Webhooks, GitHub API polling, and reconciliation.
 */
export class GitHubWebhookService {
  /**
   * HMAC SHA-256 Webhook Signature Verification using timingSafeEqual
   */
  public verifySignature(
    rawBody: Buffer | string,
    signatureHeader: string | undefined,
    secretOverride?: string
  ): boolean {
    const secret = secretOverride || process.env.GITHUB_WEBHOOK_SECRET;

    if (!signatureHeader || !secret || !rawBody) {
      return false;
    }

    const parts = signatureHeader.split("=");
    if (parts.length !== 2 || parts[0] !== "sha256") {
      return false;
    }

    const signature = parts[1];
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(rawBody);
    const digest = hmac.digest("hex");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, "utf8"),
        Buffer.from(digest, "utf8")
      );
    } catch {
      return false;
    }
  }

  /**
   * Processes an incoming GitHub webhook event payload safely
   */
  public async processWebhookEvent(
    eventType: string,
    deliveryId: string,
    payload: any,
    callbacks?: {
      onNewActivity?: (activity: any) => void;
      onGoalProgressUpdate?: (payload: any) => void;
    }
  ): Promise<{ success: boolean; createdCount: number; message?: string }> {
    if (!payload || !payload.repository) {
      return { success: true, createdCount: 0, message: "No repository payload provided" };
    }

    const repoFullName = (payload.repository.full_name || payload.repository.name || "").trim();
    if (!repoFullName) {
      return { success: true, createdCount: 0, message: "Missing repository name" };
    }

    // 1. Repository Matching: Locate synchronized IntegrationResource
    const repoResource = await prisma.integrationResource.findFirst({
      where: {
        provider: "GITHUB",
        OR: [
          { identifier: repoFullName },
          { name: repoFullName },
          { identifier: { endsWith: `/${repoFullName}` } }
        ]
      },
      include: {
        userIntegration: true
      }
    });

    if (!repoResource || !repoResource.userIntegration || !repoResource.userIntegration.isConnected) {
      return { success: true, createdCount: 0, message: `No active integration found for repository ${repoFullName}` };
    }

    const integration = repoResource.userIntegration;
    const userId = integration.userId;

    // 2. User Identity Matching: Ensure GitHub actor matches connected user
    const sender = payload.sender;
    const senderId = sender ? String(sender.id) : null;
    const senderLogin = sender ? String(sender.login).toLowerCase() : null;

    let isIdentityMatched = false;
    if (senderId && String(integration.externalUserId) === senderId) {
      isIdentityMatched = true;
    } else if (senderLogin && integration.username && integration.username.toLowerCase() === senderLogin) {
      isIdentityMatched = true;
    }

    let createdCount = 0;

    // 3. Event Normalization & Activity Persistence
    if (eventType === "push") {
      const commits = payload.commits || [];
      for (const commit of commits) {
        // Check commit author/committer against connected user identity
        const commitAuthorUser = commit.author?.username?.toLowerCase();
        const commitAuthorEmail = commit.author?.email?.toLowerCase();
        const matchesCommitUser =
          isIdentityMatched ||
          (commitAuthorUser && integration.username?.toLowerCase() === commitAuthorUser) ||
          (commitAuthorEmail && integration.accountEmail?.toLowerCase() === commitAuthorEmail);

        if (!matchesCommitUser) continue;

        const sha = commit.id || commit.sha;
        const externalActivityId = `commit:${repoResource.externalId}:${sha}`;
        const metadata = {
          what: `Committed '${(commit.message || "").split("\n")[0]}'`,
          commitMessage: commit.message,
          author: commit.author,
          added: commit.added,
          modified: commit.modified,
          removed: commit.removed
        };

        const result = await this.saveExternalActivity({
          userId,
          integrationId: integration.id,
          resourceId: repoResource.id,
          provider: "GITHUB",
          externalActivityId,
          activityType: "GITHUB_COMMIT",
          resourceType: "REPOSITORY",
          resourceName: repoResource.name,
          resourceIdentifier: repoResource.identifier,
          externalUrl: commit.url || commit.html_url || payload.repository.html_url,
          metadata: JSON.stringify(metadata),
          occurredAt: commit.timestamp ? new Date(commit.timestamp) : new Date(),
          source: "WEBHOOK"
        }, callbacks);

        if (result.isNew) createdCount++;
      }
    } else if (eventType === "pull_request") {
      const action = payload.action;
      if (["opened", "closed", "reopened"].includes(action)) {
        if (!isIdentityMatched) {
          await integrationHealthService.recordWebhookStatus(integration.id, "REJECTED");
          return { success: true, createdCount: 0, message: "Actor identity did not match connected user" };
        }

        const pr = payload.pull_request;
        const isMerged = Boolean(pr.merged || (action === "closed" && pr.merged_at));
        const externalActivityId = `pr:${repoResource.externalId}:${pr.id}`;

        const metadata = {
          what: isMerged
            ? `Merged Pull Request #${pr.number}: '${pr.title}'`
            : `${action.charAt(0).toUpperCase() + action.slice(1)} Pull Request #${pr.number}: '${pr.title}'`,
          action,
          merged: isMerged,
          prNumber: pr.number,
          prTitle: pr.title,
          state: pr.state
        };

        const result = await this.saveExternalActivity({
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
          occurredAt: pr.updated_at ? new Date(pr.updated_at) : new Date(),
          source: "WEBHOOK"
        }, callbacks);

        if (result.isNew) createdCount++;
      }
    } else if (eventType === "issues") {
      const action = payload.action;
      if (["opened", "closed", "reopened"].includes(action)) {
        if (!isIdentityMatched) {
          await integrationHealthService.recordWebhookStatus(integration.id, "REJECTED");
          return { success: true, createdCount: 0, message: "Actor identity did not match connected user" };
        }

        const issue = payload.issue;
        const externalActivityId = `issue:${repoResource.externalId}:${issue.id}`;

        const metadata = {
          what: `${action.charAt(0).toUpperCase() + action.slice(1)} Issue #${issue.number}: '${issue.title}'`,
          action,
          issueNumber: issue.number,
          issueTitle: issue.title,
          state: issue.state
        };

        const result = await this.saveExternalActivity({
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
          occurredAt: issue.updated_at ? new Date(issue.updated_at) : new Date(),
          source: "WEBHOOK"
        }, callbacks);

        if (result.isNew) createdCount++;
      }
    } else if (eventType === "pull_request_review") {
      const action = payload.action;
      if (action === "submitted") {
        if (!isIdentityMatched) {
          await integrationHealthService.recordWebhookStatus(integration.id, "REJECTED");
          return { success: true, createdCount: 0, message: "Actor identity did not match connected user" };
        }

        const review = payload.review;
        const pr = payload.pull_request;
        const externalActivityId = `review:${repoResource.externalId}:${review.id}`;

        const metadata = {
          what: `Submitted review on Pull Request #${pr.number}: '${pr.title}'`,
          action,
          reviewId: review.id,
          state: review.state
        };

        const result = await this.saveExternalActivity({
          userId,
          integrationId: integration.id,
          resourceId: repoResource.id,
          provider: "GITHUB",
          externalActivityId,
          activityType: "GITHUB_REVIEW",
          resourceType: "REPOSITORY",
          resourceName: repoResource.name,
          resourceIdentifier: repoResource.identifier,
          externalUrl: review.html_url || pr.html_url,
          metadata: JSON.stringify(metadata),
          occurredAt: review.submitted_at ? new Date(review.submitted_at) : new Date(),
          source: "WEBHOOK"
        }, callbacks);

        if (result.isNew) createdCount++;
      }
    }

    const finalStatus = createdCount > 0 ? "PROCESSED" : "DUPLICATE";
    await integrationHealthService.recordWebhookStatus(integration.id, finalStatus);

    return { success: true, createdCount };
  }

  /**
   * Saves an ExternalActivity idempotently and triggers Goal Verification & Socket updates for new records
   */
  private async saveExternalActivity(
    data: any,
    callbacks?: {
      onNewActivity?: (activity: any) => void;
      onGoalProgressUpdate?: (payload: any) => void;
    }
  ): Promise<{ activity: any; isNew: boolean }> {
    const existing = await prisma.externalActivity.findUnique({
      where: {
        integrationId_externalActivityId: {
          integrationId: data.integrationId,
          externalActivityId: data.externalActivityId
        }
      }
    });

    const saved = await prisma.externalActivity.upsert({
      where: {
        integrationId_externalActivityId: {
          integrationId: data.integrationId,
          externalActivityId: data.externalActivityId
        }
      },
      create: {
        userId: data.userId,
        integrationId: data.integrationId,
        resourceId: data.resourceId,
        provider: data.provider,
        externalActivityId: data.externalActivityId,
        activityType: data.activityType,
        resourceType: data.resourceType,
        resourceName: data.resourceName,
        resourceIdentifier: data.resourceIdentifier,
        externalUrl: data.externalUrl,
        metadata: data.metadata,
        occurredAt: data.occurredAt,
        receivedAt: new Date(),
        source: data.source || "WEBHOOK"
      },
      update: {
        externalUrl: data.externalUrl,
        metadata: data.metadata,
        occurredAt: data.occurredAt
      }
    });

    const isNew = !existing;

    if (isNew) {
      // 1. Run automatic goal verification engine for new webhook activity
      goalVerificationService
        .verifyActivityAgainstGoals(saved, callbacks?.onGoalProgressUpdate)
        .catch((err) => console.warn("Error verifying webhook activity against goals:", err));

      // 2. Trigger real-time activity timeline broadcast callback
      if (callbacks?.onNewActivity) {
        callbacks.onNewActivity(saved);
      }
    }

    return { activity: saved, isNew };
  }
}

export const githubWebhookService = new GitHubWebhookService();
