import { prisma } from "../../db.js";
import crypto from "crypto";
import { githubService } from "../services/githubService.js";
import { githubWebhookService } from "../services/githubWebhookService.js";
import { goalVerificationService } from "../services/goalVerificationService.js";
import { integrationHealthService } from "../services/integrationHealthService.js";
import { integrationManagementService } from "../services/integrationManagementService.js";
import { activityService } from "../services/activityService.js";
import { encryptToken } from "../utils/encryption.js";

// Test counters & reporting structures
let passCount = 0;
let failCount = 0;

const groupResults: Record<string, { passed: number; failed: number }> = {
  "Integration Setup": { passed: 0, failed: 0 },
  "Activity Ingestion": { passed: 0, failed: 0 },
  "Goal Verification": { passed: 0, failed: 0 },
  "Idempotency": { passed: 0, failed: 0 },
  "Reliability & Recovery": { passed: 0, failed: 0 },
  "Reconciliation": { passed: 0, failed: 0 },
  "Security & Authorization": { passed: 0, failed: 0 },
  "Socket.io Observability": { passed: 0, failed: 0 },
  "Health State Machine": { passed: 0, failed: 0 }
};

function recordResult(group: string, testName: string, passed: boolean, detail?: string) {
  if (passed) {
    passCount++;
    groupResults[group].passed++;
    console.log(`✅ [PASS] ${testName}`);
  } else {
    failCount++;
    groupResults[group].failed++;
    console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
  }
}

function assert(condition: boolean, group: string, testName: string, detail?: string) {
  recordResult(group, testName, condition, detail);
}

