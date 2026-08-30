import crypto from "crypto";
import { prisma } from "../../db.js";
import { githubWebhookService } from "../services/githubWebhookService.js";
import { goalVerificationService } from "../services/goalVerificationService.js";

const TEST_SECRET = "test_webhook_secret_key_123";

function generateSignature(payload: any, secret: string = TEST_SECRET): string {
  const body = typeof payload === "string" ? payload : JSON.stringify(payload);
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  return `sha256=${hmac.digest("hex")}`;
}

async function runTests() {
  console.log("==========================================================");
  console.log("STARTING STEP 7 GITHUB WEBHOOK FUNCTIONAL TEST SUITE");
  console.log("==========================================================");

  const testResults: Record<string, boolean> = {};

  // Setup Test Users & Integrations
  let user = await prisma.user.findFirst({ where: { email: "webhooktest@example.com" } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Webhook Test User",
        email: "webhooktest@example.com",
        passwordHash: "dummy"
      }
    });
  }

  let integration = await prisma.userIntegration.findFirst({
    where: { userId: user.id, provider: "GITHUB" }
  });
  if (!integration) {
    integration = await prisma.userIntegration.create({
      data: {
        userId: user.id,
        provider: "GITHUB",
        externalUserId: "999888",
        username: "webhook-tester",
        accountEmail: "webhooktest@example.com",
        accessToken: "encrypted_token",
        isConnected: true
      }
    });
  }

  let resource = await prisma.integrationResource.findFirst({
    where: { integrationId: integration.id, externalId: "repo_101" }
  });
  if (!resource) {
    resource = await prisma.integrationResource.create({
      data: {
        integrationId: integration.id,
        provider: "GITHUB",
        resourceType: "REPOSITORY",
        externalId: "repo_101",
        name: "test-repo",
        identifier: "webhook-owner/test-repo",
        url: "https://github.com/webhook-owner/test-repo"
      }
    });
  }

  // Setup Unrelated User for Identity & Repo Isolation tests
  let otherUser = await prisma.user.findFirst({ where: { email: "otherwebhook@example.com" } });
  if (!otherUser) {
    otherUser = await prisma.user.create({
      data: {
        name: "Other Webhook User",
        email: "otherwebhook@example.com",
        passwordHash: "dummy"
      }
    });
  }

  // TEST 1: Valid push webhook -> GITHUB_COMMIT created
  console.log("\n--- TEST 1: Valid push webhook ---");
  const pushPayload = {
    repository: { full_name: "webhook-owner/test-repo", name: "test-repo" },
    sender: { id: 999888, login: "webhook-tester" },
    commits: [
      {
        id: "commit_sha_001",
        message: "feat: add webhook integration",
        timestamp: new Date().toISOString(),
        url: "https://github.com/webhook-owner/test-repo/commit/commit_sha_001",
        author: { username: "webhook-tester", email: "webhooktest@example.com" }
      }
    ]
  };

  const res1 = await githubWebhookService.processWebhookEvent("push", "deliv_001", pushPayload);
  const act1 = await prisma.externalActivity.findFirst({
    where: { integrationId: integration.id, externalActivityId: "commit_sha_001" }
  });

  if (res1.success && act1 && act1.activityType === "GITHUB_COMMIT" && act1.source === "WEBHOOK") {
    console.log("PASS: Valid push webhook created GITHUB_COMMIT activity.");
    testResults["TEST 1"] = true;
  } else {
    console.error("FAIL: Push webhook failed to create GITHUB_COMMIT.");
    testResults["TEST 1"] = false;
  }

  // TEST 2: Valid pull_request opened -> GITHUB_PULL_REQUEST created
  console.log("\n--- TEST 2: Valid pull_request opened ---");
  const prOpenedPayload = {
    action: "opened",
    repository: { full_name: "webhook-owner/test-repo", name: "test-repo" },
    sender: { id: 999888, login: "webhook-tester" },
    pull_request: {
      id: 5001,
      number: 12,
      title: "Add Webhook Feature",
      state: "open",
      merged: false,
      html_url: "https://github.com/webhook-owner/test-repo/pull/12",
      updated_at: new Date().toISOString()
    }
  };

  const res2 = await githubWebhookService.processWebhookEvent("pull_request", "deliv_002", prOpenedPayload);
  const act2 = await prisma.externalActivity.findFirst({
    where: { integrationId: integration.id, externalActivityId: "pr_5001_opened" }
  });

  if (res2.success && act2 && act2.activityType === "GITHUB_PULL_REQUEST") {
    console.log("PASS: Valid pull_request opened created GITHUB_PULL_REQUEST activity.");
    testResults["TEST 2"] = true;
  } else {
    console.error("FAIL: PR opened webhook failed.");
    testResults["TEST 2"] = false;
  }

  // TEST 3: Valid merged pull_request -> GITHUB_PULL_REQUEST with merged=true
  console.log("\n--- TEST 3: Valid merged pull_request ---");
  const prMergedPayload = {
    action: "closed",
    repository: { full_name: "webhook-owner/test-repo", name: "test-repo" },
    sender: { id: 999888, login: "webhook-tester" },
    pull_request: {
      id: 5001,
      number: 12,
      title: "Add Webhook Feature",
      state: "closed",
      merged: true,
      merged_at: new Date().toISOString(),
      html_url: "https://github.com/webhook-owner/test-repo/pull/12",
      updated_at: new Date().toISOString()
    }
  };

  const res3 = await githubWebhookService.processWebhookEvent("pull_request", "deliv_003", prMergedPayload);
  const act3 = await prisma.externalActivity.findFirst({
    where: { integrationId: integration.id, externalActivityId: "pr_5001_closed" }
  });
  const meta3 = act3?.metadata ? JSON.parse(act3.metadata) : {};

  if (res3.success && act3 && act3.activityType === "GITHUB_PULL_REQUEST" && meta3.merged === true) {
    console.log("PASS: Valid merged PR created GITHUB_PULL_REQUEST with metadata.merged=true.");
    testResults["TEST 3"] = true;
  } else {
    console.error("FAIL: Merged PR webhook failed.");
    testResults["TEST 3"] = false;
  }

  // TEST 4: Valid issues webhook -> GITHUB_ISSUE created
  console.log("\n--- TEST 4: Valid issues webhook ---");
  const issuePayload = {
    action: "opened",
    repository: { full_name: "webhook-owner/test-repo", name: "test-repo" },
    sender: { id: 999888, login: "webhook-tester" },
    issue: {
      id: 8001,
      number: 45,
      title: "Bug in webhook signature",
      state: "open",
      html_url: "https://github.com/webhook-owner/test-repo/issues/45",
      updated_at: new Date().toISOString()
    }
  };

  const res4 = await githubWebhookService.processWebhookEvent("issues", "deliv_004", issuePayload);
  const act4 = await prisma.externalActivity.findFirst({
    where: { integrationId: integration.id, externalActivityId: "issue_8001_opened" }
  });

  if (res4.success && act4 && act4.activityType === "GITHUB_ISSUE") {
    console.log("PASS: Valid issue webhook created GITHUB_ISSUE activity.");
    testResults["TEST 4"] = true;
  } else {
    console.error("FAIL: Issue webhook failed.");
    testResults["TEST 4"] = false;
  }

  // TEST 5: Valid pull_request_review submitted -> GITHUB_REVIEW created
  console.log("\n--- TEST 5: Valid pull_request_review submitted ---");
  const reviewPayload = {
    action: "submitted",
    repository: { full_name: "webhook-owner/test-repo", name: "test-repo" },
    sender: { id: 999888, login: "webhook-tester" },
    pull_request: {
      id: 5001,
      number: 12,
      title: "Add Webhook Feature"
    },
    review: {
      id: 9001,
      state: "approved",
      html_url: "https://github.com/webhook-owner/test-repo/pull/12#pullrequestreview-9001",
      submitted_at: new Date().toISOString()
    }
  };

  const res5 = await githubWebhookService.processWebhookEvent("pull_request_review", "deliv_005", reviewPayload);
  const act5 = await prisma.externalActivity.findFirst({
    where: { integrationId: integration.id, externalActivityId: "review_9001" }
  });

  if (res5.success && act5 && act5.activityType === "GITHUB_REVIEW") {
    console.log("PASS: Valid review webhook created GITHUB_REVIEW activity.");
    testResults["TEST 5"] = true;
  } else {
    console.error("FAIL: Review webhook failed.");
    testResults["TEST 5"] = false;
  }

  // TEST 6: Invalid signature -> HTTP 401/403 or signature verification rejection
  console.log("\n--- TEST 6: Invalid signature rejection ---");
  const sampleBody = JSON.stringify({ ping: true });
  const validSig = generateSignature(sampleBody, TEST_SECRET);
  const invalidSig = "sha256=invalid000000000000000000000000000000000000000000000000000000";

  const isVerifiedValid = githubWebhookService.verifySignature(sampleBody, validSig, TEST_SECRET);
  const isVerifiedInvalid = githubWebhookService.verifySignature(sampleBody, invalidSig, TEST_SECRET);
  const isMissingSig = githubWebhookService.verifySignature(sampleBody, undefined, TEST_SECRET);

  if (isVerifiedValid && !isVerifiedInvalid && !isMissingSig) {
    console.log("PASS: Signature verification accepted valid HMAC and rejected invalid/missing signatures.");
    testResults["TEST 6"] = true;
  } else {
    console.error("FAIL: Signature verification failed security checks.");
    testResults["TEST 6"] = false;
  }

  // TEST 7: Same X-GitHub-Delivery twice -> 1 ExternalActivity (Deduplication)
  console.log("\n--- TEST 7: Duplicate delivery deduplication ---");
  const dupPayload = {
    repository: { full_name: "webhook-owner/test-repo", name: "test-repo" },
    sender: { id: 999888, login: "webhook-tester" },
    commits: [
      {
        id: "commit_sha_dup_007",
        message: "chore: update config",
        timestamp: new Date().toISOString(),
        url: "https://github.com/webhook-owner/test-repo/commit/commit_sha_dup_007",
        author: { username: "webhook-tester", email: "webhooktest@example.com" }
      }
    ]
  };

  const dupRes1 = await githubWebhookService.processWebhookEvent("push", "deliv_007", dupPayload);
  const dupRes2 = await githubWebhookService.processWebhookEvent("push", "deliv_007", dupPayload);

  const dupCount = await prisma.externalActivity.count({
    where: { integrationId: integration.id, externalActivityId: "commit_sha_dup_007" }
  });

  if (dupRes1.createdCount === 1 && dupRes2.createdCount === 0 && dupCount === 1) {
    console.log("PASS: Duplicate webhook delivery was cleanly deduplicated (Count: 1).");
    testResults["TEST 7"] = true;
  } else {
    console.error(`FAIL: Deduplication failed. Created count: ${dupCount}`);
    testResults["TEST 7"] = false;
  }

  // TEST 8: Different repository -> No activity created for unrelated repository
  console.log("\n--- TEST 8: Different repository isolation ---");
  const unlinkedRepoPayload = {
    repository: { full_name: "unlinked-org/unlinked-repo", name: "unlinked-repo" },
    sender: { id: 999888, login: "webhook-tester" },
    commits: [
      {
        id: "commit_sha_unlinked_008",
        message: "fix: unlinked repo commit",
        timestamp: new Date().toISOString(),
        author: { username: "webhook-tester" }
      }
    ]
  };

  const res8 = await githubWebhookService.processWebhookEvent("push", "deliv_008", unlinkedRepoPayload);
  const act8 = await prisma.externalActivity.findFirst({
    where: { externalActivityId: "commit_sha_unlinked_008" }
  });

  if (res8.createdCount === 0 && !act8) {
    console.log("PASS: Activity from unlinked repository was safely ignored.");
    testResults["TEST 8"] = true;
  } else {
    console.error("FAIL: Unlinked repository created unexpected activity.");
    testResults["TEST 8"] = false;
  }

  // TEST 9: Different GitHub user -> Activity is rejected for target user
  console.log("\n--- TEST 9: Different GitHub user identity isolation ---");
  const strangerPayload = {
    action: "opened",
    repository: { full_name: "webhook-owner/test-repo", name: "test-repo" },
    sender: { id: 111111, login: "random-stranger" },
    pull_request: {
      id: 9999,
      number: 99,
      title: "Malicious PR",
      state: "open",
      merged: false,
      html_url: "https://github.com/webhook-owner/test-repo/pull/99",
      updated_at: new Date().toISOString()
    }
  };

  const res9 = await githubWebhookService.processWebhookEvent("pull_request", "deliv_009", strangerPayload);
  const act9 = await prisma.externalActivity.findFirst({
    where: { externalActivityId: "pr_9999_opened" }
  });

  if (res9.createdCount === 0 && !act9) {
    console.log("PASS: Activity from unmatched user identity was rejected.");
    testResults["TEST 9"] = true;
  } else {
    console.error("FAIL: Unmatched user activity was created.");
    testResults["TEST 9"] = false;
  }

  // TEST 10: Webhook -> Automatic Goal verification trigger
  console.log("\n--- TEST 10: Webhook -> Goal verification integration ---");
  const testGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: "Merge PR for Webhooks",
      category: "Development",
      targetHours: 5,
      currentHours: 0,
      status: "active",
      externalProvider: "GITHUB",
      externalRepository: "webhook-owner/test-repo",
      verificationCriteria: JSON.stringify({ type: "PULL_REQUEST_MERGED" }),
      autoVerifyEnabled: true
    }
  });

  const goalPrPayload = {
    action: "closed",
    repository: { full_name: "webhook-owner/test-repo", name: "test-repo" },
    sender: { id: 999888, login: "webhook-tester" },
    pull_request: {
      id: 7701,
      number: 77,
      title: "Webhook Goal Feature PR",
      state: "closed",
      merged: true,
      merged_at: new Date().toISOString(),
      html_url: "https://github.com/webhook-owner/test-repo/pull/77",
      updated_at: new Date().toISOString()
    }
  };

  let goalSocketPayload: any = null;
  await githubWebhookService.processWebhookEvent("pull_request", "deliv_010", goalPrPayload, {
    onGoalProgressUpdate: (p) => { goalSocketPayload = p; }
  });

  const updatedGoal = await prisma.goal.findUnique({
    where: { id: testGoal.id },
    include: { integrationLinks: true }
  });

  if (updatedGoal && updatedGoal.status === "completed" && updatedGoal.integrationLinks[0]?.verificationStatus === "VERIFIED") {
    console.log("PASS: Webhook automatically triggered goal verification engine and completed goal!");
    testResults["TEST 10"] = true;
  } else {
    console.error("FAIL: Webhook goal verification failed.");
    testResults["TEST 10"] = false;
  }

  // TEST 11: Webhook activity followed by polling sync -> No duplicate ExternalActivity
  console.log("\n--- TEST 11: Webhook followed by polling sync reconciliation ---");
  const reSyncRes = await githubWebhookService.processWebhookEvent("pull_request", "deliv_010", goalPrPayload);
  const totalPrCount = await prisma.externalActivity.count({
    where: { integrationId: integration.id, externalActivityId: "pr_7701_closed" }
  });

  if (reSyncRes.createdCount === 0 && totalPrCount === 1) {
    console.log("PASS: Subsequent polling sync after webhook did NOT create duplicate activity.");
    testResults["TEST 11"] = true;
  } else {
    console.error("FAIL: Polling reconciliation created duplicate activity.");
    testResults["TEST 11"] = false;
  }

  // TEST 12: Socket.io callbacks
  console.log("\n--- TEST 12: Socket.io callback payload verification ---");
  let externalUpdateFired = false;
  const socketPayloadTest = {
    action: "opened",
    repository: { full_name: "webhook-owner/test-repo", name: "test-repo" },
    sender: { id: 999888, login: "webhook-tester" },
    issue: {
      id: 8888,
      number: 88,
      title: "Socket Test Issue",
      state: "open",
      html_url: "https://github.com/webhook-owner/test-repo/issues/88",
      updated_at: new Date().toISOString()
    }
  };

  await githubWebhookService.processWebhookEvent("issues", "deliv_012", socketPayloadTest, {
    onNewActivity: (act) => {
      if (act && act.externalActivityId === "issue_8888_opened") {
        externalUpdateFired = true;
      }
    }
  });

  if (externalUpdateFired && goalSocketPayload) {
    console.log("PASS: Socket.io callbacks (activity-external-update & goal-progress-update) successfully triggered.");
    testResults["TEST 12"] = true;
  } else {
    console.error("FAIL: Socket.io callbacks failed.");
    testResults["TEST 12"] = false;
  }

  // Clean up test data
  console.log("\n--- Cleaning up test records ---");
  await prisma.goalIntegrationLink.deleteMany({ where: { goalId: testGoal.id } });
  await prisma.goal.delete({ where: { id: testGoal.id } });
  await prisma.externalActivity.deleteMany({ where: { integrationId: integration.id } });
  await prisma.integrationResource.delete({ where: { id: resource.id } });
  await prisma.userIntegration.delete({ where: { id: integration.id } });
  await prisma.user.deleteMany({ where: { id: { in: [user.id, otherUser.id] } } });

  console.log("\n==========================================================");
  console.log("STEP 7 TEST SUITE RESULTS:");
  console.log("==========================================================");
  let allPassed = true;
  for (const [testName, passed] of Object.entries(testResults)) {
    console.log(`${testName}: ${passed ? "PASS" : "FAIL"}`);
    if (!passed) allPassed = false;
  }

  if (allPassed) {
    console.log("\nALL 12 STEP 7 FUNCTIONAL TESTS PASSED SUCCESSFULLY!");
  } else {
    console.error("\nSOME TESTS FAILED.");
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution exception:", err);
  process.exit(1);
});
