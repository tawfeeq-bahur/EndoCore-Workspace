import { prisma } from "../../db.js";

export class IntegrationHealthService {
  private activeSyncLocks = new Map<string, boolean>();

  /**
   * Derive integration health status dynamically based on operational state
   */
  public deriveHealthStatus(integration: any): "HEALTHY" | "WARNING" | "RATE_LIMITED" | "AUTH_REQUIRED" | "DISCONNECTED" | "ERROR" {
    if (!integration) return "DISCONNECTED";

    if (!integration.isConnected) {
      if (integration.healthStatus === "AUTH_REQUIRED" || integration.lastSyncStatus === "AUTH_REQUIRED") {
        return "AUTH_REQUIRED";
      }
      return "DISCONNECTED";
    }

    if (integration.healthStatus === "AUTH_REQUIRED" || integration.lastSyncStatus === "AUTH_REQUIRED") {
      return "AUTH_REQUIRED";
    }

    if (integration.rateLimitResetAt) {
      if (new Date(integration.rateLimitResetAt) > new Date()) {
        return "RATE_LIMITED";
      }
    } else if (integration.healthStatus === "RATE_LIMITED" || integration.lastSyncStatus === "RATE_LIMITED") {
      return "RATE_LIMITED";
    }

    if (integration.lastSyncStatus === "FAILED" || integration.healthStatus === "ERROR") {
      return "ERROR";
    }

    if (integration.healthStatus === "WARNING" || integration.lastWebhookStatus === "FAILED") {
      return "WARNING";
    }

    return "HEALTHY";
  }

  /**
   * Acquire centralized in-memory sync lock per integration
   */
  public acquireSyncLock(integrationId: string): boolean {
    if (this.activeSyncLocks.get(integrationId)) {
      return false; // Lock already held
    }
    this.activeSyncLocks.set(integrationId, true);
    return true;
  }

  /**
   * Release centralized in-memory sync lock per integration
   */
  public releaseSyncLock(integrationId: string): void {
    this.activeSyncLocks.delete(integrationId);
  }

  /**
   * Check if sync is currently running for integration
   */
  public isSyncing(integrationId: string): boolean {
    return Boolean(this.activeSyncLocks.get(integrationId));
  }

  /**
   * Gets sanitized integration status without exposing credentials
   */
  public async getIntegrationStatus(userId: string, provider: string) {
    const integration = await prisma.userIntegration.findUnique({
      where: { userId_provider: { userId, provider: provider.toUpperCase() } },
      include: {
        _count: {
          select: {
            resources: true,
            externalActivities: true
          }
        }
      }
    });

    if (!integration) {
      return {
        provider: provider.toUpperCase(),
        connected: false,
        health: "DISCONNECTED",
        account: null,
        repositoryCount: 0,
        activityCount: 0,
        lastSyncedAt: null,
        lastSyncStatus: null,
        lastSyncError: null,
        lastWebhookReceivedAt: null,
        lastWebhookStatus: null,
        rateLimit: { limited: false, remaining: null, resetAt: null },
        syncMode: "WEBHOOK_AND_POLLING"
      };
    }

    const health = this.deriveHealthStatus(integration);
    const isRateLimited = Boolean(integration.rateLimitResetAt && new Date(integration.rateLimitResetAt) > new Date());

    return {
      provider: integration.provider,
      connected: integration.isConnected,
      health,
      account: {
        username: integration.username || null,
        email: integration.accountEmail || null,
        externalUserId: integration.externalUserId || null
      },
      repositoryCount: integration._count.resources,
      activityCount: integration._count.externalActivities,
      lastSyncedAt: integration.lastSyncedAt,
      lastSyncStatus: integration.lastSyncStatus,
      lastSyncError: integration.lastSyncError,
      lastWebhookReceivedAt: integration.lastWebhookReceivedAt,
      lastWebhookStatus: integration.lastWebhookStatus,
      rateLimit: {
        limited: isRateLimited,
        remaining: integration.rateLimitRemaining,
        resetAt: integration.rateLimitResetAt
      },
      syncMode: "WEBHOOK_AND_POLLING"
    };
  }

