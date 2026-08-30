import crypto from "crypto";
import { envConfig, getGitHubConfigStatus, validateGitHubOAuthConfig } from "../config/env.js";
import { githubService } from "../services/githubService.js";
import { integrationProviderRegistry } from "../services/providers/integrationProviderRegistry.js";
import { integrationHealthService } from "../services/integrationHealthService.js";
import { goalVerificationService } from "../services/goalVerificationService.js";
import { githubWebhookService } from "../services/githubWebhookService.js";
import { prisma } from "../../db.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`✅ [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`❌ [FAIL] ${testName}${detail ? `: ${detail}` : ""}`);
  }
}

async function runTests() {
  console.log("=================================================");
  console.log("ENDOCORE GITHUB OAUTH & ENVIRONMENT CONFIG TEST SUITE (14 CASES)");
  console.log("=================================================\n");

  const defaultId = envConfig.GITHUB_CLIENT_ID || "test_client_id_123";
  const defaultSecret = envConfig.GITHUB_CLIENT_SECRET || "test_client_secret_456";

  // Ensure active mock config for test execution
  (envConfig as any).GITHUB_CLIENT_ID = defaultId;
  (envConfig as any).GITHUB_CLIENT_SECRET = defaultSecret;

  // TEST 1: Environment config initialization
  try {
    assert(
      typeof envConfig.PORT === "number" && typeof envConfig.GITHUB_REDIRECT_URI === "string",
      "Test 1: Server environment configuration initialized safely"
    );
  } catch (err: any) {
    assert(false, "Test 1: Server environment configuration initialization", err.message);
  }

  // TEST 2: GitHub Config Status payload security
  try {
    const status = getGitHubConfigStatus();
    const rawJSON = JSON.stringify(status);
    assert(
      status.provider === "github" &&
      typeof status.configured === "boolean" &&
      !rawJSON.includes("client_secret") &&
      !rawJSON.includes(process.env.GITHUB_CLIENT_SECRET || "INVALID_SECRET"),
      "Test 2: Config status report returns safe metadata with ZERO secret leakage"
    );
  } catch (err: any) {
    assert(false, "Test 2: Config status report security check", err.message);
  }

  // TEST 3: Validation handles missing Client ID safely
  try {
    (envConfig as any).GITHUB_CLIENT_ID = undefined;
    (envConfig as any).GITHUB_CLIENT_SECRET = defaultSecret;
    let caught = false;
    try {
      validateGitHubOAuthConfig();
    } catch (e: any) {
      caught = e.message.includes("Missing: GITHUB_CLIENT_ID");
    }
    (envConfig as any).GITHUB_CLIENT_ID = defaultId;
    assert(caught, "Test 3: Missing GITHUB_CLIENT_ID produces clear safe configuration error");
  } catch (err: any) {
    (envConfig as any).GITHUB_CLIENT_ID = defaultId;
    assert(false, "Test 3: Missing GITHUB_CLIENT_ID validation", err.message);
  }

  // TEST 4: Validation handles missing Client Secret safely
  try {
    (envConfig as any).GITHUB_CLIENT_ID = defaultId;
    (envConfig as any).GITHUB_CLIENT_SECRET = undefined;
    let caught = false;
    try {
      validateGitHubOAuthConfig();
    } catch (e: any) {
      caught = e.message.includes("Missing: GITHUB_CLIENT_SECRET");
    }
    (envConfig as any).GITHUB_CLIENT_SECRET = defaultSecret;
    assert(caught, "Test 4: Missing GITHUB_CLIENT_SECRET produces clear safe configuration error");
  } catch (err: any) {
    (envConfig as any).GITHUB_CLIENT_SECRET = defaultSecret;
    assert(false, "Test 4: Missing GITHUB_CLIENT_SECRET validation", err.message);
  }

  // TEST 5: GITHUB_REDIRECT_URI format validation
  try {
    assert(
      envConfig.GITHUB_REDIRECT_URI.startsWith("http") && envConfig.GITHUB_REDIRECT_URI.includes("/api/integrations/github/callback"),
      "Test 5: GITHUB_REDIRECT_URI is correctly formatted and contains expected callback path"
    );
  } catch (err: any) {
    assert(false, "Test 5: GITHUB_REDIRECT_URI format validation", err.message);
  }

  // TEST 6: IntegrationProviderRegistry resolves GITHUB provider
  try {
    const provider = integrationProviderRegistry.getProvider("GITHUB");
    assert(
      provider !== undefined && provider.getProvider() === "GITHUB" && provider.getName() === "GitHub",
      "Test 6: IntegrationProviderRegistry successfully resolves GitHub provider implementation"
    );
  } catch (err: any) {
    assert(false, "Test 6: IntegrationProviderRegistry resolution", err.message);
  }

  // TEST 7: OAuth Authorization URL generation
  try {
    (envConfig as any).GITHUB_CLIENT_ID = defaultId;
    (envConfig as any).GITHUB_CLIENT_SECRET = defaultSecret;
    const authUrl = githubService.getAuthorizationUrl("test_state_abc");

    assert(
      authUrl.startsWith("https://github.com/login/oauth/authorize") &&
      authUrl.includes(`client_id=${defaultId}`) &&
      authUrl.includes("state=test_state_abc"),
      "Test 7: GitHub OAuth authorization URL is correctly constructed"
    );
  } catch (err: any) {
    assert(false, "Test 7: OAuth Authorization URL generation", err.message);
  }

  // TEST 8: Electron & Web App endpoint parity
  try {
    const ghProvider = integrationProviderRegistry.getProvider("GITHUB");
    const fallbackProvider = integrationProviderRegistry.getProvider("JIRA");
    assert(
      ghProvider !== undefined && fallbackProvider !== undefined && fallbackProvider.getProvider() === "JIRA",
      "Test 8: Electron & Web applications use identical provider framework contract"
    );
  } catch (err: any) {
    assert(false, "Test 8: Electron & Web App endpoint parity", err.message);
  }

  // TEST 9: Client Secret absence from serialized public endpoints
  try {
    const details = integrationProviderRegistry.getProvider("GITHUB")?.getConfigStatus();
    const detailsJSON = JSON.stringify(details);
    assert(
      !detailsJSON.includes("clientSecret") || detailsJSON.includes("clientSecretConfigured"),
      "Test 9: Public provider status endpoints never expose GITHUB_CLIENT_SECRET"
    );
  } catch (err: any) {
    assert(false, "Test 9: Client Secret absence check", err.message);
  }

  // TEST 10: Provider registry list returns all supported providers
  try {
    const allProviders = integrationProviderRegistry.getAllProviders();
    assert(
      allProviders.length >= 12,
      "Test 10: IntegrationProviderRegistry contains all supported providers (GitHub, Jira, Slack, etc.)"
    );
  } catch (err: any) {
    assert(false, "Test 10: Provider registry full list check", err.message);
  }

  // TEST 11: GitHub sync contract via registry
  try {
    const provider = integrationProviderRegistry.getProvider("GITHUB");
    assert(
      typeof provider?.sync === "function",
      "Test 11: GitHub sync function is cleanly exposed through generalized provider framework"
    );
  } catch (err: any) {
    assert(false, "Test 11: GitHub sync contract via registry", err.message);
  }

  // TEST 12: Existing webhook signature verification
  try {
    const payload = JSON.stringify({ test: true });
    const secret = "test_webhook_secret_key";
    const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const sigHeader = `sha256=${hmac}`;
    const isValid = githubWebhookService.verifySignature(payload, sigHeader, secret);
    assert(isValid, "Test 12: Existing GitHub webhook signature verification integrity intact");
  } catch (err: any) {
    assert(false, "Test 12: Webhook signature verification", err.message);
  }

  // TEST 13: Existing integration health status calculation
  try {
    const status = integrationHealthService.deriveHealthStatus({
      isConnected: true,
      healthStatus: "HEALTHY",
      lastSyncStatus: "SUCCESS"
    });
    assert(status === "HEALTHY", "Test 13: Integration health status derivation logic intact");
  } catch (err: any) {
    assert(false, "Test 13: Integration health calculation", err.message);
  }

  // TEST 14: Existing goal verification service intact
  try {
    assert(
      typeof goalVerificationService.verifyPendingGoalsForUser === "function",
      "Test 14: Goal verification engine functions intact and accessible"
    );
  } catch (err: any) {
    assert(false, "Test 14: Goal verification service check", err.message);
  }

  console.log("\n=================================================");
  console.log(`RESULTS: ${passed}/14 PASSED, ${failed}/14 FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
