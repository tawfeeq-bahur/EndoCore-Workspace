import { prisma } from "../../db.js";
import { envConfig } from "../config/env.js";

/**
 * EndoCore Privacy Statement:
 * EndoCore does not monitor local terminal or Git commands.
 * GitHub activity is ingested exclusively from GitHub Webhooks, GitHub API polling, and reconciliation.
 */

export interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string | null;
  name: string | null;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  updated_at: string;
}

export interface TokenExchangeResult {
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scope?: string;
}

export interface GitHubCommitItem {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; email: string; date: string } | null;
    committer: { name: string; email: string; date: string } | null;
  };
  author: { login: string; id: number; avatar_url?: string } | null;
  committer: { login: string; id: number; avatar_url?: string } | null;
}

export interface GitHubPullRequestItem {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user: { login: string; id: number; avatar_url?: string } | null;
  head?: { ref: string };
  base?: { ref: string };
}

export interface GitHubIssueItem {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  user: { login: string; id: number; avatar_url?: string } | null;
  pull_request?: any;
}

export interface GitHubReviewItem {
  id: number;
  user: { login: string; id: number; avatar_url?: string } | null;
  body: string | null;
  state: string;
  html_url: string;
  submitted_at: string | null;
}

export class GitHubRateLimitError extends Error {
  public resetTime?: Date;
  constructor(message: string, resetTime?: Date) {
    super(message);
    this.name = "GitHubRateLimitError";
    this.resetTime = resetTime;
  }
}

export class GitHubAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitHubAuthError";
  }
}

export class GitHubService {
  private getClientId(): string {
    if (!envConfig.GITHUB_CLIENT_ID) {
      throw new Error("GitHub OAuth configuration is incomplete. Missing: GITHUB_CLIENT_ID.");
    }
    return envConfig.GITHUB_CLIENT_ID;
  }

  private getClientSecret(): string {
    if (!envConfig.GITHUB_CLIENT_SECRET) {
      throw new Error("GitHub OAuth configuration is incomplete. Missing: GITHUB_CLIENT_SECRET.");
    }
    return envConfig.GITHUB_CLIENT_SECRET;
  }

  private getCallbackUrl(): string {
    return envConfig.GITHUB_REDIRECT_URI;
  }

  private handleResponseError(response: Response, actionContext: string) {
    if (response.status === 401) {
      throw new GitHubAuthError(`GitHub authentication failed during ${actionContext}. Token may be invalid or revoked.`);
    }

    if (response.status === 403 || response.status === 429) {
      const resetHeader = response.headers.get("x-ratelimit-reset");
      let resetTime: Date | undefined;
      if (resetHeader) {
        resetTime = new Date(parseInt(resetHeader, 10) * 1000);
      }
      throw new GitHubRateLimitError(`GitHub rate limit exceeded during ${actionContext}.`, resetTime);
    }

    throw new Error(`GitHub API error during ${actionContext}: HTTP ${response.status}`);
  }

