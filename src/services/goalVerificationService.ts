import { prisma } from "../../db.js";

export interface VerificationCriteria {
  type: string; // "COMMIT_CREATED" | "PULL_REQUEST_OPENED" | "PULL_REQUEST_CLOSED" | "PULL_REQUEST_MERGED" | "ISSUE_CREATED" | "ISSUE_CLOSED" | "REVIEW_SUBMITTED" | "ACTIVITY_COUNT" | "HOURS_SPENT"
  activityType?: string;
  requiredCount?: number;
  targetHours?: number;
}

export class GoalVerificationService {
  /**
   * Parse criteria JSON string or fallback to string object
   */
  public parseCriteria(rawCriteria: string | null): VerificationCriteria {
    if (!rawCriteria) {
      return { type: "COMMIT_CREATED" };
    }
    try {
      const parsed = JSON.parse(rawCriteria);
      if (typeof parsed === "object" && parsed.type) {
        return parsed;
      }
    } catch {
      // Fallback string interpretation
      const upper = rawCriteria.trim().toUpperCase();
      if (upper.includes("MERGED")) return { type: "PULL_REQUEST_MERGED" };
      if (upper.includes("PR_OPEN") || upper.includes("PULL_REQUEST_OPENED")) return { type: "PULL_REQUEST_OPENED" };
      if (upper.includes("PR_CLOSE") || upper.includes("PULL_REQUEST_CLOSED")) return { type: "PULL_REQUEST_CLOSED" };
      if (upper.includes("ISSUE_OPEN") || upper.includes("ISSUE_CREATED")) return { type: "ISSUE_CREATED" };
      if (upper.includes("ISSUE_CLOSE") || upper.includes("ISSUE_CLOSED")) return { type: "ISSUE_CLOSED" };
      if (upper.includes("REVIEW")) return { type: "REVIEW_SUBMITTED" };
      if (upper.includes("COMMIT")) return { type: "COMMIT_CREATED" };
    }
    return { type: rawCriteria };
  }

  /**
   * Evaluates if a single ExternalActivity matches the target verification criteria
   */
  public matchesCriteria(criteria: VerificationCriteria, activity: any): boolean {
    const actType = activity.activityType?.toUpperCase() || "";
    let meta: any = null;
    if (activity.metadata) {
      try {
        meta = typeof activity.metadata === "string" ? JSON.parse(activity.metadata) : activity.metadata;
      } catch {
        meta = null;
      }
    }

    switch (criteria.type) {
      case "GITHUB_ACTIVITY":
      case "EXTERNAL_ACTIVITY":
        return true;

      case "COMMIT_CREATED":
        return actType === "GITHUB_COMMIT" || actType === "COMMIT";

      case "PULL_REQUEST_OPENED":
        if (actType !== "GITHUB_PULL_REQUEST" && actType !== "PULL_REQUEST") return false;
        return meta?.action === "opened" || meta?.state === "open" || !meta?.action;

      case "PULL_REQUEST_CLOSED":
        if (actType !== "GITHUB_PULL_REQUEST" && actType !== "PULL_REQUEST") return false;
        return meta?.action === "closed" && !meta?.merged;

      case "PULL_REQUEST_MERGED":
        if (actType !== "GITHUB_PULL_REQUEST" && actType !== "PULL_REQUEST") return false;
        return meta?.action === "closed" && meta?.merged === true || meta?.state === "merged" || meta?.merged === true;

      case "ISSUE_CREATED":
        if (actType !== "GITHUB_ISSUE" && actType !== "ISSUE") return false;
        return meta?.action === "opened" || meta?.state === "open" || !meta?.action;

      case "ISSUE_CLOSED":
        if (actType !== "GITHUB_ISSUE" && actType !== "ISSUE") return false;
        return meta?.action === "closed" || meta?.state === "closed";

      case "REVIEW_SUBMITTED":
        return actType === "GITHUB_REVIEW" || actType === "REVIEW";

      case "ACTIVITY_COUNT":
        if (criteria.activityType) {
          return actType === criteria.activityType.toUpperCase();
        }
        return true;

      case "HOURS_SPENT":
        return true;

      default:
        return actType.includes(criteria.type.toUpperCase());
    }
  }

