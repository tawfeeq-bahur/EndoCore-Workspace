import { prisma } from "../../db.js";
import { githubService } from "./githubService.js";
import { githubActivityService } from "./githubActivityService.js";
import { goalVerificationService } from "./goalVerificationService.js";
import { integrationHealthService } from "./integrationHealthService.js";
import { encryptToken, decryptToken } from "../utils/encryption.js";

export interface ReconnectAuthResult {
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scope?: string;
  externalUserId?: string;
  username?: string;
  accountEmail?: string | null;
  avatarUrl?: string | null;
}

export interface ReconciliationResult {
  repositories: { added: number; updated: number; unchanged: number; missing: number };
  activities: { synced: number; created: number; skipped: number };
  goals: { reverified: number; completed: number; updated: number };
  lastReconciledAt: string;
}

export class IntegrationManagementService {
  /**
   * Reconnects an existing UserIntegration with fresh OAuth credentials.
   * NEVER creates a new integration — always updates the existing one.
   * Preserves: ExternalActivity, IntegrationResource, Goal, GoalIntegrationLink, IntegrationSyncLog
   */
  public async reconnectUserIntegration(
    userId: string,
    provider: string,
    authResult: ReconnectAuthResult
  ): Promise<{ success: boolean; integrationId: string; health: string }> {
    const upperProvider = provider.toUpperCase();

    const existing = await prisma.userIntegration.findUnique({
      where: { userId_provider: { userId, provider: upperProvider } }
    });

    if (!existing) {
      throw new Error(`No existing ${upperProvider} integration found for user. Use initial connection flow instead.`);
    }

    // Encrypt new credentials
    const encryptedAccessToken = encryptToken(authResult.accessToken);
    const encryptedRefreshToken = authResult.refreshToken ? encryptToken(authResult.refreshToken) : existing.refreshToken;

    // Update existing integration — preserve ID and all relationships
    await prisma.userIntegration.update({
      where: { id: existing.id },
      data: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: authResult.tokenExpiresAt || null,
        scopes: authResult.scope || existing.scopes,
        externalUserId: authResult.externalUserId ? String(authResult.externalUserId) : existing.externalUserId,
        username: authResult.username || existing.username,
        accountEmail: authResult.accountEmail !== undefined ? authResult.accountEmail : existing.accountEmail,
        avatarUrl: authResult.avatarUrl !== undefined ? authResult.avatarUrl : existing.avatarUrl,
        isConnected: true,
        healthStatus: "HEALTHY",
        lastSyncStatus: "SUCCESS",
        lastSyncError: null,
        rateLimitRemaining: null,
        rateLimitResetAt: null
      }
    });

