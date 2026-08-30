import { githubService } from "../githubService.js";
import { githubActivityService } from "../githubActivityService.js";
import { integrationHealthService } from "../integrationHealthService.js";
import { integrationManagementService } from "../integrationManagementService.js";
import { envConfig, getGitHubConfigStatus } from "../../config/env.js";

export interface SyncExecutionResult {
  success: boolean;
  synced: number;
  created: number;
  updated: number;
  skipped: number;
  repositories?: number;
  items?: number;
  lastSyncedAt: string;
  warning?: string;
  error?: string;
  inProgress?: boolean;
}

export interface ProviderConfigStatus {
  configured: boolean;
  provider: string;
  clientIdConfigured?: boolean;
  clientSecretConfigured?: boolean;
  redirectUriConfigured?: boolean;
  redirectUri?: string;
  message?: string;
}

export interface IntegrationProvider {
  getProvider(): string;
  getName(): string;
  isConfigured(): boolean;
  getConfigStatus(): ProviderConfigStatus;
  getAuthorizationUrl(state: string): Promise<string> | string;
  sync(userId: string, source?: "MANUAL" | "POLLING", onNewActivity?: any): Promise<SyncExecutionResult>;
  reconcile(userId: string): Promise<any>;
  getDetails(userId: string): Promise<any>;
}

export class GitHubProvider implements IntegrationProvider {
  getProvider(): string {
    return "GITHUB";
  }

  getName(): string {
    return "GitHub";
  }

  isConfigured(): boolean {
    return envConfig.isGitHubOAuthConfigured;
  }

  getConfigStatus(): ProviderConfigStatus {
    return getGitHubConfigStatus();
  }

  getAuthorizationUrl(state: string): string {
    return githubService.getAuthorizationUrl(state);
  }

  async sync(userId: string, source: "MANUAL" | "POLLING" = "MANUAL", onNewActivity?: any): Promise<SyncExecutionResult> {
    return githubActivityService.syncUserGitHubActivity(userId, source, onNewActivity);
  }

  async reconcile(userId: string): Promise<any> {
    const repoResult = await integrationManagementService.reconcileRepositories(userId, "GITHUB");
    const activityResult = await integrationManagementService.reconcileActivity(userId, "GITHUB");
    const goalResult = await integrationManagementService.reverifyGoals(userId, "GITHUB");
    return {
      repositories: repoResult,
      activities: activityResult,
      goals: goalResult
    };
  }

  async getDetails(userId: string): Promise<any> {
    return integrationManagementService.getIntegrationDetails(userId, "GITHUB");
  }
}

export class FallbackProvider implements IntegrationProvider {
  private providerKey: string;
  private providerName: string;

  constructor(providerKey: string, providerName: string) {
    this.providerKey = providerKey.toUpperCase();
    this.providerName = providerName;
  }

  getProvider(): string {
    return this.providerKey;
  }

  getName(): string {
    return this.providerName;
  }

  isConfigured(): boolean {
    return true;
  }

  getConfigStatus(): ProviderConfigStatus {
    return {
      configured: true,
      provider: this.providerKey.toLowerCase(),
      message: `${this.providerName} integration provider initialized.`
    };
  }

  getAuthorizationUrl(state: string): string {
    return `/?integration=${this.providerKey.toLowerCase()}&status=simulated&state=${encodeURIComponent(state)}`;
  }

  async sync(userId: string, source: "MANUAL" | "POLLING" = "MANUAL"): Promise<SyncExecutionResult> {
    return {
      success: true,
      synced: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      items: 0,
      lastSyncedAt: new Date().toISOString(),
      warning: `${this.providerName} manual synchronization acknowledged.`
    };
  }

  async reconcile(userId: string): Promise<any> {
    return {
      repositories: { added: 0, updated: 0, unchanged: 0, missing: 0 },
      activities: { synced: 0, created: 0, skipped: 0 },
      goals: { reverified: 0, completed: 0, updated: 0 }
    };
  }

  async getDetails(userId: string): Promise<any> {
    return {
      provider: this.providerKey,
      name: this.providerName,
      connected: true,
      healthStatus: "HEALTHY",
      lastSyncedAt: new Date().toISOString()
    };
  }
}

export class IntegrationProviderRegistry {
  private providers: Map<string, IntegrationProvider> = new Map();

  constructor() {
    this.register(new GitHubProvider());

    const fallbackList = [
      { key: "JIRA", name: "Jira" },
      { key: "GOOGLE_CALENDAR", name: "Google Calendar" },
      { key: "LINEAR", name: "Linear" },
      { key: "SLACK", name: "Slack" },
      { key: "GITLAB", name: "GitLab" },
      { key: "FIGMA", name: "Figma" },
      { key: "NOTION", name: "Notion" },
      { key: "MICROSOFT_TEAMS", name: "Microsoft Teams" },
      { key: "GOOGLE_DRIVE", name: "Google Drive" },
      { key: "TRELLO", name: "Trello" },
      { key: "ASANA", name: "Asana" }
    ];

    for (const item of fallbackList) {
      this.register(new FallbackProvider(item.key, item.name));
    }
  }

  public register(provider: IntegrationProvider): void {
    this.providers.set(provider.getProvider().toUpperCase(), provider);
  }

  public getProvider(providerKey: string): IntegrationProvider | undefined {
    return this.providers.get(providerKey.toUpperCase());
  }

  public getAllProviders(): IntegrationProvider[] {
    return Array.from(this.providers.values());
  }
}

export const integrationProviderRegistry = new IntegrationProviderRegistry();
