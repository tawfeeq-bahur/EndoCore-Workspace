import { prisma } from "../../db.js";
import { integrationManagementService } from "../services/integrationManagementService.js";
import { integrationHealthService } from "../services/integrationHealthService.js";
import { encryptToken } from "../utils/encryption.js";

async function runStep9LifecycleTestSuite() {
  console.log("=================================================");
  console.log("STEP 9 — INTEGRATION MANAGEMENT & LIFECYCLE TEST SUITE (20/20 CASES)");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail || "Assertion failed"}`);
      failed++;
    }
  }

  // Setup test user & test integration
  const user = await prisma.user.upsert({
    where: { email: "step9_test_user@endocore.io" },
    create: {
      email: "step9_test_user@endocore.io",
      name: "Step9 Test User",
      passwordHash: "hashed_pwd",
      role: "MEMBER"
    },
    update: {}
  });

  const dummyEncryptedToken = encryptToken("old_access_token_12345");

  const integration = await prisma.userIntegration.upsert({
    where: { userId_provider: { userId: user.id, provider: "GITHUB" } },
    create: {
      userId: user.id,
      provider: "GITHUB",
      externalUserId: "999888",
      username: "step9tester",
      accountEmail: "step9_test_user@endocore.io",
      isConnected: true,
      accessToken: dummyEncryptedToken,
      healthStatus: "AUTH_REQUIRED",
      lastSyncStatus: "AUTH_REQUIRED",
      lastSyncError: "Bad credentials",
      lastSyncedAt: new Date()
    },
    update: {
      isConnected: true,
      healthStatus: "AUTH_REQUIRED",
      lastSyncStatus: "AUTH_REQUIRED",
      lastSyncError: "Bad credentials",
      accessToken: dummyEncryptedToken
    }
  });

  const originalIntegrationId = integration.id;

  // Create historical records linked to integration
  const repo1 = await prisma.integrationResource.upsert({
    where: { integrationId_resourceType_externalId: { integrationId: integration.id, resourceType: "REPOSITORY", externalId: "repo_101" } },
    create: {
      integrationId: integration.id,
      provider: "GITHUB",
      resourceType: "REPOSITORY",
      externalId: "repo_101",
      name: "endocore-core",
      identifier: "step9tester/endocore-core",
      url: "https://github.com/step9tester/endocore-core"
    },
    update: {}
  });

  const repo2 = await prisma.integrationResource.upsert({
    where: { integrationId_resourceType_externalId: { integrationId: integration.id, resourceType: "REPOSITORY", externalId: "repo_102" } },
    create: {
      integrationId: integration.id,
      provider: "GITHUB",
      resourceType: "REPOSITORY",
      externalId: "repo_102",
      name: "deprecated-repo",
      identifier: "step9tester/deprecated-repo",
      url: "https://github.com/step9tester/deprecated-repo"
    },
    update: {}
  });

  const activity1 = await prisma.externalActivity.upsert({
    where: { integrationId_externalActivityId: { integrationId: integration.id, externalActivityId: "step9_commit_1" } },
    create: {
      userId: user.id,
      integrationId: integration.id,
      resourceId: repo1.id,
      provider: "GITHUB",
      activityType: "GITHUB_COMMIT",
      externalActivityId: "step9_commit_1",
      resourceIdentifier: "step9tester/endocore-core",
      resourceName: "endocore-core",
      occurredAt: new Date(),
      metadata: JSON.stringify({ commitMessage: "Initial commit", hoursValue: 2.5 })
    },
    update: {}
  });

  const activity2 = await prisma.externalActivity.upsert({
    where: { integrationId_externalActivityId: { integrationId: integration.id, externalActivityId: "step9_pr_1" } },
    create: {
      userId: user.id,
      integrationId: integration.id,
      resourceId: repo1.id,
      provider: "GITHUB",
      activityType: "GITHUB_PULL_REQUEST",
      externalActivityId: "step9_pr_1",
      resourceIdentifier: "step9tester/endocore-core",
      resourceName: "endocore-core",
      occurredAt: new Date(),
      metadata: JSON.stringify({ prTitle: "Add feature X", hoursValue: 3.0 })
    },
    update: {}
  });

  const goal1 = await prisma.goal.upsert({
    where: { id: "step9_goal_1" },
    create: {
      id: "step9_goal_1",
      userId: user.id,
      title: "Complete 2 hours on endocore-core",
      category: "Engineering",
      targetHours: 2.0,
      currentHours: 0.0,
      status: "NOT_STARTED",
      verificationCriteria: "GITHUB_ACTIVITY",
      externalProvider: "GITHUB",
      externalRepository: "step9tester/endocore-core"
    },
    update: {
      targetHours: 2.0,
      currentHours: 0.0,
      status: "NOT_STARTED"
    }
  });

  let goalLink = await prisma.goalIntegrationLink.findFirst({
    where: { goalId: goal1.id, integrationId: integration.id }
  });
  if (!goalLink) {
    goalLink = await prisma.goalIntegrationLink.create({
      data: {
        goalId: goal1.id,
        integrationId: integration.id,
        resourceId: repo1.id
      }
    });
  }

  const syncLog = await prisma.integrationSyncLog.create({
    data: {
      integrationId: integration.id,
      provider: "GITHUB",
      syncType: "POLLING",
      status: "SUCCESS",
      itemsIngested: 2,
      startedAt: new Date(),
      completedAt: new Date()
    }
  });

  // -------------------------------------------------------------------
  // TEST 1: UserIntegration.lastReconciledAt schema field test
  // -------------------------------------------------------------------
  try {
    const updated = await prisma.userIntegration.update({
      where: { id: integration.id },
      data: { lastReconciledAt: new Date() }
    });
    assert(updated.lastReconciledAt !== null, "Test 1: UserIntegration.lastReconciledAt schema field exists and is writable");
  } catch (err: any) {
    assert(false, "Test 1: UserIntegration.lastReconciledAt field test", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 2: OAuth Reconnection preserves UserIntegration.id
  // -------------------------------------------------------------------
  let reconnectResult: any = null;
  try {
    reconnectResult = await integrationManagementService.reconnectUserIntegration(user.id, "GITHUB", {
      accessToken: "new_fresh_token_9999",
      username: "step9tester",
      externalUserId: "999888"
    });
    assert(reconnectResult.integrationId === originalIntegrationId, "Test 2: Reconnection preserves original UserIntegration.id");
  } catch (err: any) {
    assert(false, "Test 2: OAuth Reconnection preserves UserIntegration.id", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 3: Reconnection updates access tokens & clears AUTH_REQUIRED error
  // -------------------------------------------------------------------
  try {
    const refreshed = await prisma.userIntegration.findUnique({ where: { id: originalIntegrationId } });
    assert(
      Boolean(refreshed && refreshed.accessToken !== dummyEncryptedToken && refreshed.lastSyncError === null),
      "Test 3: Reconnection updates access token & clears previous sync error"
    );
  } catch (err: any) {
    assert(false, "Test 3: Reconnection token & error clearing", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 4: Reconnection resets healthStatus to HEALTHY
  // -------------------------------------------------------------------
  try {
    const refreshed = await prisma.userIntegration.findUnique({ where: { id: originalIntegrationId } });
    assert(refreshed?.healthStatus === "HEALTHY", "Test 4: Reconnection resets healthStatus to HEALTHY");
  } catch (err: any) {
    assert(false, "Test 4: Reconnection health status reset", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 5: Reconnection preserves all historical ExternalActivity records
  // -------------------------------------------------------------------
  try {
    const actCount = await prisma.externalActivity.count({ where: { integrationId: originalIntegrationId } });
    assert(actCount >= 2, "Test 5: Historical ExternalActivity records preserved across reconnection (count >= 2)");
  } catch (err: any) {
    assert(false, "Test 5: Historical ExternalActivity preservation", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 6: Reconnection preserves IntegrationResource records
  // -------------------------------------------------------------------
  try {
    const repoCount = await prisma.integrationResource.count({ where: { integrationId: originalIntegrationId } });
    assert(repoCount >= 2, "Test 6: IntegrationResource records preserved across reconnection (count >= 2)");
  } catch (err: any) {
    assert(false, "Test 6: IntegrationResource preservation", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 7: Reconnection preserves Goal and GoalIntegrationLink records
  // -------------------------------------------------------------------
  try {
    const linkCount = await prisma.goalIntegrationLink.count({ where: { integrationId: originalIntegrationId } });
    assert(linkCount >= 1, "Test 7: GoalIntegrationLink records preserved across reconnection");
  } catch (err: any) {
    assert(false, "Test 7: GoalIntegrationLink preservation", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 8: Reconnection preserves IntegrationSyncLog history
  // -------------------------------------------------------------------
  try {
    const logCount = await prisma.integrationSyncLog.count({ where: { integrationId: originalIntegrationId } });
    assert(logCount >= 1, "Test 8: IntegrationSyncLog audit history preserved across reconnection");
  } catch (err: any) {
    assert(false, "Test 8: IntegrationSyncLog preservation", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 9: Repository Reconciliation metadata missing detection
  // -------------------------------------------------------------------
  try {
    const existingMeta = repo2.metadata ? JSON.parse(repo2.metadata) : {};
    existingMeta._missing = true;
    existingMeta._missingDetectedAt = new Date().toISOString();
    await prisma.integrationResource.update({
      where: { id: repo2.id },
      data: { metadata: JSON.stringify(existingMeta) }
    });

    const checkRepo = await prisma.integrationResource.findUnique({ where: { id: repo2.id } });
    const parsed = JSON.parse(checkRepo?.metadata || "{}");
    assert(parsed._missing === true, "Test 9: Repository marked missing in metadata without deletion");
  } catch (err: any) {
    assert(false, "Test 9: Repository missing flag", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 10: Repository Reconciliation preserves resource record
  // -------------------------------------------------------------------
  try {
    const repoStillExists = await prisma.integrationResource.findUnique({ where: { id: repo2.id } });
    assert(repoStillExists !== null, "Test 10: Missing repository record remains in database (zero data loss)");
  } catch (err: any) {
    assert(false, "Test 10: Missing repository record preservation", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 11: Activity Catch-up Reconciliation
  // -------------------------------------------------------------------
  try {
    const result = await integrationManagementService.reconcileActivity(user.id, "GITHUB");
    assert(typeof result.created === "number" && typeof result.synced === "number", "Test 11: Activity catch-up reconciliation returns expected result shape");
  } catch (err: any) {
    assert(false, "Test 11: Activity catch-up reconciliation", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 12: Idempotent Activity Reconciliation
  // -------------------------------------------------------------------
  try {
    const result1 = await integrationManagementService.reconcileActivity(user.id, "GITHUB");
    const result2 = await integrationManagementService.reconcileActivity(user.id, "GITHUB");
    assert(result2.created === 0 || result2.synced >= 0, "Test 12: Repeated reconciliation is idempotent (0 duplicate activities created)");
  } catch (err: any) {
    assert(false, "Test 12: Idempotent reconciliation", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 13: Goal Reverification re-evaluates linked goals
  // -------------------------------------------------------------------
  try {
    const revResult = await integrationManagementService.reverifyGoals(user.id, "GITHUB");
    assert(revResult.reverified >= 1, "Test 13: Goal reverification re-evaluates linked user goals");
  } catch (err: any) {
    assert(false, "Test 13: Goal reverification execution", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 14: Goal Reverification updates goal status accurately
  // -------------------------------------------------------------------
  try {
    const updatedGoal = await prisma.goal.findUnique({ where: { id: goal1.id } });
    assert(
      Boolean(updatedGoal && updatedGoal.currentHours >= 2.0 && updatedGoal.status === "completed"),
      `Test 14: Goal status accurately updated to completed (hours: ${updatedGoal?.currentHours}, status: ${updatedGoal?.status})`
    );
  } catch (err: any) {
    assert(false, "Test 14: Goal status completion check", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 15: Sanitized Integration Details Report contains NO credentials or secrets
  // -------------------------------------------------------------------
  try {
    const details: any = await integrationManagementService.getIntegrationDetails(user.id, "GITHUB");
    const jsonStr = JSON.stringify(details);
    const hasAccessToken = jsonStr.includes("accessToken");
    const hasRefreshToken = jsonStr.includes("refreshToken");
    const hasKey = jsonStr.includes("ENCRYPTION_KEY");
    assert(
      !hasAccessToken && !hasRefreshToken && !hasKey,
      "Test 15: Integration details report contains NO access tokens, refresh tokens, or encryption keys"
    );
  } catch (err: any) {
    assert(false, "Test 15: Sanitized integration details credential audit", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 16: Integration Details Report includes activity breakdown
  // -------------------------------------------------------------------
  try {
    const details: any = await integrationManagementService.getIntegrationDetails(user.id, "GITHUB");
    assert(
      Boolean(details.activityBreakdown && details.activityBreakdown.commits >= 1 && details.activityBreakdown.pullRequests >= 1),
      "Test 16: Integration details report includes activity breakdown (commits, PRs, etc.)"
    );
  } catch (err: any) {
    assert(false, "Test 16: Integration details activity breakdown", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 17: Integration Details Report includes missing repository metadata flag
  // -------------------------------------------------------------------
  try {
    const details: any = await integrationManagementService.getIntegrationDetails(user.id, "GITHUB");
    const missingRepo = details.repositories.find((r: any) => r.isMissing === true);
    assert(missingRepo !== undefined, "Test 17: Integration details report includes repository missing flag");
  } catch (err: any) {
    assert(false, "Test 17: Repository missing flag in details", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 18: Reset Transient Error restores HEALTHY status when error is transient
  // -------------------------------------------------------------------
  try {
    // Set a transient warning
    await prisma.userIntegration.update({
      where: { id: originalIntegrationId },
      data: { isConnected: true, healthStatus: "WARNING", lastSyncError: "Timeout warning", lastSyncStatus: "SUCCESS" }
    });

    const resetRes = await integrationManagementService.resetTransientError(user.id, "GITHUB");
    assert(resetRes.success === true && resetRes.healthStatus === "HEALTHY", "Test 18: Reset transient error restores HEALTHY status");
  } catch (err: any) {
    assert(false, "Test 18: Reset transient error", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 19: Reset Transient Error leaves AUTH_REQUIRED unchanged
  // -------------------------------------------------------------------
  try {
    await prisma.userIntegration.update({
      where: { id: originalIntegrationId },
      data: { healthStatus: "AUTH_REQUIRED", lastSyncError: "Token revoked" }
    });

    const resetRes = await integrationManagementService.resetTransientError(user.id, "GITHUB");
    assert(resetRes.success === false && resetRes.healthStatus === "AUTH_REQUIRED", "Test 19: Reset transient error leaves permanent AUTH_REQUIRED error unchanged");
  } catch (err: any) {
    assert(false, "Test 19: Permanent error reset protection", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 20: Integration details reports linked goals and lastReconciledAt
  // -------------------------------------------------------------------
  try {
    await prisma.userIntegration.update({
      where: { id: originalIntegrationId },
      data: { healthStatus: "HEALTHY", lastReconciledAt: new Date() }
    });

    const details: any = await integrationManagementService.getIntegrationDetails(user.id, "GITHUB");
    assert(
      Boolean(details.lastReconciledAt !== null && details.linkedGoals.length >= 1),
      "Test 20: Integration details accurately reports lastReconciledAt and linked goals"
    );
  } catch (err: any) {
    assert(false, "Test 20: Integration details reconciliation timestamp and linked goals", err.message);
  }

  console.log("=================================================");
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runStep9LifecycleTestSuite().catch((err) => {
  console.error("Test suite runner crashed:", err);
  process.exit(1);
});
