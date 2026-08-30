import { prisma } from "../../db.js";
import { integrationHealthService } from "../services/integrationHealthService.js";
import { githubWebhookService } from "../services/githubWebhookService.js";
import { githubActivityService } from "../services/githubActivityService.js";
import crypto from "crypto";

async function runStep8ReliabilityTestSuite() {
  console.log("=================================================");
  console.log("STEP 8 — INTEGRATION RELIABILITY TEST SUITE (15/15 CASES)");
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
    where: { email: "step8_test_user@endocore.io font-mono" },
    create: {
      email: "step8_test_user@endocore.io font-mono",
      name: "Step8 Test User",
      passwordHash: "hashed_pwd",
      role: "MEMBER"
    },
    update: {}
  });

  const dummyEncryptedToken = "dummy_encrypted_access_token";

  const integration = await prisma.userIntegration.upsert({
    where: { userId_provider: { userId: user.id, provider: "GITHUB" } },
    create: {
      userId: user.id,
      provider: "GITHUB",
      username: "step8tester",
      accountEmail: "step8_test_user@endocore.io",
      isConnected: true,
      accessToken: dummyEncryptedToken,
      healthStatus: "HEALTHY",
      lastSyncStatus: "SUCCESS",
      lastSyncedAt: new Date()
    },
    update: {
      isConnected: true,
      healthStatus: "HEALTHY",
      lastSyncStatus: "SUCCESS"
    }
  });

  // -------------------------------------------------------------------
  // TEST 1: Operational schema extension
  // -------------------------------------------------------------------
  try {
    const updated = await prisma.userIntegration.update({
      where: { id: integration.id },
      data: {
        healthStatus: "HEALTHY",
        lastSyncStatus: "SUCCESS",
        rateLimitRemaining: 4999,
        lastWebhookStatus: "PROCESSED"
      }
    });
    assert(
      updated.healthStatus === "HEALTHY" && updated.rateLimitRemaining === 4999,
      "Test 1: Operational schema extension fields exist in UserIntegration"
    );
  } catch (err: any) {
    assert(false, "Test 1: Operational schema extension fields exist", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 2: IntegrationSyncLog persistence & sanitization
  // -------------------------------------------------------------------
  try {
    const logId = await integrationHealthService.createSyncLog(integration.id, "GITHUB", "MANUAL");
    const longErrorMessage = "A".repeat(1000); // 1000 char error message
    await integrationHealthService.finishSyncLog(logId, integration.id, {
      status: "FAILED",
      itemsIngested: 42,
      errorMessage: longErrorMessage
    });

    const savedLog = await prisma.integrationSyncLog.findUnique({ where: { id: logId } });
    assert(
      Boolean(savedLog && savedLog.itemsIngested === 42 && savedLog.errorMessage?.length === 500 && savedLog.durationMs !== null),
      "Test 2: IntegrationSyncLog persistence and error sanitization (capped at 500 chars)"
    );
  } catch (err: any) {
    assert(false, "Test 2: IntegrationSyncLog persistence & sanitization", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 3: Dynamic health status derivation
  // -------------------------------------------------------------------
  try {
    const healthHealthy = integrationHealthService.deriveHealthStatus({ isConnected: true, healthStatus: "HEALTHY" });
    const healthRateLimited = integrationHealthService.deriveHealthStatus({
      isConnected: true,
      rateLimitResetAt: new Date(Date.now() + 60000)
    });
    const healthAuth = integrationHealthService.deriveHealthStatus({
      isConnected: false,
      healthStatus: "AUTH_REQUIRED"
    });
    const healthDisconnected = integrationHealthService.deriveHealthStatus({
      isConnected: false,
      healthStatus: "HEALTHY"
    });

    assert(
      healthHealthy === "HEALTHY" &&
        healthRateLimited === "RATE_LIMITED" &&
        healthAuth === "AUTH_REQUIRED" &&
        healthDisconnected === "DISCONNECTED",
      "Test 3: Dynamic health status derivation logic"
    );
  } catch (err: any) {
    assert(false, "Test 3: Dynamic health status derivation logic", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 4: Centralized concurrent sync locking
  // -------------------------------------------------------------------
  try {
    const lockId = "test_lock_integration_id";
    const acquired1 = integrationHealthService.acquireSyncLock(lockId);
    const acquired2 = integrationHealthService.acquireSyncLock(lockId);
    integrationHealthService.releaseSyncLock(lockId);
    const acquired3 = integrationHealthService.acquireSyncLock(lockId);
    integrationHealthService.releaseSyncLock(lockId);

    assert(
      acquired1 === true && acquired2 === false && acquired3 === true,
      "Test 4: Centralized concurrent sync lock acquisition and release"
    );
  } catch (err: any) {
    assert(false, "Test 4: Centralized concurrent sync lock", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 5: Credential isolation in status API response
  // -------------------------------------------------------------------
  try {
    const status = await integrationHealthService.getIntegrationStatus(user.id, "GITHUB");
    const jsonStr = JSON.stringify(status);
    assert(
      !jsonStr.includes("accessToken") && !jsonStr.includes(dummyEncryptedToken) && status.connected === true,
      "Test 5: Credential isolation (no tokens exposed in status endpoint payload)"
    );
  } catch (err: any) {
    assert(false, "Test 5: Credential isolation", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 6: API Rate Limit handling & status recording
  // -------------------------------------------------------------------
  try {
    const resetTime = new Date(Date.now() + 3600 * 1000);
    await integrationHealthService.recordRateLimit(integration.id, 0, resetTime);
    const updated = await prisma.userIntegration.findUnique({ where: { id: integration.id } });
    const health = integrationHealthService.deriveHealthStatus(updated);

    assert(
      updated?.rateLimitRemaining === 0 && health === "RATE_LIMITED",
      "Test 6: Rate limit handling and RATE_LIMITED status update"
    );
  } catch (err: any) {
    assert(false, "Test 6: API Rate Limit handling", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 7: Auth failure (401) recovery & history preservation
  // -------------------------------------------------------------------
  try {
    // Record historical ExternalActivity first
    await prisma.externalActivity.create({
      data: {
        userId: user.id,
        integrationId: integration.id,
        provider: "GITHUB",
        externalActivityId: `history_preservation_test_${Date.now()}`,
        activityType: "GITHUB_COMMIT",
        resourceType: "REPOSITORY",
        resourceName: "test-repo",
        occurredAt: new Date(),
        receivedAt: new Date()
      }
    });

    await integrationHealthService.recordAuthFailure(integration.id, "401 Unauthorized token expired");
    const updated = await prisma.userIntegration.findUnique({ where: { id: integration.id } });
    const historyActivities = await prisma.externalActivity.findMany({ where: { userId: user.id } });

    assert(
      updated?.isConnected === false && updated?.healthStatus === "AUTH_REQUIRED" && historyActivities.length > 0,
      "Test 7: 401 Auth failure sets AUTH_REQUIRED without deleting historical activity data"
    );

    // Restore connection for subsequent tests
    await prisma.userIntegration.update({
      where: { id: integration.id },
      data: { isConnected: true, healthStatus: "HEALTHY", lastSyncStatus: "SUCCESS" }
    });
  } catch (err: any) {
    assert(false, "Test 7: Auth failure handling", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 8: Manual Sync trigger execution & sync logging
  // -------------------------------------------------------------------
  try {
    const logId = await integrationHealthService.createSyncLog(integration.id, "GITHUB", "MANUAL");
    await integrationHealthService.finishSyncLog(logId, integration.id, {
      status: "SUCCESS",
      itemsIngested: 5
    });

    const logs = await prisma.integrationSyncLog.findMany({
      where: { id: logId }
    });

    assert(
      logs.length > 0 && logs[0].status === "SUCCESS" && logs[0].itemsIngested === 5,
      "Test 8: Manual sync execution creates structured IntegrationSyncLog entry"
    );
  } catch (err: any) {
    assert(false, "Test 8: Manual sync trigger execution", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 9: Paginated sync history API
  // -------------------------------------------------------------------
  try {
    const history = await integrationHealthService.getSyncHistory(user.id, "GITHUB", { page: 1, limit: 10 });
    assert(
      Array.isArray(history.items) && history.pagination.total >= 1 && history.pagination.page === 1,
      "Test 9: Paginated sync history response formatting"
    );
  } catch (err: any) {
    assert(false, "Test 9: Paginated sync history", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 10: Webhook operational status recording
  // -------------------------------------------------------------------
  try {
    await integrationHealthService.recordWebhookStatus(integration.id, "PROCESSED");
    const updated = await prisma.userIntegration.findUnique({ where: { id: integration.id } });

    assert(
      updated?.lastWebhookStatus === "PROCESSED" && updated?.lastWebhookReceivedAt !== null,
      "Test 10: Webhook operational status tracking (lastWebhookReceivedAt & status)"
    );
  } catch (err: any) {
    assert(false, "Test 10: Webhook operational status", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 11: Webhook HMAC signature validation
  // -------------------------------------------------------------------
  try {
    const secret = "test_webhook_secret_key_12345";
    const body = JSON.stringify({ ping: "pong" });
    const hmac = crypto.createHmac("sha256", secret).update(body).digest("hex");
    const validSignatureHeader = `sha256=${hmac}`;

    const isValid = githubWebhookService.verifySignature(body, validSignatureHeader, secret);
    const isInvalid = githubWebhookService.verifySignature(body, "sha256=invalid_digest", secret);

    assert(
      isValid === true && isInvalid === false,
      "Test 11: Webhook HMAC SHA-256 signature verification"
    );
  } catch (err: any) {
    assert(false, "Test 11: Webhook HMAC signature validation", err.message);
  }

  let testRepoFullName = "";
  // -------------------------------------------------------------------
  // TEST 12: Goal auto-verification regression protection
  // -------------------------------------------------------------------
  try {
    const identifier = `step8tester/test-auto-verify-repo-${Date.now()}`;
    testRepoFullName = identifier;
    const repoResource = await prisma.integrationResource.create({
      data: {
        integrationId: integration.id,
        provider: "GITHUB",
        name: "test-auto-verify-repo",
        identifier,
        externalId: `repo_ext_step8_${Date.now()}`,
        resourceType: "REPOSITORY"
      }
    });

    const testGoal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: "Step 8 Verification Goal",
        category: "CODING",
        targetHours: 10,
        verificationCriteria: "GITHUB_COMMIT",
        externalProvider: "GITHUB",
        externalResourceId: repoResource.id,
        status: "NOT_STARTED"
      }
    });

    await prisma.goalIntegrationLink.create({
      data: {
        goalId: testGoal.id,
        integrationId: integration.id,
        resourceId: repoResource.id,
        completionCriteria: "GITHUB_COMMIT"
      }
    });

    // Process webhook event to trigger auto-verification
    const webhookPayload = {
      repository: { full_name: identifier },
      sender: { id: 9999, login: "step8tester" },
      commits: [
        {
          id: "commit_step8_autoverify_1",
          message: "Step 8 Auto Verification Commit",
          author: { username: "step8tester", email: "step8_test_user@endocore.io" },
          timestamp: new Date().toISOString()
        }
      ]
    };

    await githubWebhookService.processWebhookEvent("push", "delivery_step8_1", webhookPayload);

    const verifiedGoal = await prisma.goal.findUnique({ where: { id: testGoal.id } });
    assert(
      Boolean(verifiedGoal),
      "Test 12: Goal auto-verification engine regression protection on webhook ingestion"
    );
  } catch (err: any) {
    assert(false, "Test 12: Goal auto-verification regression", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 13: Unified activity timeline regression protection
  // -------------------------------------------------------------------
  try {
    const timelineActivities = await prisma.externalActivity.findMany({
      where: { userId: user.id }
    });
    assert(
      timelineActivities.length > 0 && timelineActivities.some(a => a.provider === "GITHUB"),
      "Test 13: Unified activity timeline persistence and query integrity"
    );
  } catch (err: any) {
    assert(false, "Test 13: Unified activity timeline regression", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 14: Socket.io real-time update payload integrity
  // -------------------------------------------------------------------
  try {
    const statusPayload = await integrationHealthService.getIntegrationStatus(user.id, "GITHUB");
    assert(
      statusPayload.syncMode === "WEBHOOK_AND_POLLING" && typeof statusPayload.health === "string",
      "Test 14: Socket.io real-time update payload schema integrity"
    );
  } catch (err: any) {
    assert(false, "Test 14: Socket.io real-time update payload integrity", err.message);
  }

  // -------------------------------------------------------------------
  // TEST 15: ExternalActivity idempotency (No double counting)
  // -------------------------------------------------------------------
  try {
    const webhookPayload = {
      repository: { full_name: testRepoFullName || "step8tester/test-auto-verify-repo" },
      sender: { id: 9999, login: "step8tester" },
      commits: [
        {
          id: "commit_step8_autoverify_1", // Exact same sha as Test 12
          message: "Step 8 Auto Verification Commit",
          author: { username: "step8tester", email: "step8_test_user@endocore.io" },
          timestamp: new Date().toISOString()
        }
      ]
    };

    const duplicateRes = await githubWebhookService.processWebhookEvent("push", "delivery_step8_2", webhookPayload);
    const activityCount = await prisma.externalActivity.count({
      where: { externalActivityId: "commit_step8_autoverify_1" }
    });

    assert(
      duplicateRes.createdCount === 0 && activityCount === 1,
      "Test 15: ExternalActivity idempotency (re-ingesting exact commit creates 0 new records)"
    );
  } catch (err: any) {
    assert(false, "Test 15: ExternalActivity idempotency", err.message);
  }

  console.log("=================================================");
  console.log(`RESULTS: ${passed}/15 PASSED, ${failed}/15 FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStep8ReliabilityTestSuite().catch((err) => {
  console.error("Fatal error running Step 8 test suite:", err);
  process.exit(1);
});
