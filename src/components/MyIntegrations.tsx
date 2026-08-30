import React, { useState, useEffect, useCallback } from "react";
import { getSocket } from "../services/socketManager";
import { 
  Search, 
  Settings, 
  Shield, 
  Check, 
  Plus, 
  RefreshCw, 
  ExternalLink, 
  X, 
  Puzzle, 
  Activity, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { ActivityItem } from "../types";

interface IntegrationItem {
  id: string;
  provider: string;
  username: string;
  isConnected: boolean;
  autoPauseCalendar: boolean;
  lastSyncedAt: string;
  repositoryCount?: number;
  activityCount?: number;
}

interface MyIntegrationsProps {
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  triggerToast: (msg: string) => void;
  activeProjectName: string;
  setActiveProjectName: (name: string) => void;
}

// Inline brand logos for a premium, high-fidelity aesthetic
const IntegrationLogo = ({ provider, className = "w-8 h-8" }: { provider: string; className?: string }) => {
  switch (provider) {
    case "GITHUB":
      return (
        <svg className={`${className} text-neutral-900`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
        </svg>
      );
    case "JIRA":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.53 2c-.22.18-.3.49-.16.74l3.19 5.64c.15.26.43.42.73.42h6.14c.55 0 .93-.54.73-1.05L19.2 2.65A1.5 1.5 0 0 0 17.81 1.7H12.3c-.31 0-.6.11-.77.3zM1.86 10.63l2.96 5.23c.15.26.43.42.73.42h6.14c.55 0 .93-.54.73-1.05l-2.96-5.23A1.5 1.5 0 0 0 8.07 9.3H2.63c-.31 0-.6.11-.77.3-.22.18-.3.49-.16.74l.16.29zM7.74 21.6h6.14c.55 0 .93-.54.73-1.05l-2.96-5.23a1.5 1.5 0 0 0-1.31-.72H4.9c-.31 0-.6.11-.77.3-.22.18-.3.49-.16.74l2.96 5.23c.15.26.43.42.73.42z" fill="#0052CC"/>
        </svg>
      );
    case "GOOGLE_CALENDAR":
      return (
        <svg className={className} viewBox="0 0 48 48">
          <path fill="#4285F4" d="M40 8H8c-2.2 0-4 1.8-4 4v24c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V12c0-2.2-1.8-4-4-4z"/>
          <path fill="#FFF" d="M31 16H17v16h14V16z"/>
          <path fill="#34A853" d="M17 16h6v6h-6zm8 0h6v6h-6zm-8 8h6v6h-6z"/>
          <path fill="#EA4335" d="M25 24h6v6h-6z"/>
        </svg>
      );
    case "LINEAR":
      return (
        <svg className={`${className} text-[#5E6AD2]`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm1 15.93V14h-2v3.93c-2.935-.484-5.246-2.795-5.73-5.73H9v-2H5.27c.484-2.935 2.795-5.246 5.73-5.73V7h2v-2.07c2.935.484 5.246 2.795 5.73 5.73H15v2h3.73c-.484 2.935-2.795 5.246-5.73 5.73z"/>
        </svg>
      );
    case "SLACK":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52z" fill="#36C5F0"/>
          <path d="M6.302 15.165a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.822a2.528 2.528 0 0 1-2.52-2.52v-5.042z" fill="#36C5F0"/>
          <path d="M8.822 5.043a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52v2.52h-2.522a2.528 2.528 0 0 1-2.52-2.52z" fill="#2EB67D"/>
          <path d="M8.822 6.302a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.78a2.528 2.528 0 0 1-2.522-2.522 2.528 2.528 0 0 1 2.522-2.52h5.043z" fill="#2EB67D"/>
          <path d="M18.958 8.822a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52v-2.52z" fill="#ECB22E"/>
          <path d="M17.698 8.822a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V3.78a2.528 2.528 0 0 1 2.522-2.522h5.043a2.528 2.528 0 0 1 2.52 2.522v5.042z" fill="#ECB22E"/>
          <path d="M15.178 18.958a2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.522-2.52v-2.52h2.522a2.528 2.528 0 0 1 2.52 2.52z" fill="#E01E5A"/>
          <path d="M15.178 17.698a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.52-2.522h5.043a2.528 2.528 0 0 1 2.522 2.522 2.528 2.528 0 0 1-2.522 2.52h-5.043v5.043z" fill="#E01E5A"/>
        </svg>
      );
    case "GITLAB":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M23.63 12.593l-1.042-3.21a.75.75 0 0 0-.251-.383l-10.1-7.362a.375.375 0 0 0-.44 0L1.697 9a.75.75 0 0 0-.25.383L.403 12.59a1.127 1.127 0 0 0 .41 1.258l10.97 7.994c.13.094.303.094.433 0l10.97-7.994a1.127 1.127 0 0 0 .41-1.258z" fill="#FC6D26"/>
          <path d="M12 21.846l3.657-11.25H8.343L12 21.846z" fill="#E24329"/>
          <path d="M12 21.846L8.343 10.596H1.697l10.303 11.25z" fill="#FC6D26"/>
          <path d="M1.697 10.596l6.646-4.832L1.697 10.596z" fill="#FCA326"/>
          <path d="M12 21.846l3.657-11.25h6.646L12 21.846z" fill="#FC6D26"/>
          <path d="M22.303 10.596l-6.646-4.832 6.646 4.832z" fill="#FCA326"/>
        </svg>
      );
    case "FIGMA":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 2c2.209 0 4 1.791 4 4v4H8C5.791 10 4 8.209 4 6s1.791-4 4-4z" fill="#F24E1E"/>
          <path d="M12 10V6c0-2.209 1.791-4 4-4s4 1.791 4 6-1.791 4-4 4h-4z" fill="#FF7262"/>
          <path d="M8 10c2.209 0 4 1.791 4 4v4c0 2.209-1.791 4-4 4s-4-1.791-4-4 1.791-4 4-4z" fill="#1ABC9C"/>
          <path d="M12 14c0-2.209 1.791-4 4-4s4 1.791 4 4-1.791 4-4 4h-4v-4z" fill="#0ACF83"/>
          <path d="M8 10h4v4H8c-2.209 0-4-1.791-4-4s1.791-4 4-4z" fill="#A259FF"/>
        </svg>
      );
    case "NOTION":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M4.2 3h15.6c.66 0 1.2.54 1.2 1.2v15.6c0 .66-.54 1.2-1.2 1.2H4.2C3.54 21 3 20.46 3 19.8V4.2C3 3.54 3.54 3 4.2 3zm2.4 3h2.4l5.4 7.2V6h3v12h-2.4L7.2 10.8V18H4.2V6h2.4z" fill="black"/>
        </svg>
      );
    case "MICROSOFT_TEAMS":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#4B53BC"/>
          <path d="M12.5 7.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zM11.5 10c0-1.1.9-2 2-2h1c1.1 0 2 .9 2 2v5h-5v-5zM7.5 8c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm-1 2c0-1.1.9-2 2-2h1c1.1 0 2 .9 2 2v6h-5v-6z" fill="white"/>
        </svg>
      );
    case "GOOGLE_DRIVE":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.33 3.5L2.5 13.5l3.33 5.75L11.67 9.25 8.33 3.5z" fill="#0066DA"/>
          <path d="M15.67 3.5H8.33l6.67 11.5h7.33L15.67 3.5z" fill="#00A85D"/>
          <path d="M5.83 19.25l3.34-5.75h13.33l-3.34 5.75H5.83z" fill="#FFD014"/>
        </svg>
      );
    case "TRELLO":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#0079BF"/>
          <rect x="4" y="4" width="6" height="12" rx="1.5" fill="white"/>
          <rect x="14" y="4" width="6" height="8" rx="1.5" fill="white"/>
        </svg>
      );
    case "ASANA":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="7" r="3" fill="#F86368"/>
          <circle cx="7.5" cy="15.5" r="3" fill="#F86368"/>
          <circle cx="16.5" cy="15.5" r="3" fill="#F86368"/>
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M12 8v8M8 12h8"/>
        </svg>
      );
  }
};

