import { prisma } from "../../db.js";
import { ActivityItem } from "../types.js";

export interface UnifiedTimelineOptions {
  userId?: string;
  userIds?: string[];
  page?: number;
  limit?: number;
  source?: "DESKTOP" | "EXTERNAL";
  provider?: string;
  startDate?: Date;
  endDate?: Date;
  roomId?: string;
  requestingUserId?: string;
}

function parseDurationTextSeconds(durationText: string): number {
  if (!durationText) return 0;
  if (durationText.includes("h") || durationText.includes("m") || durationText.includes("s")) {
    let seconds = 0;
    const hoursMatch = durationText.match(/(\d+)\s*h/);
    const minsMatch = durationText.match(/(\d+)\s*m/);
    const secsMatch = durationText.match(/(\d+)\s*s/);
    if (hoursMatch) seconds += parseInt(hoursMatch[1], 10) * 3600;
    if (minsMatch) seconds += parseInt(minsMatch[1], 10) * 60;
    if (secsMatch) seconds += parseInt(secsMatch[1], 10);
    return seconds;
  }
  const parsed = parseInt(durationText, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export class ActivityService {
  /**
   * Retrieves a unified, normalized, and chronologically sorted activity timeline
   * combining Desktop activity (ActivityLog) and External integration activity (ExternalActivity).
   */
  public async getUnifiedTimeline(options: UnifiedTimelineOptions): Promise<{
    items: ActivityItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));

    let targetUserIds: string[] = [];

    // 1. Room-based target users vs personal target users
    if (options.roomId) {
      if (!options.requestingUserId) {
        throw new Error("Requesting user ID required for room activity access authorization.");
      }

      // Verify room membership
      const room = await (prisma as any).room?.findFirst?.({
        where: {
          id: options.roomId,
          occupants: {
            some: {
              userId: options.requestingUserId
            }
          }
        },
        include: {
          occupants: {
            select: { userId: true }
          }
        }
      });

      // Fallback check if room occupants relation uses a different shape
      if (!room) {
        // Attempt room lookup with standard user check
        const basicRoom = await (prisma as any).room?.findUnique?.({
          where: { id: options.roomId }
        });

        if (!basicRoom) {
          throw new Error("Specified room was not found.");
        }
      }

      if (room && Array.isArray(room.occupants)) {
        targetUserIds = room.occupants.map((o: any) => o.userId).filter(Boolean);
      } else {
        // If room query doesn't match relation, fallback to requesting user
        targetUserIds = [options.requestingUserId];
      }
    } else if (options.userIds && options.userIds.length > 0) {
      targetUserIds = options.userIds;
    } else if (options.userId) {
      targetUserIds = [options.userId];
    } else if (options.requestingUserId) {
      targetUserIds = [options.requestingUserId];
    }

    if (targetUserIds.length === 0) {
      return {
        items: [],
        pagination: { page, limit, total: 0, pages: 0 }
      };
    }

    // 2. Fetch User profiles for display names and avatars
    const userRecords = await prisma.user.findMany({
      where: { id: { in: targetUserIds } },
      select: {
        id: true,
        name: true,
        avatarUrl: true
      }
    });

    const userMap = new Map<string, { name: string; avatarUrl: string }>();
    userRecords.forEach((u: any) => {
      userMap.set(u.id, {
        name: u.name || "Member",
        avatarUrl: u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name || 'User'}`
      });
    });

    let desktopItems: ActivityItem[] = [];
    let externalItems: ActivityItem[] = [];

    // 3. Fetch Desktop ActivityLog entries
    if (!options.source || options.source === "DESKTOP") {
      const desktopWhere: any = {
        userId: { in: targetUserIds }
      };

      if (options.startDate || options.endDate) {
        desktopWhere.timestamp = {};
        if (options.startDate) desktopWhere.timestamp.gte = options.startDate;
        if (options.endDate) desktopWhere.timestamp.lte = options.endDate;
      }

      const rawLogs = await prisma.activityLog.findMany({
        where: desktopWhere,
        orderBy: { timestamp: "desc" },
        take: 500 // Bound fetch for performance prior to merging
      });

      desktopItems = rawLogs.map((log) => {
        const userInfo = userMap.get(log.userId);
        const durationSec = parseDurationTextSeconds(log.durationText);
        return {
          id: log.id,
          userId: log.userId,
          source: "DESKTOP" as const,
          provider: null,
          activityType: "DESKTOP_WINDOW_ACTIVE",
          application: log.app,
          project: log.project,
          summary: `Working in ${log.app} (${log.project})`,
          occurredAt: log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString(),
          durationSeconds: durationSec > 0 ? durationSec : null,
          externalUrl: null,
          metadata: { durationText: log.durationText },
          resourceId: null,
          userName: userInfo?.name,
          userAvatar: userInfo?.avatarUrl
        };
      });
    }

    // 4. Fetch ExternalActivity entries
    if (!options.source || options.source === "EXTERNAL") {
      const externalWhere: any = {
        userId: { in: targetUserIds }
      };

      if (options.provider) {
        externalWhere.provider = options.provider;
      }

      if (options.startDate || options.endDate) {
        externalWhere.occurredAt = {};
        if (options.startDate) externalWhere.occurredAt.gte = options.startDate;
        if (options.endDate) externalWhere.occurredAt.lte = options.endDate;
      }

      const rawExternal = await prisma.externalActivity.findMany({
        where: externalWhere,
        orderBy: { occurredAt: "desc" },
        take: 500
      });

      externalItems = rawExternal.map((act) => {
        const userInfo = userMap.get(act.userId);
        let parsedMeta: any = null;
        if (act.metadata) {
          try {
            parsedMeta = typeof act.metadata === "string" ? JSON.parse(act.metadata) : act.metadata;
          } catch {
            parsedMeta = null;
          }
        }

        let summary = parsedMeta?.what;
        if (!summary) {
          if (parsedMeta?.commitMessage) {
            summary = `Committed '${parsedMeta.commitMessage.split("\n")[0]}'`;
          } else if (parsedMeta?.prTitle) {
            summary = `Pull Request '${parsedMeta.prTitle}'`;
          } else if (parsedMeta?.issueTitle) {
            summary = `Issue '${parsedMeta.issueTitle}'`;
          } else {
            summary = `${act.activityType} in ${act.resourceIdentifier || act.resourceName || "Repository"}`;
          }
        }

        return {
          id: act.id,
          userId: act.userId,
          source: "EXTERNAL" as const,
          provider: act.provider,
          activityType: act.activityType,
          application: act.provider === "GITHUB" ? "GitHub" : act.provider,
          project: act.resourceIdentifier || act.resourceName || "Repository",
          summary,
          occurredAt: act.occurredAt ? new Date(act.occurredAt).toISOString() : new Date().toISOString(),
          durationSeconds: null,
          externalUrl: act.externalUrl,
          metadata: parsedMeta,
          resourceId: act.resourceId,
          userName: userInfo?.name,
          userAvatar: userInfo?.avatarUrl
        };
      });
    }

    // 5. Merge, Deduplicate & Sort chronologically descending
    const combined = [...desktopItems, ...externalItems];
    
    // Deduplicate by ID
    const uniqueMap = new Map<string, ActivityItem>();
    combined.forEach((item) => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });

    const uniqueList = Array.from(uniqueMap.values()).sort((a, b) => {
      return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
    });

    // 6. Pagination
    const total = uniqueList.length;
    const pages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;
    const paginatedItems = uniqueList.slice(skip, skip + limit);

    return {
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    };
  }
}

export const activityService = new ActivityService();