  /**
   * Calculates dynamic goal progress percentage (0 - 100%) and completed status
   */
  public calculateGoalProgress(
    goal: any,
    matchingActivities: any[]
  ): { progressPercentage: number; isComplete: boolean; currentHours: number } {
    const criteria = this.parseCriteria(goal.verificationCriteria);
    const targetHours = goal.targetHours || 1;

    let progressPercentage = 0;
    let isComplete = false;

    if (criteria.type === "PULL_REQUEST_MERGED" || criteria.type === "PULL_REQUEST_CLOSED" || criteria.type === "ISSUE_CLOSED") {
      // Single event requirement or event-based boolean completion
      const hasMatch = matchingActivities.some((act) => this.matchesCriteria(criteria, act));
      if (hasMatch) {
        progressPercentage = 100;
        isComplete = true;
      } else {
        progressPercentage = matchingActivities.length > 0 ? 50 : 0;
        isComplete = false;
      }
    } else if (criteria.type === "ACTIVITY_COUNT") {
      const requiredCount = criteria.requiredCount || 5;
      const count = matchingActivities.filter((act) => this.matchesCriteria(criteria, act)).length;
      progressPercentage = Math.min(100, Math.round((count / requiredCount) * 100));
      isComplete = count >= requiredCount;
    } else if (criteria.type === "HOURS_SPENT") {
      // Each activity counts as 0.5 hours by default if duration is null
      let totalSecs = 0;
      matchingActivities.forEach((act) => {
        if (act.durationSeconds) {
          totalSecs += act.durationSeconds;
        } else {
          totalSecs += 1800; // 30 mins fallback per activity
        }
      });
      const hours = totalSecs / 3600;
      progressPercentage = Math.min(100, Math.round((hours / targetHours) * 100));
      isComplete = hours >= targetHours;
    } else {
      // Standard count threshold based on targetHours or default 5 activities
      const requiredCount = Math.max(1, Math.round(targetHours));
      const count = matchingActivities.filter((act) => this.matchesCriteria(criteria, act)).length;
      progressPercentage = Math.min(100, Math.round((count / requiredCount) * 100));
      isComplete = count >= requiredCount;
    }

    const currentHours = Number(((progressPercentage / 100) * targetHours).toFixed(2));
    return { progressPercentage, isComplete, currentHours };
  }

  /**
   * Verifies a newly persisted ExternalActivity against all relevant goals belonging to the same user
   */
  public async verifyActivityAgainstGoals(
    activity: any,
    emitSocketCallback?: (payload: any) => void
  ): Promise<any[]> {
    if (!activity || !activity.userId) return [];

    // Find active goals for this user that have integration auto-verify enabled or linked
    const userGoals = await prisma.goal.findMany({
      where: {
        userId: activity.userId,
        status: { in: ["active", "IN_PROGRESS", "NOT_STARTED"] }
      },
      include: {
        integrationLinks: {
          include: { resource: true }
        }
      }
    });

    const updatedGoals: any[] = [];

    for (const goal of userGoals) {
      // 1. User Identity Matching
      if (goal.userId !== activity.userId) continue;

      // 2. Repository / Resource Matching
      let isRepositoryMatch = false;
      const targetRepo = goal.externalRepository?.trim().toLowerCase();

      if (targetRepo) {
        const actRepoId = activity.resourceIdentifier?.trim().toLowerCase();
        const actRepoName = activity.resourceName?.trim().toLowerCase();
        if (actRepoId === targetRepo || actRepoName === targetRepo || (actRepoId && actRepoId.endsWith(`/${targetRepo}`))) {
          isRepositoryMatch = true;
        }
      } else if (goal.externalResourceId) {
        if (activity.resourceId === goal.externalResourceId) {
          isRepositoryMatch = true;
        }
      } else {
        // Goal has no specific repository constraint -> matches any repo from same user integration
        isRepositoryMatch = true;
      }

      if (!isRepositoryMatch) continue;

      // 3. Find all matching activities for this goal & repository
      const allActivitiesForUser = await prisma.externalActivity.findMany({
        where: {
          userId: goal.userId,
          provider: activity.provider || "GITHUB"
        }
      });

      // Filter user activities by repository matching rule
      const relevantActivities = allActivitiesForUser.filter((act) => {
        if (!targetRepo) return true;
        const actRepoId = act.resourceIdentifier?.trim().toLowerCase();
        const actRepoName = act.resourceName?.trim().toLowerCase();
        return actRepoId === targetRepo || actRepoName === targetRepo || (actRepoId && actRepoId.endsWith(`/${targetRepo}`));
      });

      // 4. Calculate progress & completion state
      const { progressPercentage, isComplete, currentHours } = this.calculateGoalProgress(goal, relevantActivities);
      const newStatus = isComplete ? "completed" : (progressPercentage > 0 ? "IN_PROGRESS" : "active");

      // 5. Update Goal record
      const updatedGoal = await prisma.goal.update({
        where: { id: goal.id },
        data: {
          currentHours,
          status: newStatus
        }
      });

      // 6. Update or create GoalIntegrationLink record safely (idempotent verification)
      const existingLink = goal.integrationLinks[0];
      if (existingLink) {
        await prisma.goalIntegrationLink.update({
          where: { id: existingLink.id },
          data: {
            verificationStatus: isComplete ? "VERIFIED" : "PENDING",
            verificationActivityId: isComplete ? activity.id : existingLink.verificationActivityId,
            verifiedAt: isComplete ? new Date() : existingLink.verifiedAt,
            completionSource: "GITHUB_ACTIVITY"
          }
        });
      } else {
        await prisma.goalIntegrationLink.create({
          data: {
            goalId: goal.id,
            integrationId: activity.integrationId,
            resourceId: activity.resourceId,
            externalResourceType: "REPOSITORY",
            externalResourceId: activity.resourceId,
            completionCriteria: goal.verificationCriteria,
            verificationStatus: isComplete ? "VERIFIED" : "PENDING",
            verificationActivityId: isComplete ? activity.id : null,
            verifiedAt: isComplete ? new Date() : null,
            completionSource: "GITHUB_ACTIVITY"
          }
        });
      }

      const socketPayload = {
        goalId: updatedGoal.id,
        userId: updatedGoal.userId,
        status: updatedGoal.status,
        currentHours: updatedGoal.currentHours,
        targetHours: updatedGoal.targetHours,
        progressPercentage,
        verificationStatus: isComplete ? "VERIFIED" : "PENDING",
        completionSource: "GITHUB_ACTIVITY",
        externalProvider: updatedGoal.externalProvider,
        externalRepository: updatedGoal.externalRepository
      };

      if (emitSocketCallback) {
        emitSocketCallback(socketPayload);
      }

      updatedGoals.push(updatedGoal);
    }

    return updatedGoals;
  }