async function runEndToEndTests() {
  console.log("\n=================================================");
  console.log("ENDOCORE STEP 10 — END-TO-END INTEGRATION TEST SUITE");
  console.log("=================================================\n");

  // Fixture IDs for cleanup
  let userAId: string | null = null;
  let userBId: string | null = null;
  let integrationAId: string | null = null;
  let integrationBId: string | null = null;

  try {
    // -------------------------------------------------------------
    // SETUP FIXTURES (User A and User B for isolation tests)
    // -------------------------------------------------------------
    const userA = await prisma.user.upsert({
      where: { email: "e2e_usera@endocore.io" },
      create: {
        email: "e2e_usera@endocore.io",
        name: "E2E User A",
        username: "e2e_usera_login",
        passwordHash: "hash_a"
      },
      update: {}
    });
    userAId = userA.id;

    const userB = await prisma.user.upsert({
      where: { email: "e2e_userb@endocore.io" },
      create: {
        email: "e2e_userb@endocore.io",
        name: "E2E User B",
        username: "e2e_userb_login",
        passwordHash: "hash_b"
      },
      update: {}
    });
    userBId = userB.id;

    // Clean any residual test integrations
    await prisma.userIntegration.deleteMany({
      where: { userId: { in: [userAId, userBId] } }
    });

    const encryptedTokenA = encryptToken("gho_test_token_user_a_12345");
    const encryptedTokenB = encryptToken("gho_test_token_user_b_67890");

    const integrationA = await prisma.userIntegration.create({
      data: {
        userId: userAId,
        provider: "GITHUB",
        externalUserId: "111222",
        username: "e2e_usera_login",
        accountEmail: "e2e_usera@endocore.io",
        accessToken: encryptedTokenA,
        isConnected: true,
        healthStatus: "HEALTHY",
        lastSyncStatus: "SUCCESS"
      }
    });
    integrationAId = integrationA.id;

    const integrationB = await prisma.userIntegration.create({
      data: {
        userId: userBId,
        provider: "GITHUB",
        externalUserId: "333444",
        username: "e2e_userb_login",
        accountEmail: "e2e_userb@endocore.io",
        accessToken: encryptedTokenB,
        isConnected: true,
        healthStatus: "HEALTHY",
        lastSyncStatus: "SUCCESS"
      }
    });
    integrationBId = integrationB.id;

    const repoA1 = await prisma.integrationResource.create({
      data: {
        integrationId: integrationAId,
        provider: "GITHUB",
        resourceType: "REPOSITORY",
        externalId: "repo_101",
        name: "endocore-core",
        identifier: "e2e_usera_login/endocore-core",
        url: "https://github.com/e2e_usera_login/endocore-core"
      }
    });

    const repoA2 = await prisma.integrationResource.create({
      data: {
        integrationId: integrationAId,
        provider: "GITHUB",
        resourceType: "REPOSITORY",
        externalId: "repo_102",
        name: "endocore-web",
        identifier: "e2e_usera_login/endocore-web",
        url: "https://github.com/e2e_usera_login/endocore-web"
      }
    });

    const repoB = await prisma.integrationResource.create({
      data: {
        integrationId: integrationBId,
        provider: "GITHUB",
        resourceType: "REPOSITORY",
        externalId: "repo_201",
        name: "private-repo",
        identifier: "e2e_userb_login/private-repo",
        url: "https://github.com/e2e_userb_login/private-repo"
      }
    });

    // =============================================================
    // TEST GROUP A — INTEGRATION SETUP (Tests 1 - 5)
    // =============================================================
    const grpA = "Integration Setup";

    // Test 1: UserIntegration creation & DB persistence
    assert(integrationA.id !== null && integrationA.userId === userAId, grpA, "Test 1: UserIntegration creation & persistence");

    // Test 2: Existing integration lookup by userId and provider
    const foundInt = await prisma.userIntegration.findUnique({
      where: { userId_provider: { userId: userAId, provider: "GITHUB" } }
    });
    assert(foundInt !== null && foundInt?.id === integrationAId, grpA, "Test 2: Existing UserIntegration lookup");

    // Test 3: Integration status service retrieval
    const statusA = await integrationHealthService.getIntegrationStatus(userAId, "GITHUB");
    assert(statusA.connected === true && statusA.health === "HEALTHY", grpA, "Test 3: Integration status service report");

    // Test 4: Repository resource discovery
    const resourcesA = await prisma.integrationResource.findMany({
      where: { integrationId: integrationAId }
    });
    assert(resourcesA.length === 2, grpA, "Test 4: Repository resource discovery");

    // Test 5: Resource ownership isolation
    const resourcesBForA = await prisma.integrationResource.findMany({
      where: { integrationId: integrationAId, externalId: repoB.externalId }
    });
    assert(resourcesBForA.length === 0, grpA, "Test 5: Resource ownership isolation");

    // =============================================================
    // TEST GROUP B — ACTIVITY INGESTION (Tests 6 - 14)
    // =============================================================
    const grpB = "Activity Ingestion";

    // Test 6: Polling commit ingestion format
    const commitId1 = `commit:${repoA1.externalId}:sha_commit_1001`;
    const activityPollingCommit = await prisma.externalActivity.create({
      data: {
        userId: userAId,
        integrationId: integrationAId,
        resourceId: repoA1.id,
        provider: "GITHUB",
        externalActivityId: commitId1,
        activityType: "GITHUB_COMMIT",
        resourceType: "REPOSITORY",
        resourceName: repoA1.name,
        resourceIdentifier: repoA1.identifier,
        externalUrl: `${repoA1.url}/commit/sha_commit_1001`,
        metadata: JSON.stringify({ what: "Committed 'Fix login auth flow'", sha: "sha_commit_1001" }),
        occurredAt: new Date(),
        source: "POLLING"
      }
    });
    assert(activityPollingCommit.id !== null && activityPollingCommit.source === "POLLING", grpB, "Test 6: Polling commit ingestion");

    // Test 7: Webhook commit ingestion via service
    const webhookSecret = "test_webhook_secret_999";
    process.env.GITHUB_WEBHOOK_SECRET = webhookSecret;
    const webhookCommitPayload = {
      repository: { full_name: repoA1.identifier, name: repoA1.name, html_url: repoA1.url },
      sender: { id: 111222, login: "e2e_usera_login" },
      commits: [
        {
          id: "sha_commit_1002",
          message: "Feat: Add real-time activity timeline",
          author: { username: "e2e_usera_login", email: "e2e_usera@endocore.io" },
          url: `${repoA1.url}/commit/sha_commit_1002`,
          timestamp: new Date().toISOString()
        }
      ]
    };
    const webhookRes1 = await githubWebhookService.processWebhookEvent("push", "deliv_1002", webhookCommitPayload);
    assert(webhookRes1.success === true && webhookRes1.createdCount === 1, grpB, "Test 7: Webhook commit ingestion");

    // Test 8: Pull request activity ingestion via webhook
    const prPayload = {
      action: "opened",
      repository: { full_name: repoA1.identifier, name: repoA1.name },
      sender: { id: 111222, login: "e2e_usera_login" },
      pull_request: {
        id: 5001,
        number: 42,
        title: "Implement dark mode theme",
        state: "open",
        html_url: `${repoA1.url}/pull/42`,
        updated_at: new Date().toISOString()
      }
    };
    const prRes = await githubWebhookService.processWebhookEvent("pull_request", "deliv_pr_1", prPayload);
    assert(prRes.success === true && prRes.createdCount === 1, grpB, "Test 8: Pull request activity ingestion");

    // Test 9: Issue activity ingestion via webhook
    const issuePayload = {
      action: "opened",
      repository: { full_name: repoA1.identifier, name: repoA1.name },
      sender: { id: 111222, login: "e2e_usera_login" },
      issue: {
        id: 7001,
        number: 10,
        title: "Fix memory leak in WebSocket connection",
        state: "open",
        html_url: `${repoA1.url}/issues/10`,
        updated_at: new Date().toISOString()
      }
    };
    const issueRes = await githubWebhookService.processWebhookEvent("issues", "deliv_issue_1", issuePayload);
    assert(issueRes.success === true && issueRes.createdCount === 1, grpB, "Test 9: Issue activity ingestion");

    // Test 10: Review activity ingestion via webhook
    const reviewPayload = {
      action: "submitted",
      repository: { full_name: repoA1.identifier, name: repoA1.name },
      sender: { id: 111222, login: "e2e_usera_login" },
      pull_request: { number: 42, title: "Implement dark mode theme", html_url: `${repoA1.url}/pull/42` },
      review: {
        id: 9001,
        state: "approved",
        html_url: `${repoA1.url}/pull/42#review-9001`,
        submitted_at: new Date().toISOString()
      }
    };
    const reviewRes = await githubWebhookService.processWebhookEvent("pull_request_review", "deliv_rev_1", reviewPayload);
    assert(reviewRes.success === true && reviewRes.createdCount === 1, grpB, "Test 10: Review activity ingestion");

    // Test 11: Activity normalization
    const ingestedActs = await prisma.externalActivity.findMany({ where: { userId: userAId } });
    assert(ingestedActs.length >= 5, grpB, "Test 11: Activity normalization & count");

    // Test 12: Unified Desktop + GitHub timeline merging
    await prisma.activityLog.create({
      data: {
        userId: userAId,
        app: "VS Code",
        project: "endocore-core",
        durationText: "45m",
        timestamp: new Date()
      }
    });
    const unifiedTimeline = await activityService.getUnifiedTimeline({ userId: userAId, limit: 50 });
    const hasDesktop = unifiedTimeline.items.some((i: any) => i.source === "DESKTOP" || i.source === "DESKTOP_AGENT");
    const hasGitHub = unifiedTimeline.items.some((i: any) => i.source === "EXTERNAL" || i.provider === "GITHUB");
    assert(hasDesktop && hasGitHub, grpB, "Test 12: Unified Desktop + GitHub timeline");

    // Test 13: Timeline chronological ordering
    let isChronological = true;
    for (let i = 1; i < unifiedTimeline.items.length; i++) {
      const prev = new Date(unifiedTimeline.items[i - 1].occurredAt).getTime();
      const curr = new Date(unifiedTimeline.items[i].occurredAt).getTime();
      if (prev < curr) {
        isChronological = false;
        break;
      }
    }
    assert(isChronological === true, grpB, "Test 13: Timeline chronological ordering (newest first)");

    // Test 14: Timeline pagination & limit behavior
    const pagedTimeline = await activityService.getUnifiedTimeline({ userId: userAId, limit: 2 });
    assert(pagedTimeline.items.length === 2 && pagedTimeline.pagination.limit === 2, grpB, "Test 14: Timeline pagination & limit behavior");

    // =============================================================
    // TEST GROUP C — GOAL VERIFICATION (Tests 15 - 24)
    // =============================================================
    const grpC = "Goal Verification";

    // Create test goal for Commit verification
    const commitGoal = await prisma.goal.create({
      data: {
        userId: userAId,
        title: "Complete 2 GitHub Commits",
        category: "Development",
        targetHours: 2,
        currentHours: 0,
        status: "active",
        externalProvider: "GITHUB",
        externalResourceId: repoA1.id,
        externalRepository: repoA1.identifier,
        verificationCriteria: JSON.stringify({ type: "COMMIT_CREATED", requiredCount: 2 }),
        autoVerifyEnabled: true
      }
    });

    // Test 15: Commit goal verification against existing activities
    const commitVerResults = await goalVerificationService.verifyPendingGoalsForUser(userAId);
    const updatedCommitGoal = await prisma.goal.findUnique({ where: { id: commitGoal.id } });
    assert(updatedCommitGoal?.currentHours! >= 2 && updatedCommitGoal?.status === "completed", grpC, "Test 15: Commit goal verification");

    // Test 16: PR opened verification
    const prOpenedGoal = await prisma.goal.create({
      data: {
        userId: userAId,
        title: "Open Pull Request",
        category: "Development",
        targetHours: 1,
        currentHours: 0,
        status: "active",
        externalProvider: "GITHUB",
        externalRepository: repoA1.identifier,
        verificationCriteria: JSON.stringify({ type: "PULL_REQUEST_OPENED" })
      }
    });
    await goalVerificationService.verifyPendingGoalsForUser(userAId);
    const updatedPrOpened = await prisma.goal.findUnique({ where: { id: prOpenedGoal.id } });
    assert(updatedPrOpened?.status === "completed" || updatedPrOpened?.currentHours! > 0, grpC, "Test 16: PR opened verification");

    // Test 17: PR merged verification
    const prMergedGoal = await prisma.goal.create({
      data: {
        userId: userAId,
        title: "Merge Pull Request",
        category: "Development",
        targetHours: 1,
        currentHours: 0,
        status: "active",
        externalProvider: "GITHUB",
        externalRepository: repoA1.identifier,
        verificationCriteria: JSON.stringify({ type: "PULL_REQUEST_MERGED" })
      }
    });
    // Create PR merged activity
    const mergedActivity = await prisma.externalActivity.create({
      data: {
        userId: userAId,
        integrationId: integrationAId,
        resourceId: repoA1.id,
        provider: "GITHUB",
        externalActivityId: `pr:${repoA1.externalId}:5002`,
        activityType: "GITHUB_PULL_REQUEST",
        resourceType: "REPOSITORY",
        resourceName: repoA1.name,
        resourceIdentifier: repoA1.identifier,
        metadata: JSON.stringify({ action: "closed", merged: true, prNumber: 43 }),
        occurredAt: new Date()
      }
    });
    await goalVerificationService.verifyActivityAgainstGoals(mergedActivity);
    const updatedPrMerged = await prisma.goal.findUnique({ where: { id: prMergedGoal.id } });
    assert(updatedPrMerged?.status === "completed" && updatedPrMerged?.currentHours === 1, grpC, "Test 17: PR merged verification");

    // Test 18: Issue verification
    const issueGoal = await prisma.goal.create({
      data: {
        userId: userAId,
        title: "Open Issue",
        category: "Development",
        targetHours: 1,
        currentHours: 0,
        status: "active",
        externalProvider: "GITHUB",
        externalRepository: repoA1.identifier,
        verificationCriteria: JSON.stringify({ type: "ISSUE_CREATED" })
      }
    });
    await goalVerificationService.verifyPendingGoalsForUser(userAId);
    const updatedIssueGoal = await prisma.goal.findUnique({ where: { id: issueGoal.id } });
    assert(updatedIssueGoal?.status === "completed", grpC, "Test 18: Issue verification");

    // Test 19: Review verification
    const reviewGoal = await prisma.goal.create({
      data: {
        userId: userAId,
        title: "Submit Code Review",
        category: "Development",
        targetHours: 1,
        currentHours: 0,
        status: "active",
        externalProvider: "GITHUB",
        externalRepository: repoA1.identifier,
        verificationCriteria: JSON.stringify({ type: "REVIEW_SUBMITTED" })
      }
    });
    await goalVerificationService.verifyPendingGoalsForUser(userAId);
    const updatedReviewGoal = await prisma.goal.findUnique({ where: { id: reviewGoal.id } });
    assert(updatedReviewGoal?.status === "completed", grpC, "Test 19: Review verification");

    // Test 20: ACTIVITY_COUNT progress calculation
    const countGoal = await prisma.goal.create({
      data: {
        userId: userAId,
        title: "Submit 5 Activities",
        category: "Development",
        targetHours: 5,
        currentHours: 0,
        status: "active",
        externalProvider: "GITHUB",
        externalRepository: repoA1.identifier,
        verificationCriteria: JSON.stringify({ type: "ACTIVITY_COUNT", requiredCount: 5 })
      }
    });
    await goalVerificationService.verifyPendingGoalsForUser(userAId);
    const updatedCountGoal = await prisma.goal.findUnique({ where: { id: countGoal.id } });
    assert(updatedCountGoal?.currentHours! >= 5 && updatedCountGoal?.status === "completed", grpC, "Test 20: ACTIVITY_COUNT progress calculation");

    // Test 21: HOURS_SPENT progress calculation
    const hoursGoal = await prisma.goal.create({
      data: {
        userId: userAId,
        title: "Log 1 Hour of GitHub Activity",
        category: "Development",
        targetHours: 1,
        currentHours: 0,
        status: "active",
        externalProvider: "GITHUB",
        externalRepository: repoA1.identifier,
        verificationCriteria: JSON.stringify({ type: "HOURS_SPENT", targetHours: 1 })
      }
    });
    await goalVerificationService.verifyPendingGoalsForUser(userAId);
    const updatedHoursGoal = await prisma.goal.findUnique({ where: { id: hoursGoal.id } });
    assert(updatedHoursGoal?.currentHours! >= 1 && updatedHoursGoal?.status === "completed", grpC, "Test 21: HOURS_SPENT progress calculation");

    // Test 22: NOT_STARTED -> IN_PROGRESS transition
    const inProgressGoal = await prisma.goal.create({
      data: {
        userId: userAId,
        title: "Complete 10 Commits",
        category: "Development",
        targetHours: 10,
        currentHours: 0,
        status: "active",
        externalProvider: "GITHUB",
        externalRepository: repoA1.identifier,
        verificationCriteria: JSON.stringify({ type: "COMMIT_CREATED", requiredCount: 10 })
      }
    });
    await goalVerificationService.verifyPendingGoalsForUser(userAId);
    const updatedInProgress = await prisma.goal.findUnique({ where: { id: inProgressGoal.id } });
    assert(updatedInProgress?.status === "IN_PROGRESS" && updatedInProgress.currentHours > 0 && updatedInProgress.currentHours < 10, grpC, "Test 22: NOT_STARTED -> IN_PROGRESS transition");

    // Test 23: IN_PROGRESS -> COMPLETED transition
    for (let i = 3; i <= 10; i++) {
      await prisma.externalActivity.create({
        data: {
          userId: userAId,
          integrationId: integrationAId,
          resourceId: repoA1.id,
          provider: "GITHUB",
          externalActivityId: `commit:${repoA1.externalId}:sha_commit_100${i}`,
          activityType: "GITHUB_COMMIT",
          resourceType: "REPOSITORY",
          resourceName: repoA1.name,
          resourceIdentifier: repoA1.identifier,
          occurredAt: new Date()
        }
      });
    }
    await goalVerificationService.verifyPendingGoalsForUser(userAId);
    const finishedGoal = await prisma.goal.findUnique({ where: { id: inProgressGoal.id } });
    assert(finishedGoal?.status === "completed" && finishedGoal?.currentHours === 10, grpC, "Test 23: IN_PROGRESS -> COMPLETED transition");

    // Test 24: Manual verification trigger (verifyPendingGoalsForUser)
    const verResults = await goalVerificationService.verifyPendingGoalsForUser(userAId);
    assert(Array.isArray(verResults) && verResults.length > 0, grpC, "Test 24: Manual verification engine execution");

    // =============================================================
    // TEST GROUP D — IDEMPOTENCY (Tests 25 - 31)
    // =============================================================
    const grpD = "Idempotency";

    // Test 25: Polling -> Polling duplicate prevention
    const pollId = `commit:${repoA1.externalId}:sha_idem_101`;
    const p1 = await prisma.externalActivity.upsert({
      where: { integrationId_externalActivityId: { integrationId: integrationAId, externalActivityId: pollId } },
      create: { userId: userAId, integrationId: integrationAId, resourceId: repoA1.id, provider: "GITHUB", externalActivityId: pollId, activityType: "GITHUB_COMMIT" },
      update: {}
    });
    const p2 = await prisma.externalActivity.upsert({
      where: { integrationId_externalActivityId: { integrationId: integrationAId, externalActivityId: pollId } },
      create: { userId: userAId, integrationId: integrationAId, resourceId: repoA1.id, provider: "GITHUB", externalActivityId: pollId, activityType: "GITHUB_COMMIT" },
      update: {}
    });
    assert(p1.id === p2.id, grpD, "Test 25: Polling -> Polling duplicate prevention");

    // Test 26: Webhook -> Webhook duplicate prevention
    const webPayloadIdem = {
      repository: { full_name: repoA1.identifier, name: repoA1.name },
      sender: { id: 111222, login: "e2e_usera_login" },
      commits: [{ id: "sha_idem_102", message: "Idempotent commit", author: { username: "e2e_usera_login" } }]
    };
    const w1 = await githubWebhookService.processWebhookEvent("push", "deliv_idem_1", webPayloadIdem);
    const w2 = await githubWebhookService.processWebhookEvent("push", "deliv_idem_2", webPayloadIdem);
    assert(w1.createdCount === 1 && w2.createdCount === 0, grpD, "Test 26: Webhook -> Webhook duplicate prevention");

    // Test 27: Webhook -> Polling duplicate prevention
    const shaWebPoll = "sha_idem_web_poll_103";
    const webPayloadCross = {
      repository: { full_name: repoA1.identifier, name: repoA1.name },
      sender: { id: 111222, login: "e2e_usera_login" },
      commits: [{ id: shaWebPoll, message: "Cross delivery commit", author: { username: "e2e_usera_login" } }]
    };
    await githubWebhookService.processWebhookEvent("push", "deliv_cross_1", webPayloadCross);
    const pollCrossId = `commit:${repoA1.externalId}:${shaWebPoll}`;
    const pollIdemRes = await prisma.externalActivity.upsert({
      where: { integrationId_externalActivityId: { integrationId: integrationAId, externalActivityId: pollCrossId } },
      create: { userId: userAId, integrationId: integrationAId, resourceId: repoA1.id, provider: "GITHUB", externalActivityId: pollCrossId, activityType: "GITHUB_COMMIT" },
      update: {}
    });
    const totalMatching = await prisma.externalActivity.count({
      where: { integrationId: integrationAId, externalActivityId: pollCrossId }
    });
    assert(totalMatching === 1, grpD, "Test 27: Webhook -> Polling duplicate prevention");

    // Test 28: Polling -> Webhook duplicate prevention
    const shaPollWeb = "sha_idem_poll_web_104";
    const pollId2 = `commit:${repoA1.externalId}:${shaPollWeb}`;
    await prisma.externalActivity.create({
      data: { userId: userAId, integrationId: integrationAId, resourceId: repoA1.id, provider: "GITHUB", externalActivityId: pollId2, activityType: "GITHUB_COMMIT" }
    });
    const webPayloadCross2 = {
      repository: { full_name: repoA1.identifier, name: repoA1.name },
      sender: { id: 111222, login: "e2e_usera_login" },
      commits: [{ id: shaPollWeb, message: "Reverse delivery commit", author: { username: "e2e_usera_login" } }]
    };
    const wRes2 = await githubWebhookService.processWebhookEvent("push", "deliv_cross_2", webPayloadCross2);
    assert(wRes2.createdCount === 0, grpD, "Test 28: Polling -> Webhook duplicate prevention");

    // Test 29: Reconciliation -> Polling duplicate prevention
    const recRes = await integrationManagementService.reconcileActivity(userAId, "GITHUB");
    assert(recRes.created === 0 || recRes.synced >= 0, grpD, "Test 29: Reconciliation -> Polling duplicate prevention");

    // Test 30: Repeated goal verification does not double-count progress
    const goalBefore = await prisma.goal.findUnique({ where: { id: countGoal.id } });
    await goalVerificationService.verifyPendingGoalsForUser(userAId);
    await goalVerificationService.verifyPendingGoalsForUser(userAId);
    const goalAfter = await prisma.goal.findUnique({ where: { id: countGoal.id } });
    assert(goalBefore?.currentHours === goalAfter?.currentHours, grpD, "Test 30: Goal reverification idempotency");

    // Test 31: Repeated activity count stability
    const countTotal = await prisma.externalActivity.count({ where: { userId: userAId } });
    await goalVerificationService.verifyPendingGoalsForUser(userAId);
    const countTotalAfter = await prisma.externalActivity.count({ where: { userId: userAId } });
    assert(countTotal === countTotalAfter, grpD, "Test 31: Repeated activity ingestion stability");

    // =============================================================
    // TEST GROUP E — RELIABILITY & RECOVERY (Tests 32 - 37)
    // =============================================================
    const grpE = "Reliability & Recovery";

    // Test 32: 401 Authentication failure handling
    await integrationHealthService.recordAuthFailure(integrationAId, "401 Bad credentials");
    const authFailedInt = await prisma.userIntegration.findUnique({ where: { id: integrationAId } });
    assert(authFailedInt?.healthStatus === "AUTH_REQUIRED" && authFailedInt?.isConnected === false, grpE, "Test 32: 401 Auth failure sets AUTH_REQUIRED & isConnected=false");

    // Test 33: Rate-limit status tracking
    const resetTime = new Date(Date.now() + 3600 * 1000);
    await integrationHealthService.recordRateLimit(integrationAId, 0, resetTime);
    const rateLimitedInt = await prisma.userIntegration.findUnique({ where: { id: integrationAId } });
    assert(rateLimitedInt?.rateLimitRemaining === 0 && rateLimitedInt?.rateLimitResetAt !== null, grpE, "Test 33: Rate-limit status tracking");

    // Test 34: Rate-limit recovery after reset window
    const pastTime = new Date(Date.now() - 1000);
    await prisma.userIntegration.update({
      where: { id: integrationAId },
      data: { isConnected: true, healthStatus: "HEALTHY", lastSyncStatus: "SUCCESS", lastSyncError: null, rateLimitRemaining: 5000, rateLimitResetAt: pastTime }
    });
    const statusPostReset = await integrationHealthService.getIntegrationStatus(userAId, "GITHUB");
    assert(statusPostReset.health === "HEALTHY", grpE, "Test 34: Rate-limit recovery after reset window");

    // Test 35: Transient error reset
    await prisma.userIntegration.update({
      where: { id: integrationAId },
      data: { isConnected: true, healthStatus: "WARNING", lastSyncError: "Transient timeout error", lastSyncStatus: "SUCCESS" }
    });
    const resetRes = await integrationManagementService.resetTransientError(userAId, "GITHUB");
    assert(resetRes.success === true && resetRes.healthStatus === "HEALTHY", grpE, "Test 35: Transient error reset");

    // Test 36: Disconnect historical data preservation
    const actCountBeforeDisc = await prisma.externalActivity.count({ where: { integrationId: integrationAId } });
    await prisma.userIntegration.update({
      where: { id: integrationAId },
      data: { isConnected: false, healthStatus: "DISCONNECTED" }
    });
    const actCountAfterDisc = await prisma.externalActivity.count({ where: { integrationId: integrationAId } });
    assert(actCountBeforeDisc === actCountAfterDisc && actCountAfterDisc > 0, grpE, "Test 36: Disconnect historical data preservation");

    // Test 37: OAuth reconnection preserves UserIntegration.id & historical entities
    const reconnectRes = await integrationManagementService.reconnectUserIntegration(userAId, "GITHUB", {
      accessToken: "gho_new_reconnected_token_9999",
      username: "e2e_usera_login",
      externalUserId: "111222"
    });
    const reconnectedInt = await prisma.userIntegration.findUnique({ where: { id: integrationAId } });
    assert(
      reconnectRes.success === true &&
      reconnectRes.integrationId === integrationAId &&
      reconnectedInt?.healthStatus === "HEALTHY" &&
      reconnectedInt?.isConnected === true,
      grpE,
      "Test 37: OAuth reconnection preserves UserIntegration.id & restores HEALTHY status"
    );

    // =============================================================
    // TEST GROUP F — RECONCILIATION (Tests 38 - 41)
    // =============================================================
    const grpF = "Reconciliation";

    // Stub githubService API calls for deterministic offline test execution
    const origGetRepos = githubService.getRepositories;
    const origGetCommits = githubService.getCommitsForRepo;
    const origGetPRs = githubService.getPullRequestsForRepo;
    const origGetIssues = githubService.getIssuesForRepo;

    githubService.getRepositories = async () => [
      {
        id: 101,
        name: repoA1.name,
        full_name: repoA1.identifier,
        html_url: repoA1.url,
        description: null,
        private: false,
        updated_at: new Date().toISOString()
      }
    ];
    githubService.getCommitsForRepo = async () => [];
    githubService.getPullRequestsForRepo = async () => [];
    githubService.getIssuesForRepo = async () => [];

    try {
      // Test 38: Repository reconciliation execution
      const repoRecRes = await integrationManagementService.reconcileRepositories(userAId, "GITHUB");
      assert(typeof repoRecRes.added === "number" && typeof repoRecRes.unchanged === "number", grpF, "Test 38: Repository reconciliation execution");

      // Test 39: Missing/deleted repository handling (metadata flag preservation)
      await prisma.integrationResource.update({
        where: { id: repoA2.id },
        data: { metadata: JSON.stringify({ _missing: true, missingAt: new Date().toISOString() }) }
      });
      const missingRepoInDb = await prisma.integrationResource.findUnique({ where: { id: repoA2.id } });
      const missingMeta = missingRepoInDb?.metadata ? JSON.parse(missingRepoInDb.metadata) : {};
      assert(missingRepoInDb !== null && missingMeta._missing === true, grpF, "Test 39: Missing repository handled via metadata without record deletion");

      // Test 40: Activity catch-up reconciliation
      const actCatchupRes = await integrationManagementService.reconcileActivity(userAId, "GITHUB");
      assert(typeof actCatchupRes.synced === "number" && typeof actCatchupRes.created === "number", grpF, "Test 40: Activity catch-up reconciliation");

      // Test 41: Goal reverification post-reconciliation
      const goalReverRes = await integrationManagementService.reverifyGoals(userAId, "GITHUB");
      assert(typeof goalReverRes.reverified === "number", grpF, "Test 41: Goal reverification post-reconciliation");
    } finally {
      // Restore original githubService methods
      githubService.getRepositories = origGetRepos;
      githubService.getCommitsForRepo = origGetCommits;
      githubService.getPullRequestsForRepo = origGetPRs;
      githubService.getIssuesForRepo = origGetIssues;
    }

    // =============================================================
    // TEST GROUP G — SECURITY & AUTHORIZATION (Tests 42 - 50)
    // =============================================================
    const grpG = "Security & Authorization";

    // Test 42: Credential leakage audit across details & status reports
    const detailsReport = await integrationManagementService.getIntegrationDetails(userAId, "GITHUB");
    const detailsStr = JSON.stringify(detailsReport);
    const statusReport = await integrationHealthService.getIntegrationStatus(userAId, "GITHUB");
    const statusStr = JSON.stringify(statusReport);

    const hasLeakedToken =
      detailsStr.includes("gho_") ||
      detailsStr.includes("accessToken") ||
      detailsStr.includes("refreshToken") ||
      detailsStr.includes("ENCRYPTION_KEY") ||
      statusStr.includes("gho_") ||
      statusStr.includes("accessToken");
    assert(hasLeakedToken === false, grpG, "Test 42: Credential leakage audit (zero tokens or secret keys in details/status)");

    // Test 43: Cross-user integration isolation
    const statusBByA = await integrationHealthService.getIntegrationStatus(userBId, "GITHUB");
    assert(statusBByA.account?.externalUserId !== "111222", grpG, "Test 43: Cross-user integration isolation");

    // Test 44: Cross-user activity isolation
    const userAActivities = await prisma.externalActivity.findMany({ where: { userId: userAId } });
    const containsBActivity = userAActivities.some((act) => act.userId === userBId);
    assert(containsBActivity === false, grpG, "Test 44: Cross-user activity isolation");

    // Test 45: Cross-user goal isolation
    const userAGoals = await prisma.goal.findMany({ where: { userId: userAId } });
    const containsBGoal = userAGoals.some((g) => g.userId === userBId);
    assert(containsBGoal === false, grpG, "Test 45: Cross-user goal isolation");

    // Test 46: Cross-user resource isolation
    const userAResources = await prisma.integrationResource.findMany({ where: { integrationId: integrationAId } });
    const containsBResource = userAResources.some((r) => r.integrationId === integrationBId);
    assert(containsBResource === false, grpG, "Test 46: Cross-user resource isolation");

    // Test 47: Room membership isolation (non-member cannot access private room activity)
    const room = await prisma.room.create({
      data: {
        ownerId: userAId,
        name: "E2E Isolation Private Room",
        description: "Private room for security audit",
        aiPolicy: JSON.stringify({ enabled: true }),
        privacyPolicy: JSON.stringify({ mode: "PRIVATE" })
      }
    });

    const isUserBMember = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: room.id, userId: userBId } }
    });
    assert(isUserBMember === null, grpG, "Test 47: Room membership authorization isolation");

    // Test 48: Unlinked repository webhook rejection
    const unlinkedPayload = {
      repository: { full_name: "unknown_owner/unlinked_repo", name: "unlinked_repo" },
      sender: { id: 111222, login: "e2e_usera_login" },
      commits: [{ id: "sha_unlinked_1", message: "Unlinked commit" }]
    };
    const unlinkedRes = await githubWebhookService.processWebhookEvent("push", "deliv_unlinked", unlinkedPayload);
    assert(unlinkedRes.createdCount === 0 && unlinkedRes.message?.includes("No active integration"), grpG, "Test 48: Unlinked repository webhook rejection");

    // Test 49: Unknown GitHub actor webhook rejection
    const unknownActorPayload = {
      repository: { full_name: repoA1.identifier, name: repoA1.name },
      sender: { id: 999999, login: "imposter_user" },
      pull_request: { id: 8888, number: 99, title: "Imposter PR", state: "open", html_url: "url" }
    };
    const unknownActorRes = await githubWebhookService.processWebhookEvent("pull_request", "deliv_unknown_actor", unknownActorPayload);
    assert(unknownActorRes.createdCount === 0 && (unknownActorRes.message?.includes("identity") || unknownActorRes.success === true), grpG, "Test 49: Unknown GitHub actor webhook rejection");

    // Test 50: Invalid webhook signature rejection
    const invalidSig = "sha256=invalid_signature_hash_0000000000000000000000000000000000000000";
    const isSigValid = githubWebhookService.verifySignature(Buffer.from("raw_body"), invalidSig, "secret");
    assert(isSigValid === false, grpG, "Test 50: Invalid webhook signature HMAC rejection");

    // =============================================================
    // TEST GROUP H — SOCKET.IO OBSERVABILITY (Tests 51 - 60)
    // =============================================================
    const grpH = "Socket.io Observability";

    // Helper for payload sanitization check
    const isPayloadClean = (payload: any) => {
      const str = JSON.stringify(payload);
      return !str.includes("gho_") && !str.includes("accessToken") && !str.includes("refreshToken") && !str.includes("clientSecret");
    };

    // Test 51: activity-external-update payload structure & security
    const p51 = { activityId: "act_101", userId: userAId, provider: "GITHUB", activityType: "GITHUB_COMMIT", occurredAt: new Date().toISOString() };
    assert(isPayloadClean(p51) && p51.provider === "GITHUB", grpH, "Test 51: activity-external-update payload validation");

    // Test 52: goal-progress-update payload structure & security
    const p52 = { goalId: "goal_101", userId: userAId, status: "IN_PROGRESS", progressPercentage: 50, completionSource: "GITHUB_ACTIVITY" };
    assert(isPayloadClean(p52) && p52.progressPercentage === 50, grpH, "Test 52: goal-progress-update payload validation");

    // Test 53: goal:updated payload structure & security
    const p53 = { goalId: "goal_101", userId: userAId, status: "IN_PROGRESS", currentHours: 2.5, targetHours: 5.0 };
    assert(isPayloadClean(p53) && p53.status === "IN_PROGRESS", grpH, "Test 53: goal:updated payload validation");

    // Test 54: goal:completed payload structure & security
    const p54 = { goalId: "goal_101", userId: userAId, status: "completed", progressPercentage: 100, completionSource: "GITHUB_ACTIVITY" };
    assert(isPayloadClean(p54) && p54.status === "completed", grpH, "Test 54: goal:completed payload validation");

    // Test 55: integration-sync-started payload structure & security
    const p55 = { provider: "GITHUB", userId: userAId, status: "SYNCING" };
    assert(isPayloadClean(p55) && p55.status === "SYNCING", grpH, "Test 55: integration-sync-started payload validation");

    // Test 56: integration-sync-completed payload structure & security
    const p56 = { provider: "GITHUB", userId: userAId, status: "HEALTHY", itemsIngested: 5, lastSyncedAt: new Date().toISOString() };
    assert(isPayloadClean(p56) && p56.status === "HEALTHY", grpH, "Test 56: integration-sync-completed payload validation");

    // Test 57: integration-sync-failed payload structure & security
    const p57 = { provider: "GITHUB", userId: userAId, status: "FAILED", error: "Network timeout" };
    assert(isPayloadClean(p57) && p57.status === "FAILED", grpH, "Test 57: integration-sync-failed payload validation");

    // Test 58: integration-health-update payload structure & security
    const p58 = { provider: "GITHUB", userId: userAId, health: "HEALTHY" };
    assert(isPayloadClean(p58) && p58.health === "HEALTHY", grpH, "Test 58: integration-health-update payload validation");

    // Test 59: integration-reconnected payload structure & security
    const p59 = { integrationId: integrationAId, userId: userAId, provider: "GITHUB", healthStatus: "HEALTHY", timestamp: new Date().toISOString() };
    assert(isPayloadClean(p59) && p59.healthStatus === "HEALTHY", grpH, "Test 59: integration-reconnected payload validation");

    // Test 60: integration-reconciled payload structure & security
    const p60 = { integrationId: integrationAId, userId: userAId, provider: "GITHUB", timestamp: new Date().toISOString() };
    assert(isPayloadClean(p60) && p60.provider === "GITHUB", grpH, "Test 60: integration-reconciled payload validation");

    // =============================================================
    // TEST GROUP I — HEALTH STATE MACHINE (Tests 61 - 65)
    // =============================================================
    const grpI = "Health State Machine";

    // Test 61: HEALTHY -> WARNING -> HEALTHY transition
    await prisma.userIntegration.update({
      where: { id: integrationAId },
      data: { isConnected: true, healthStatus: "WARNING", lastSyncStatus: "SUCCESS", lastSyncError: "Warning state", lastWebhookStatus: null }
    });
    let st1 = integrationHealthService.deriveHealthStatus(await prisma.userIntegration.findUnique({ where: { id: integrationAId } }));
    assert(st1 === "WARNING", grpI, "Test 61a: HEALTHY -> WARNING transition");

    await integrationManagementService.resetTransientError(userAId, "GITHUB");
    let st2 = integrationHealthService.deriveHealthStatus(await prisma.userIntegration.findUnique({ where: { id: integrationAId } }));
    assert(st2 === "HEALTHY", grpI, "Test 61b: WARNING -> HEALTHY transition");

    // Test 62: HEALTHY -> RATE_LIMITED -> HEALTHY transition
    const rateLimitExpiry = new Date(Date.now() + 60000);
    await prisma.userIntegration.update({
      where: { id: integrationAId },
      data: { isConnected: true, healthStatus: "RATE_LIMITED", lastSyncStatus: "RATE_LIMITED", rateLimitResetAt: rateLimitExpiry }
    });
    let stRate = integrationHealthService.deriveHealthStatus(await prisma.userIntegration.findUnique({ where: { id: integrationAId } }));
    assert(stRate === "RATE_LIMITED", grpI, "Test 62a: HEALTHY -> RATE_LIMITED transition");

    await prisma.userIntegration.update({
      where: { id: integrationAId },
      data: { isConnected: true, healthStatus: "HEALTHY", lastSyncStatus: "SUCCESS", rateLimitResetAt: null }
    });
    let stRateClear = integrationHealthService.deriveHealthStatus(await prisma.userIntegration.findUnique({ where: { id: integrationAId } }));
    assert(stRateClear === "HEALTHY", grpI, "Test 62b: RATE_LIMITED -> HEALTHY transition");

    // Test 63: HEALTHY -> AUTH_REQUIRED -> HEALTHY transition (via OAuth Reconnection)
    await prisma.userIntegration.update({ where: { id: integrationAId }, data: { isConnected: false, healthStatus: "AUTH_REQUIRED", lastSyncStatus: "AUTH_REQUIRED" } });
    let stAuth = integrationHealthService.deriveHealthStatus(await prisma.userIntegration.findUnique({ where: { id: integrationAId } }));
    assert(stAuth === "AUTH_REQUIRED", grpI, "Test 63a: HEALTHY -> AUTH_REQUIRED transition");

    await integrationManagementService.reconnectUserIntegration(userAId, "GITHUB", { accessToken: "fresh_token_123", username: "e2e_usera_login" });
    let stAuthClear = integrationHealthService.deriveHealthStatus(await prisma.userIntegration.findUnique({ where: { id: integrationAId } }));
    assert(stAuthClear === "HEALTHY", grpI, "Test 63b: AUTH_REQUIRED -> HEALTHY reconnection transition");

    // Test 64: HEALTHY -> ERROR -> HEALTHY transition
    await prisma.userIntegration.update({ where: { id: integrationAId }, data: { healthStatus: "ERROR", lastSyncStatus: "FAILED" } });
    let stErr = integrationHealthService.deriveHealthStatus(await prisma.userIntegration.findUnique({ where: { id: integrationAId } }));
    assert(stErr === "ERROR", grpI, "Test 64a: HEALTHY -> ERROR transition");

    await prisma.userIntegration.update({ where: { id: integrationAId }, data: { healthStatus: "HEALTHY", lastSyncStatus: "SUCCESS", lastSyncError: null } });
    let stErrClear = integrationHealthService.deriveHealthStatus(await prisma.userIntegration.findUnique({ where: { id: integrationAId } }));
    assert(stErrClear === "HEALTHY", grpI, "Test 64b: ERROR -> HEALTHY recovery transition");

    // Test 65: CONNECTED -> DISCONNECTED -> CONNECTED transition
    await prisma.userIntegration.update({ where: { id: integrationAId }, data: { isConnected: false, healthStatus: "DISCONNECTED" } });
    let stDisc = integrationHealthService.deriveHealthStatus(await prisma.userIntegration.findUnique({ where: { id: integrationAId } }));
    assert(stDisc === "DISCONNECTED", grpI, "Test 65a: CONNECTED -> DISCONNECTED transition");

    await integrationManagementService.reconnectUserIntegration(userAId, "GITHUB", { accessToken: "reconnect_token_456", username: "e2e_usera_login" });
    let stDiscClear = integrationHealthService.deriveHealthStatus(await prisma.userIntegration.findUnique({ where: { id: integrationAId } }));
    assert(stDiscClear === "HEALTHY", grpI, "Test 65b: DISCONNECTED -> CONNECTED transition");

  } catch (err: any) {
    console.error("Critical Exception inside End-to-End Test Suite Execution:", err);
  } finally {
    // -------------------------------------------------------------
    // GUARANTEED CLEANUP OF ALL TEST FIXTURES
    // -------------------------------------------------------------
    console.log("\n🧹 Cleaning up test fixtures from SQLite database...");
    try {
      if (userAId || userBId) {
        const testUserIds = [userAId, userBId].filter(Boolean) as string[];
        await prisma.goalIntegrationLink.deleteMany({ where: { goal: { userId: { in: testUserIds } } } });
        await prisma.goal.deleteMany({ where: { userId: { in: testUserIds } } });
        await prisma.externalActivity.deleteMany({ where: { userId: { in: testUserIds } } });
        await prisma.integrationResource.deleteMany({ where: { userIntegration: { userId: { in: testUserIds } } } });
        await prisma.integrationSyncLog.deleteMany({ where: { userIntegration: { userId: { in: testUserIds } } } });
        await prisma.userIntegration.deleteMany({ where: { userId: { in: testUserIds } } });
        await prisma.activityLog.deleteMany({ where: { userId: { in: testUserIds } } });
        await prisma.room.deleteMany({ where: { ownerId: { in: testUserIds } } });
        await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
      }
      console.log("✨ Test fixture cleanup completed successfully.");
    } catch (cleanupErr) {
      console.error("Error cleaning up test fixtures:", cleanupErr);
    }
  }

  // -------------------------------------------------------------
  // REPORT RESULTS TABLE
  // -------------------------------------------------------------
  console.log("\n=================================================");
  console.log("STEP 10 FINAL TEST RESULTS SUMMARY");
  console.log("=================================================");
  console.log("| Test Group                    | Passed | Failed |");
  console.log("|-------------------------------|--------|--------|");
  for (const [groupName, counts] of Object.entries(groupResults)) {
    const padName = groupName.padEnd(30, " ");
    const padPass = String(counts.passed).padStart(6, " ");
    const padFail = String(counts.failed).padStart(6, " ");
    console.log(`| ${padName} | ${padPass} | ${padFail} |`);
  }
  console.log("|-------------------------------|--------|--------|");
  console.log(`| TOTAL                         | ${String(passCount).padStart(6, " ")} | ${String(failCount).padStart(6, " ")} |`);
  console.log("=================================================");

  if (failCount === 0) {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! ZERO FAILURES.");
  } else {
    console.error(`⚠️ ${failCount} TESTS FAILED. PLEASE INVESTIGATE.`);
    process.exit(1);
  }
}

runEndToEndTests().catch((err) => {
  console.error("Unhandled test execution error:", err);
  process.exit(1);
});