  /**
   * Creates a new IntegrationSyncLog entry
   */
  public async createSyncLog(integrationId: string, provider: string, syncType: "MANUAL" | "POLLING" | "WEBHOOK"): Promise<string> {
    const log = await prisma.integrationSyncLog.create({
      data: {
        integrationId,
        provider,
        syncType,
        status: "RUNNING",
        startedAt: new Date()
      }
    });

    await prisma.userIntegration.update({
      where: { id: integrationId },
      data: { lastSyncStatus: "RUNNING" }
    });

    return log.id;
  }

  /**
   * Completes an IntegrationSyncLog entry safely
   */
  public async finishSyncLog(
    logId: string,
    integrationId: string,
    stats: {
      status: "SUCCESS" | "FAILED" | "RATE_LIMITED" | "AUTH_REQUIRED" | "SKIPPED";
      itemsIngested?: number;
      errorMessage?: string;
    }
  ): Promise<void> {
    const existingLog = await prisma.integrationSyncLog.findUnique({ where: { id: logId } });
    const completedAt = new Date();
    const durationMs = existingLog ? completedAt.getTime() - new Date(existingLog.startedAt).getTime() : 0;

    const sanitizedError = stats.errorMessage ? stats.errorMessage.slice(0, 500) : null;

    await prisma.integrationSyncLog.update({
      where: { id: logId },
      data: {
        status: stats.status,
        itemsIngested: stats.itemsIngested || 0,
        errorMessage: sanitizedError,
        durationMs,
        completedAt
      }
    });

    let healthStatus = stats.status === "SUCCESS" ? "HEALTHY" : stats.status;
    if (stats.status === "SKIPPED") healthStatus = "HEALTHY";

    await prisma.userIntegration.update({
      where: { id: integrationId },
      data: {
        lastSyncedAt: completedAt,
        lastSyncStatus: stats.status,
        lastSyncError: sanitizedError,
        healthStatus
      }
    });
  }

  /**
   * Record Authentication failure (401) without deleting historical data
   */
  public async recordAuthFailure(integrationId: string, errorMessage: string): Promise<void> {
    const sanitizedError = errorMessage ? errorMessage.slice(0, 500) : "Authentication failed (401 Unauthorized)";

    await prisma.userIntegration.update({
      where: { id: integrationId },
      data: {
        isConnected: false,
        healthStatus: "AUTH_REQUIRED",
        lastSyncStatus: "AUTH_REQUIRED",
        lastSyncError: sanitizedError
      }
    });
  }

  /**
   * Record Rate-limit state
   */
  public async recordRateLimit(integrationId: string, remaining: number, resetAt: Date): Promise<void> {
    await prisma.userIntegration.update({
      where: { id: integrationId },
      data: {
        healthStatus: "RATE_LIMITED",
        lastSyncStatus: "RATE_LIMITED",
        rateLimitRemaining: remaining,
        rateLimitResetAt: resetAt,
        lastSyncError: `GitHub API rate limit reached. Resets at ${resetAt.toISOString()}`
      }
    });
  }

  /**
   * Record Webhook processing status
   */
  public async recordWebhookStatus(
    integrationId: string,
    status: "PROCESSED" | "DUPLICATE" | "IGNORED" | "REJECTED" | "FAILED"
  ): Promise<void> {
    await prisma.userIntegration.update({
      where: { id: integrationId },
      data: {
        lastWebhookReceivedAt: new Date(),
        lastWebhookStatus: status
      }
    });
  }

  /**
   * Fetch paginated sync history for an integration safely
   */
  public async getSyncHistory(
    userId: string,
    provider: string,
    options: { page?: number; limit?: number; status?: string }
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const integration = await prisma.userIntegration.findUnique({
      where: { userId_provider: { userId, provider: provider.toUpperCase() } }
    });

    if (!integration) {
      return {
        items: [],
        pagination: { page, limit, total: 0, pages: 0 }
      };
    }

    const where: any = { integrationId: integration.id };
    if (options.status) {
      where.status = options.status.toUpperCase();
    }

    const [items, total] = await Promise.all([
      prisma.integrationSyncLog.findMany({
        where,
        orderBy: { startedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          provider: true,
          syncType: true,
          status: true,
          itemsIngested: true,
          errorMessage: true,
          durationMs: true,
          startedAt: true,
          completedAt: true
        }
      }),
      prisma.integrationSyncLog.count({ where })
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1
      }
    };
  }
}

export const integrationHealthService = new IntegrationHealthService();