  /**
   * Re-evaluates all pending goals for a user against existing stored ExternalActivities
   */
  public async verifyPendingGoalsForUser(
    userId: string,
    emitSocketCallback?: (payload: any) => void
  ): Promise<any[]> {
    const goals = await prisma.goal.findMany({
      where: { userId },
      include: { integrationLinks: true }
    });

    const results: any[] = [];

    for (const goal of goals) {
      const targetRepo = goal.externalRepository?.trim().toLowerCase();
      const userActivities = await prisma.externalActivity.findMany({
        where: {
          userId,
          provider: goal.externalProvider || "GITHUB"
        }
      });

      const relevantActivities = userActivities.filter((act) => {
        if (!targetRepo) return true;
        const actRepoId = act.resourceIdentifier?.trim().toLowerCase();
        const actRepoName = act.resourceName?.trim().toLowerCase();
        return actRepoId === targetRepo || actRepoName === targetRepo || (actRepoId && actRepoId.endsWith(`/${targetRepo}`));
      });

      const { progressPercentage, isComplete, currentHours } = this.calculateGoalProgress(goal, relevantActivities);
      const newStatus = isComplete ? "completed" : (progressPercentage > 0 ? "IN_PROGRESS" : "active");

      const updatedGoal = await prisma.goal.update({
        where: { id: goal.id },
        data: {
          currentHours,
          status: newStatus
        }
      });

      const existingLink = goal.integrationLinks[0];
      const latestMatchingActivity = relevantActivities[0];

      if (existingLink) {
        await prisma.goalIntegrationLink.update({
          where: { id: existingLink.id },
          data: {
            verificationStatus: isComplete ? "VERIFIED" : "PENDING",
            verificationActivityId: isComplete ? (latestMatchingActivity?.id || existingLink.verificationActivityId) : existingLink.verificationActivityId,
            verifiedAt: isComplete ? new Date() : existingLink.verifiedAt,
            completionSource: "GITHUB_ACTIVITY"
          }
        });
      }

      const socketPayload = {
        goalId: updatedGoal.id,
        userId: updatedGoal.userId,
        status: updatedGoal.status,
        currentHours: updatedGoal.currentHours,
        targetHours: updatedGoal.targetHours,
        progressPercentage,
        verificationStatus: isComplete ? "VERIFIED" : "PENDING",
        completionSource: "GITHUB_ACTIVITY",
        externalProvider: updatedGoal.externalProvider,
        externalRepository: updatedGoal.externalRepository
      };

      if (emitSocketCallback) {
        emitSocketCallback(socketPayload);
      }

      results.push({
        goal: updatedGoal,
        progressPercentage,
        verificationStatus: isComplete ? "VERIFIED" : "PENDING"
      });
    }

    return results;
  }
}

export const goalVerificationService = new GoalVerificationService();