  /**
   * Generates the GitHub OAuth authorization URL.
   */
  public getAuthorizationUrl(state: string): string {
    const clientId = this.getClientId();
    const redirectUri = this.getCallbackUrl();
    const scopes = "read:user user:email repo";

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      state
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for GitHub access token.
   */
  public async exchangeOAuthCode(code: string): Promise<TokenExchangeResult> {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();
    const redirectUri = this.getCallbackUrl();

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "EndoCore-Workspace"
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub token exchange failed with HTTP status ${response.status}`);
    }

    const data = (await response.json()) as any;

    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
    }

    if (!data.access_token) {
      throw new Error("No access_token returned from GitHub token exchange.");
    }

    let tokenExpiresAt: Date | undefined = undefined;
    if (data.expires_in && typeof data.expires_in === "number") {
      tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || undefined,
      tokenExpiresAt,
      scope: data.scope || undefined
    };
  }

  /**
   * Fetches authenticated GitHub user profile.
   */
  public async getAuthenticatedUser(accessToken: string): Promise<GitHubUser> {
    const response = await fetch("https://api.github.com/user", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "EndoCore-Workspace"
      }
    });

    if (!response.ok) {
      this.handleResponseError(response, "getAuthenticatedUser");
    }

    const profile = (await response.json()) as any;
    let email: string | null = profile.email || null;

    // Fallback if primary email is private in main profile
    if (!email) {
      try {
        const emailResponse = await fetch("https://api.github.com/user/emails", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "EndoCore-Workspace"
          }
        });

        if (emailResponse.ok) {
          const emails = (await emailResponse.json()) as any[];
          if (Array.isArray(emails)) {
            const primary = emails.find((e) => e.primary && e.verified) || emails[0];
            if (primary?.email) {
              email = primary.email;
            }
          }
        }
      } catch (err) {
        // Non-fatal, email remains null
      }
    }

    return {
      id: profile.id,
      login: profile.login,
      email,
      avatar_url: profile.avatar_url || null,
      name: profile.name || null
    };
  }

  /**
   * Fetches user's accessible GitHub repositories.
   */
  public async getRepositories(accessToken: string): Promise<GitHubRepository[]> {
    const response = await fetch(
      "https://api.github.com/user/repos?per_page=100&sort=updated&type=all",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "EndoCore-Workspace"
        }
      }
    );

    if (!response.ok) {
      this.handleResponseError(response, "getRepositories");
    }

    const repos = (await response.json()) as any[];
    if (!Array.isArray(repos)) {
      return [];
    }

    return repos.map((r) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      html_url: r.html_url,
      description: r.description || null,
      private: !!r.private,
      updated_at: r.updated_at || new Date().toISOString()
    }));
  }

  /**
   * Fetches commits authored by the authenticated user in a specific repository.
   */
  public async getCommitsForRepo(
    accessToken: string,
    owner: string,
    repo: string,
    author?: string,
    since?: Date
  ): Promise<GitHubCommitItem[]> {
    const params = new URLSearchParams({ per_page: "50" });
    if (author) params.append("author", author);
    if (since) params.append("since", since.toISOString());

    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?${params.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "EndoCore-Workspace"
      }
    });

    if (!response.ok) {
      if (response.status === 409 || response.status === 404) {
        // Empty repository or not found
        return [];
      }
      this.handleResponseError(response, `getCommitsForRepo (${owner}/${repo})`);
    }

    const data = (await response.json()) as any[];
    if (!Array.isArray(data)) return [];

    return data.map((c) => ({
      sha: c.sha,
      html_url: c.html_url,
      commit: {
        message: c.commit?.message || "",
        author: c.commit?.author || null,
        committer: c.commit?.committer || null
      },
      author: c.author ? { login: c.author.login, id: c.author.id, avatar_url: c.author.avatar_url } : null,
      committer: c.committer ? { login: c.committer.login, id: c.committer.id, avatar_url: c.committer.avatar_url } : null
    }));
  }

  /**
   * Fetches pull requests in a specific repository.
   */
  public async getPullRequestsForRepo(
    accessToken: string,
    owner: string,
    repo: string,
    since?: Date
  ): Promise<GitHubPullRequestItem[]> {
    const params = new URLSearchParams({
      state: "all",
      sort: "updated",
      direction: "desc",
      per_page: "50"
    });

    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?${params.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "EndoCore-Workspace"
      }
    });

    if (!response.ok) {
      if (response.status === 404) return [];
      this.handleResponseError(response, `getPullRequestsForRepo (${owner}/${repo})`);
    }

    const data = (await response.json()) as any[];
    if (!Array.isArray(data)) return [];

    let filtered = data;
    if (since) {
      const sinceTime = since.getTime();
      filtered = data.filter((pr) => new Date(pr.updated_at).getTime() >= sinceTime);
    }

    return filtered.map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      state: pr.state,
      html_url: pr.html_url,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      closed_at: pr.closed_at || null,
      merged_at: pr.merged_at || null,
      user: pr.user ? { login: pr.user.login, id: pr.user.id, avatar_url: pr.user.avatar_url } : null,
      head: pr.head ? { ref: pr.head.ref } : undefined,
      base: pr.base ? { ref: pr.base.ref } : undefined
    }));
  }

  /**
   * Fetches issues in a specific repository.
   */
  public async getIssuesForRepo(
    accessToken: string,
    owner: string,
    repo: string,
    since?: Date
  ): Promise<GitHubIssueItem[]> {
    const params = new URLSearchParams({
      state: "all",
      sort: "updated",
      direction: "desc",
      per_page: "50"
    });
    if (since) params.append("since", since.toISOString());

    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?${params.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "EndoCore-Workspace"
      }
    });

    if (!response.ok) {
      if (response.status === 404) return [];
      this.handleResponseError(response, `getIssuesForRepo (${owner}/${repo})`);
    }

    const data = (await response.json()) as any[];
    if (!Array.isArray(data)) return [];

    // Filter out PRs returned by the issues endpoint
    const issuesOnly = data.filter((item) => !item.pull_request);

    return issuesOnly.map((issue) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      html_url: issue.html_url,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      closed_at: issue.closed_at || null,
      user: issue.user ? { login: issue.user.login, id: issue.user.id, avatar_url: issue.user.avatar_url } : null
    }));
  }

  /**
   * Fetches reviews for a specific pull request.
   */
  public async getReviewsForPullRequest(
    accessToken: string,
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<GitHubReviewItem[]> {
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}/reviews?per_page=50`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "EndoCore-Workspace"
      }
    });

    if (!response.ok) {
      if (response.status === 404) return [];
      this.handleResponseError(response, `getReviewsForPullRequest (${owner}/${repo} #${pullNumber})`);
    }

    const data = (await response.json()) as any[];
    if (!Array.isArray(data)) return [];

    return data.map((r) => ({
      id: r.id,
      user: r.user ? { login: r.user.login, id: r.user.id, avatar_url: r.user.avatar_url } : null,
      body: r.body || null,
      state: r.state,
      html_url: r.html_url,
      submitted_at: r.submitted_at || null
    }));
  }

  /**
   * Idempotently syncs repositories into IntegrationResource table.
   */
  public async syncUserRepositories(
    userId: string,
    integrationId: string,
    accessToken: string
  ): Promise<{ count: number }> {
    const repos = await this.getRepositories(accessToken);

    for (const repo of repos) {
      await prisma.integrationResource.upsert({
        where: {
          integrationId_resourceType_externalId: {
            integrationId,
            resourceType: "REPOSITORY",
            externalId: repo.id.toString()
          }
        },
        create: {
          integrationId,
          provider: "GITHUB",
          resourceType: "REPOSITORY",
          externalId: repo.id.toString(),
          name: repo.name,
          identifier: repo.full_name,
          url: repo.html_url,
          metadata: JSON.stringify({
            private: repo.private,
            description: repo.description,
            updatedAt: repo.updated_at
          })
        },
        update: {
          name: repo.name,
          identifier: repo.full_name,
          url: repo.html_url,
          metadata: JSON.stringify({
            private: repo.private,
            description: repo.description,
            updatedAt: repo.updated_at
          })
        }
      });
    }

    await prisma.userIntegration.update({
      where: { id: integrationId },
      data: { lastSyncedAt: new Date() }
    });

    return { count: repos.length };
  }
}

export const githubService = new GitHubService();