    return {
      success: true,
      integrationId: existing.id,
      health: "HEALTHY"
    };
  }

  /**
   * Reconciles repositories: fetches current list from GitHub, upserts into IntegrationResource.
   * Does NOT delete historical records. Marks missing repos via metadata.
   */
  public async reconcileRepositories(
    userId: string,
    provider: string
  ): Promise<{ added: number; updated: number; unchanged: number; missing: number }> {
    const upperProvider = provider.toUpperCase();
    const integration = await prisma.userIntegration.findUnique({
      where: { userId_provider: { userId, provider: upperProvider } }
    });

    if (!integration || !integration.isConnected || !integration.accessToken) {
      throw new Error(`${upperProvider} integration is not connected.`);
    }

    const accessToken = decryptToken(integration.accessToken);

    // Use existing githubService.syncUserRepositories which is idempotent
    const { count } = await githubService.syncUserRepositories(userId, integration.id, accessToken);

    // Find current repo external IDs from GitHub
    const currentRepos = await githubService.getRepositories(accessToken);
    const currentExternalIds = new Set(currentRepos.map(r => r.id.toString()));

    // Find existing integration resources
    const existingResources = await prisma.integrationResource.findMany({
      where: {
        integrationId: integration.id,
        provider: upperProvider,
        resourceType: "REPOSITORY"
      }
    });

    let added = 0;
    let updated = 0;
    let unchanged = 0;
    let missing = 0;

    for (const resource of existingResources) {
      if (!currentExternalIds.has(resource.externalId)) {
        // Mark as missing in metadata but preserve the record
        const existingMeta = resource.metadata ? JSON.parse(resource.metadata) : {};
        existingMeta._missing = true;
        existingMeta._missingDetectedAt = new Date().toISOString();
        await prisma.integrationResource.update({
          where: { id: resource.id },
          data: { metadata: JSON.stringify(existingMeta) }
        });
        missing++;
      } else {
        // Clear missing flag if previously set
        if (resource.metadata) {
          try {
            const meta = JSON.parse(resource.metadata);
            if (meta._missing) {
              delete meta._missing;
              delete meta._missingDetectedAt;
              await prisma.integrationResource.update({
                where: { id: resource.id },
                data: { metadata: JSON.stringify(meta) }
              });
              updated++;
            } else {
              unchanged++;
            }
          } catch {
            unchanged++;
          }
        } else {
          unchanged++;
        }
      }
    }

    // Count newly added repos (total from sync minus previously existing)
    added = Math.max(0, count - existingResources.length + missing);

    return { added, updated, unchanged, missing };
  }

  /**
   * Catch-up activity reconciliation: ingests activity missed during downtime.
   * Reuses existing githubActivityService which handles idempotency.
   */
  public async reconcileActivity(
    userId: string,
    provider: string
  ): Promise<{ synced: number; created: number; skipped: number }> {
    const upperProvider = provider.toUpperCase();

    if (upperProvider !== "GITHUB") {
      return { synced: 0, created: 0, skipped: 0 };
    }

    // Reuse the existing sync pipeline which handles idempotency
    const result = await githubActivityService.syncUserGitHubActivity(userId, "MANUAL");

    if (result.inProgress) {
      return { synced: 0, created: 0, skipped: 0 };
    }

    return {
      synced: result.synced,
      created: result.created,
      skipped: result.skipped
    };
  }

  /**
   * Re-evaluates all active/pending goals linked to the provider.
   * Uses existing goalVerificationService.verifyPendingGoalsForUser().
   */
  public async reverifyGoals(
    userId: string,
    provider: string,
    emitSocketCallback?: (payload: any) => void
  ): Promise<{ reverified: number; completed: number; updated: number }> {
    const results = await goalVerificationService.verifyPendingGoalsForUser(userId, emitSocketCallback);

    let completed = 0;
    let updated = 0;

    for (const r of results) {
      if (r.goal.status === "completed") {
        completed++;
      }
      updated++;
    }

    return {
      reverified: results.length,
      completed,
      updated
    };
  }

  /**
   * Returns a comprehensive sanitized integration details report.
   * NEVER includes accessToken, refreshToken, encryption keys, or secrets.
   */
  public async getIntegrationDetails(userId: string, provider: string) {
    const upperProvider = provider.toUpperCase();
    const integration = await prisma.userIntegration.findUnique({
      where: { userId_provider: { userId, provider: upperProvider } },
      include: {
        resources: {
          where: { resourceType: "REPOSITORY" },
          select: {
            id: true,
            name: true,
            identifier: true,
            url: true,
            resourceType: true,
            metadata: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { name: "asc" }
        },
        _count: {
          select: {
            externalActivities: true,
            resources: true,
            goalLinks: true,
            syncLogs: true
          }
        }
      }
    });

    if (!integration) {
      return {
        provider: upperProvider,
        isConnected: false,
        healthStatus: "DISCONNECTED",
        account: null,
        repositoryCount: 0,
        repositories: [],
        activityCount: 0,
        activityBreakdown: { commits: 0, pullRequests: 0, issues: 0, reviews: 0 },
        rateLimit: { remaining: null, resetAt: null, limited: false },
        webhook: { lastReceivedAt: null, lastStatus: null },
        lastSyncStatus: null,
        lastSyncedAt: null,
        lastSyncError: null,
        lastReconciledAt: null,
        recentSyncHistory: [],
        linkedGoals: [],
        syncLogCount: 0
      };
    }

    // Activity breakdown by type
    const activityBreakdown = await prisma.externalActivity.groupBy({
      by: ["activityType"],
      where: { userId, integrationId: integration.id },
      _count: { id: true }
    });

    const breakdown = { commits: 0, pullRequests: 0, issues: 0, reviews: 0 };
    for (const item of activityBreakdown) {
      const t = item.activityType.toUpperCase();
      if (t.includes("COMMIT")) breakdown.commits = item._count.id;
      else if (t.includes("PULL_REQUEST")) breakdown.pullRequests = item._count.id;
      else if (t.includes("ISSUE")) breakdown.issues = item._count.id;
      else if (t.includes("REVIEW")) breakdown.reviews = item._count.id;
    }

    // Recent sync history (last 5)
    const recentSyncHistory = await prisma.integrationSyncLog.findMany({
      where: { integrationId: integration.id },
      orderBy: { startedAt: "desc" },
      take: 5,
      select: {
        id: true,
        syncType: true,
        status: true,
        itemsIngested: true,
        durationMs: true,
        startedAt: true,
        completedAt: true,
        errorMessage: true
      }
    });

    // Linked goals summary
    const linkedGoals = await prisma.goal.findMany({
      where: {
        userId,
        OR: [
          { externalProvider: upperProvider },
          { integrationLinks: { some: { integrationId: integration.id } } }
        ]
      },
      select: {
        id: true,
        title: true,
        status: true,
        targetHours: true,
        currentHours: true,
        verificationCriteria: true,
        externalRepository: true
      }
    });

    const health = integrationHealthService.deriveHealthStatus(integration);
    const isRateLimited = Boolean(integration.rateLimitResetAt && new Date(integration.rateLimitResetAt) > new Date());

    // Sanitized repository list (parse metadata, remove sensitive fields)
    const sanitizedRepos = integration.resources.map(r => {
      let meta: any = null;
      if (r.metadata) {
        try {
          meta = JSON.parse(r.metadata);
        } catch { meta = null; }
      }
      return {
        id: r.id,
        name: r.name,
        identifier: r.identifier,
        url: r.url,
        isMissing: Boolean(meta?._missing),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      };
    });

    // CREDENTIAL LEAKAGE AUDIT: ensure no tokens in output
    return {
      provider: integration.provider,
      isConnected: integration.isConnected,
      healthStatus: health,
      account: {
        username: integration.username || null,
        email: integration.accountEmail || null,
        externalUserId: integration.externalUserId || null,
        avatarUrl: integration.avatarUrl || null
      },
      repositoryCount: integration._count.resources,
      repositories: sanitizedRepos,
      activityCount: integration._count.externalActivities,
      activityBreakdown: breakdown,
      rateLimit: {
        remaining: integration.rateLimitRemaining,
        resetAt: integration.rateLimitResetAt,
        limited: isRateLimited
      },
      webhook: {
        lastReceivedAt: integration.lastWebhookReceivedAt,
        lastStatus: integration.lastWebhookStatus
      },
      lastSyncStatus: integration.lastSyncStatus,
      lastSyncedAt: integration.lastSyncedAt,
      lastSyncError: integration.lastSyncError,
      lastReconciledAt: integration.lastReconciledAt,
      recentSyncHistory,
      linkedGoals,
      syncLogCount: integration._count.syncLogs
    };
  }

  /**
   * Resets transient error state if the integration is connected and not in a permanent failure state.
   */
  public async resetTransientError(
    userId: string,
    provider: string
  ): Promise<{ success: boolean; healthStatus: string }> {
    const upperProvider = provider.toUpperCase();
    const integration = await prisma.userIntegration.findUnique({
      where: { userId_provider: { userId, provider: upperProvider } }
    });

    if (!integration) {
      return { success: false, healthStatus: "DISCONNECTED" };
    }

    // Do not override permanent failure states
    if (integration.healthStatus === "AUTH_REQUIRED" || !integration.isConnected) {
      return { success: false, healthStatus: integration.healthStatus };
    }

    // Do not override active rate limiting
    if (integration.rateLimitResetAt && new Date(integration.rateLimitResetAt) > new Date()) {
      return { success: false, healthStatus: "RATE_LIMITED" };
    }

    const previousHealth = integration.healthStatus;
    const updated = await prisma.userIntegration.update({
      where: { id: integration.id },
      data: {
        healthStatus: "HEALTHY",
        lastSyncError: null,
        lastSyncStatus: "SUCCESS",
        lastWebhookStatus: integration.lastWebhookStatus === "FAILED" || integration.lastWebhookStatus === "REJECTED" ? "PROCESSED" : integration.lastWebhookStatus
      }
    });

    const finalHealth = integrationHealthService.deriveHealthStatus(updated);

    return {
      success: true,
      healthStatus: finalHealth
    };
  }
}

export const integrationManagementService = new IntegrationManagementService();
