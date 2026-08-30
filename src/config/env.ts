import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Deterministically locate and load .env files across development, production, root, and subdirectories
function loadEnvironmentVariables(): void {
  let baseDir = process.cwd();
  try {
    const filename = fileURLToPath(import.meta.url);
    baseDir = path.dirname(filename);
  } catch {}

  const possiblePaths = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(baseDir, "../../.env.local"),
    path.resolve(baseDir, "../../.env"),
    path.resolve(baseDir, "../.env"),
    path.resolve(baseDir, ".env")
  ];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false });
    }
  }
  // Fallback default dotenv call if no explicit file was matched
  dotenv.config();
}

loadEnvironmentVariables();

/**
 * Returns a sanitized environment variable value.
 * Converts empty strings ("") or default place-holder template values to undefined.
 */
function getSanitizedEnv(key: string): string | undefined {
  const value = process.env[key];
  if (!value) return undefined;

  const trimmed = value.trim();
  if (trimmed === "" || trimmed.startsWith("your_github_") || trimmed === "MY_GEMINI_API_KEY" || trimmed === "MY_APP_URL") {
    return undefined;
  }
  return trimmed;
}

export interface EnvironmentConfig {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
  REDIS_URL: string;
  GITHUB_CLIENT_ID: string | undefined;
  GITHUB_CLIENT_SECRET: string | undefined;
  GITHUB_REDIRECT_URI: string;
  GITHUB_WEBHOOK_SECRET: string | undefined;
  isGitHubOAuthConfigured: boolean;
}

const portNumber = parseInt(process.env.PORT || "3000", 10);
const defaultRedirectUri = `http://localhost:${portNumber}/api/integrations/github/callback`;

const clientId = getSanitizedEnv("GITHUB_CLIENT_ID");
const clientSecret = getSanitizedEnv("GITHUB_CLIENT_SECRET");
const redirectUri = getSanitizedEnv("GITHUB_REDIRECT_URI") || getSanitizedEnv("GITHUB_CALLBACK_URL") || defaultRedirectUri;

export const envConfig: EnvironmentConfig = {
  PORT: portNumber,
  DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
  JWT_SECRET: process.env.JWT_SECRET || "super-secret-dashboard-key",
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || "e2b847a90f14c5d312e7350d89fa71239c4d28e75a1b0293847561a2b3c4d5e6",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  GITHUB_CLIENT_ID: clientId,
  GITHUB_CLIENT_SECRET: clientSecret,
  GITHUB_REDIRECT_URI: redirectUri,
  GITHUB_WEBHOOK_SECRET: getSanitizedEnv("GITHUB_WEBHOOK_SECRET"),
  isGitHubOAuthConfigured: Boolean(clientId && clientSecret)
};

/**
 * Returns a sanitized diagnostic report of integration configuration.
 * EXPLICIT SECURITY RULE: Secret values (Client Secret, JWT, Encryption Keys) are NEVER returned.
 */
export function getGitHubConfigStatus() {
  return {
    configured: Boolean(envConfig.GITHUB_CLIENT_ID && envConfig.GITHUB_CLIENT_SECRET),
    provider: "github",
    clientIdConfigured: Boolean(envConfig.GITHUB_CLIENT_ID),
    clientSecretConfigured: Boolean(envConfig.GITHUB_CLIENT_SECRET),
    redirectUriConfigured: Boolean(envConfig.GITHUB_REDIRECT_URI),
    redirectUri: envConfig.GITHUB_REDIRECT_URI,
    message: Boolean(envConfig.GITHUB_CLIENT_ID && envConfig.GITHUB_CLIENT_SECRET)
      ? "GitHub OAuth configuration is active and fully functional."
      : "GitHub OAuth configuration is incomplete. GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set in the server .env file."
  };
}

/**
 * Validates that GitHub OAuth is properly configured on the server.
 * Throws a descriptive safe error if configuration is missing.
 */
export function validateGitHubOAuthConfig(): { clientId: string; clientSecret: string; redirectUri: string } {
  if (!envConfig.GITHUB_CLIENT_ID && !envConfig.GITHUB_CLIENT_SECRET) {
    throw new Error("GitHub OAuth configuration is incomplete. Missing: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.");
  }
  if (!envConfig.GITHUB_CLIENT_ID) {
    throw new Error("GitHub OAuth configuration is incomplete. Missing: GITHUB_CLIENT_ID.");
  }
  if (!envConfig.GITHUB_CLIENT_SECRET) {
    throw new Error("GitHub OAuth configuration is incomplete. Missing: GITHUB_CLIENT_SECRET.");
  }

  return {
    clientId: envConfig.GITHUB_CLIENT_ID,
    clientSecret: envConfig.GITHUB_CLIENT_SECRET,
    redirectUri: envConfig.GITHUB_REDIRECT_URI
  };
}

/**
 * Safe startup diagnostic log (prints configuration presence without exposing raw secrets).
 */
export function logStartupDiagnostics(): void {
  console.log("--------------------------------------------------");
  console.log("🚀 EndoCore Server Environment Diagnostics:");
  console.log(`   - Port: ${envConfig.PORT}`);
  console.log(`   - Database: ${envConfig.DATABASE_URL ? "Configured" : "Default fallback"}`);
  console.log(`   - GitHub OAuth Client ID: ${envConfig.GITHUB_CLIENT_ID ? "Configured" : "Missing / Unset"}`);
  console.log(`   - GitHub OAuth Client Secret: ${envConfig.GITHUB_CLIENT_SECRET ? "Configured" : "Missing / Unset"}`);
  console.log(`   - GitHub Redirect URI: ${envConfig.GITHUB_REDIRECT_URI}`);
  console.log("--------------------------------------------------");
}