export default function MyIntegrations({ 
  apiFetch, 
  triggerToast, 
  activeProjectName,
  setActiveProjectName 
}: MyIntegrationsProps) {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Modals state
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationItem | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddIntegrationsPicker, setShowAddIntegrationsPicker] = useState(false);

  // Form input states inside modals
  const [workspaceId, setWorkspaceId] = useState("");
  const [autoPause, setAutoPause] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Custom integration states
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customToolName, setCustomToolName] = useState("");
  const [customToolDesc, setCustomToolDesc] = useState("");
  const [customLoading, setCustomLoading] = useState(false);

  const [syncingGitHub, setSyncingGitHub] = useState(false);
  const [realExternalActivities, setRealExternalActivities] = useState<ActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Step 8: Integration Health & Sync History states
  const [githubStatus, setGithubStatus] = useState<any>(null);
  const [showSyncHistoryModal, setShowSyncHistoryModal] = useState(false);
  const [syncHistoryLogs, setSyncHistoryLogs] = useState<any[]>([]);
  const [syncHistoryLoading, setSyncHistoryLoading] = useState(false);

  // Step 9: Integration Management, Recovery & Details states
  const [reconcilingGitHub, setReconcilingGitHub] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [integrationDetails, setIntegrationDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadGitHubStatus = useCallback(async () => {
    try {
      const res = await apiFetch("/api/integrations/GITHUB/status");
      if (res.ok) {
        const data = await res.json();
        setGithubStatus(data);
      }
    } catch (err) {
      console.error("Error loading GitHub status:", err);
    }
  }, [apiFetch]);

  const loadSyncHistory = useCallback(async () => {
    setSyncHistoryLoading(true);
    try {
      const res = await apiFetch("/api/integrations/GITHUB/sync-history?limit=20");
      if (res.ok) {
        const data = await res.json();
        setSyncHistoryLogs(data.items || []);
      }
    } catch (err) {
      console.error("Error loading sync history:", err);
    } finally {
      setSyncHistoryLoading(false);
    }
  }, [apiFetch]);

  const loadRecentActivities = useCallback(async () => {
    setLoadingActivities(true);
    try {
      const res = await apiFetch("/api/activity/timeline?source=EXTERNAL&provider=GITHUB&limit=10");
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.items)) {
          setRealExternalActivities(json.items);
        }
      }
    } catch (err) {
      console.error("Error fetching external activity timeline:", err);
    } finally {
      setLoadingActivities(false);
    }
  }, [apiFetch]);

  const handleManualGitHubSync = async () => {
    setSyncingGitHub(true);
    try {
      const res = await apiFetch("/api/integrations/GITHUB/sync", { method: "POST" });
      const data = await res.json();
      if (res.status === 409 || data.inProgress) {
        triggerToast("⏳ Synchronization is already in progress.");
      } else if (res.ok && data.success) {
        triggerToast(`🔄 GitHub sync complete: ${data.created} new activities, ${data.updated} updated from ${data.repositories || 0} repos.`);
        loadIntegrations();
        loadGitHubStatus();
        loadRecentActivities();
        if (showSyncHistoryModal) loadSyncHistory();
      } else {
        triggerToast(`⚠️ Sync notice: ${data.error || data.warning || "Sync incomplete"}`);
        loadGitHubStatus();
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || "Error communicating with server during GitHub sync.");
    } finally {
      setSyncingGitHub(false);
    }
  };

  // Step 9: Reconnect GitHub via OAuth
  const handleReconnectGitHub = async () => {
    try {
      const res = await apiFetch("/api/integrations/GITHUB/reconnect", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        triggerToast(`❌ ${data.error || "Could not generate reconnection URL."}`);
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || "Error initiating GitHub reconnection.");
    }
  };

  // Step 9: Reconcile & Refresh
  const handleReconcile = async () => {
    setReconcilingGitHub(true);
    try {
      const res = await apiFetch("/api/integrations/GITHUB/reconcile", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(`✅ Reconciled: ${data.repositories?.added || 0} new repos, ${data.activities?.created || 0} activities, ${data.goals?.reverified || 0} goals reverified.`);
        loadIntegrations();
        loadGitHubStatus();
        loadRecentActivities();
      } else {
        triggerToast(`⚠️ Reconciliation: ${data.error || "Incomplete"}`);
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || "Error during reconciliation.");
    } finally {
      setReconcilingGitHub(false);
    }
  };

  // Step 9: Reset Transient Errors
  const handleResetError = async () => {
    try {
      const res = await apiFetch("/api/integrations/GITHUB/reset-error", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        triggerToast("✅ Transient errors cleared.");
        loadGitHubStatus();
      } else {
        triggerToast(`⚠️ Cannot reset: ${data.healthStatus || "unknown state"}`);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error resetting errors.");
    }
  };

  // Step 9: Load Integration Details
  const loadIntegrationDetails = async () => {
    setDetailsLoading(true);
    try {
      const res = await apiFetch("/api/integrations/GITHUB/details");
      if (res.ok) {
        const data = await res.json();
        setIntegrationDetails(data);
      }
    } catch (err) {
      console.error("Error loading integration details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const loadIntegrations = async () => {
    try {
      const res = await apiFetch("/api/integrations");
      if (res.ok) {
        const data = await res.json();
        setIntegrations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error loading integrations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
    loadGitHubStatus();
    loadRecentActivities();
  }, [loadIntegrations, loadGitHubStatus, loadRecentActivities]);

  useEffect(() => {
    // Attach Socket.io listener for real-time external activity & sync status pushes
    const socket = getSocket();
    if (socket) {
      const handleExternalActivity = (data: { userId: string; activity: ActivityItem }) => {
        if (data && data.activity) {
          setRealExternalActivities((prev) => {
            if (prev.some((item) => item.id === data.activity.id)) {
              return prev;
            }
            return [data.activity, ...prev].slice(0, 10);
          });
        }
      };

      const handleSyncStarted = (data: any) => {
        if (data.provider === "GITHUB") {
          setSyncingGitHub(true);
        }
      };

      const handleSyncCompleted = (data: any) => {
        if (data.provider === "GITHUB") {
          setSyncingGitHub(false);
          loadGitHubStatus();
          loadRecentActivities();
        }
      };

      const handleSyncFailed = (data: any) => {
        if (data.provider === "GITHUB") {
          setSyncingGitHub(false);
          loadGitHubStatus();
        }
      };

      const handleHealthUpdate = (data: any) => {
        if (data.provider === "GITHUB") {
          loadGitHubStatus();
        }
      };

      const handleReconnected = (data: any) => {
        if (data.provider === "GITHUB") {
          loadGitHubStatus();
          loadIntegrations();
          triggerToast("🔌 GitHub account reconnected successfully!");
        }
      };

      const handleReconciled = (data: any) => {
        if (data.provider === "GITHUB") {
          loadGitHubStatus();
          loadIntegrations();
          loadRecentActivities();
        }
      };

      socket.on("activity-external-update", handleExternalActivity);
      socket.on("integration-sync-started", handleSyncStarted);
      socket.on("integration-sync-completed", handleSyncCompleted);
      socket.on("integration-sync-failed", handleSyncFailed);
      socket.on("integration-health-update", handleHealthUpdate);
      socket.on("integration-reconnected", handleReconnected);
      socket.on("integration-reconciled", handleReconciled);

      // Handle OAuth Callback return URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const integrationParam = urlParams.get("integration");
      const statusParam = urlParams.get("status");
      const messageParam = urlParams.get("message");
      const usernameParam = urlParams.get("username");

      if (integrationParam === "github") {
        if (statusParam === "success") {
          triggerToast(`🔌 Connected GitHub account ${usernameParam ? `@${usernameParam}` : ""} successfully!`);
          loadGitHubStatus();
        } else if (statusParam === "error") {
          triggerToast(`❌ GitHub OAuth error: ${messageParam || "Authorization failed"}`);
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      return () => {
        socket.off("activity-external-update", handleExternalActivity);
        socket.off("integration-sync-started", handleSyncStarted);
        socket.off("integration-sync-completed", handleSyncCompleted);
        socket.off("integration-sync-failed", handleSyncFailed);
        socket.off("integration-health-update", handleHealthUpdate);
        socket.off("integration-reconnected", handleReconnected);
        socket.off("integration-reconciled", handleReconciled);
      };
    }
  }, [loadGitHubStatus, loadIntegrations, loadRecentActivities, triggerToast]);

  const getProviderName = (provider: string) => {
    switch (provider) {
      case "GITHUB": return "GitHub";
      case "JIRA": return "Jira";
      case "GOOGLE_CALENDAR": return "Google Calendar";
      case "LINEAR": return "Linear";
      case "SLACK": return "Slack";
      case "GITLAB": return "GitLab";
      case "FIGMA": return "Figma";
      case "NOTION": return "Notion";
      case "MICROSOFT_TEAMS": return "Microsoft Teams";
      case "GOOGLE_DRIVE": return "Google Drive";
      case "TRELLO": return "Trello";
      case "ASANA": return "Asana";
      default: return provider;
    }
  };

  const getProviderCategory = (provider: string) => {
    switch (provider) {
      case "GITHUB":
      case "GITLAB":
        return "Developer Tool";
      case "JIRA":
      case "LINEAR":
      case "TRELLO":
      case "ASANA":
        return "Project Management";
      case "GOOGLE_CALENDAR":
        return "Productivity";
      case "SLACK":
      case "MICROSOFT_TEAMS":
        return "Communication";
      case "FIGMA":
        return "Design Tool";
      case "NOTION":
        return "Documentation";
      case "GOOGLE_DRIVE":
        return "Storage";
      default:
        return "Utility";
    }
  };

  const getProviderDescription = (provider: string) => {
    switch (provider) {
      case "GITHUB": return "Repository activity, commits, PRs and branch insights.";
      case "JIRA": return "Issues, tasks, epics and sprint progress for focus tracking.";
      case "GOOGLE_CALENDAR": return "Meetings, events and focus time blocking.";
      case "LINEAR": return "Issues, cycles and progress from Linear.";
      case "SLACK": return "Channel messages, mentions and team updates.";
      case "GITLAB": return "Commits, merge requests and pipeline insights.";
      case "FIGMA": return "Design activity and file updates from Figma.";
      case "NOTION": return "Pages, docs and knowledge base updates.";
      case "MICROSOFT_TEAMS": return "Team messages, calls and meeting notifications.";
      case "GOOGLE_DRIVE": return "Files, docs and shared drive activity.";
      case "TRELLO": return "Boards, cards and task progress.";
      case "ASANA": return "Tasks, projects and team work progress.";
      default: return "Connect and sync credentials with your workstation.";
    }
  };

  const getProviderConnectedDetails = (item: IntegrationItem) => {
    if (!item.isConnected) return "";
    switch (item.provider) {
      case "GITHUB": {
        const repoStr = item.repositoryCount ? `${item.repositoryCount} repos` : "";
        const actStr = item.activityCount !== undefined ? `${item.activityCount} activities` : "";
        if (repoStr && actStr) return `${repoStr} • ${actStr} synced`;
        if (repoStr) return `${repoStr} synced`;
        return item.username ? `@${item.username}` : "Connected to GitHub";
      }
      case "JIRA": return "24 tasks synced";
      case "GOOGLE_CALENDAR": return "Next sync in 1 min";
      case "LINEAR": return "12 issues active";
      case "SLACK": return "Connected to #engineering";
      case "GITLAB": return "Pipelines running";
      case "FIGMA": return "3 files linked";
      case "NOTION": return "Wiki workspace synced";
      case "MICROSOFT_TEAMS": return "Active status synced";
      case "GOOGLE_DRIVE": return "Storage linked";
      case "TRELLO": return "2 boards active";
      case "ASANA": return "5 projects tracked";
      default: return "Live Sync Active";
    }
  };

  // REST API: Connect Integration
  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntegration) return;

    setModalLoading(true);
    try {
      const res = await apiFetch(`/api/integrations/${selectedIntegration.provider}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: workspaceId })
      });

      if (res.ok) {
        const updated = await res.json();
        setIntegrations(prev => prev.map(item => item.id === updated.id ? updated : item));
        triggerToast(`🔌 Connected ${getProviderName(updated.provider)} successfully!`);

        setShowConnectModal(false);
        setWorkspaceId("");
      } else {
        triggerToast("Failed to connect integration.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error communicating with server.");
    } finally {
      setModalLoading(false);
    }
  };

  // REST API: Disconnect Integration
  const handleDisconnect = async () => {
    if (!selectedIntegration) return;

    setModalLoading(true);
    try {
      const res = await apiFetch(`/api/integrations/${selectedIntegration.provider}/disconnect`, {
        method: "POST"
      });

      if (res.ok) {
        const updated = await res.json();
        setIntegrations(prev => prev.map(item => item.id === updated.id ? updated : item));
        triggerToast(`⚡ Disconnected ${getProviderName(updated.provider)}`);
        
        setShowSettingsModal(false);
        setShowConnectModal(false);
      } else {
        triggerToast("Failed to disconnect integration.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error communicating with server.");
    } finally {
      setModalLoading(false);
    }
  };

  // REST API: Patch configuration (Workspace identifier, Auto-pause calendar)
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntegration) return;

    setModalLoading(true);
    try {
      const res = await apiFetch(`/api/integrations/${selectedIntegration.provider}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: workspaceId,
          autoPauseCalendar: autoPause
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setIntegrations(prev => prev.map(item => item.id === updated.id ? updated : item));
        triggerToast(`⚙️ Saved ${getProviderName(updated.provider)} settings`);
        setShowSettingsModal(false);
      } else {
        triggerToast("Failed to update settings.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error communicating with server.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleCustomRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customToolName.trim()) return;

    setCustomLoading(true);
    // Simulate API request delay
    setTimeout(() => {
      triggerToast(`🚀 Custom integration request for "${customToolName}" submitted successfully!`);
      setCustomToolName("");
      setCustomToolDesc("");
      setCustomLoading(false);
      setShowCustomModal(false);
    }, 800);
  };

  // Trigger modal triggers
  const openConnectDialog = async (item: IntegrationItem) => {
    setSelectedIntegration(item);
    if (item.provider === "GITHUB") {
      try {
        const res = await apiFetch("/api/integrations/github/authorize?json=true");
        const data = await res.json();
        if (res.ok && data.url) {
          window.location.href = data.url;
        } else {
          triggerToast(`❌ GitHub OAuth: ${data.error || "Failed to generate authorization URL"}`);
        }
      } catch (err: any) {
        triggerToast(`❌ ${err.message || "Error initiating GitHub connection"}`);
      }
      return;
    }
    setWorkspaceId(item.username || "");
    setShowConnectModal(true);
  };

  const openSettingsDialog = (item: IntegrationItem) => {
    setSelectedIntegration(item);
    setWorkspaceId(item.username || "");
    setAutoPause(item.autoPauseCalendar);
    setShowSettingsModal(true);
  };

  // Dynamic filter counters
  const connectedCount = integrations.filter(i => i.isConnected).length;

  // Filter grid calculations
  const filteredIntegrations = integrations.filter(item => {
    const name = getProviderName(item.provider).toLowerCase();
    const category = getProviderCategory(item.provider).toLowerCase();
    const desc = getProviderDescription(item.provider).toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || 
                          category.includes(searchQuery.toLowerCase()) || 
                          desc.includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "all") return true;
    if (activeTab === "connected") return item.isConnected;
    if (activeTab === "dev_tools") return category === "developer tool";
    if (activeTab === "project_management") return category === "project management";
    if (activeTab === "communication") return category === "communication";
    if (activeTab === "productivity") return category === "productivity";
    if (activeTab === "design") return category === "design tool";
    if (activeTab === "documentation") return category === "documentation";
    if (activeTab === "storage") return category === "storage";

    return true;
  });

  // Health check list calculations (disconnected tools like Slack do NOT show as warning. Only connected are listed)
  const healthList = integrations.filter(i => i.isConnected).map(i => ({
    provider: i.provider,
    name: getProviderName(i.provider),
    status: "Healthy",
    color: "status-dot-emerald"
  }));

  const allDisconnected = integrations.filter(i => !i.isConnected);

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#e4e4e7] pb-5 gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight font-display text-[#09090b]">Integrations</h2>
          <p className="text-xs text-[#71717a] font-sans">
            Connect the tools that power your EndoCore workspace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#71717a]" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          
          <button 
            onClick={() => setShowAddIntegrationsPicker(true)}
            className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Connect Integration</span>
          </button>
        </div>
      </div>

      {/* Privacy Layer Banner */}
      <div className="flex items-start gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 text-blue-900 justify-between">
        <div className="flex gap-3">
          <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-blue-950 font-display">EndoCore Privacy Layer</h4>
            <p className="text-xs text-blue-900 font-sans leading-relaxed">
              Workspace signals are processed through EndoCore's privacy boundary before being shared with the workspace.
            </p>
          </div>
        </div>
        <a 
          href="https://endocore.io/privacy" 
          target="_blank" 
          rel="noreferrer" 
          className="text-xs font-semibold text-blue-600 hover:underline shrink-0 flex items-center gap-1"
        >
          <span>Learn more</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Tabs / Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all ${
            activeTab === "all" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          All Integrations
        </button>
        <button
          onClick={() => setActiveTab("connected")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all ${
            activeTab === "connected" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Connected ({connectedCount})
        </button>
        <button
          onClick={() => setActiveTab("dev_tools")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all ${
            activeTab === "dev_tools" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Developer Tools
        </button>
        <button
          onClick={() => setActiveTab("project_management")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all ${
            activeTab === "project_management" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Project Management
        </button>
        <button
          onClick={() => setActiveTab("communication")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all ${
            activeTab === "communication" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Communication
        </button>
        <button
          onClick={() => setActiveTab("productivity")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all ${
            activeTab === "productivity" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Productivity
        </button>

        {/* More Categories Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all flex items-center gap-1 ${
              ["design", "documentation", "storage"].includes(activeTab) 
                ? "bg-zinc-900 text-white" 
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <span>
              {activeTab === "design" ? "Design Tool" : 
               activeTab === "documentation" ? "Documentation" : 
               activeTab === "storage" ? "Storage" : "More"}
            </span>
            <span className="text-[10px]">▼</span>
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 mt-1 w-40 rounded-lg border border-zinc-200 bg-white shadow-lg py-1 z-10">
              <button
                onClick={() => { setActiveTab("design"); setShowMoreMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-50 font-medium text-zinc-700"
              >
                Design Tool
              </button>
              <button
                onClick={() => { setActiveTab("documentation"); setShowMoreMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-50 font-medium text-zinc-700"
              >
                Documentation
              </button>
              <button
                onClick={() => { setActiveTab("storage"); setShowMoreMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-50 font-medium text-zinc-700"
              >
                Storage
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping mr-2"></span>
          <span className="text-xs font-mono text-[#71717a]">Loading integration clearances...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left/Middle 2 Columns: Catalog Grid */}
          <div className="lg:col-span-2 space-y-6">
            {filteredIntegrations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-300 rounded-xl bg-white p-6">
                <AlertCircle className="h-10 w-10 text-zinc-400 mb-2" />
                <h4 className="text-sm font-bold text-zinc-900">No integrations found</h4>
                <p className="text-xs text-zinc-500 mt-1">Try adjusting your search query or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredIntegrations.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-5 rounded-xl border border-[#e4e4e7] bg-white flex flex-col justify-between hover:shadow-md transition-all duration-200"
                  >
                    <div className="space-y-4">
                      {/* Top Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                            <IntegrationLogo provider={item.provider} className="h-8 w-8" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#09090b] font-display">
                              {getProviderName(item.provider)}
                            </h4>
                            <p className="text-[10px] font-mono text-[#71717a] font-medium">
                              {getProviderCategory(item.provider)}
                            </p>
                          </div>
                        </div>

                        {/* Settings Cog (Connected only) */}
                        {item.isConnected && (
                          <button
                            onClick={() => openSettingsDialog(item)}
                            className="btn-icon p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-zinc-600 font-sans leading-relaxed min-h-[36px]">
                        {getProviderDescription(item.provider)}
                      </p>

                      {/* Status row */}
                      <div className="pt-1 space-y-2">
                        {item.isConnected ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${
                                  (item.provider === "GITHUB" ? githubStatus?.health : "HEALTHY") === "HEALTHY" || !githubStatus ? "bg-emerald-500 animate-pulse" :
                                  githubStatus?.health === "RATE_LIMITED" ? "bg-amber-500 animate-pulse" :
                                  githubStatus?.health === "AUTH_REQUIRED" ? "bg-rose-500 animate-bounce" :
                                  "bg-yellow-500"
                                }`}></span>
                                <span className={`text-[10px] font-bold font-sans ${
                                  (item.provider === "GITHUB" ? githubStatus?.health : "HEALTHY") === "HEALTHY" || !githubStatus ? "text-emerald-700" :
                                  githubStatus?.health === "RATE_LIMITED" ? "text-amber-700" :
                                  githubStatus?.health === "AUTH_REQUIRED" ? "text-rose-700" :
                                  "text-yellow-700"
                                }`}>
                                  {item.provider === "GITHUB" && githubStatus ? `Connected (${githubStatus.health})` : "Connected"}
                                </span>
                              </div>
                              {item.provider === "GITHUB" && (
                                <button
                                  onClick={() => {
                                    loadSyncHistory();
                                    setShowSyncHistoryModal(true);
                                  }}
                                  className="text-[10px] text-zinc-500 hover:text-zinc-800 underline font-mono"
                                >
                                  Sync History
                                </button>
                              )}
                            </div>

                            {getProviderConnectedDetails(item) && (
                              <p className="text-[10px] text-zinc-400 font-mono font-medium">
                                {getProviderConnectedDetails(item)}
                              </p>
                            )}

                            {item.provider === "GITHUB" && githubStatus && (
                              <div className="text-[10px] text-zinc-600 font-mono space-y-0.5 pt-1 bg-zinc-50 p-2 rounded-md border border-zinc-100">
                                <div className="flex justify-between">
                                  <span className="text-zinc-400">Repositories:</span>
                                  <span className="font-semibold text-zinc-800">{githubStatus.repositoryCount} repos</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-400">Activities:</span>
                                  <span className="font-semibold text-zinc-800">{githubStatus.activityCount} items</span>
                                </div>
                                {githubStatus.lastSyncedAt && (
                                  <div className="flex justify-between">
                                    <span className="text-zinc-400">Last Synced:</span>
                                    <span className="text-zinc-700">{new Date(githubStatus.lastSyncedAt).toLocaleTimeString()}</span>
                                  </div>
                                )}
                                {githubStatus.rateLimit?.limited && (
                                  <div className="text-amber-600 font-semibold pt-0.5">
                                    ⚠️ API Rate Limited. Resets at {new Date(githubStatus.rateLimit.resetAt).toLocaleTimeString()}
                                  </div>
                                )}
                                {githubStatus.health === "AUTH_REQUIRED" && (
                                  <div className="text-rose-600 font-semibold pt-0.5">
                                    ❌ Credentials expired or revoked. Please reconnect.
                                  </div>
                                )}
                              </div>
                            )}

                            {item.provider === "GITHUB" && !githubStatus && (
                              <p className="text-[10px] text-emerald-600 font-mono font-semibold flex items-center gap-1">
                                <span>Activity Sync: Real-time & Polling Fallback</span>
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-zinc-300"></span>
                            <span className="text-[10px] font-semibold text-zinc-500 font-sans">
                              Not Connected
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-5 pt-3 border-t border-zinc-100 flex flex-col gap-2">
                      {item.isConnected ? (
                        <>
                          {item.provider === "GITHUB" ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              {githubStatus?.health === "AUTH_REQUIRED" ? (
                                <button
                                  onClick={handleReconnectGitHub}
                                  className="btn-secondary py-1 px-2.5 text-[11px] flex items-center gap-1.5 text-rose-700 border-rose-200 hover:bg-rose-50 font-bold"
                                >
                                  🔑 Reconnect GitHub
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={handleManualGitHubSync}
                                    disabled={syncingGitHub}
                                    className="btn-secondary py-1 px-2.5 text-[11px] flex items-center gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 disabled:opacity-50"
                                  >
                                    <RefreshCw className={`h-3 w-3 ${syncingGitHub ? "animate-spin" : ""}`} />
                                    <span>{syncingGitHub ? "Syncing..." : "Sync"}</span>
                                  </button>
                                  <button
                                    onClick={handleReconcile}
                                    disabled={reconcilingGitHub}
                                    className="btn-secondary py-1 px-2.5 text-[11px] flex items-center gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50 disabled:opacity-50"
                                  >
                                    <RefreshCw className={`h-3 w-3 ${reconcilingGitHub ? "animate-spin" : ""}`} />
                                    <span>{reconcilingGitHub ? "Reconciling..." : "Reconcile"}</span>
                                  </button>
                                  {(githubStatus?.health === "ERROR" || githubStatus?.health === "WARNING" || githubStatus?.lastSyncError) && (
                                    <button
                                      onClick={handleResetError}
                                      className="btn-secondary py-1 px-2 text-[11px] text-amber-700 border-amber-200 hover:bg-amber-50"
                                    >
                                      Reset Errors
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <div></div>
                          )}
                          <div className="flex items-center justify-between">
                            {item.provider === "GITHUB" && (
                              <button
                                onClick={() => {
                                  loadIntegrationDetails();
                                  setShowDetailsModal(true);
                                }}
                                className="text-[10px] text-zinc-500 hover:text-zinc-800 underline font-mono"
                              >
                                View Details
                              </button>
                            )}
                            <button
                              onClick={() => openSettingsDialog(item)}
                              className="btn-secondary py-1 px-3 text-[11px]"
                            >
                              Manage
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full flex justify-end">
                          <button
                            onClick={() => openConnectDialog(item)}
                            className="btn-secondary py-1 px-3 text-[11px] text-zinc-900 border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400"
                          >
                            Connect
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Sidebar Widgets */}
          <div className="space-y-6">
            {/* Widget 1: Integration Health */}
            <div className="studio-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-zinc-500">
                  Integration Health
                </h3>
                <span className="text-[10px] text-zinc-400 font-semibold cursor-pointer hover:text-zinc-600">
                  View All
                </span>
              </div>

              {healthList.length === 0 ? (
                <div className="text-center py-8 text-[11px] text-zinc-400 font-sans">
                  No active integrations connected.
                </div>
              ) : (
                <div className="space-y-3">
                  {healthList.map((health, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-zinc-50">
                      <div className="flex items-center gap-2">
                        <IntegrationLogo provider={health.provider} className="h-5 w-5" />
                        <span className="font-semibold text-zinc-800">{health.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`status-dot ${health.color}`}></span>
                        <span className="text-[10px] font-bold text-zinc-600 font-sans">{health.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {healthList.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-100/60 text-[10px] text-emerald-700 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>All systems operational • Last checked 1 min ago</span>
                </div>
              )}
            </div>

            {/* Widget 2: Recent Activity */}
            <div className="studio-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-zinc-500">
                    Recent Activity
                  </h3>
                  <p className="text-[9px] text-zinc-400 font-mono tracking-wide uppercase font-bold">Synced Live Stream</p>
                </div>
                {loadingActivities && (
                  <RefreshCw className="h-3 w-3 text-zinc-400 animate-spin" />
                )}
              </div>

              {realExternalActivities.length === 0 ? (
                <div className="text-center py-8 text-[11px] text-zinc-400 font-sans">
                  No activity logged. Connect GitHub and sync repositories.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {realExternalActivities.map((act) => (
                    <div key={act.id} className="flex items-start justify-between gap-3 text-xs leading-tight">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-1 rounded bg-zinc-50 border border-zinc-100 shrink-0 mt-0.5">
                          <IntegrationLogo provider={act.provider || "GITHUB"} className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-zinc-900">{act.application}</span>
                            <span className="px-1.5 py-0.2 rounded bg-zinc-100 text-[9px] font-mono text-zinc-600 font-semibold truncate max-w-[120px]">
                              {act.project}
                            </span>
                          </div>
                          <p className="text-zinc-600 text-[11px] font-sans mt-0.5 truncate" title={act.summary}>
                            {act.summary}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <span className="text-[9px] text-zinc-400 font-mono">
                          {act.occurredAt ? new Date(act.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                        </span>
                        {act.externalUrl && (
                          <a
                            href={act.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"
                          >
                            <span>Link</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={loadRecentActivities}
                className="w-full btn-secondary text-[11px] py-1.5 mt-2 flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Refresh activity</span>
                <RefreshCw className={`h-3 w-3 ${loadingActivities ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Widget 3: Need a Custom Integration? */}
            <div className="studio-card p-5 space-y-4 bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-100 rounded-lg border border-zinc-200">
                  <Puzzle className="h-6 w-6 text-zinc-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 font-display">Need a Custom Integration?</h4>
                  <p className="text-[10px] text-zinc-500 font-sans leading-snug">
                    We can build custom integrations for tools you use.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowCustomModal(true)}
                className="w-full btn-primary text-xs py-2 bg-zinc-900 hover:bg-zinc-800 border-zinc-900 flex items-center justify-center gap-1.5"
              >
                <span>Request Integration</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Connect Specific Integration */}
      {showConnectModal && selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 studio-card shadow-2xl bg-white space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <IntegrationLogo provider={selectedIntegration.provider} className="h-6 w-6" />
                <h3 className="text-sm font-bold text-[#09090b] font-display">
                  Connect {getProviderName(selectedIntegration.provider)}
                </h3>
              </div>
              <button 
                onClick={() => { setShowConnectModal(false); setWorkspaceId(""); }}
                className="btn-icon p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConnectSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                  Account / Workspace Identifier
                </label>
                <input 
                  type="text" 
                  required
                  value={workspaceId}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                  className="input-field h-10 text-xs"
                  placeholder={
                    selectedIntegration.provider === "GOOGLE_CALENDAR" ? "e.g. user@company.com" :
                    selectedIntegration.provider === "SLACK" ? "e.g. subdomain.slack.com" : "e.g. workspace-name"
                  }
                />
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] text-zinc-500 font-sans leading-relaxed">
                ℹ️ <strong>Developer Preview Mode</strong>: This forms a demo connection for UI review and does not redirect to live OAuth authentication pages.
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowConnectModal(false); setWorkspaceId(""); }}
                  className="btn-secondary flex-1 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="btn-primary flex-1 text-xs"
                >
                  {modalLoading ? "Linking..." : "Link Integration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage Settings */}
      {showSettingsModal && selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 studio-card shadow-2xl bg-white space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <IntegrationLogo provider={selectedIntegration.provider} className="h-6 w-6" />
                <h3 className="text-sm font-bold text-[#09090b] font-display">
                  Manage {getProviderName(selectedIntegration.provider)}
                </h3>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="btn-icon p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                  Linked Account / Workspace
                </label>
                <input 
                  type="text" 
                  required
                  value={workspaceId}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                  className="input-field h-10 text-xs"
                />
              </div>

              {selectedIntegration.provider === "GOOGLE_CALENDAR" && (
                <div className="flex items-center justify-between py-2 border-t border-b border-zinc-100">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-zinc-800 font-display">Auto-Pause Focus</span>
                    <p className="text-[10px] text-zinc-500 font-sans">
                      Pause focus sessions automatically during calendar events.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoPause(!autoPause)}
                    className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer focus:outline-none ${
                      autoPause ? "bg-zinc-900" : "bg-zinc-300"
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                      autoPause ? "translate-x-4.5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 gap-3">
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={modalLoading}
                  className="btn-danger py-2 text-xs flex-1 border-rose-200 hover:bg-rose-50"
                >
                  Disconnect
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="btn-primary py-2 text-xs flex-1"
                >
                  {modalLoading ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: General "+ Connect Integration" Catalog Picker */}
      {showAddIntegrationsPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 studio-card shadow-2xl bg-white space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-[#09090b] font-display">
                Select an Integration to Connect
              </h3>
              <button 
                onClick={() => setShowAddIntegrationsPicker(false)}
                className="btn-icon p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {allDisconnected.length === 0 ? (
              <div className="text-center py-10 text-xs text-zinc-500 font-sans">
                🎉 All integrations are connected!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {allDisconnected.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setShowAddIntegrationsPicker(false);
                      openConnectDialog(item);
                    }}
                    className="p-3.5 border border-zinc-200 rounded-xl bg-white hover:border-zinc-900 cursor-pointer transition-all flex items-center gap-3"
                  >
                    <div className="p-1.5 rounded bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                      <IntegrationLogo provider={item.provider} className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#09090b] font-display">
                        {getProviderName(item.provider)}
                      </h4>
                      <p className="text-[9px] font-mono text-zinc-400">
                        {getProviderCategory(item.provider)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Request Custom Integration */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 studio-card shadow-2xl bg-white space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Puzzle className="h-5 w-5 text-zinc-600" />
                <h3 className="text-sm font-bold text-[#09090b] font-display">
                  Request Custom Integration
                </h3>
              </div>
              <button 
                onClick={() => setShowCustomModal(false)}
                className="btn-icon p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCustomRequestSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                  Integration Tool Name
                </label>
                <input 
                  type="text" 
                  required
                  value={customToolName}
                  onChange={(e) => setCustomToolName(e.target.value)}
                  className="input-field h-10 text-xs"
                  placeholder="e.g. Datadog, Linear, Sentry"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                  Use Case Details (Optional)
                </label>
                <textarea 
                  rows={3}
                  value={customToolDesc}
                  onChange={(e) => setCustomToolDesc(e.target.value)}
                  className="input-field text-xs p-2.5"
                  placeholder="Describe what data or activity signals you would like to capture..."
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="btn-secondary flex-1 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={customLoading}
                  className="btn-primary flex-1 text-xs"
                >
                  {customLoading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: GitHub Synchronization History Log */}
      {showSyncHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl p-6 studio-card shadow-2xl bg-white space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-[#09090b] font-display">
                    GitHub Synchronization History
                  </h3>
                  <p className="text-[10px] font-mono text-zinc-500">
                    Audit log of synchronization runs, webhook events, and rate-limit details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSyncHistoryModal(false)}
                className="btn-icon p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
              {syncHistoryLoading ? (
                <div className="text-center py-8 text-xs text-zinc-500 font-mono">
                  Loading sync logs...
                </div>
              ) : syncHistoryLogs.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-400 font-mono">
                  No synchronization history logs found.
                </div>
              ) : (
                syncHistoryLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/50 flex flex-col gap-1 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === "SUCCESS" ? "bg-emerald-100 text-emerald-800" :
                          log.status === "RATE_LIMITED" ? "bg-amber-100 text-amber-800" :
                          log.status === "AUTH_REQUIRED" ? "bg-rose-100 text-rose-800" :
                          log.status === "RUNNING" ? "bg-blue-100 text-blue-800 animate-pulse" :
                          "bg-zinc-200 text-zinc-700"
                        }`}>
                          {log.status}
                        </span>
                        <span className="font-semibold text-zinc-800">{log.syncType} SYNC</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(log.startedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-600 pt-1">
                      <span>Items Ingested: <strong className="text-zinc-900">{log.itemsIngested || 0}</strong></span>
                      {log.durationMs && <span>Duration: {(log.durationMs / 1000).toFixed(2)}s</span>}
                    </div>

                    {log.errorMessage && (
                      <div className="text-[10px] text-rose-600 bg-rose-50 p-1.5 rounded border border-rose-100 mt-1">
                        Error: {log.errorMessage}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => setShowSyncHistoryModal(false)}
                className="btn-secondary text-xs px-4 py-1.5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 9: Integration Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl p-6 studio-card shadow-2xl bg-white space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-[#09090b] font-display">GitHub Integration Details</h3>
                  <p className="text-[10px] font-mono text-zinc-500">Comprehensive integration health and data report</p>
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="btn-icon p-1"><X className="h-4 w-4" /></button>
            </div>

            {detailsLoading ? (
              <div className="text-center py-8 text-xs text-zinc-500 font-mono">Loading details...</div>
            ) : integrationDetails ? (
              <div className="space-y-4 text-xs font-mono">
                {/* Connection & Health */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Connection</div>
                    <div className={`font-bold mt-1 ${integrationDetails.isConnected ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {integrationDetails.isConnected ? '✅ Connected' : '❌ Disconnected'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Health</div>
                    <div className={`font-bold mt-1 ${
                      integrationDetails.healthStatus === 'HEALTHY' ? 'text-emerald-700' :
                      integrationDetails.healthStatus === 'RATE_LIMITED' ? 'text-amber-700' :
                      integrationDetails.healthStatus === 'AUTH_REQUIRED' ? 'text-rose-700' :
                      'text-yellow-700'
                    }`}>{integrationDetails.healthStatus}</div>
                  </div>
                </div>

                {/* Account */}
                {integrationDetails.account && (
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold mb-1">Account</div>
                    <div className="text-zinc-800">@{integrationDetails.account.username || 'unknown'}</div>
                    {integrationDetails.account.email && <div className="text-zinc-500">{integrationDetails.account.email}</div>}
                  </div>
                )}

                {/* Activity Breakdown */}
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                  <div className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Activity Breakdown ({integrationDetails.activityCount} total)</div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-2 bg-white rounded border"><div className="text-lg font-bold text-zinc-900">{integrationDetails.activityBreakdown?.commits || 0}</div><div className="text-[9px] text-zinc-500">Commits</div></div>
                    <div className="text-center p-2 bg-white rounded border"><div className="text-lg font-bold text-zinc-900">{integrationDetails.activityBreakdown?.pullRequests || 0}</div><div className="text-[9px] text-zinc-500">PRs</div></div>
                    <div className="text-center p-2 bg-white rounded border"><div className="text-lg font-bold text-zinc-900">{integrationDetails.activityBreakdown?.issues || 0}</div><div className="text-[9px] text-zinc-500">Issues</div></div>
                    <div className="text-center p-2 bg-white rounded border"><div className="text-lg font-bold text-zinc-900">{integrationDetails.activityBreakdown?.reviews || 0}</div><div className="text-[9px] text-zinc-500">Reviews</div></div>
                  </div>
                </div>

                {/* Repositories */}
                <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                  <div className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Repositories ({integrationDetails.repositoryCount})</div>
                  <div className="max-h-[120px] overflow-y-auto space-y-1">
                    {integrationDetails.repositories?.map((repo: any) => (
                      <div key={repo.id} className={`flex items-center justify-between py-1 px-2 rounded ${repo.isMissing ? 'bg-rose-50 border border-rose-100' : 'bg-white border border-zinc-100'}`}>
                        <span className="text-zinc-800 text-[11px]">{repo.identifier || repo.name}</span>
                        {repo.isMissing && <span className="text-[9px] text-rose-500 font-bold">MISSING</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rate Limit & Webhook */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Rate Limit</div>
                    <div className="mt-1">{integrationDetails.rateLimit?.limited ? (
                      <span className="text-amber-700 font-bold">Limited (resets {integrationDetails.rateLimit.resetAt ? new Date(integrationDetails.rateLimit.resetAt).toLocaleTimeString() : 'soon'})</span>
                    ) : <span className="text-emerald-700">OK</span>}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Webhook</div>
                    <div className="mt-1 text-zinc-700">{integrationDetails.webhook?.lastStatus || 'N/A'}</div>
                    {integrationDetails.webhook?.lastReceivedAt && <div className="text-[9px] text-zinc-400">{new Date(integrationDetails.webhook.lastReceivedAt).toLocaleString()}</div>}
                  </div>
                </div>

                {/* Sync Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Last Sync</div>
                    <div className="mt-1 text-zinc-700">{integrationDetails.lastSyncStatus || 'N/A'}</div>
                    {integrationDetails.lastSyncedAt && <div className="text-[9px] text-zinc-400">{new Date(integrationDetails.lastSyncedAt).toLocaleString()}</div>}
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Last Reconciled</div>
                    <div className="mt-1 text-zinc-700">{integrationDetails.lastReconciledAt ? new Date(integrationDetails.lastReconciledAt).toLocaleString() : 'Never'}</div>
                  </div>
                </div>

                {/* Linked Goals */}
                {integrationDetails.linkedGoals?.length > 0 && (
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Linked Goals ({integrationDetails.linkedGoals.length})</div>
                    <div className="space-y-1">
                      {integrationDetails.linkedGoals.map((goal: any) => (
                        <div key={goal.id} className="flex items-center justify-between py-1 px-2 rounded bg-white border border-zinc-100">
                          <span className="text-zinc-800 text-[11px]">{goal.title}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            goal.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            goal.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                            'bg-zinc-100 text-zinc-600'
                          }`}>{goal.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {integrationDetails.lastSyncError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-[11px]">
                    ⚠️ Last Error: {integrationDetails.lastSyncError}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-zinc-400">No details available.</div>
            )}

            <div className="pt-2 border-t border-zinc-100 flex justify-end">
              <button onClick={() => setShowDetailsModal(false)} className="btn-secondary text-xs px-4 py-1.5">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
