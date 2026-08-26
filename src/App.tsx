import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  User,
  Settings,
  Activity,
  Pause,
  Play,
  RefreshCw,
  Search,
  Award,
  Clock,
  Sparkles,
  Laptop,
  CheckCircle2,
  Plus,
  X,
  ArrowLeft,
  ArrowUpRight,
  Terminal,
  ExternalLink,
  Lock,
  Globe,
  Sun,
  Moon,
  Compass,
  ArrowRight,
  Home,
  Target,
  Flame,
  MessageSquare,
  Menu,
  Send,
  VolumeX,
  Bell,
  Pill,
  Stethoscope,
  ShieldCheck,
  Calendar,
  Zap,
  Check,
  Upload,
  Smartphone,
  Tablet,
  Monitor,
  Cpu,
  ChevronDown,
  FileText,
  Layout,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  UserProfile,
  Activity as UserActivity,
  Friend,
  Group,
  AnalyticsData,
  TimelineItem,
  ChatMessage,
  ConnectionItem,
  ConnectionRequestItem,
  FocusChallengeItem
} from "./types";
import { RoomCreationWizard } from "./components/RoomCreationWizard";
import { OwnerRoomDashboard } from "./components/OwnerRoomDashboard";
import { NumberTicker } from "./components/NumberTicker";
import { TiltCard } from "./components/TiltCard";
import { CommandPalette } from "./components/CommandPalette";
import { SkeletonLoader } from "./components/SkeletonLoader";
import AnalyticsDashboard from "./components/AnalyticsDashboard";

export default function App() {
  const [cmdKOpen, setCmdKOpen] = useState(false);

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<"home" | "focus" | "routines" | "experts" | "profile" | "control" | "room" | "me">("home");
  const [mobileRoutines, setMobileRoutines] = useState([
    { id: "r1", title: "Morning Code Review & PR Triage", detail: "VS Code & GitHub • Post Coffee • 08:00 AM", done: true, icon: "code" },
    { id: "r2", title: "Standup Sync & Task Planning", detail: "Jira & Slack • 08:30 AM", done: true, icon: "clock" },
    { id: "r3", title: "90-Min Deep Focus Block", detail: "VS Code • Code Implementation • 09:30 AM", done: false, icon: "clock" },
    { id: "r4", title: "Mid-day Eye Rest & Posture Reset", detail: "Pomodoro Pause • 01:00 PM", done: false, icon: "activity" },
    { id: "r5", title: "End-of-day Git Commit & Logging", detail: "Terminal & Dashboard • 05:30 PM", done: false, icon: "terminal" },
    { id: "r6", title: "AI Workstation Briefing Sync", detail: "Gemini AI • 06:00 PM", done: false, icon: "ai" }
  ]);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [mobileExpertCategory, setMobileExpertCategory] = useState("All");

  useEffect(() => {
    const checkDevice = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const platform = urlParams.get("platform");
      setIsMobile(platform === "mobile" || window.innerWidth < 768);
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdKOpen(open => !open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Navigation & Workspace Panel states
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  // Classroom & Room-Specific Navigation states
  const [selectedRoomName, setSelectedRoomName] = useState<string | null>(null);
  const [roomTab, setRoomTab] = useState<"overview" | "members" | "live" | "leaderboard" | "ai-summary" | "chat">("overview");
  const [roomChatMessages, setRoomChatMessages] = useState<ChatMessage[]>([]);
  const [roomChatInput, setRoomChatInput] = useState<string>("");
  const [roomLeaderboard, setRoomLeaderboard] = useState<any[]>([]);
  const [fetchingLeaderboard, setFetchingLeaderboard] = useState<boolean>(false);

  // Pomodoro timer states
  const [pomodoroMinutesLeft, setPomodoroMinutesLeft] = useState<number>(25);
  const [pomodoroSecondsLeft, setPomodoroSecondsLeft] = useState<number>(0);
  const [customFocusMinutes, setCustomFocusMinutes] = useState<number>(25);
  const [customBreakMinutes, setCustomBreakMinutes] = useState<number>(5);
  const [pomodoroActive, setPomodoroActive] = useState<boolean>(false);
  const [pomodoroMode, setPomodoroMode] = useState<"focus" | "break">("focus");
  const [pomodoroSessionCount, setPomodoroSessionCount] = useState<number>(0);
  const [distractionsManualCount, setDistractionsManualCount] = useState<number>(0);
  const [themeMode] = useState<"light" | "dark">("light");

  // Server-state synchronize mirrors
  const [user, setUser] = useState<UserProfile | null>(null);
  const [myActivity, setMyActivity] = useState<UserActivity | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [aiInsights, setAiInsights] = useState<any | null>(null);
  const [roomsOccupants, setRoomsOccupants] = useState<Record<string, Friend[]>>({});
  const [roomsLastMessage, setRoomsLastMessage] = useState<Record<string, ChatMessage | null>>({});
  const [hubTab, setHubTab] = useState<"timeline" | "rooms">("timeline");
  const groupsRef = useRef<Group[]>([]);

  // Asynchronous Loading Flags
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);
  const [insightsError, setInsightsError] = useState<boolean>(false);
  const [updatingActivity, setUpdatingActivity] = useState<boolean>(false);
  const [creatingGroup, setCreatingGroup] = useState<boolean>(false);

  // Interactive Controls Input Buffers
  const [appInput, setAppInput] = useState<string>("");
  const [projectInput, setProjectInput] = useState<string>("");
  const [statusInput, setStatusInput] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState<string>("");
  const [newGroupDesc, setNewGroupDesc] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Public Directory State
  const [directoryGroups, setDirectoryGroups] = useState<any[]>([]);
  const [directoryQuery, setDirectoryQuery] = useState<string>("");
  const [isSearchingDirectory, setIsSearchingDirectory] = useState<boolean>(false);

  const [profileNameInput, setProfileNameInput] = useState<string>("");
  const [profileAvatarInput, setProfileAvatarInput] = useState<string>("");
  const [profileDeviceInput, setProfileDeviceInput] = useState<string>("");
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [headlineInput, setHeadlineInput] = useState<string>("");
  const [currentTimeText, setCurrentTimeText] = useState<string>("");

  // Nudge reaction status Map
  const [nudgedFriendIds, setNudgedFriendIds] = useState<Record<string, boolean>>({});
  const [waveAlert, setWaveAlert] = useState<{ senderName: string; timestamp: string } | null>(null);
  const [recentWaves, setRecentWaves] = useState<Array<{ id: string; senderId: string; senderName: string; timestamp: string }>>([]);

  // Connections and focus challenges states
  const [connectionsData, setConnectionsData] = useState<{
    friends: any[];
    incoming: any[];
    outgoing: any[];
  }>({ friends: [], incoming: [], outgoing: [] });
  const [loadingConnections, setLoadingConnections] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState<boolean>(false);
  
  const [activeChallenge, setActiveChallenge] = useState<any | null>(null);
  const [incomingChallenges, setIncomingChallenges] = useState<any[]>([]);
  const [challengeObjectiveInput, setChallengeObjectiveInput] = useState<string>("");
  const [challengeSecondsLeft, setChallengeSecondsLeft] = useState<number>(0);
  const [activeConnectionsTab, setActiveConnectionsTab] = useState<"lobby" | "discover" | "requests">("lobby");
  // Challenge 1v1 modal state
  const [challengeModalOpen, setChallengeModalOpen] = useState<boolean>(false);
  const [challengeModalFriend, setChallengeModalFriend] = useState<any | null>(null);
  const [challengeModalObjective, setChallengeModalObjective] = useState<string>("");
  const [challengeModalDuration, setChallengeModalDuration] = useState<number>(25);
  const [challengeModalMode, setChallengeModalMode] = useState<string>("co_focus");
  // In-app confirmation modal state (replaces native confirm())
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Authentication states
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authName, setAuthName] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [electronTracking, setElectronTracking] = useState<boolean>(false);

  // Diagnostics & Connectivity Health States
  const [apiStatus, setApiStatus] = useState<"online" | "offline">("online");
  const [dbStatus, setDbStatus] = useState<"connected" | "error" | "checking">("checking");
  const [socketStatus, setSocketStatus] = useState<"connected" | "disconnected" | "error">("disconnected");
  const [aiStatus, setAiStatus] = useState<"configured" | "missing_key" | "checking">("checking");

  // Responsive layout & Hamburger Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isRoomWizardOpen, setIsRoomWizardOpen] = useState<boolean>(false);

  // Active Session & Custom App Addition Modal States
  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);
  const [customApps, setCustomApps] = useState<string[]>([
    "VS Code",
    "Antigravity IDE",
    "PyCharm",
    "Chrome Browser",
    "Figma Design",
    "Terminal / Shell",
    "Postman API",
    "Docker Desktop"
  ]);
  const [sessionAppInput, setSessionAppInput] = useState<string>("VS Code");
  const [sessionTaskInput, setSessionTaskInput] = useState<string>("Building EndoCore System");

  // Connected Devices Matrix State
  const [showDevicesList, setShowDevicesList] = useState<boolean>(true);
  const [connectedDevices, setConnectedDevices] = useState<Array<{
    id: string;
    name: string;
    type: "desktop" | "laptop" | "mobile" | "tablet" | "monitor";
    os: string;
    status: "active" | "online" | "idle" | "display_active";
    lastSync: string;
  }>>([]);

  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  const getAuthHeaders = () => {
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
    const headers = {
      ...getAuthHeaders(),
      ...(init?.headers || {})
    };
    const res = await fetch(input, { ...init, headers });
    if (res.status === 401 || res.status === 403) {
      handleLogout();
      throw new Error("Session expired. Please log in again.");
    }
    return res;
  }

  const fetchDevices = async () => {
    try {
      const res = await apiFetch("/api/devices");
      if (res.ok) {
        const data = await res.json();
        if (data.devices && Array.isArray(data.devices)) {
          setConnectedDevices(data.devices);
        }
      }
    } catch (err) {
      console.error("Error fetching devices:", err);
    }
  };

  const registerCurrentDevice = async () => {
    try {
      const userAgent = navigator.userAgent.toLowerCase();
      let deviceName = "Chrome (Web Workstation)";
      let platform = "WEB";

      if (userAgent.includes("android")) {
        deviceName = "Mobile Chrome (Android Phone)";
        platform = "ANDROID";
      } else if (userAgent.includes("iphone")) {
        deviceName = "Mobile Safari (iPhone)";
        platform = "IOS";
      } else if (userAgent.includes("ipad")) {
        deviceName = "iPad (Tablet Browser)";
        platform = "IOS";
      } else if (userAgent.includes("macintosh") || userAgent.includes("mac os")) {
        deviceName = "MacBook Pro (macOS Browser)";
        platform = "MACOS";
      } else if (userAgent.includes("windows")) {
        deviceName = "Windows PC (Browser)";
        platform = "WINDOWS";
      }

      await apiFetch("/api/devices/register", {
        method: "POST",
        body: JSON.stringify({
          deviceName,
          platform,
          pushToken: `browser_token_${token ? token.slice(-8) : "guest"}`
        })
      });
      fetchDevices();
    } catch (err) {
      console.error("Error registering current device:", err);
    }
  };

  const disconnectDevice = async (deviceId: string, deviceName: string) => {
    setConfirmModal({
      title: "Disconnect Remote Device",
      message: `Are you sure you want to revoke remote session access for ${deviceName}?`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const res = await apiFetch("/api/devices/disconnect", {
            method: "POST",
            body: JSON.stringify({ deviceId })
          });
          if (res.ok) {
            triggerToast(`Device access revoked for ${deviceName}`);
            setConnectedDevices(prev => prev.filter(d => d.id !== deviceId));
          }
        } catch (err) {
          triggerToast(`Failed to disconnect ${deviceName}`);
        }
      }
    });
  };

  const socketRef = useRef<any>(null);
  const chatEndRef = useRef<any>(null);

  const checkHealth = async () => {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data.database);
        setAiStatus(data.ai);
        setApiStatus("online");
      } else {
        setDbStatus("error");
        setApiStatus("offline");
      }
    } catch (e) {
      setDbStatus("error");
      setApiStatus("offline");
    }
  };

  // Bootstrap data loop, polling for updates and setting up WebSocket connection
  useEffect(() => {
    if (!token) return;

    fetchProfile();
    fetchActivity();
    fetchFriends();
    fetchAnalytics();
    fetchGroups();
    fetchAiBriefing();
    checkHealth();
    fetchConnections();
    registerCurrentDevice();

    const updateTime = () => {
      const now = new Date();
      setCurrentTimeText(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);
    const healthInterval = setInterval(checkHealth, 10000);

    // Slower fallback polling for other database states
    const dataSyncInterval = setInterval(() => {
      fetchActivity();
      silentFetchAnalytics();
      fetchProfile();
      fetchConnections();
      if (groupsRef.current.length > 0) {
        fetchAllRoomsDetails(groupsRef.current);
      }
    }, 8000);

    // Initialize Socket.io connection
    const socket = io({
      auth: { token }
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("WebSocket connected");
      setSocketStatus("connected");
      if (user?.activeGroup) {
        socket.emit("join-group", user.activeGroup);
      }
    });

    socket.on("connect_error", (err: any) => {
      console.error("WebSocket connection error:", err);
      setSocketStatus("error");
      if (err.message && err.message.includes("Authentication error")) {
        socket.disconnect();
        handleLogout();
      }
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setSocketStatus("disconnected");
    });

    socket.on("activity-update", (updatedFriend: Friend) => {
      setFriends(prev => {
        const index = prev.findIndex(f => f.id === updatedFriend.id);
        if (index === -1) {
          return [...prev, updatedFriend];
        }
        const next = [...prev];
        next[index] = updatedFriend;
        return next;
      });
      // also refresh connections list to update presence status in "My Connections" panel
      fetchConnections();
    });

    const handleWaveNotification = (data: { senderId: string; senderName: string }) => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setWaveAlert({ senderName: data.senderName, timestamp: timeStr });
      setRecentWaves(prev => [{ id: Date.now().toString(), senderId: data.senderId, senderName: data.senderName, timestamp: timeStr }, ...prev.slice(0, 9)]);

      setTimeout(() => {
        setWaveAlert(null);
      }, 7000);

      // Play soft web audio chime tone for instant auditory feedback
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {}

      // Dispatch native OS Desktop Notification (via Electron Agent or Web Notification API)
      const notifTitle = `👋 ${data.senderName} waved at you`;
      const notifBody = "They're checking in and cheering on your focus.";

      const desktopBridge = (window as any).endocoreDesktop || (window as any).electronAPI;
      if (desktopBridge?.showNotification) {
        // Trigger Electron native Windows/Mac OS system toast (displays over ALL running apps)
        desktopBridge.showNotification({ title: notifTitle, body: notifBody, senderId: data.senderId });
      } else if ("Notification" in window) {
        const fireWebNotif = () => {
          const notif = new Notification(notifTitle, { body: notifBody, icon: "/favicon.ico" });
          notif.onclick = () => {
            window.focus();
            setActiveTab("connections");
          };
        };

        if (Notification.permission === "granted") {
          fireWebNotif();
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then(permission => {
            if (permission === "granted") fireWebNotif();
          });
        }
      }

      triggerToast(`👋 ${data.senderName} waved at you!`);
    };

    socket.on("peer-nudge", handleWaveNotification);
    socket.on("connection:wave", (data: any) => {
      handleWaveNotification({ senderId: data.senderId || data.sender?.id, senderName: data.senderName || data.sender?.name || "A co-worker" });
    });

    socket.on("room-chat-message", (data: ChatMessage) => {
      setRoomChatMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
    });

    // Connections Sockets
    socket.on("connection:received", (reqItem: any) => {
      triggerToast(`✨ Friend request received from ${reqItem.profile.name}!`);
      fetchConnections();
    });

    socket.on("connection:accepted", (data: any) => {
      triggerToast("🤝 Friend request accepted! You are now connected.");
      fetchConnections();
    });

    socket.on("connection:declined", () => {
      fetchConnections();
    });

    socket.on("connection:canceled", () => {
      fetchConnections();
    });

    socket.on("connection:removed", (data: any) => {
      triggerToast("Connection removed.");
      fetchConnections();
    });

    // Focus Challenge Sockets
    socket.on("challenge:received", (challenge: any) => {
      triggerToast(`⚔️ Focus challenge invitation from ${challenge.creator.name}!`);
      setIncomingChallenges(prev => {
        if (prev.some(c => c.challengeId === challenge.challengeId)) return prev;
        return [...prev, challenge];
      });
    });

    socket.on("challenge:started", (challenge: any) => {
      triggerToast("🚀 Focus challenge has started!");
      setActiveChallenge(challenge);
      // Clear all pending incoming challenges and reset objective input
      setIncomingChallenges([]);
      setChallengeObjectiveInput("");
    });

    socket.on("challenge:canceled", (data: any) => {
      triggerToast("⚠️ Focus challenge was canceled.");
      setActiveChallenge(prev => prev && prev.challengeId === data.challengeId ? null : prev);
      setIncomingChallenges(prev => prev.filter(c => c.challengeId !== data.challengeId));
    });

    // Fires on the CHALLENGER's side when their invite is declined
    socket.on("challenge:responded", (data: any) => {
      if (data.action === "decline") {
        triggerToast("❌ Your focus challenge was declined.");
        setIncomingChallenges(prev => prev.filter(c => c.challengeId !== data.challengeId));
      }
    });

    socket.on("challenge:completed", (data: any) => {
      triggerToast(`🎉 Challenge completed! Winner: ${data.winnerId === user?.id ? "You" : "Your partner"}!`);
      setActiveChallenge(null);
    });

    return () => {
      clearInterval(clockInterval);
      clearInterval(healthInterval);
      clearInterval(dataSyncInterval);
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [token]);

  // Request OS Native Notification permissions on startup
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Sync token and start tracking with Electron desktop agent if available
  useEffect(() => {
    const electronAPI = (window as any).electronAPI;
    const desktopBridge = (window as any).endocoreDesktop;

    if (electronAPI) {
      if (token && user?.email) {
        electronAPI.saveConfig({ token, email: user.email });
        electronAPI.startTracking();
      } else {
        electronAPI.stopTracking();
      }
    }

    if (desktopBridge?.onNavigateToConnection) {
      const cleanup = desktopBridge.onNavigateToConnection(() => {
        setActiveTab("connections");
      });
      return () => cleanup?.();
    }
  }, [token, user?.email]);

  // Listen to Electron tracking state and auth errors
  useEffect(() => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI) return;

    electronAPI.onTrackingState((state: { isTracking: boolean }) => {
      setElectronTracking(state.isTracking);
    });

    electronAPI.onAuthError((message: string) => {
      triggerToast(`⚠️ Agent: ${message}`);
      handleLogout();
    });
  }, []);

  // Keep WebSocket room membership in sync with user's active group
  useEffect(() => {
    if (socketRef.current && user?.activeGroup) {
      socketRef.current.emit("join-group", user.activeGroup);
      fetchFriends();
    }
  }, [user?.activeGroup]);

  // Synchronized challenge timer countdown
  useEffect(() => {
    if (!activeChallenge || !activeChallenge.endAt) {
      setChallengeSecondsLeft(0);
      return;
    }
    const updateChallengeTimer = () => {
      const end = new Date(activeChallenge.endAt).getTime();
      const left = Math.max(0, Math.round((end - Date.now()) / 1000));
      setChallengeSecondsLeft(left);
      if (left === 0 && activeChallenge) {
        completeFocusChallenge(activeChallenge.challengeId);
      }
    };
    updateChallengeTimer();
    const interval = setInterval(updateChallengeTimer, 1000);
    return () => clearInterval(interval);
  }, [activeChallenge]);

  // Soft toast alert trigger
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // REST API Interactions
  const fetchProfile = async () => {
    try {
      const res = await apiFetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          setUser(data);
          if (!statusInput) setStatusInput(data.customStatus || "");
          if (!profileNameInput) setProfileNameInput(data.name || "");
          if (!profileAvatarInput) setProfileAvatarInput(data.avatarUrl || "");
          if (!profileDeviceInput) setProfileDeviceInput(data.deviceConnected || "");
          if (!usernameInput) setUsernameInput(data.username || "");
          if (!headlineInput) setHeadlineInput(data.headline || "");
          return;
        }
      }
      if (res.status === 401 || res.status === 403) {
        setToken(null);
        localStorage.removeItem("token");
      }
    } catch (e: any) {
      // apiFetch already handles 401/403 by calling handleLogout().
      // Only log the error here — don't blindly clear the token on
      // transient network errors, as that would kick the user out.
      console.error("API Fetch Error (Profile):", e);
    }
  };

  const fetchActivity = async () => {
    try {
      const res = await apiFetch("/api/my-activity");
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          setMyActivity(data);
        }
      }
    } catch (e) {
      console.error("API Fetch Error (My Activity):", e);
    }
  };

  const fetchFriends = async () => {
    try {
      const groupParam = user?.activeGroup ? `?group=${encodeURIComponent(user.activeGroup)}` : "";
      const res = await apiFetch(`/api/friends${groupParam}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setFriends(data);
          return;
        }
      }
      setFriends([]);
    } catch (e) {
      console.error("API Fetch Error (Friends):", e);
      setFriends([]);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await apiFetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          setAnalytics(data);
        }
      }
    } catch (e) {
      console.error("API Fetch Error (Analytics):", e);
    }
  };

  const silentFetchAnalytics = async () => {
    try {
      const res = await apiFetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          setAnalytics(prev => {
            if (!prev) return data;
            // Blend in real-time values smoothly
            return {
              ...data,
              weeklyTotalHours: prev.weeklyTotalHours,
              weeklyProdGoalAchieved: prev.weeklyProdGoalAchieved
            };
          });
        }
      }
    } catch (e) {
      // Slient fail
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await apiFetch("/api/groups");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setGroups(data);
          if (data.length > 0) {
            fetchAllRoomsDetails(data);
          }
        }
      }
    } catch (e) {
      console.error("API Fetch Error (Groups):", e);
    }
  };
  const searchDirectory = async (q: string = "") => {
    setIsSearchingDirectory(true);
    try {
      const res = await apiFetch(`/api/groups/directory?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setDirectoryGroups(data);
      }
    } catch (e) {
      console.error("Error searching directory", e);
    } finally {
      setIsSearchingDirectory(false);
    }
  };

  const joinRoom = async (groupId: string) => {
    try {
      const res = await apiFetch(`/api/groups/${groupId}/join`, { method: "POST" });
      if (res.ok) {
        triggerToast("Successfully requested/joined room!");
        await fetchGroups(); // refresh sidebar/groups
        await searchDirectory(directoryQuery); // refresh directory list
      } else {
        const err = await res.json();
        triggerToast(err.error || "Failed to join room");
      }
    } catch (e) {
      triggerToast("Error joining room.");
    }
  };

  const handleToggleRoomStatus = async (newStatus: string) => {
    try {
      const activeGroupObj = groups.find(g => g.name === selectedRoomName);
      if (!activeGroupObj) return;

      const res = await apiFetch(`/api/rooms/${activeGroupObj.id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        triggerToast(`🚀 Group status updated to "${newStatus.toUpperCase()}"!`);
        setGroups(prev => prev.map(g => g.name === selectedRoomName ? { ...g, status: newStatus } : g));
        fetchGroups();
      } else {
        const data = await res.json();
        triggerToast(data.error || "Failed to update group status");
      }
    } catch (e) {
      triggerToast("Error updating group status.");
    }
  };


  useEffect(() => {
    if (activeTab === "groups") {
      searchDirectory(directoryQuery);
    }
  }, [activeTab]);

  const fetchAllRoomsDetails = async (rooms: Group[]) => {
    try {
      const occupantsMap: Record<string, Friend[]> = {};
      const lastMsgMap: Record<string, ChatMessage | null> = {};

      await Promise.all(
        rooms.map(async (group) => {
          // Fetch occupants
          const friendsRes = await apiFetch(`/api/friends?group=${encodeURIComponent(group.name)}`);
          if (friendsRes.ok) {
            const data = await friendsRes.json();
            occupantsMap[group.name] = data;
          }

          // Fetch chat
          const chatRes = await apiFetch(`/api/chat/${group.id}`);
          if (chatRes.ok) {
            const messages = await chatRes.json();
            if (Array.isArray(messages) && messages.length > 0) {
              lastMsgMap[group.name] = messages[messages.length - 1];
            } else {
              lastMsgMap[group.name] = null;
            }
          }
        })
      );

      setRoomsOccupants(occupantsMap);
      setRoomsLastMessage(lastMsgMap);
    } catch (e) {
      console.error("Error fetching all rooms details:", e);
    }
  };

  const toggleRoomSync = async (roomName: string, currentlyEnabled: boolean) => {
    try {
      let activeBroadcasts = user?.broadcastGroups
        ? user.broadcastGroups.split(",").map(g => g.trim()).filter(Boolean)
        : [];

      let updatedGroups: string[];
      if (currentlyEnabled) {
        // Remove room
        updatedGroups = activeBroadcasts.filter(g => g !== roomName);
      } else {
        // Add room if not present
        updatedGroups = [...activeBroadcasts];
        if (!updatedGroups.includes(roomName)) {
          updatedGroups.push(roomName);
        }
      }

      const res = await apiFetch("/api/user/broadcast-groups", {
        method: "POST",
        body: JSON.stringify({ groups: updatedGroups })
      });
      const data = await res.json();
      if (data.success) {
        setUser(prev => prev ? { ...prev, broadcastGroups: data.broadcastGroups } : null);
        triggerToast(`${currentlyEnabled ? "Disabled" : "Enabled"} sync broadcasting for #${roomName}`);

        // Refresh occupants map
        if (groupsRef.current.length > 0) {
          fetchAllRoomsDetails(groupsRef.current);
        }
      }
    } catch (e) {
      console.error("API Broadcast Groups Update Error:", e);
    }
  };

  // Connections REST interactions
  const fetchConnections = async () => {
    try {
      setLoadingConnections(true);
      const res = await apiFetch("/api/connections");
      if (res.ok) {
        const data = await res.json();
        setConnectionsData(data);
      }
    } catch (e) {
      console.error("Error fetching connections:", e);
    } finally {
      setLoadingConnections(false);
    }
  };

  const executeSearchUsers = async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setSearchingUsers(true);
      const res = await apiFetch(`/api/connections/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      console.error("Error searching users:", e);
    } finally {
      setSearchingUsers(false);
    }
  };

  const sendConnectionRequest = async (targetUserId: string) => {
    try {
      const res = await apiFetch("/api/connection-requests", {
        method: "POST",
        body: JSON.stringify({ targetUserId })
      });
      if (res.ok) {
        triggerToast("Friend request sent successfully!");
        fetchConnections();
        if (searchQuery) executeSearchUsers(searchQuery);
      } else {
        const err = await res.json();
        triggerToast(err.error || "Failed to send friend request.");
      }
    } catch (e) {
      console.error("Error sending connection request:", e);
    }
  };

  const respondConnectionRequest = async (requestId: string, action: "accept" | "decline") => {
    try {
      const res = await apiFetch(`/api/connection-requests/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        triggerToast(`Friend request ${action}ed!`);
        fetchConnections();
        if (searchQuery) executeSearchUsers(searchQuery);
      }
    } catch (e) {
      console.error("Error responding to connection request:", e);
    }
  };

  const cancelConnectionRequest = async (requestId: string) => {
    try {
      const res = await apiFetch(`/api/connection-requests/${requestId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        triggerToast("Friend request canceled.");
        fetchConnections();
        if (searchQuery) executeSearchUsers(searchQuery);
      }
    } catch (e) {
      console.error("Error canceling connection request:", e);
    }
  };

  const removeConnection = async (connectionId: string) => {
    setConfirmModal({
      title: "Remove Connection",
      message: "Are you sure you want to remove this connection? You will need to send a new friend request to reconnect.",
      onConfirm: async () => {
        try {
          const res = await apiFetch(`/api/connections/${connectionId}`, { method: "DELETE" });
          if (res.ok) {
            triggerToast("Connection removed.");
            fetchConnections();
            if (searchQuery) executeSearchUsers(searchQuery);
          }
        } catch (e) {
          console.error("Error removing connection:", e);
        }
      }
    });
  };

  const blockUser = async (userId: string) => {
    setConfirmModal({
      title: "Block User",
      message: "Are you sure you want to block this user? This will remove any existing connection and prevent future requests.",
      onConfirm: async () => {
        try {
          const res = await apiFetch(`/api/users/${userId}/block`, { method: "POST" });
          if (res.ok) {
            triggerToast("User blocked.");
            fetchConnections();
            if (searchQuery) executeSearchUsers(searchQuery);
          }
        } catch (e) {
          console.error("Error blocking user:", e);
        }
      }
    });
  };

  const sendFocusChallenge = async (friendId: string, duration: number, mode: string, objective: string) => {
    try {
      const res = await apiFetch("/api/focus-challenges", {
        method: "POST",
        body: JSON.stringify({ invitedUserId: friendId, durationMinutes: duration, challengeMode: mode, creatorObjective: objective })
      });
      if (res.ok) {
        triggerToast("Challenge invitation sent!");
      } else {
        const err = await res.json();
        triggerToast(err.error || "Failed to send focus challenge.");
      }
    } catch (e) {
      console.error("Error sending focus challenge:", e);
    }
  };

  const respondFocusChallenge = async (challengeId: string, action: "accept" | "decline", objective: string) => {
    try {
      const res = await apiFetch(`/api/focus-challenges/${challengeId}/respond`, {
        method: "PATCH",
        body: JSON.stringify({ action, invitedObjective: objective })
      });
      if (res.ok) {
        const data = await res.json();
        if (action === "accept") {
          triggerToast("Focus challenge started!");
          setActiveChallenge(data.challenge);
        } else {
          triggerToast("Focus challenge declined.");
        }
        setIncomingChallenges(prev => prev.filter(c => c.challengeId !== challengeId));
      }
    } catch (e) {
      console.error("Error responding to focus challenge:", e);
    }
  };

  const cancelFocusChallenge = async (challengeId: string) => {
    try {
      const res = await apiFetch(`/api/focus-challenges/${challengeId}/cancel`, {
        method: "POST"
      });
      if (res.ok) {
        triggerToast("Challenge canceled.");
        setActiveChallenge(null);
      }
    } catch (e) {
      console.error("Error canceling focus challenge:", e);
    }
  };

  const completeFocusChallenge = async (challengeId: string) => {
    try {
      const res = await apiFetch(`/api/focus-challenges/${challengeId}/complete`, {
        method: "POST"
      });
      if (res.ok) {
        triggerToast("🎉 Challenge complete! You finished first!");
        setActiveChallenge(null);
      }
    } catch (e) {
      console.error("Error completing focus challenge:", e);
    }
  };

  const getAppColor = (app: string) => {
    const colors: Record<string, string> = {
      "VS Code": "bg-blue-500",
      "Chrome": "bg-emerald-500",
      "Google Chrome": "bg-emerald-500",
      "Figma": "bg-pink-500",
      "Terminal": "bg-zinc-500",
      "Spotify": "bg-purple-500",
      "Slack": "bg-amber-500",
      "Electron": "bg-indigo-500",
    };
    return colors[app] || "bg-stone-500";
  };

  const getTodayWorkBreakdown = () => {
    if (!analytics || !analytics.appBreakdown) return [];
    return analytics.appBreakdown.map(item => {
      const minutes = item.value;
      const hoursText = minutes >= 60 ? `${(minutes / 60).toFixed(1)} hrs` : `${minutes} mins`;
      return {
        app: item.name,
        seconds: minutes * 60,
        hoursText,
        color: item.color
      };
    });
  };

  const renderTimelineItemText = (item: { text: string; app?: string; project?: string; type: string }) => {
    if (item.type === "app_focus" && item.app) {
      return (
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-[#09090b]">
          <span className="text-[#3f3f46]">Started focus in</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
            {item.app}
          </span>
          {item.project && (
            <>
              <span className="text-[#3f3f46]">on</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs max-w-[200px] truncate" title={item.project}>
                {item.project}
              </span>
            </>
          )}
        </div>
      );
    }

    if (item.type === "room_entry" && item.project) {
      return (
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-[#09090b]">
          <span className="text-[#3f3f46]">Entered workspace room</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-xs">
            #{item.project}
          </span>
        </div>
      );
    }

    if (item.type === "pomodoro") {
      return (
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-[#09090b]">
          <span className="text-[#3f3f46]">Completed focus sprint</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
            Pomodoro block
          </span>
        </div>
      );
    }

    return <span className="text-[#09090b] font-medium">{item.text}</span>;
  };

  const getGroupedEvents = () => {
    const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const allEvents: Array<{ date: string; time: string; text: string; app?: string; project?: string; type: string }> = [];

    if (user?.timeline) {
      user.timeline.forEach(item => {
        allEvents.push({
          date: item.date || todayStr,
          time: item.time,
          text: `Started focus in ${item.app} — ${item.project}`,
          app: item.app,
          project: item.project,
          type: "app_focus"
        });
      });
    }

    if (user?.activeGroup) {
      allEvents.push({
        date: todayStr,
        time: "11:00 AM",
        text: `Entered workspace room: "${user.activeGroup}"`,
        project: user.activeGroup,
        type: "room_entry"
      });
    }

    if (pomodoroSessionCount > 0) {
      allEvents.push({
        date: todayStr,
        time: "10:25 AM",
        text: `Completed focus sprint (Pomodoro block)`,
        type: "pomodoro"
      });
    }

    const groupsMap: Record<string, typeof allEvents> = {};
    allEvents.forEach(evt => {
      let groupLabel = evt.date;
      if (evt.date === todayStr) groupLabel = "Today";
      else if (evt.date === yesterdayStr) groupLabel = "Yesterday";

      if (!groupsMap[groupLabel]) {
        groupsMap[groupLabel] = [];
      }
      groupsMap[groupLabel].push(evt);
    });

    return Object.entries(groupsMap);
  };

  const fetchAiBriefing = async (force: boolean = false) => {
    setLoadingInsights(true);
    setInsightsError(false);
    try {
      const res = await apiFetch(`/api/ai-insights${force ? "?force=true" : ""}`);
      const data = await res.json();
      if (data.error) {
        setInsightsError(true);
        setAiInsights(data);
      } else {
        setAiInsights(data);
      }
      if (force) {
        triggerToast(data.isFallback ? "Generated briefing via heuristic engine" : "Compiled a fresh co-working briefing with Gemini AI");
      }
    } catch (e) {
      console.error("API Fetch Error (AI Insights):", e);
      setInsightsError(true);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Pomodoro Timer Countdown Effect
  useEffect(() => {
    let timer: any;
    if (pomodoroActive) {
      timer = setInterval(() => {
        if (pomodoroSecondsLeft > 0) {
          setPomodoroSecondsLeft(prev => prev - 1);
        } else if (pomodoroMinutesLeft > 0) {
          setPomodoroMinutesLeft(prev => prev - 1);
          setPomodoroSecondsLeft(59);
        } else {
          // Timer finished!
          clearInterval(timer);
          setPomodoroActive(false);

          if (pomodoroMode === "focus") {
            setPomodoroSessionCount(prev => prev + 1);
            triggerToast("🎉 Pomodoro Focus Session Complete! Time for a short break.");
            setPomodoroMode("break");
            setPomodoroMinutesLeft(customBreakMinutes);
            setPomodoroSecondsLeft(0);
            completePomodoroSession();
          } else {
            triggerToast("🔋 Break session completed! Ready to focus?");
            setPomodoroMode("focus");
            setPomodoroMinutesLeft(customFocusMinutes);
            setPomodoroSecondsLeft(0);
          }
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [pomodoroActive, pomodoroMinutesLeft, pomodoroSecondsLeft, pomodoroMode]);

  const completePomodoroSession = async () => {
    if (!token) return;
    try {
      const res = await apiFetch("/api/my-activity", {
        method: "POST",
        body: JSON.stringify({ completeFocusSession: true })
      });
      const data = await res.json();
      if (data.success) {
        fetchProfile();
      }
    } catch (e) {
      console.error("Failed to complete focus session:", e);
    }
  };

  const handleIncrementDistraction = async () => {
    if (!token) return;
    setDistractionsManualCount(prev => prev + 1);
    try {
      await apiFetch("/api/my-activity", {
        method: "POST",
        body: JSON.stringify({ incrementDistraction: true })
      });
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetDistractions = async () => {
    if (!token) return;
    setDistractionsManualCount(0);
    try {
      await apiFetch("/api/my-activity", {
        method: "POST",
        body: JSON.stringify({ resetDistractions: true })
      });
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRoomChat = async (roomName: string) => {
    if (!token) return;
    try {
      const g = groups.find(x => x.name === roomName);
      if (!g) return;
      const res = await apiFetch(`/api/chat/${g.id}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setRoomChatMessages(data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch chat:", e);
    }
  };

  const fetchRoomLeaderboard = async (roomName: string) => {
    if (!token) return;
    setFetchingLeaderboard(true);
    try {
      const res = await apiFetch(`/api/leaderboard?group=${encodeURIComponent(roomName)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setRoomLeaderboard(data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch leaderboard:", e);
    } finally {
      setFetchingLeaderboard(false);
    }
  };

  const sendRoomChatMessage = () => {
    if (!roomChatInput.trim() || !socketRef.current || !selectedRoomName) return;
    const g = groups.find(x => x.name === selectedRoomName);
    if (!g) return;

    socketRef.current.emit("send-chat-message", {
      groupId: g.id,
      message: roomChatInput
    });
    setRoomChatInput("");
  };

  const enterRoomChannel = async (roomName: string) => {
    setActiveTab("groups");
    setSelectedRoomName(roomName);
    setRoomTab("overview");
    await submitProfileSettings({ activeGroup: roomName });
    fetchRoomChat(roomName);
    fetchRoomLeaderboard(roomName);
  };

  useEffect(() => {
    if (selectedRoomName) {
      if (roomTab === "chat") {
        fetchRoomChat(selectedRoomName);
      } else if (roomTab === "leaderboard") {
        fetchRoomLeaderboard(selectedRoomName);
      }
    }
  }, [roomTab, selectedRoomName]);

  useEffect(() => {
    if (roomTab === "chat" && chatEndRef.current) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [roomChatMessages, roomTab]);

  const updateMyActiveTracker = async (app?: string, project?: string, togglePause?: boolean) => {
    setUpdatingActivity(true);
    try {
      const payload: any = {};
      if (app !== undefined) {
        payload.app = app;
        setAppInput(app);
      }
      if (project !== undefined) payload.project = project;
      if (togglePause !== undefined) payload.togglePause = togglePause;

      const res = await apiFetch("/api/my-activity", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setMyActivity(data.activity);
        if (app) triggerToast(`App tracking focus switched to ${app}`);
        if (project) triggerToast(`Refocused active project path: "${project}"`);
        if (togglePause !== undefined) {
          triggerToast(togglePause ? "Active activity tracker suspended" : "Active focus sequence restored");
        }
        fetchProfile();
      }
    } catch (e) {
      console.error("API Update Error:", e);
    } finally {
      setUpdatingActivity(false);
    }
  };

  const submitProfileSettings = async (updates: Partial<UserProfile>) => {
    try {
      const res = await apiFetch("/api/user/settings", {
        method: "POST",
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.profile);
        setProfileNameInput(data.profile.name || "");
        setProfileAvatarInput(data.profile.avatarUrl || "");
        setProfileDeviceInput(data.profile.deviceConnected || "");
        triggerToast("Developer workstation parameters loaded");
        // Re-align friends group focus instantly
        setTimeout(fetchFriends, 200);
      }
    } catch (e) {
      console.error("API Profile Update Error:", e);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setUpdatingActivity(true);
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setProfileAvatarInput(data.user.avatarUrl || "");
        triggerToast("Profile picture updated successfully");
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUpdatingActivity(false);
    }
  };

  const executeCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;
    setCreatingGroup(true);
    try {
      const res = await apiFetch("/api/groups/create", {
        method: "POST",
        body: JSON.stringify({ name: newGroupName, description: newGroupDesc })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`New focus guild established: "${newGroupName}"`);
        setNewGroupName("");
        setNewGroupDesc("");
        fetchGroups();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("token", data.token);
      if (data.user) {
        setUser(data.user);
      }
      setToken(data.token);
      // Note: Do NOT call fetchProfile() here — the useEffect([token]) bootstrap
      // will fire when the token state updates and call all fetch functions.
      // Calling it here causes a race condition: token state is still null,
      // so the request has no auth header, gets 401, and immediately logs out.
      triggerToast("Logged in successfully! Welcome to EndoCore.");
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const executeShowcaseLogin = async () => {
    setAuthEmail("showcase");
    setAuthPassword("123");
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "showcase", password: "123" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Showcase login failed");

      localStorage.setItem("token", data.token);
      if (data.user) {
        setUser(data.user);
      }
      setToken(data.token);
      triggerToast("🏆 Connected to Judge Demo Showcase World!");
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: authName, email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      localStorage.setItem("token", data.token);
      if (data.user) {
        setUser(data.user);
      }
      setToken(data.token);
      // Note: Do NOT call fetchProfile() here — same race condition as handleLogin.
      triggerToast("Account created successfully!");
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setMyActivity(null);
    setFriends([]);
    setAnalytics(null);
    setGroups([]);
    setAiInsights(null);
    triggerToast("Logged out successfully");
  }

  // Send interactive co-working wave signal with REST API persistence & Socket fallback
  const triggerPeerNudge = async (friendName: string, id: string) => {
    setNudgedFriendIds(prev => ({ ...prev, [id]: true }));

    try {
      const res = await apiFetch("/api/connections/wave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: id })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          triggerToast(`⏳ Wave cooldown active for ${friendName}`);
          return;
        }
        throw new Error(data.error || "Failed to send wave");
      }

      triggerToast(`✓ Wave sent to ${friendName} 🕊️`);
    } catch (err: any) {
      console.error("Wave API error, falling back to socket:", err);
      if (socketRef.current) {
        socketRef.current.emit("send-nudge", { targetUserId: id });
      }
      triggerToast(`✓ Wave sent to ${friendName} 🕊️`);
    }

    // Keep "Waved!" button state feedback
    setTimeout(() => {
      setNudgedFriendIds(prev => ({ ...prev, [id]: false }));
    }, 10000);
  };

  const handleManualThemeChange = (newTheme: "dark" | "light") => {
    // Disabled
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.classList.remove("dark");
  }, []);

  // Dynamic status-colored indicator dots for editorial aesthetics
  const getStatusNodeMeta = (status: "online" | "busy" | "away" | "focus" | "offline") => {
    switch (status) {
      case "online":
        return { color: "bg-zinc-400 dark:bg-[#bfb5a3]", border: "border-zinc-400/20 dark:border-[#bfb5a3]/30", label: "Active", text: "text-zinc-600 dark:text-gray-300" };
      case "busy":
        return { color: "bg-red-500", border: "border-red-500/20", label: "In Deep Flow", text: "text-red-550 dark:text-rose-350" };
      case "focus":
        return { color: "bg-zinc-800 dark:bg-stone-300", border: "border-zinc-800/10 dark:border-stone-100/10", label: "Quiet Space", text: "text-zinc-700 dark:text-[#bfb5a3]" };
      case "away":
        return { color: "bg-neutral-400 dark:bg-stone-700", border: "border-neutral-400/10 dark:border-stone-800/20", label: "Stepped Away", text: "text-zinc-500 dark:text-stone-400" };
      default:
        return { color: "bg-zinc-300 dark:bg-stone-800", border: "border-zinc-200/10 dark:border-zinc-800/20", label: "Offline", text: "text-zinc-400 dark:text-zinc-650" };
    }
  };

  // Duration parser helper
  const parsedDurationText = (secNum: number) => {
    const hours = Math.floor(secNum / 3600);
    const minutes = Math.floor((secNum % 3600) / 60);
    const secs = secNum % 60;
    return `${hours > 0 ? `${hours}h ` : ""}${minutes}m ${secs}s`;
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    const name = user ? user.name.split(" ")[0] : "";
    if (hours < 12) return `Good Morning, ${name}`;
    if (hours < 17) return `Good Afternoon, ${name}`;
    return `Good Evening, ${name}`;
  };

  const renderContributionCalendar = () => {
    const daysInCalendar = 371; // 53 weeks * 7 days
    const today = new Date();
    const calendarDays = [];

    // Start date: 370 days ago
    const startDate = new Date();
    startDate.setDate(today.getDate() - daysInCalendar + 1);

    for (let i = 0; i < daysInCalendar; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = currentDate.toISOString().split("T")[0];

      const isToday = dateString === today.toISOString().split("T")[0];

      let level = 0;
      const historyDay = analytics?.dailySummaries?.find((d: any) => d.date === dateString);
      if (historyDay) {
        const hours = historyDay.totalFocusSeconds / 3600;
        if (hours === 0) level = 0;
        else if (hours < 1) level = 1;
        else if (hours < 3) level = 2;
        else if (hours < 5) level = 3;
        else level = 4;
      } else if (isToday) {
        const hours = myActivity ? myActivity.durationSeconds / 3600 : 0;
        if (hours === 0) level = 0;
        else if (hours < 1) level = 1;
        else if (hours < 3) level = 2;
        else if (hours < 5) level = 3;
        else level = 4;
      } else {
        level = 0;
      }

      calendarDays.push({
        date: currentDate,
        level,
        isToday
      });
    }

    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }

    return (
      <div className={`p-6 rounded-3xl border ${bgCard} ${borderRule} space-y-4`}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold font-mono tracking-widest uppercase text-stone-400">
            Focus Contribution Heatmap
          </h3>
          <span className="text-[10px] font-mono text-stone-500">Last 365 Days</span>
        </div>

        <div className="overflow-x-auto pr-2 pb-2 scrollbar-thin">
          <div className="flex space-x-1.5 min-w-[650px] justify-start items-start">
            <div className="grid grid-rows-7 gap-1 pr-2 text-[9px] font-mono text-zinc-500 pt-6">
              <span>Mon</span>
              <span></span>
              <span>Wed</span>
              <span></span>
              <span>Fri</span>
              <span></span>
              <span></span>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 pb-1.5 px-1">
                <span>Jan</span>
                <span>Mar</span>
                <span>May</span>
                <span>Jul</span>
                <span>Sep</span>
                <span>Nov</span>
                <span>Jan</span>
              </div>

              <div className="flex gap-1">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-rows-7 gap-1">
                    {week.map((day, dIdx) => {
                      const levelColors = themeMode === 'dark'
                        ? ["bg-[#18181c]/80 border border-[#27272a]/30", "bg-emerald-950 border border-emerald-900/20", "bg-emerald-800", "bg-emerald-600", "bg-emerald-400"]
                        : ["bg-[#f5f4ef] border border-[#dcdcd4]/30", "bg-emerald-100 border border-emerald-200/40", "bg-emerald-200", "bg-emerald-400", "bg-emerald-600"];

                      return (
                        <div
                          key={dIdx}
                          className={`w-3.5 h-3.5 rounded-sm transition-all duration-300 ${levelColors[day.level]} ${day.isToday ? "ring-2 ring-blue-500 dark:ring-stone-300" : ""
                            }`}
                          title={`${day.date.toDateString()}: Focus level ${day.level}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 text-[9px] font-mono text-stone-500">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-neutral-100 dark:bg-neutral-900 border dark:border-neutral-800"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-100 dark:bg-emerald-950 border dark:border-neutral-800"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-800 border dark:border-neutral-805"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-600 border dark:border-neutral-805"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-400 border dark:border-neutral-805"></div>
          <span>More</span>
        </div>
      </div>
    );
  };

  // ── Arctic Slate Studio style bindings ──
  const bgMain     = "bg-[#fafafa]";
  const bgCard     = "studio-card";
  const bgInternal = "bg-[#f4f4f5] border-[#e4e4e7]";
  const textTitle  = "t-main";
  const textSub    = "t-muted";
  const borderRule = "border-[#e4e4e7]";
  const formInput  = "input-field";

  // ── Ambient Theming Helper ──
  const getAmbientBackground = () => {
    switch (activeTab) {
      case "dashboard": return "bg-gradient-to-br from-[#fafafa] via-[#fafafa] to-blue-50/40";
      case "rooms": return "bg-gradient-to-br from-[#fafafa] via-[#fafafa] to-indigo-50/40";
      case "analytics": return "bg-gradient-to-br from-[#fafafa] via-[#fafafa] to-emerald-50/40";
      case "connections": return "bg-gradient-to-br from-[#fafafa] via-[#fafafa] to-rose-50/40";
      default: return "bg-[#fafafa]";
    }
  };

  // Room icon symbol resolver matching navigation aesthetics
  const getRoomIcon = (name: string, index: number) => {
    const lower = name.toLowerCase();
    if (lower.includes("engineering") || lower.includes("dev") || lower.includes("code")) {
      return <Terminal className="h-4 w-4 shrink-0 text-zinc-500" />;
    }
    if (lower.includes("design") || lower.includes("ui") || lower.includes("art")) {
      return <Sparkles className="h-4 w-4 shrink-0 text-zinc-500" />;
    }
    if (lower.includes("focus") || lower.includes("deep") || lower.includes("sprint")) {
      return <Flame className="h-4 w-4 shrink-0 text-zinc-500" />;
    }
    if (lower.includes("general") || lower.includes("chat") || lower.includes("lounge")) {
      return <MessageSquare className="h-4 w-4 shrink-0 text-zinc-500" />;
    }
    if (lower.includes("global") || lower.includes("world") || lower.includes("all")) {
      return <Globe className="h-4 w-4 shrink-0 text-zinc-500" />;
    }
    const icons = [MessageSquare, Compass, Globe, Sparkles, Flame, Target, Terminal, Zap, Layout];
    const IconComp = icons[index % icons.length];
    return <IconComp className="h-4 w-4 shrink-0 text-zinc-500" />;
  };

  // Reusable Sidebar Render Helper (closed over App states)
  const renderSidebar = (isMobileDrawer: boolean = false) => {
    if (isMobileDrawer) {
      return (
        <aside className="w-full h-full flex flex-col shrink-0 bg-[#f4f4f5] select-none">
          {/* Header */}
          <div className="p-4 border-b border-[#e4e4e7] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-display text-xl font-bold tracking-tight text-[#09090b]">EndoCore</span>
              <span className="badge badge-neutral">v1.0</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-[#71717a] hover:text-[#09090b] rounded-md hover:bg-zinc-200/60 cursor-pointer"
              title="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Dynamic Guild Selector */}
          {user && (
            <div className="p-3.5 border-b border-[#e4e4e7] bg-white/60">
              <label className="text-[10px] font-semibold uppercase tracking-wider t-muted block mb-1">
                Active Focus Guild
              </label>
              <select
                value={user.activeGroup}
                onChange={(e) => {
                  submitProfileSettings({ activeGroup: e.target.value });
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-white border border-[#e4e4e7] rounded-md px-2.5 py-1.5 font-sans text-xs font-medium text-[#09090b] cursor-pointer focus:outline-none"
              >
                {groups.map(g => (
                  <option key={g.id} value={g.name} className="bg-white text-[#09090b]">
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Nav Links */}
          <nav className="p-3 flex-1 select-none overflow-y-auto space-y-4">
            <div className="space-y-1">
              <div className="px-3 mb-1 text-[10px] font-extrabold tracking-wider text-black uppercase">
                Home
              </div>

              <button
                onClick={() => { setActiveTab("dashboard"); setSelectedRoomName(null); setSelectedFriendId(null); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                  activeTab === "dashboard" && !selectedRoomName && !selectedFriendId
                    ? "bg-[#09090b] text-white font-extrabold"
                    : "text-black hover:bg-slate-200/60 font-bold"
                }`}
              >
                <Home className="h-4 w-4 shrink-0" />
                <span>My Productivity</span>
              </button>

              <button
                onClick={() => { setActiveTab("analytics"); setSelectedRoomName(null); setSelectedFriendId(null); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                  activeTab === "analytics" ? "bg-[#09090b] text-white font-extrabold" : "text-black hover:bg-slate-200/60 font-bold"
                }`}
              >
                <BarChart3 className="h-4 w-4 shrink-0" />
                <span>My Analytics</span>
              </button>

              <button
                onClick={() => { setActiveTab("focus"); setSelectedRoomName(null); setSelectedFriendId(null); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                  activeTab === "focus" ? "bg-[#09090b] text-white font-extrabold" : "text-black hover:bg-slate-200/60 font-bold"
                }`}
              >
                <Clock className="h-4 w-4 shrink-0" />
                <span>My Focus</span>
              </button>

              <button
                onClick={() => { setActiveTab("goals"); setSelectedRoomName(null); setSelectedFriendId(null); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                  activeTab === "goals" ? "bg-[#09090b] text-white font-extrabold" : "text-black hover:bg-slate-200/60 font-bold"
                }`}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span>My Goals</span>
              </button>

              <button
                onClick={() => { setActiveTab("connections"); setSelectedRoomName(null); setSelectedFriendId(null); fetchConnections(); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                  activeTab === "connections" ? "bg-[#09090b] text-white font-extrabold" : "text-black hover:bg-slate-200/60 font-bold"
                }`}
              >
                <Users className="h-4 w-4 shrink-0" />
                <span>My Connections</span>
              </button>
            </div>

            {/* Rooms Section */}
            <div className="space-y-1 pt-2 border-t border-slate-200">
              <div className="px-3 mb-1 text-[10px] font-extrabold tracking-wider text-black uppercase">
                Rooms
              </div>
              {groups.map((group, index) => (
                <button
                  key={group.id}
                  onClick={() => { enterRoomChannel(group.name); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono cursor-pointer ${
                    selectedRoomName === group.name ? "bg-[#09090b] text-white font-extrabold" : "text-black hover:bg-slate-200/60 font-bold"
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    {getRoomIcon(group.name, index)}
                    <span className="font-sans font-bold">{group.name}</span>
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                </button>
              ))}
            </div>

            {/* Account */}
            <div className="space-y-1 pt-2 border-t border-slate-200">
              <div className="px-3 mb-1 text-[10px] font-extrabold tracking-wider text-black uppercase">
                Account
              </div>
              <button
                onClick={() => { setActiveTab("profile"); setSelectedRoomName(null); setSelectedFriendId(null); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                  activeTab === "profile" ? "bg-[#09090b] text-white font-extrabold" : "text-black hover:bg-slate-200/60 font-bold"
                }`}
              >
                <User className="h-4 w-4 shrink-0" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => { setActiveTab("settings"); setSelectedRoomName(null); setSelectedFriendId(null); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                  activeTab === "settings" ? "bg-[#09090b] text-white font-extrabold" : "text-black hover:bg-slate-200/60 font-bold"
                }`}
              >
                <Settings className="h-4 w-4 shrink-0" />
                <span>Settings</span>
              </button>
            </div>
          </nav>
        </aside>
      );
    }

    // Desktop view with iOS animated width & push transitions
    return (
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 256 : 72 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="hidden md:flex flex-col shrink-0 bg-[#f4f4f5]/90 backdrop-blur-xl border-r border-[#e4e4e7] h-screen sticky top-0 overflow-hidden shadow-sm z-30 select-none"
      >
        {/* Studio Branding & Hamburger Toggle */}
        <div className="p-3.5 border-b border-[#e4e4e7] flex items-center justify-between h-16 shrink-0">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-[#09090b] hover:text-[#09090b] rounded-xl hover:bg-stone-200/70 transition-all cursor-pointer shrink-0"
              title={isSidebarOpen ? "Collapse Navigation Menu" : "Expand Navigation Menu"}
            >
              <Menu className="h-5 w-5" />
            </button>

            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-0.5 whitespace-nowrap overflow-hidden"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-display text-lg font-bold tracking-tight text-[#09090b]">EndoCore</span>
                  <span className="badge badge-neutral">v1.0</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[#71717a]">
                  <span className={`h-2 w-2 rounded-full ${socketStatus === "connected" && apiStatus === "online" && dbStatus === "connected" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
                  <span>Workstation Pipeline</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Dynamic Guild Selector */}
        {user && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 border-b border-[#e4e4e7] bg-white/60 shrink-0 whitespace-nowrap overflow-hidden"
          >
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] block mb-1">
              Active Focus Guild
            </label>
            <select
              value={user.activeGroup}
              onChange={(e) => submitProfileSettings({ activeGroup: e.target.value })}
              className="w-full bg-white border border-[#e4e4e7] rounded-md px-2.5 py-1.5 font-sans text-xs font-medium text-[#09090b] cursor-pointer focus:outline-none"
            >
              {groups.map(g => (
                <option key={g.id} value={g.name} className="bg-white text-[#09090b]">
                  {g.name}
                </option>
              ))}
            </select>
          </motion.div>
        )}

        {/* Navigation Item List */}
        <nav className="p-3 flex-1 select-none overflow-y-auto space-y-4 overflow-x-hidden">
          {/* HOME Section */}
          <div className="space-y-1">
            {isSidebarOpen && (
              <div className="px-3 mb-1.5 text-[10px] font-extrabold tracking-wider text-black uppercase whitespace-nowrap">
                Home
              </div>
            )}

            {/* My Productivity */}
            <button
              onClick={() => { setActiveTab("dashboard"); setSelectedRoomName(null); setSelectedFriendId(null); }}
              className={`relative w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "dashboard" && !selectedRoomName && !selectedFriendId
                  ? "text-white font-extrabold"
                  : "text-black hover:bg-slate-200/60 font-bold"
              }`}
              title="My Productivity"
            >
              {activeTab === "dashboard" && !selectedRoomName && !selectedFriendId && (
                <motion.div layoutId="nav-pill-desktop" className="absolute inset-0 bg-[#09090b] rounded-xl" style={{ zIndex: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} />
              )}
              <span className="relative z-10 flex items-center gap-3 w-full">
                <Home className="h-4 w-4 shrink-0" />
                {isSidebarOpen && (
                  <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="truncate whitespace-nowrap font-bold">
                    My Productivity
                  </motion.span>
                )}
              </span>
            </button>

            {/* My Analytics */}
            <button
              onClick={() => { setActiveTab("analytics"); setSelectedRoomName(null); setSelectedFriendId(null); }}
              className={`relative w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "analytics" ? "text-white font-extrabold" : "text-black hover:bg-slate-200/60 font-bold"
              }`}
              title="My Analytics"
            >
              {activeTab === "analytics" && (
                <motion.div layoutId="nav-pill-desktop" className="absolute inset-0 bg-[#09090b] rounded-xl" style={{ zIndex: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} />
              )}
              <span className="relative z-10 flex items-center gap-3 w-full">
                <BarChart3 className="h-4 w-4 shrink-0" />
                {isSidebarOpen && (
                  <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="truncate whitespace-nowrap font-bold">
                    My Analytics
                  </motion.span>
                )}
              </span>
            </button>

            {/* My Focus */}
            <button
              onClick={() => { setActiveTab("focus"); setSelectedRoomName(null); setSelectedFriendId(null); }}
              className={`relative w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "focus" ? "text-white font-extrabold" : "text-black hover:bg-slate-200/60 font-bold"
              }`}
              title="My Focus"
            >
              {activeTab === "focus" && (
                <motion.div layoutId="nav-pill-desktop" className="absolute inset-0 bg-[#09090b] rounded-xl" style={{ zIndex: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} />
              )}
              <span className="relative z-10 flex items-center gap-3 w-full">
                <Clock className="h-4 w-4 shrink-0" />
                {isSidebarOpen && (
                  <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="truncate whitespace-nowrap font-bold">
                    My Focus
                  </motion.span>
                )}
              </span>
            </button>

            {/* My Goals */}
            <button
              onClick={() => { setActiveTab("goals"); setSelectedRoomName(null); setSelectedFriendId(null); }}
              className={`relative w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "goals" ? "text-white font-extrabold" : "text-black hover:bg-slate-200/60 font-bold"
              }`}
              title="My Goals"
            >
              {activeTab === "goals" && (
                <motion.div layoutId="nav-pill-desktop" className="absolute inset-0 bg-[#09090b] rounded-xl" style={{ zIndex: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} />
              )}
              <span className="relative z-10 flex items-center gap-3 w-full">
                <FileText className="h-4 w-4 shrink-0" />
                {isSidebarOpen && (
                  <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="truncate whitespace-nowrap font-bold">
                    My Goals
                  </motion.span>
                )}
              </span>
            </button>

            {/* My Connections */}
            <button
              onClick={() => { setActiveTab("connections"); setSelectedRoomName(null); setSelectedFriendId(null); fetchConnections(); }}
              className={`relative w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "connections" ? "text-white font-extrabold" : "text-black hover:bg-slate-200/60 font-bold"
              }`}
              title="My Connections"
            >
              {activeTab === "connections" && (
                <motion.div layoutId="nav-pill-desktop" className="absolute inset-0 bg-[#09090b] rounded-xl" style={{ zIndex: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} />
              )}
              <span className="relative z-10 flex items-center gap-3 w-full">
                <Users className="h-4 w-4 shrink-0" />
                {isSidebarOpen && (
                  <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="truncate whitespace-nowrap font-bold">
                    My Connections
                  </motion.span>
                )}
              </span>
            </button>
          </div>

          {/* Rooms Section */}
          <div className="space-y-1 pt-2 border-t border-slate-200">
            {isSidebarOpen && (
              <div
                onClick={() => { setActiveTab("groups"); setSelectedRoomName(null); setSelectedFriendId(null); }}
                className="px-3 mb-1 text-[10px] font-extrabold tracking-wider text-black uppercase cursor-pointer hover:text-black flex items-center justify-between whitespace-nowrap"
              >
                <span>ROOMS</span>
                <Plus className="h-3.5 w-3.5 text-black hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); setActiveTab("groups"); setSelectedRoomName(null); }} />
              </div>
            )}

            <div className="space-y-1">
              {groups.map((group, index) => {
                const isSelected = selectedRoomName === group.name;
                return (
                  <button
                    key={group.id}
                    onClick={() => enterRoomChannel(group.name)}
                    className={`relative w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                      isSelected ? "text-white font-extrabold" : "text-black hover:bg-slate-200/60 font-bold"
                    }`}
                    title={`Room #${group.name}`}
                  >
                    {isSelected && (
                      <motion.div layoutId="nav-pill-desktop" className="absolute inset-0 bg-[#09090b] rounded-xl" style={{ zIndex: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} />
                    )}
                    <span className="relative z-10 flex items-center gap-3 w-full">
                      {getRoomIcon(group.name, index)}
                      {isSidebarOpen && (
                        <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="truncate whitespace-nowrap font-sans text-xs font-bold">
                          {group.name}
                        </motion.span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account / Settings Section */}
          <div className="space-y-1 pt-2 border-t border-slate-200">
            {isSidebarOpen && (
              <div className="px-3 mb-1.5 text-[10px] font-extrabold tracking-wider text-black uppercase whitespace-nowrap">
                Account
              </div>
            )}

            <button
              onClick={() => { setActiveTab("profile"); setSelectedRoomName(null); setSelectedFriendId(null); }}
              className={`relative w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "profile" ? "text-white font-extrabold" : "text-black hover:bg-slate-200/60 font-bold"
              }`}
              title="Profile & Settings"
            >
              {activeTab === "profile" && (
                <motion.div layoutId="nav-pill-desktop" className="absolute inset-0 bg-[#09090b] rounded-xl" style={{ zIndex: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} />
              )}
              <span className="relative z-10 flex items-center gap-3 w-full">
                <Settings className="h-4 w-4 shrink-0" />
                {isSidebarOpen && (
                  <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="truncate whitespace-nowrap font-bold">
                    Profile & Settings
                  </motion.span>
                )}
              </span>
            </button>
          </div>
        </nav>

        {/* User Card & Theme Footer */}
        <div className="p-3 border-t border-slate-200 bg-white/40 shrink-0">
          {isSidebarOpen ? (
            <div className="flex items-center justify-between gap-2">
              {user && (
                <button
                  onClick={() => { setActiveTab("profile"); setSelectedRoomName(null); setSelectedFriendId(null); }}
                  className="flex items-center space-x-2.5 overflow-hidden text-left hover:opacity-80 transition-opacity cursor-pointer min-w-0 flex-1"
                  title="View Profile & Settings"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 whitespace-nowrap flex-1">
                    <p className="text-xs font-extrabold text-black truncate">{user.name}</p>
                    <p className="text-[10px] text-black font-bold truncate">{user.email}</p>
                  </motion.div>
                </button>
              )}

              <button
                onClick={() => {
                  document.documentElement.classList.toggle("dark");
                  triggerToast("Theme toggled");
                }}
                className="p-2 text-black hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Toggle Light/Dark Theme"
              >
                <Sun className="h-4 w-4 text-black" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2 py-1">
              {user && (
                <button
                  onClick={() => { setActiveTab("profile"); setSelectedRoomName(null); setSelectedFriendId(null); }}
                  className="hover:scale-105 transition-transform cursor-pointer"
                  title={`${user.name} - View Profile`}
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover border border-[#e4e4e7] shrink-0"
                  />
                </button>
              )}
              <button
                onClick={() => {
                  document.documentElement.classList.toggle("dark");
                  triggerToast("Theme toggled");
                }}
                className="p-1.5 text-[#71717a] hover:text-[#09090b] rounded-lg hover:bg-stone-200/60 transition-colors cursor-pointer"
                title="Toggle Light/Dark Theme"
              >
                <Sun className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </motion.aside>
    );
  };

  // Selected friend detailed side navigation pane helper
  const rightPaneFriend = friends.find(f => f.id === selectedFriendId);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 mesh-bg">
        {/* ⚡ PREMIUM HIGH-CONTRAST TOAST ALERT (TOP-RIGHT CORNER NON-BLOCKING) */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-16 right-6 z-[9999] max-w-sm px-4 py-3 rounded-xl bg-[#09090b] text-white border border-[#27272a] shadow-2xl flex items-center space-x-3 text-xs font-semibold select-none"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span className="text-white font-medium text-xs flex-1">{toastMessage}</span>
              <button
                onClick={() => setToastMessage(null)}
                className="text-zinc-400 hover:text-white text-xs p-1 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 rounded-3xl glass-card border-glow shadow-2xl space-y-8"
        >
          <div className="text-center space-y-2">
            <span className="font-serif italic text-4xl font-semibold tracking-tight">EndoCore.</span>
            <p className="text-[10px] font-mono tracking-wider uppercase opacity-60">WORKSTATION AUTHENTICATION GATE</p>
          </div>

          {authError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 font-mono">
              Error: {authError}
            </div>
          )}

          {authView === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              {/* 🏆 ONE-CLICK JUDGE SHOWCASE DEMO BUTTON */}
              <button
                type="button"
                onClick={executeShowcaseLogin}
                disabled={authLoading}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer border border-amber-400/30"
              >
                <span>🏆 Launch Judge Demo Showcase Mode</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-zinc-300 dark:border-zinc-800"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-mono tracking-widest text-zinc-400">or sign in manually</span>
                <div className="flex-grow border-t border-zinc-300 dark:border-zinc-800"></div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 block">Workspace Email / Username</label>
                <input
                  type="text"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 text-xs ${formInput} transition-all`}
                  placeholder="showcase or name@email.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 block">Gate Passcode</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 text-xs ${formInput} transition-all`}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="btn-primary w-full justify-center py-3.5 text-xs tracking-widest uppercase"
              >
                {authLoading ? "Verifying traces…" : "Connect Workspace"}
              </button>

              <div className="pt-2 text-center text-xs text-stone-500 font-mono">
                Need key clearance?{" "}
                <button
                  type="button"
                  onClick={() => { setAuthView("register"); setAuthError(null); }}
                  className="text-stone-300 hover:underline cursor-pointer"
                >
                  Create Identity
                </button>
              </div>

              <div className="mt-4 p-4 rounded-2xl border border-dashed dark:border-neutral-800/80 border-stone-200/50 text-[10px] font-mono text-zinc-500 space-y-1.5 bg-[#fafafa]/50 dark:bg-[#151518]/20">
                <p className="font-bold text-amber-500 uppercase tracking-wider">🏆 Judge Competition Demo Credentials:</p>
                <p>Username: <span className="dark:text-emerald-400 font-bold select-all">showcase</span> (or showcase@endocore.io)</p>
                <p>Password: <span className="dark:text-emerald-400 font-bold select-all">123</span></p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 block">Your Display Name</label>
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 text-xs ${formInput} transition-all`}
                  placeholder="Tawfeeq Bahur"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 block">Workspace Email</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 text-xs ${formInput} transition-all`}
                  placeholder="name@email.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 block">Gate Passcode</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 text-xs ${formInput} transition-all`}
                  placeholder="Min 6 characters"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="btn-primary w-full justify-center py-3.5 text-xs tracking-widest uppercase"
              >
                {authLoading ? "Registering identity…" : "Establish Clearances"}
              </button>

              <div className="pt-2 text-center text-xs text-stone-500 font-mono">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => { setAuthView("login"); setAuthError(null); }}
                  className="text-stone-300 hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-350 ease-out font-sans ${bgMain}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-6"
        >
          <span className="font-serif italic text-4xl font-semibold tracking-tight">EndoCore.</span>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-ping"></span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500">
              Loading workspace…
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render the responsive Web Workstation Dashboard for all viewports (mobile browser & desktop)


  return (
    <div className={`min-h-screen flex flex-col md:flex-row mesh-bg font-sans`}>

      {/* ⚡ PREMIUM HIGH-CONTRAST TOAST ALERT (TOP-RIGHT CORNER NON-BLOCKING) */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 right-6 z-[9999] max-w-sm px-4 py-3 rounded-xl bg-[#09090b] text-white border border-[#27272a] shadow-2xl flex items-center space-x-3 text-xs font-semibold select-none"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="text-white font-medium text-xs flex-1">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-zinc-400 hover:text-white text-xs p-1 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🕊️ PEER WAVE BOTTOM-RIGHT FLOATING NOTIFICATION CARD */}
      <AnimatePresence>
        {waveAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full p-4 rounded-2xl bg-white border border-[#e4e4e7] text-[#09090b] shadow-2xl flex items-start justify-between space-x-3.5"
          >
            <div className="flex items-start space-x-3.5 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shrink-0">
                👋
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#09090b]">
                    Workstation Check-In
                  </h4>
                  <span className="text-[10px] font-mono text-[#71717a]">{waveAlert.timestamp}</span>
                </div>
                <p className="text-xs font-semibold text-[#09090b]">
                  {waveAlert.senderName} waved at you
                </p>
                <p className="text-[11px] text-[#71717a] leading-relaxed">
                  They're checking in and cheering on your focus.
                </p>
                <div className="flex gap-2 pt-1.5">
                  <button
                    onClick={() => {
                      const recentWave = recentWaves.find(w => w.senderName === waveAlert.senderName);
                      const senderId = recentWave?.senderId;
                      const senderName = waveAlert.senderName;
                      if (senderId) {
                        triggerPeerNudge(senderName, senderId);
                      } else {
                        const sender = friends.find(f => f.name === senderName);
                        if (sender) triggerPeerNudge(sender.name, sender.id);
                      }
                      setWaveAlert(null);
                    }}
                    className="px-3 py-1.5 bg-[#09090b] hover:bg-[#27272a] text-white text-xs font-semibold rounded-lg cursor-pointer transition-all"
                  >
                    Wave Back 👋
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("connections");
                      setWaveAlert(null);
                    }}
                    className="px-3 py-1.5 bg-[#f4f4f5] hover:bg-[#e4e4e7] text-[#09090b] text-xs font-semibold rounded-lg cursor-pointer transition-all border border-[#e4e4e7]"
                  >
                    Connections
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setWaveAlert(null)}
              className="text-[#71717a] hover:text-[#09090b] text-xs font-mono p-1 rounded-full hover:bg-zinc-100 cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🕊️ LEFT SYSTEM BRAND & WORKSPACE COMMAND PANEL */}
      {renderSidebar(false)}

      {/* Mobile Drawer Sidebar overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm"
            />
            {/* Drawer container */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 z-50 flex flex-col md:hidden shadow-2xl"
            >
              {renderSidebar(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🚀 CENTRAL VIEW CONTAINER */}
      <main className={`flex-1 flex flex-col min-w-0 overflow-y-auto relative transition-colors duration-500 ${getAmbientBackground()}`}>
        {/* Sleek Top Gradient Accent Strip */}
        <div className="gradient-bar-primary shrink-0"></div>

        {/* Elegant Top Header with High-Contrast Black Greeting, Blended Components & Minimal Pipeline Dot */}
        <header className="min-h-16 py-3 border-b border-slate-200/90 shrink-0 px-3.5 sm:px-6 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-40 backdrop-blur-md bg-white/80 text-black">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Left Hamburger Navigation Menu Trigger (Mobile Only) */}
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  setMobileMenuOpen(true);
                } else {
                  setIsSidebarOpen(!isSidebarOpen);
                }
              }}
              className="md:hidden p-2 text-black hover:text-black rounded-xl hover:bg-slate-100 transition-all cursor-pointer shrink-0"
              title="Toggle Left Navigation Menu"
            >
              <Menu className="h-5 w-5 text-black" />
            </button>

            {/* Mobile Brand Tag */}
            <span className="font-serif italic text-base font-semibold tracking-tight text-[#D4AF37] shrink-0 md:hidden">EndoCore.</span>
            <span className="h-3.5 w-px bg-neutral-700/40 md:hidden"></span>

            {/* Promoted Greeting Header & Subtitle */}
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-2xl font-display font-black text-black tracking-tight truncate">
                  {selectedRoomName ? `Room #${selectedRoomName}` : activeTab === "dashboard" ? getGreeting() : activeTab === "analytics" ? "My Analytics" : activeTab === "focus" ? "My Focus" : activeTab === "goals" ? "My Goals" : activeTab === "connections" ? "My Connections" : activeTab === "profile" ? "Profile & Settings" : getGreeting()}
                </h1>

                {/* 🟢/🔴 Simple Dot Indicator (NO text pill) */}
                {(() => {
                  const isPipelineHealthy = socketStatus === "connected" && apiStatus === "online" && dbStatus === "connected" && aiStatus === "configured" && !insightsError;
                  const pipelineErrors: string[] = [];
                  if (apiStatus !== "online") pipelineErrors.push("REST API");
                  if (socketStatus !== "connected") pipelineErrors.push("WebSockets");
                  if (dbStatus !== "connected") pipelineErrors.push("Supabase DB");
                  if (!electronTracking) pipelineErrors.push("Desktop Agent");
                  if (aiStatus !== "configured" || insightsError) pipelineErrors.push("Gemini AI");

                  return (
                    <div className="relative group cursor-pointer shrink-0 inline-flex items-center" title={isPipelineHealthy ? "Pipeline Operational" : `Pipeline Error: ${pipelineErrors.join(", ")}`}>
                      <span className="relative flex h-3 w-3 items-center justify-center p-1">
                        {!isPipelineHealthy && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                          isPipelineHealthy
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                            : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse"
                        }`}></span>
                      </span>

                      {/* Hover Popup specifying exact microservice status and errors */}
                      <div className="absolute left-0 mt-8 w-64 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50 space-y-2 text-xs text-black">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="font-extrabold text-black font-mono uppercase text-[10px] tracking-wider">Pipeline Health</span>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              triggerToast("Running diagnostics health-check...");
                              await checkHealth();
                              if (socketRef.current && !socketRef.current.connected) {
                                socketRef.current.connect();
                              }
                            }}
                            className="text-[9px] font-mono text-indigo-600 hover:underline cursor-pointer font-bold"
                          >
                            Re-check ↺
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-black font-bold">REST API</span>
                            <span className={`font-mono font-extrabold ${apiStatus === "online" ? "text-emerald-600" : "text-rose-600"}`}>
                              {apiStatus === "online" ? "● ONLINE" : "● OFFLINE"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-black font-bold">WebSockets</span>
                            <span className={`font-mono font-extrabold ${socketStatus === "connected" ? "text-emerald-600" : "text-rose-600"}`}>
                              {socketStatus === "connected" ? "● CONNECTED" : "● ERROR"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-black font-bold">Supabase DB</span>
                            <span className={`font-mono font-extrabold ${dbStatus === "connected" ? "text-emerald-600" : "text-rose-600"}`}>
                              {dbStatus === "connected" ? "● CONNECTED" : "● ERROR"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-black font-bold">Desktop Agent</span>
                            <span className={`font-mono font-extrabold ${electronTracking ? "text-emerald-600" : "text-slate-600"}`}>
                              {electronTracking ? "● SYNCED" : "○ OFFLINE"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-black font-bold">Gemini AI</span>
                            <span className={`font-mono font-extrabold ${aiStatus === "configured" && !insightsError ? "text-emerald-600" : "text-rose-600"}`}>
                              {aiStatus === "configured" && !insightsError ? "● ACTIVE" : "● ERROR"}
                            </span>
                          </div>
                        </div>

                        {!isPipelineHealthy && (
                          <div className="pt-2 border-t border-slate-200 text-[10px] font-mono text-rose-600 font-extrabold leading-tight">
                            ⚠️ Issue: {pipelineErrors.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <p className="text-xs text-black font-semibold hidden sm:block truncate">
                {selectedRoomName ? "Active guild room channel" : activeTab === "dashboard" ? "Here's your real-time workstation overview for today." : activeTab === "analytics" ? "Performance tracking and focus metrics" : activeTab === "focus" ? "Deep work sessions and distraction monitoring" : activeTab === "goals" ? "Milestones, task routines, and objectives" : activeTab === "connections" ? "Co-worker presence and real-time collaboration" : activeTab === "profile" ? "Manage workstation account and preferences" : "Here's your real-time workstation overview for today."}
              </p>
            </div>
          </div>

          {/* Quick Segment Controls: Components blend with webpage, Fonts are pure black */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Agent Status Pill Indicator */}
            <button
              onClick={() => {
                if (myActivity?.isPaused) {
                  setShowSessionModal(true);
                } else {
                  updateMyActiveTracker(undefined, undefined, true);
                }
              }}
              disabled={updatingActivity}
              className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 bg-white/80 hover:bg-white border border-slate-200/90 shadow-xs transition-all cursor-pointer text-black"
              title="Click to configure agent monitoring session"
            >
              <span className="font-black text-black">Agent</span>
              {myActivity?.isPaused ? (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              ) : (
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              )}
            </button>

            {/* Privacy Toggle Pills */}
            <div className="flex items-center gap-1 bg-white/80 border border-slate-200/90 p-1 rounded-xl shadow-xs">
              <button
                onClick={() => submitProfileSettings({ privacyMode: "Private" })}
                className={`px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  user?.privacyMode === "Private"
                    ? "bg-[#09090b] text-white shadow-xs font-black"
                    : "text-black hover:bg-slate-100/80 font-extrabold"
                }`}
                title="Private Mode: Activity hidden from co-workers"
              >
                <Lock className={`h-3.5 w-3.5 ${user?.privacyMode === "Private" ? "text-amber-400" : "text-amber-600"}`} />
                <span className="font-extrabold text-current">Private</span>
              </button>

              <button
                onClick={() => submitProfileSettings({ privacyMode: "Team" })}
                className={`px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  user?.privacyMode === "Team"
                    ? "bg-[#09090b] text-white shadow-xs font-black"
                    : "text-black hover:bg-slate-100/80 font-extrabold"
                }`}
                title="Team Mode: Activity visible to room members"
              >
                <Users className={`h-3.5 w-3.5 ${user?.privacyMode === "Team" ? "text-blue-400" : "text-blue-600"}`} />
                <span className="font-extrabold text-current">Team</span>
              </button>

              <button
                onClick={() => submitProfileSettings({ privacyMode: "Public" })}
                className={`px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  user?.privacyMode === "Public" || (!user?.privacyMode || user?.privacyMode === "Level 1: Full Detail")
                    ? "bg-[#09090b] text-white shadow-xs font-black"
                    : "text-black hover:bg-slate-100/80 font-extrabold"
                }`}
                title="Public Mode: Live activity broadcasting ON"
              >
                <Globe className={`h-3.5 w-3.5 ${user?.privacyMode === "Public" || (!user?.privacyMode || user?.privacyMode === "Level 1: Full Detail") ? "text-emerald-400" : "text-emerald-600"}`} />
                <span className="font-extrabold text-current">Public</span>
              </button>
            </div>

            {/* Connected Devices Quick Hub Trigger */}
            <button
              onClick={() => setShowDevicesList(!showDevicesList)}
              className="px-3 py-1.5 rounded-xl text-xs font-black bg-white/80 hover:bg-white border border-slate-200/90 text-black shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <Laptop className="h-4 w-4 text-indigo-600" />
              <span className="font-black text-black">{connectedDevices.length} Connected Devices</span>
              <ChevronDown className={`h-3.5 w-3.5 text-black transition-transform ${showDevicesList ? "rotate-180" : ""}`} />
            </button>
          </div>
        </header>

        {/* 📚 PRIMARY SCROLLABLE BODY */}
        <div className={`p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-8 w-full ${activeTab === "analytics" ? "max-w-[1600px] mx-auto px-4 sm:px-8" : "max-w-5xl mx-auto"}`}>

          {/* SLIDING TIMELINE SUBSECTION FOR SELECTED FRIENDS */}
          <AnimatePresence>
            {rightPaneFriend && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-6 border rounded-2xl relative overflow-hidden ${bgCard} ${borderRule}`}
              >
                <button
                  onClick={() => setSelectedFriendId(null)}
                  className="absolute top-5 right-5 text-stone-500 hover:text-stone-300 p-2 rounded-full cursor-pointer"
                  title="Close panel"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={rightPaneFriend.avatarUrl}
                      alt={rightPaneFriend.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-[#a1a1aa] block leading-none">{rightPaneFriend.role}</span>
                      <h3 className="text-xl font-serif italic font-semibold mt-1">{rightPaneFriend.name}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#18181c]/30 dark:bg-[#18181c]/50 p-4 rounded-xl border dark:border-[#222227] border-stone-200/40 text-center">
                      <span className="text-[10px] text-stone-500 font-mono uppercase block">Active App</span>
                      <span className="text-sm font-bold text-stone-300 block mt-1">{rightPaneFriend.currentActivity.app}</span>
                    </div>
                    <div className="bg-[#18181c]/30 dark:bg-[#18181c]/50 p-4 rounded-xl border dark:border-[#222227] border-stone-200/40 text-center">
                      <span className="text-[10px] text-stone-500 font-mono uppercase block">Daily Focus</span>
                      <span className="text-sm font-bold text-stone-300 block mt-1">{rightPaneFriend.todayFocusTime}</span>
                    </div>
                    <div className="bg-[#18181c]/30 dark:bg-[#18181c]/50 p-4 rounded-xl border dark:border-[#222227] border-stone-200/40 text-center">
                      <span className="text-[10px] text-stone-500 font-mono uppercase block">Engagement Score</span>
                      <span className="text-sm font-bold text-zinc-300 block mt-1">{rightPaneFriend.focusScore}%</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] uppercase tracking-wider font-mono text-stone-500 block">Workspace Activity Timeline</span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {rightPaneFriend.timeline.map((item, id) => (
                        <div key={id} className="flex justify-between text-xs py-2 border-b dark:border-[#222227]/70 border-stone-200/50">
                          <div className="flex space-x-3">
                            <span className="font-mono text-stone-500">{item.time}</span>
                            <span className="font-semibold text-stone-300">{item.app}</span>
                            <span className="text-stone-400">— {item.project}</span>
                          </div>
                          <span className="font-mono text-[10px] text-zinc-500">{item.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* VIEWPORT CONTROLLER CHANNELS */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (selectedRoomName || "")}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >

              {/* 1⃣ MAIN DASHBOARD TAB VIEW */}
              {activeTab === "dashboard" && (
                <>

                  {/* CONNECTED DEVICES & DISPLAY MONITOR MATRIX */}
                  <AnimatePresence>
                    {showDevicesList && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="studio-card p-4 space-y-3 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 border border-[#e4e4e7] rounded-2xl"
                      >
                        <div className="flex items-center justify-between border-b border-[#e4e4e7] pb-2.5">
                          <div className="flex items-center space-x-2">
                            <Laptop className="h-4 w-4 text-indigo-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#09090b]">
                              Connected Workstation Devices & Display Monitor Matrix
                            </h3>
                          </div>
                          <span className="badge badge-emerald">
                            <span className="status-dot status-dot-emerald"></span>
                            <span>{connectedDevices.filter(d => d.status !== "idle").length} Active Devices / Monitors</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                          {connectedDevices.map((device) => {
                            let icon = <Laptop className="h-4 w-4 text-blue-600" />;
                            if (device.type === "mobile") icon = <Smartphone className="h-4 w-4 text-purple-600" />;
                            if (device.type === "tablet") icon = <Tablet className="h-4 w-4 text-teal-600" />;
                            if (device.type === "monitor") icon = <Monitor className="h-4 w-4 text-amber-600" />;
                            if (device.type === "desktop") icon = <Cpu className="h-4 w-4 text-emerald-600" />;

                            return (
                              <div key={device.id} className="p-3 bg-white rounded-xl border border-[#e4e4e7] shadow-xs flex flex-col justify-between space-y-2.5 hover:border-indigo-300 transition-colors">
                                <div className="flex items-start justify-between space-x-3">
                                  <div className="flex items-start space-x-3 min-w-0">
                                    <div className="p-2 bg-[#f4f4f5] rounded-lg shrink-0">
                                      {icon}
                                    </div>
                                    <div className="min-w-0 space-y-0.5">
                                      <h4 className="text-xs font-bold text-[#09090b] truncate">{device.name}</h4>
                                      <p className="text-[10px] font-mono text-[#71717a]">{device.os}</p>
                                      <p className="text-[10px] text-[#71717a] font-medium">{device.lastSync}</p>
                                    </div>
                                  </div>
                                  <span className={`status-dot shrink-0 mt-1 ${
                                    device.status === "active" || device.status === "display_active"
                                      ? "status-dot-emerald"
                                      : device.status === "online"
                                      ? "status-dot-indigo"
                                      : "status-dot-amber"
                                  }`} title={device.status} />
                                </div>

                                <div className="flex items-center justify-between border-t border-[#f4f4f5] pt-2">
                                  <span className="text-[9px] font-mono text-emerald-700 font-semibold uppercase">
                                    {device.status === "active" ? "Primary Workstation" : device.status === "display_active" ? "Display Connected" : "Paired Session"}
                                  </span>
                                  {device.status === "active" ? (
                                    <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200" title="This machine is your current active workstation session">
                                      This Machine (Active) ✓
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => disconnectDevice(device.id, device.name)}
                                      className="text-[10px] font-mono font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded transition-colors cursor-pointer"
                                      title="Disconnect and revoke remote device session"
                                    >
                                      Disconnect ✕
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* CARDS GRID */}
                  <div className="grid grid-cols-12 gap-3 sm:gap-5">
                    {/* Focus Time Card */}
                    <TiltCard className="col-span-12 sm:col-span-6 lg:col-span-2">
                      <div className="studio-card flex flex-col justify-between p-4 h-28 sm:h-32 w-full h-full">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-black">Focus Time</span>
                        <div className="space-y-1">
                          <div className="text-2xl font-display font-black text-black"><NumberTicker value={myActivity ? parseFloat((myActivity.durationSeconds / 3600).toFixed(1)) : 0.0} decimals={1} /> <span className="text-xs font-bold text-black">hrs</span></div>
                          <div className="text-[11px] text-black font-extrabold font-mono">Goal: <NumberTicker value={user?.productivityGoal || 6} /> hrs</div>
                        </div>
                      </div>
                    </TiltCard>

                    {/* Productivity Score */}
                    <TiltCard className="col-span-12 sm:col-span-6 lg:col-span-2">
                      <div className="studio-card flex flex-col justify-between p-4 h-28 sm:h-32 w-full h-full">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-black">Productivity Score</span>
                        <div className="space-y-1">
                          <div className="text-2xl font-display font-black text-black"><NumberTicker value={myActivity ? Math.min(100, Math.round(((myActivity.durationSeconds / 3600) / (user?.productivityGoal || 6)) * 100)) : 0} />%</div>
                          <div className="text-[11px] text-black font-extrabold">Target achieved</div>
                        </div>
                      </div>
                    </TiltCard>

                    {/* Current Session */}
                    <TiltCard className="col-span-12 sm:col-span-6 lg:col-span-2">
                      <div className="studio-card flex flex-col justify-between p-4 h-28 sm:h-32 w-full h-full">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-black">Current Session</span>
                        <div className="space-y-0.5">
                          <div className="text-base font-black text-black truncate">{myActivity ? myActivity.app : "Inactive"}</div>
                          <div className="text-[11px] text-black font-extrabold font-mono truncate">Proj: {myActivity ? myActivity.project : "None"}</div>
                        </div>
                      </div>
                    </TiltCard>

                    {/* Today's Progress / Activity Tracker Controls */}
                    {myActivity && (
                      <div className="col-span-12 sm:col-span-12 lg:col-span-6 studio-card flex flex-col justify-between p-4 min-h-32">
                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center space-x-2">
                            <span className="badge badge-neutral">
                              Activity Tracker Console
                            </span>
                            {myActivity.isPaused ? (
                              <span className="relative flex h-2.5 w-2.5 ml-2" title="Agent Monitoring Paused">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                              </span>
                            ) : (
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] ml-2" title="Agent Monitoring Active"></span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          {/* App Selector Custom Node with Plus Button */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] block">Active Application</label>
                            <div className="flex items-center space-x-1.5">
                              <select
                                value={myActivity.app}
                                onChange={(e) => updateMyActiveTracker(e.target.value, undefined, undefined)}
                                className="input-field cursor-pointer text-xs flex-1"
                              >
                                {customApps.map(app => (
                                  <option key={app} value={app}>{app}</option>
                                ))}
                                {myActivity.openApps && myActivity.openApps.map(app => (
                                  !customApps.includes(app) && <option key={app} value={app}>{app}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => {
                                  const name = prompt("Enter new custom application name:");
                                  if (name && name.trim()) {
                                    const cleanName = name.trim();
                                    if (!customApps.includes(cleanName)) {
                                      setCustomApps(prev => [...prev, cleanName]);
                                    }
                                    updateMyActiveTracker(cleanName, undefined, false);
                                  }
                                }}
                                className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-all cursor-pointer font-bold text-xs shrink-0"
                                title="Add New Custom Application"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Project description inline apply */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] block">Active Task / Project</label>
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="text"
                                value={projectInput}
                                onChange={(e) => setProjectInput(e.target.value)}
                                className="input-field text-xs"
                                placeholder="What are you building?"
                                onKeyDown={(e) => e.key === "Enter" && updateMyActiveTracker(undefined, projectInput, undefined)}
                              />
                              <button
                                onClick={() => updateMyActiveTracker(undefined, projectInput, undefined)}
                                className="btn-primary shrink-0 py-1.5 px-3 text-xs"
                              >
                                Sync
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TODAY'S PROGRESS / TRACKER & TIMELINE SPLIT GRID */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Left Column: Today's Progress / Activity Tracker */}
                    <div className="lg:col-span-2">
                      {myActivity && (
                        <div className="studio-card p-5 h-full relative overflow-hidden">
                          <div className="flex flex-col justify-between h-full space-y-5">
                            {/* Team & Scrum Telemetry Section */}
                            <div className="p-4 rounded-xl bg-white/70 backdrop-blur-xs border border-slate-200/90 space-y-3">
                              <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                                  <Users className="h-4 w-4 text-black" />
                                  <span>Team & Scrum Telemetry</span>
                                </h3>
                                <div className="badge badge-emerald">
                                  <span className="status-dot status-dot-emerald"></span>
                                  <span>Live Synced</span>
                                </div>
                              </div>

                              {/* Active Room Members Grid */}
                              <div className="space-y-3">
                                {(() => {
                                  const activeGroupName = user?.activeGroup || (groups.length > 0 ? groups[0].name : null);
                                  if (!activeGroupName) {
                                    return (
                                      <p className="text-xs text-black font-extrabold italic">No active workspace group selected.</p>
                                    );
                                  }

                                  const occupants = activeGroupName === user?.activeGroup && friends && friends.length > 0
                                    ? friends
                                    : (roomsOccupants[activeGroupName] || []);

                                  return (
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center text-xs font-black text-black border-b border-slate-200 pb-1.5">
                                        <span>Guild: #{activeGroupName}</span>
                                        <span>{occupants.length} Co-workers</span>
                                      </div>

                                      {occupants.length === 0 ? (
                                        <p className="text-xs text-black font-extrabold italic">No other co-workers in this room currently.</p>
                                      ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                                          {occupants.map((occ) => {
                                            const occOnline = occ.status !== "offline";
                                            const activityApp = occ.currentActivity?.app || "Offline";
                                            const activityProject = occ.currentActivity?.project || "None";
                                            const duration = occ.currentActivity?.durationText || "";

                                            return (
                                              <div key={occ.id} className="p-2.5 bg-white/90 rounded-xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-2">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center space-x-2 min-w-0">
                                                    <div className="relative shrink-0">
                                                      <img
                                                        src={occ.avatarUrl}
                                                        alt={occ.name}
                                                        className="h-6 w-6 rounded-full object-cover border border-slate-200"
                                                      />
                                                      <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white ${occOnline ? "bg-emerald-500" : "bg-slate-400"
                                                        }`} />
                                                    </div>
                                                    <div className="min-w-0">
                                                      <span className="font-sans font-black text-xs text-black truncate block leading-tight">{occ.name}</span>
                                                      <span className="text-[9px] font-black uppercase tracking-wider text-black block">{occ.role}</span>
                                                    </div>
                                                  </div>
                                                  <span className="text-[10px] font-mono font-black text-black shrink-0">{duration}</span>
                                                </div>

                                                {occOnline ? (
                                                  <div className="flex items-center justify-between text-[11px] bg-slate-100/80 p-1.5 rounded-lg border border-slate-200">
                                                    <span className="text-black font-black truncate flex items-center space-x-1">
                                                      <span className="text-emerald-600">⚡</span>
                                                      <span>{activityApp}</span>
                                                    </span>
                                                    {activityProject !== "None" && (
                                                      <span className="text-[10px] text-black font-extrabold max-w-[100px] truncate" title={activityProject}>
                                                        {activityProject}
                                                      </span>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <span className="text-[10px] font-bold text-black block pl-1">Offline</span>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* AI Scrum Coordinator Brief */}
                              <div className="pt-3 border-t border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-1.5">
                                    <Sparkles className="h-4 w-4 text-amber-600" />
                                    <span className="text-xs font-black uppercase tracking-wider text-black">Scrum Coordinator Brief</span>
                                  </div>
                                  <button
                                    onClick={() => fetchAiBriefing(true)}
                                    disabled={loadingInsights}
                                    className="p-1 rounded hover:bg-slate-200/60 text-black hover:text-black transition-all cursor-pointer disabled:opacity-50"
                                    title="Regenerate Scrum Alignment Brief"
                                  >
                                    <RefreshCw className={`h-3.5 w-3.5 ${loadingInsights ? "animate-spin" : ""}`} />
                                  </button>
                                </div>

                                {loadingInsights ? (
                                  <SkeletonLoader lines={3} className="py-1" />
                                ) : aiInsights && aiInsights.success ? (() => {
                                  const roomSummary = aiInsights.roomSummary || { status: "Active Room", productivityPercentage: 50, description: "Compiling room data...", activeCount: 0, totalCount: 1 };
                                  const topPerformer = aiInsights.topPerformer || { name: "None", focusTime: "0m", apps: [], score: 0, reason: "" };
                                  const needsAttention = aiInsights.needsAttention || { name: "None", idleTime: "0m", reason: "" };
                                  const scrum = aiInsights.agents?.scrumCoordinator || { status: "Optimal Alignment", recommendation: "", pairSuggestions: [] };
                                  const welfare = aiInsights.agents?.welfareCoach || { burnoutRiskIndex: 0, ergonomicNudge: "" };
                                  const recommendations = Array.isArray(aiInsights.recommendations) ? aiInsights.recommendations : [];
                                  const prediction = aiInsights.prediction || { completionPercentage: 50, description: "" };
                                  const memberInsights = Array.isArray(aiInsights.memberInsights) ? aiInsights.memberInsights : [];
                                  const focusPatterns = aiInsights.focusPatterns || { deepWorkStreak: 0, contextSwitchCount: 0, peakProductivityWindow: "--", averageSessionLength: "0m", flowStateDetected: false };
                                  const collaborationScore = aiInsights.collaborationScore ?? 50;
                                  const summary = aiInsights.summary || "";

                                  const moodColors: Record<string, string> = {
                                    "deep_work": "bg-emerald-100 text-emerald-700 border-emerald-200",
                                    "focused": "bg-blue-100 text-blue-700 border-blue-200",
                                    "idle": "bg-amber-100 text-amber-700 border-amber-200",
                                    "distracted": "bg-red-100 text-red-700 border-red-200",
                                    "offline": "bg-slate-100 text-slate-800 border-slate-200"
                                  };
                                  const moodLabels: Record<string, string> = {
                                    "deep_work": "🧠 Deep Work",
                                    "focused": "🎯 Focused",
                                    "idle": "💤 Idle",
                                    "distracted": "⚡ Distracted",
                                    "offline": "⭘ Offline"
                                  };

                                  return (
                                    <div className="space-y-3">
                                      {/* Mini Cards Grid */}
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                                        <div className="p-2.5 bg-white/90 rounded-lg border border-slate-200/90 text-center">
                                          <span className="text-[9px] font-black uppercase tracking-wider text-black block">Productivity</span>
                                          <span className="text-xs font-black text-black block mt-0.5">{roomSummary.productivityPercentage}%</span>
                                          <span className={`text-[8px] font-extrabold block mt-0.5 ${roomSummary.productivityPercentage >= 60 ? "text-emerald-600" : roomSummary.productivityPercentage >= 30 ? "text-amber-600" : "text-black"}`}>
                                            {roomSummary.productivityPercentage >= 60 ? "Strong" : roomSummary.productivityPercentage >= 30 ? "Moderate" : "Low Activity"}
                                          </span>
                                        </div>
                                        <div className="p-2.5 bg-white/90 rounded-lg border border-slate-200/90 text-center">
                                          <span className="text-[9px] font-black uppercase tracking-wider text-black block">Deep Work</span>
                                          <span className="text-xs font-black text-black block mt-0.5">{focusPatterns.deepWorkStreak}m</span>
                                          <span className={`text-[8px] font-extrabold block mt-0.5 ${focusPatterns.flowStateDetected ? "text-emerald-600" : "text-black"}`}>
                                            {focusPatterns.flowStateDetected ? "Flow Detected ✦" : "No Flow State"}
                                          </span>
                                        </div>
                                        <div className="p-2.5 bg-white/90 rounded-lg border border-slate-200/90 text-center">
                                          <span className="text-[9px] font-black uppercase tracking-wider text-black block">Burnout Risk</span>
                                          <span className={`text-xs font-black block mt-0.5 ${welfare.burnoutRiskIndex > 60 ? "text-red-600" : welfare.burnoutRiskIndex > 30 ? "text-amber-600" : "text-emerald-600"}`}>{welfare.burnoutRiskIndex}/100</span>
                                          <span className={`text-[8px] font-extrabold block mt-0.5 ${welfare.burnoutRiskIndex > 60 ? "text-red-600" : welfare.burnoutRiskIndex > 30 ? "text-amber-600" : "text-emerald-600"}`}>
                                            {welfare.burnoutRiskIndex > 60 ? "High Risk ⚠" : welfare.burnoutRiskIndex > 30 ? "Moderate" : "Healthy"}
                                          </span>
                                        </div>
                                        <div className="p-2.5 bg-white/90 rounded-lg border border-slate-200/90 text-center">
                                          <span className="text-[9px] font-black uppercase tracking-wider text-black block">Collaboration</span>
                                          <span className="text-xs font-black text-black block mt-0.5">{collaborationScore}/100</span>
                                          <span className={`text-[8px] font-extrabold block mt-0.5 ${collaborationScore >= 60 ? "text-emerald-600" : "text-black"}`}>
                                            {collaborationScore >= 70 ? "High Synergy" : collaborationScore >= 40 ? "Moderate" : "Independent"}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Scrum Coordinator Panel */}
                                      <div className="text-xs leading-relaxed font-sans max-h-[520px] overflow-y-auto pr-1 text-black bg-white/90 rounded-lg p-3.5 border border-slate-200 space-y-3">
                                        
                                        {/* Room Status */}
                                        <div className="space-y-1.5 pb-2.5 border-b border-slate-200">
                                          <div className="flex justify-between items-center text-xs">
                                            <span className="text-black font-black flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                                              <span className={roomSummary.activeCount > 0 ? "text-emerald-500" : "text-black"}>
                                                {roomSummary.activeCount > 0 ? "🟢" : "🔴"}
                                              </span> Room Summary — {roomSummary.status}
                                            </span>
                                            <span className="text-black font-black">{roomSummary.productivityPercentage}%</span>
                                          </div>
                                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                                            <div 
                                              className={`h-full rounded-full transition-all duration-700 ${roomSummary.productivityPercentage >= 60 ? "bg-emerald-500" : roomSummary.productivityPercentage >= 30 ? "bg-amber-500" : "bg-slate-400"}`}
                                              style={{ width: `${roomSummary.productivityPercentage}%` }}
                                            />
                                          </div>
                                          <p className="text-xs text-black font-extrabold mt-1 leading-normal">
                                            {roomSummary.description}
                                          </p>
                                          <div className="flex gap-3 text-[10px] font-mono text-black font-bold pt-1">
                                            <span>• {roomSummary.activeCount} / {roomSummary.totalCount} developers active</span>
                                            <span>• {aiInsights.isFallback ? "Heuristic Engine" : "Gemini AI"}</span>
                                          </div>
                                        </div>

                                        {/* Scrum Coordinator Status */}
                                        <div className="space-y-1.5 pb-2.5 border-b border-[#e4e4e7]">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#09090b]">🕵️ Scrum Coordinator</span>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${scrum.status === "Optimal Alignment" ? "bg-emerald-100 text-emerald-700" : scrum.status === "Critical Blockage" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                              {scrum.status}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-[#52525b] leading-normal">
                                            {scrum.recommendation}
                                          </p>
                                          {scrum.pairSuggestions && scrum.pairSuggestions.length > 0 && (
                                            <div className="space-y-1 mt-1">
                                              <span className="text-[9px] font-semibold uppercase tracking-wider text-indigo-600">Pair Suggestions:</span>
                                              {scrum.pairSuggestions.map((p: any, idx: number) => (
                                                <div key={idx} className="text-[10px] bg-indigo-50 rounded p-1.5 border border-indigo-100">
                                                  <span className="font-semibold">{p.stuckUser}</span> ↔ <span className="font-semibold">{p.suggestedPeer}</span>
                                                  <span className="text-indigo-600 block mt-0.5">{p.reason}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>

                                        {/* Member Insights Grid */}
                                        {memberInsights.length > 0 && (
                                          <div className="space-y-1.5 pb-2.5 border-b border-[#e4e4e7]">
                                            <span className="text-[10px] font-semibold text-[#09090b] uppercase tracking-wider block">
                                              👥 Individual Member Analysis
                                            </span>
                                            <div className="space-y-1.5">
                                              {memberInsights.map((mi: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-[#fafafa] rounded border border-[#e4e4e7]">
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                      <span className="text-[11px] font-semibold text-[#09090b] truncate">{mi.name}</span>
                                                      <span className={`text-[8px] px-1 py-0.5 rounded border font-semibold ${moodColors[mi.moodIndicator] || moodColors["offline"]}`}>
                                                        {moodLabels[mi.moodIndicator] || "⭘ Offline"}
                                                      </span>
                                                    </div>
                                                    <span className="text-[10px] text-[#71717a] block truncate">{mi.currentFocus}</span>
                                                    <span className="text-[9px] text-[#a1a1aa] italic block mt-0.5">{mi.suggestion}</span>
                                                  </div>
                                                  <div className="text-right shrink-0">
                                                    {mi.productivityScore >= 0 && (
                                                      <>
                                                        <span className={`text-xs font-bold block ${mi.productivityScore >= 60 ? "text-emerald-600" : mi.productivityScore >= 30 ? "text-amber-600" : "text-zinc-400"}`}>
                                                          {mi.productivityScore}%
                                                        </span>
                                                        <span className="text-[9px] text-[#a1a1aa] block">{mi.focusDuration}</span>
                                                      </>
                                                    )}
                                                    {mi.productivityScore < 0 && (
                                                      <span className="text-[9px] text-[#a1a1aa] italic">Private</span>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Top Performer */}
                                        {topPerformer && topPerformer.name !== "None" && (
                                          <div className="p-3 bg-amber-50/80 rounded-md border border-amber-200 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                                                🏆 Top Performer
                                              </span>
                                              <span className="text-[9px] bg-amber-200/60 text-amber-900 px-1.5 py-0.5 rounded font-semibold">
                                                Score: {topPerformer.score}%
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                              <span className="font-semibold text-[#09090b]">{topPerformer.name}</span>
                                              <span className="text-[#71717a] font-mono text-[10px]">Focus: {topPerformer.focusTime}</span>
                                            </div>
                                            {topPerformer.apps && topPerformer.apps.length > 0 && (
                                              <div className="text-[10px] text-[#52525b]">
                                                <span className="font-semibold text-[#09090b]">Apps: </span>
                                                {topPerformer.apps.join(" • ")}
                                              </div>
                                            )}
                                            <p className="text-[10px] italic text-amber-900 border-t border-amber-200/60 pt-1">
                                              {topPerformer.reason}
                                            </p>
                                          </div>
                                        )}

                                        {/* Needs Attention */}
                                        {needsAttention && needsAttention.name !== "None" && (
                                          <div className="p-3 bg-rose-50/80 rounded-md border border-rose-200 space-y-1">
                                            <span className="text-[10px] font-semibold text-rose-800 uppercase tracking-wider block">
                                              ⚠️ Needs Attention
                                            </span>
                                            <div className="flex items-center justify-between text-xs">
                                              <span className="font-semibold text-[#09090b]">{needsAttention.name}</span>
                                              <span className="text-rose-700 font-mono text-[10px]">{needsAttention.idleTime}</span>
                                            </div>
                                            <p className="text-[10px] text-rose-900 leading-normal">
                                              {needsAttention.reason}
                                            </p>
                                          </div>
                                        )}

                                        {/* Welfare Coach */}
                                        <div className="p-2.5 bg-sky-50/60 rounded-md border border-sky-200 space-y-1">
                                          <span className="text-[10px] font-semibold text-sky-800 uppercase tracking-wider block">
                                            🩺 Welfare & Productivity Coach
                                          </span>
                                          <p className="text-[10px] text-sky-900 leading-normal">
                                            {welfare.ergonomicNudge}
                                          </p>
                                          {welfare.targetUsers && welfare.targetUsers.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {welfare.targetUsers.map((u: string, i: number) => (
                                                <span key={i} className="text-[9px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-medium">{u}</span>
                                              ))}
                                            </div>
                                          )}
                                        </div>

                                        {/* Focus Patterns */}
                                        <div className="space-y-1.5 pb-2.5 border-b border-[#e4e4e7]">
                                          <span className="text-[10px] font-semibold text-[#09090b] uppercase tracking-wider block">
                                            📊 Focus Patterns
                                          </span>
                                          <div className="grid grid-cols-2 gap-1.5">
                                            <div className="text-[10px] bg-[#fafafa] rounded p-1.5 border border-[#e4e4e7]">
                                              <span className="text-[#71717a] block">Deep Work Streak</span>
                                              <span className="font-semibold text-[#09090b]">{focusPatterns.deepWorkStreak}m</span>
                                            </div>
                                            <div className="text-[10px] bg-[#fafafa] rounded p-1.5 border border-[#e4e4e7]">
                                              <span className="text-[#71717a] block">Context Switches</span>
                                              <span className="font-semibold text-[#09090b]">{focusPatterns.contextSwitchCount}</span>
                                            </div>
                                            <div className="text-[10px] bg-[#fafafa] rounded p-1.5 border border-[#e4e4e7]">
                                              <span className="text-[#71717a] block">Peak Window</span>
                                              <span className="font-semibold text-[#09090b]">{focusPatterns.peakProductivityWindow}</span>
                                            </div>
                                            <div className="text-[10px] bg-[#fafafa] rounded p-1.5 border border-[#e4e4e7]">
                                              <span className="text-[#71717a] block">Avg Session</span>
                                              <span className="font-semibold text-[#09090b]">{focusPatterns.averageSessionLength}</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Recommendations */}
                                        {recommendations && recommendations.length > 0 && (
                                          <div className="space-y-1">
                                            <span className="text-[10px] font-semibold text-[#09090b] uppercase tracking-wider block">
                                              🤖 AI Recommendations
                                            </span>
                                            <ul className="space-y-1 pl-1">
                                              {recommendations.map((rec: string, idx: number) => (
                                                <li key={idx} className="flex items-start text-[11px] text-[#09090b]">
                                                  <span className="text-blue-600 mr-1.5">•</span>
                                                  <span>{rec}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}

                                        {/* Prediction */}
                                        {prediction && (
                                          <div className="space-y-1 pt-2 border-t border-[#e4e4e7]">
                                            <div className="flex justify-between items-center text-xs">
                                              <span className="text-[#09090b] font-semibold uppercase tracking-wider text-[10px]">
                                                🔮 Daily Goal Prediction
                                              </span>
                                              <span className="text-[#09090b] font-bold">{prediction.completionPercentage}%</span>
                                            </div>
                                            <div className="w-full bg-[#f4f4f5] rounded-full h-1.5 overflow-hidden border border-[#e4e4e7]">
                                              <div 
                                                className="bg-indigo-600 h-full rounded-full transition-all duration-700" 
                                                style={{ width: `${prediction.completionPercentage}%` }}
                                              />
                                            </div>
                                            <p className="text-[10px] text-[#71717a] italic">
                                              {prediction.description}
                                            </p>
                                          </div>
                                        )}

                                        {/* Summary Footer */}
                                        <div className="pt-2 border-t border-[#e4e4e7]">
                                          <p className="text-[11px] text-[#52525b] italic font-sans leading-normal">
                                            {summary}
                                          </p>
                                          <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[8px] font-mono text-[#a1a1aa]">
                                              {aiInsights.isFallback ? "⚙ Heuristic Engine" : "✦ Gemini AI"} • {new Date(aiInsights.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })() : (
                                  <p className="text-xs text-[#71717a] italic">No active scrum alignments logged. Click reload to generate.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Unified Sync & Room Hub */}
                    <div className="space-y-6">
                      <div className="studio-card p-5 space-y-5 flex flex-col justify-between">
                        {/* Equally Placed Tab Switcher Header */}
                        <div className="grid grid-cols-2 gap-2 border-b border-[#e4e4e7] pb-3">
                          <button
                            onClick={() => setHubTab("timeline")}
                            className={`w-full py-2 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer text-center ${
                              hubTab === "timeline"
                                ? "text-[#09090b] border-[#09090b] bg-[#f4f4f5]"
                                : "text-[#71717a] border-transparent hover:text-[#09090b] hover:bg-stone-50"
                            } rounded-t-lg`}
                          >
                            Timeline
                          </button>
                          <button
                            onClick={() => setHubTab("rooms")}
                            className={`w-full py-2 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer text-center ${
                              hubTab === "rooms"
                                ? "text-[#09090b] border-[#09090b] bg-[#f4f4f5]"
                                : "text-[#71717a] border-transparent hover:text-[#09090b] hover:bg-stone-50"
                            } rounded-t-lg`}
                          >
                            Rooms & Sync
                          </button>
                        </div>

                        {hubTab === "timeline" && (
                          <div className="space-y-5">
                            {/* Today's Work Breakdown Card (Inlined) */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] block">Today's Work Breakdown</span>
                                <span className="text-[10px] font-mono text-[#71717a]">Distribution</span>
                              </div>

                              <div className="space-y-2.5">
                                {(() => {
                                  const todayBreakdown = getTodayWorkBreakdown();
                                  const maxSeconds = todayBreakdown.length > 0 ? Math.max(...todayBreakdown.map(x => x.seconds)) : 1;

                                  if (todayBreakdown.length === 0) {
                                    return (
                                      <div className="text-[#71717a] text-xs font-mono py-2 text-center">
                                        No activity tracked today yet.
                                      </div>
                                    );
                                  }

                                  return todayBreakdown.map((item, idx) => {
                                    const percent = Math.min(100, Math.round((item.seconds / maxSeconds) * 100));
                                    return (
                                      <div key={idx} className="space-y-1">
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="font-semibold text-[#09090b] truncate flex items-center space-x-2">
                                            <span className={`h-2 w-2 rounded-full ${getAppColor(item.app)} shrink-0`}></span>
                                            <span>{item.app}</span>
                                          </span>
                                          <span className="font-mono text-[10px] text-[#71717a] shrink-0">{item.hoursText}</span>
                                        </div>
                                        <div className="h-1.5 bg-[#f4f4f5] rounded-full overflow-hidden border border-[#e4e4e7]">
                                          <div
                                            className={`h-full ${getAppColor(item.app)} rounded-full transition-all duration-700`}
                                            style={{ width: `${percent}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </div>

                            <hr className="border-[#e4e4e7]" />

                            {/* Daily Activity Feed */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between pb-1">
                                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] flex items-center">
                                  <Target className="h-3.5 w-3.5 mr-1.5 text-[#71717a]" />
                                  Recent Activity Logs
                                </h4>
                                {myActivity && (
                                  <div className="flex items-center space-x-2 bg-[#f4f4f5] border border-[#e4e4e7] px-2.5 py-1 rounded-full shrink-0">
                                    <div className="flex items-center text-[10px] font-mono font-bold text-[#09090b]">
                                      <Clock className="h-3 w-3 text-[#71717a] mr-1.5 shrink-0 animate-pulse" />
                                      <span>{parsedDurationText(myActivity.durationSeconds || 0)}</span>
                                    </div>
                                    <span className="h-3 w-[1px] bg-[#e4e4e7]"></span>
                                    <button
                                      onClick={() => updateMyActiveTracker(undefined, undefined, !myActivity.isPaused)}
                                      className="text-[#71717a] hover:text-[#09090b] transition-all cursor-pointer bg-transparent border-0 p-0 flex items-center justify-center"
                                      title={myActivity.isPaused ? "Resume focus tracking session" : "Temporarily pause activity tracker"}
                                    >
                                      {myActivity.isPaused ? (
                                        <Play className="h-2.5 w-2.5 text-emerald-600 fill-emerald-600/20" />
                                      ) : (
                                        <Pause className="h-2.5 w-2.5 text-amber-600 fill-amber-600/20" />
                                      )}
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const res = await apiFetch("/api/my-activity", {
                                          method: "POST",
                                          body: JSON.stringify({ resetTimer: true })
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                          setMyActivity(data.activity);
                                          triggerToast("Focus session duration timer reset successfully");
                                          fetchProfile();
                                        }
                                      }}
                                      className="text-[#71717a] hover:text-[#09090b] transition-all cursor-pointer bg-transparent border-0 p-0 flex items-center justify-center"
                                      title="Restart Timer"
                                    >
                                      <RefreshCw className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                                {(() => {
                                  const grouped = getGroupedEvents();

                                  if (grouped.length === 0) {
                                    return (
                                      <p className="text-[#71717a] text-xs italic text-center py-8 font-mono">
                                        No activities logged yet.
                                      </p>
                                    );
                                  }

                                  return grouped.map(([groupLabel, items]) => (
                                    <div key={groupLabel} className="space-y-2">
                                      {/* Group Label */}
                                      <h4 className="text-[10px] font-semibold tracking-wider text-[#71717a] uppercase flex items-center">
                                        <span className="bg-[#f4f4f5] border border-[#e4e4e7] px-2 py-0.5 rounded text-[9px] font-semibold text-[#09090b]">
                                          {groupLabel}
                                        </span>
                                      </h4>

                                      {/* Items list with vertical connector */}
                                      <div className="relative pl-5 border-l border-[#e4e4e7] ml-2 space-y-3">
                                        {items.map((item, idx) => {
                                          return (
                                            <div key={idx} className="relative">
                                              {/* Timeline dot */}
                                              <div className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-emerald-500 border border-white shadow-sm" />
                                              <div className="flex flex-col space-y-0.5">
                                                <div className="flex items-start justify-between">
                                                  {renderTimelineItemText(item)}
                                                  <span className="font-mono text-[10px] font-semibold text-[#52525b] shrink-0 ml-2 mt-0.5">{item.time}</span>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          </div>
                        )}

                        {hubTab === "rooms" && (
                          <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                            {groups.length === 0 ? (
                              <p className="text-[#71717a] text-xs italic text-center py-8 font-mono">
                                No workspace rooms joined.
                              </p>
                            ) : (
                              groups.map((group) => {
                                const isSyncing = user?.broadcastGroups
                                  ? user.broadcastGroups.split(",").map(g => g.trim()).includes(group.name)
                                  : false;
                                const occupants = roomsOccupants[group.name] || [];
                                const lastMessage = roomsLastMessage[group.name];

                                return (
                                  <div
                                    key={group.id}
                                    className="p-3.5 rounded-lg bg-[#f4f4f5] border border-[#e4e4e7] space-y-3"
                                  >
                                    {/* Room Header with Toggle Sync */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex flex-col min-w-0">
                                        <div className="flex items-center space-x-1.5">
                                          <span className="text-[#71717a] font-mono">#</span>
                                          <span className="text-xs font-bold text-[#09090b] truncate">{group.name}</span>
                                        </div>
                                        <span className="text-[10px] text-[#71717a] truncate mt-0.5">{group.description}</span>
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        <span className={`text-[9px] font-semibold tracking-wider uppercase ${isSyncing ? "text-emerald-600" : "text-[#71717a]"}`}>
                                          {isSyncing ? "Syncing" : "Muted"}
                                        </span>
                                        <button
                                          onClick={() => toggleRoomSync(group.name, isSyncing)}
                                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-[#e4e4e7] transition-colors duration-200 ease-in-out focus:outline-none ${isSyncing ? "bg-emerald-500" : "bg-zinc-300"
                                            }`}
                                          title={isSyncing ? "Turn off telemetry syncing to this room" : "Turn on telemetry syncing to this room"}
                                        >
                                          <span
                                            aria-hidden="true"
                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isSyncing ? "translate-x-4" : "translate-x-0"
                                              }`}
                                          />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Room Occupants Status */}
                                    <div className="space-y-2 border-t border-b border-[#e4e4e7] py-2.5">
                                      <span className="text-[9px] font-semibold text-[#71717a] uppercase tracking-wider block">Room Members Activity</span>
                                      {occupants.length === 0 ? (
                                        <p className="text-[10px] text-[#71717a] italic">No other occupants in room</p>
                                      ) : (
                                        <div className="space-y-2">
                                          {occupants.map((occ) => {
                                            const isOnline = occ.status !== "offline";
                                            const activityApp = occ.currentActivity?.app || "Offline";
                                            const activityProject = occ.currentActivity?.project || "None";
                                            const duration = occ.currentActivity?.durationText || "";

                                            return (
                                              <div key={occ.id} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center space-x-2 min-w-0">
                                                  <div className="relative">
                                                    <img
                                                      src={occ.avatarUrl}
                                                      alt={occ.name}
                                                      className="h-5 w-5 rounded-full object-cover border border-[#e4e4e7]"
                                                    />
                                                    <span className={`absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border border-white ${isOnline ? "bg-emerald-500" : "bg-zinc-400"
                                                      }`} />
                                                  </div>
                                                  <span className="font-semibold text-[#09090b] truncate">{occ.name}</span>
                                                </div>

                                                <div className="flex items-center space-x-1.5 shrink-0 text-[#71717a]">
                                                  {isOnline ? (
                                                    <>
                                                      <span className="bg-white text-[#09090b] px-1.5 py-0.5 rounded text-[9px] font-semibold border border-[#e4e4e7]">
                                                        {activityApp}
                                                      </span>
                                                      {activityProject !== "None" && (
                                                        <span className="text-[9px] text-[#71717a] max-w-[80px] truncate" title={activityProject}>
                                                          ({activityProject})
                                                        </span>
                                                      )}
                                                      <span className="text-[9px] text-[#71717a]">{duration}</span>
                                                    </>
                                                  ) : (
                                                    <span className="text-[9px] text-[#71717a]">offline</span>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>

                                    {/* Room Chat Summary */}
                                    <div className="space-y-1">
                                      <span className="text-[9px] font-semibold text-[#71717a] uppercase tracking-wider block">Latest Message</span>
                                      {lastMessage ? (
                                        <div className="bg-white rounded-md p-2.5 border border-[#e4e4e7] flex items-start space-x-2">
                                          <img
                                            src={lastMessage.avatarUrl}
                                            alt={lastMessage.userName}
                                            className="h-4.5 w-4.5 rounded-full object-cover shrink-0 mt-0.5 border border-[#e4e4e7]"
                                          />
                                          <div className="min-w-0 flex-1 text-xs">
                                            <div className="flex justify-between items-center">
                                              <span className="font-semibold text-[#09090b]">{lastMessage.userName}</span>
                                              <span className="text-[8px] font-mono text-[#71717a]">
                                                {new Date(lastMessage.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                              </span>
                                            </div>
                                            <p className="text-[#52525b] truncate mt-0.5">{lastMessage.message}</p>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-[10px] text-[#71717a] italic">No recent messages</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "analytics" && (
                <div className="analytics-container w-full h-full p-0 m-0 bg-[#f8fafc]">
                  <AnalyticsDashboard />
                </div>
              )}

              {/* GOALS TAB VIEW */}
              {activeTab === "goals" && (
                <div className="goals-container w-full h-full p-0 m-0 relative -mx-4 sm:-mx-6 -my-6 bg-[#f8fafc]">
                  <AnalyticsDashboard />
                </div>
              )}

              {/* 🎯 MY FOCUS TAB VIEWPORT */}
              {activeTab === "focus" && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-[#09090b]">My Focus Cockpit</h2>
                    <p className="text-xs text-[#71717a]">
                      Run Pomodoro cycles, track distraction levels, and monitor your focus streak.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Pomodoro Timer circular card */}
                    <div className="lg:col-span-2 studio-card p-6 flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
                      <div className="text-center space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] block">
                          {pomodoroMode === "focus" ? "Deep Focus Session" : "Short Break Time"}
                        </span>
                        <h3 className="text-sm font-semibold text-[#09090b]">
                          {myActivity?.project ? `Active Task: ${myActivity.project}` : "No Active Task"}
                        </h3>
                      </div>

                      {/* Visual Circular Timer */}
                      <div className="relative w-64 h-64 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="128" cy="128" r="90" fill="none" stroke="#e4e4e7" strokeWidth="6" />
                          <circle
                            cx="128"
                            cy="128"
                            r="90"
                            fill="none"
                            stroke={pomodoroMode === "focus" ? "#10b981" : "#2563eb"}
                            strokeWidth="8"
                            strokeDasharray="565.48"
                            strokeDashoffset={(1 - ((pomodoroMinutesLeft * 60 + pomodoroSecondsLeft) / Math.max(1, ((pomodoroMode === "focus" ? customFocusMinutes : customBreakMinutes) * 60)))) * 565.48}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-linear"
                          />
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
                          <div className="text-4xl font-mono font-bold tracking-tight text-[#09090b]">
                            {String(pomodoroMinutesLeft).padStart(2, '0')}:{String(pomodoroSecondsLeft).padStart(2, '0')}
                          </div>
                          <span className={pomodoroMode === "focus" ? "badge badge-emerald" : "badge badge-indigo"}>
                            {pomodoroMode === "focus" ? `Focusing (${customFocusMinutes}m)` : `Resting (${customBreakMinutes}m)`}
                          </span>
                        </div>
                      </div>

                      {/* Controls Button Group & Quick Time Adjusters */}
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            const newMins = Math.max(1, pomodoroMinutesLeft - 5);
                            setPomodoroMinutesLeft(newMins);
                            if (pomodoroMode === "focus") setCustomFocusMinutes(newMins);
                            else setCustomBreakMinutes(newMins);
                            triggerToast(`Timer adjusted to ${newMins}m`);
                          }}
                          className="btn-secondary px-3 py-2 text-xs font-mono font-bold shadow-xs cursor-pointer"
                          title="Reduce 5 Minutes"
                        >
                          -5m
                        </button>

                        <button
                          onClick={() => setPomodoroActive(!pomodoroActive)}
                          className={pomodoroActive ? "btn-secondary px-6 py-2.5 font-bold cursor-pointer" : "btn-primary px-8 py-2.5 font-bold cursor-pointer"}
                        >
                          {pomodoroActive ? "Pause Session" : "Start Focus"}
                        </button>

                        <button
                          onClick={() => {
                            setPomodoroActive(false);
                            setPomodoroMinutesLeft(pomodoroMode === "focus" ? customFocusMinutes : customBreakMinutes);
                            setPomodoroSecondsLeft(0);
                            triggerToast("Pomodoro timer reset successfully");
                          }}
                          className="btn-secondary p-2.5 cursor-pointer"
                          title="Reset Timer"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => {
                            setPomodoroActive(false);
                            setPomodoroSecondsLeft(0);
                            if (pomodoroMode === "focus") {
                              setPomodoroMode("break");
                              setPomodoroMinutesLeft(customBreakMinutes);
                              triggerToast("Skipped focus. Time for a short break.");
                            } else {
                              setPomodoroMode("focus");
                              setPomodoroMinutesLeft(customFocusMinutes);
                              triggerToast("Skipped break. Ready to focus?");
                            }
                          }}
                          className="btn-secondary px-4 py-2.5 text-xs font-semibold cursor-pointer"
                        >
                          Skip
                        </button>

                        <button
                          onClick={() => {
                            const newMins = pomodoroMinutesLeft + 5;
                            setPomodoroMinutesLeft(newMins);
                            if (pomodoroMode === "focus") setCustomFocusMinutes(newMins);
                            else setCustomBreakMinutes(newMins);
                            triggerToast(`Timer adjusted to ${newMins}m`);
                          }}
                          className="btn-secondary px-3 py-2 text-xs font-mono font-bold shadow-xs cursor-pointer"
                          title="Add 5 Minutes"
                        >
                          +5m
                        </button>
                      </div>

                      {/* Session Mode Selector & Duration Presets */}
                      <div className="w-full max-w-md bg-[#fafafa] p-4 rounded-2xl border border-[#e4e4e7] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#09090b] uppercase tracking-wider">Session Mode</span>
                          <div className="flex items-center bg-[#f4f4f5] p-1 rounded-lg border border-[#e4e4e7]">
                            <button
                              onClick={() => {
                                setPomodoroActive(false);
                                setPomodoroMode("focus");
                                setPomodoroMinutesLeft(customFocusMinutes);
                                setPomodoroSecondsLeft(0);
                              }}
                              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${pomodoroMode === "focus"
                                  ? "bg-white text-[#09090b] shadow-xs border border-[#e4e4e7]"
                                  : "text-[#71717a] hover:text-[#09090b]"
                                }`}
                            >
                              Focus ({customFocusMinutes}m)
                            </button>
                            <button
                              onClick={() => {
                                setPomodoroActive(false);
                                setPomodoroMode("break");
                                setPomodoroMinutesLeft(customBreakMinutes);
                                setPomodoroSecondsLeft(0);
                              }}
                              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${pomodoroMode === "break"
                                  ? "bg-white text-[#09090b] shadow-xs border border-[#e4e4e7]"
                                  : "text-[#71717a] hover:text-[#09090b]"
                                }`}
                            >
                              Break ({customBreakMinutes}m)
                            </button>
                          </div>
                        </div>

                        {/* Preset Duration Chips */}
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[11px] font-semibold text-[#71717a] block">
                            Quick Duration Presets ({pomodoroMode === "focus" ? "Focus" : "Break"}):
                          </label>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {(pomodoroMode === "focus" ? [15, 25, 35, 45, 60, 90] : [5, 10, 15, 20]).map((mins) => {
                              const isCurrent = (pomodoroMode === "focus" ? customFocusMinutes : customBreakMinutes) === mins;
                              return (
                                <button
                                  key={mins}
                                  onClick={() => {
                                    setPomodoroActive(false);
                                    if (pomodoroMode === "focus") setCustomFocusMinutes(mins);
                                    else setCustomBreakMinutes(mins);
                                    setPomodoroMinutesLeft(mins);
                                    setPomodoroSecondsLeft(0);
                                    triggerToast(`Duration set to ${mins} minutes`);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer border ${isCurrent
                                      ? "bg-[#09090b] text-white border-[#09090b] shadow-xs"
                                      : "bg-white text-[#09090b] border-[#e4e4e7] hover:bg-zinc-100"
                                    }`}
                                >
                                  {mins}m
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Custom Duration Input */}
                        <div className="pt-2 border-t border-[#e4e4e7] flex items-center justify-between gap-2">
                          <label className="text-[11px] font-semibold text-[#71717a] shrink-0">Custom Minutes:</label>
                          <div className="flex items-center gap-1.5 w-full max-w-[200px]">
                            <input
                              type="number"
                              min={1}
                              max={240}
                              value={pomodoroMode === "focus" ? customFocusMinutes : customBreakMinutes}
                              onChange={(e) => {
                                const val = Math.max(1, Math.min(240, Number(e.target.value) || 1));
                                setPomodoroActive(false);
                                if (pomodoroMode === "focus") setCustomFocusMinutes(val);
                                else setCustomBreakMinutes(val);
                                setPomodoroMinutesLeft(val);
                                setPomodoroSecondsLeft(0);
                              }}
                              className="w-full px-3 py-1 bg-white border border-[#e4e4e7] rounded-lg text-xs font-mono text-[#09090b] font-bold shadow-xs focus:outline-none focus:border-[#09090b]"
                            />
                            <span className="text-xs font-mono text-[#71717a] shrink-0">mins</span>
                          </div>
                        </div>
                      </div>

                      {/* Task config sync inside cockpit */}
                      <div className="w-full max-w-md border-t border-[#e4e4e7] pt-5 space-y-2.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] block text-center">Sync Active Task Name</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={projectInput}
                            onChange={(e) => setProjectInput(e.target.value)}
                            className="input-field"
                            placeholder="Type active task name..."
                          />
                          <button
                            onClick={() => updateMyActiveTracker(undefined, projectInput, undefined)}
                            className="btn-primary shrink-0"
                          >
                            Sync Task
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Focus Stats */}
                    <div className="space-y-6">
                      {/* Streak Card */}
                      <div className="studio-card studio-card-amber p-5 space-y-4 relative overflow-hidden">
                        <div className="flex items-center space-x-2 text-amber-700">
                          <Flame className="h-5 w-5 fill-amber-500" />
                          <h4 className="text-xs font-semibold uppercase tracking-wider">Focus Streak</h4>
                        </div>

                        <div className="space-y-1">
                          <div className="text-3xl font-bold text-[#09090b]">
                            {user?.focusStreak || 0} Day Streak
                          </div>
                          <p className="text-xs text-[#52525b] leading-normal">
                            Maintain your streak by meeting your daily goal of {user?.productivityGoal || 6} hours.
                          </p>
                        </div>

                        <div className="h-2 bg-amber-200/60 rounded-full overflow-hidden border border-amber-300/60">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                            style={{ width: `${Math.min(100, ((user?.focusStreak || 0) / 7) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-mono text-[#71717a] block">// {7 - ((user?.focusStreak || 0) % 7)} days remaining for weekly reward</span>
                      </div>

                      {/* Distraction Card */}
                      <div className="studio-card p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-[#09090b]">
                            <Activity className="h-4 w-4" />
                            <h4 className="text-xs font-semibold uppercase tracking-wider">Distraction Log</h4>
                          </div>
                          <span className={(user?.distractionsCount || 0) === 0 ? "badge badge-emerald" : (user?.distractionsCount || 0) <= 3 ? "badge badge-amber" : "badge badge-rose"}>
                            {(user?.distractionsCount || 0) === 0 ? "Zen State" : (user?.distractionsCount || 0) <= 3 ? "Low Noise" : "High Noise"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-[#f4f4f5] p-3 rounded-md border border-[#e4e4e7] text-center">
                            <span className="text-[10px] font-semibold text-[#71717a] uppercase block">Agent Flags</span>
                            <span className="text-2xl font-bold text-[#09090b] block mt-0.5">{user?.distractionsCount || 0}</span>
                          </div>
                          <div className="bg-[#f4f4f5] p-3 rounded-md border border-[#e4e4e7] text-center">
                            <span className="text-[10px] font-semibold text-[#71717a] uppercase block">Manual Log</span>
                            <span className="text-2xl font-bold text-[#09090b] block mt-0.5">{distractionsManualCount}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            onClick={handleIncrementDistraction}
                            className="btn-secondary flex-1 text-xs"
                          >
                            Log Distraction
                          </button>
                          <button
                            onClick={handleResetDistractions}
                            className="btn-danger text-xs"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3️⃣ ROOMS TAB VIEWPORT */}
              {activeTab === "groups" && (
                <div className="space-y-6">
                  {selectedRoomName === null ? (
                    <>
                      {/* Directory View */}
                      <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-[#09090b] tracking-tight">Rooms Directory</h2>
                        <p className="text-xs text-[#71717a]">
                          Select a room workspace to collaborate, monitor active telemetry, or commission a new channel.
                        </p>
                      </div>

                      {/* 5-Step Room Creation Wizard Launch Card */}
                      <div className="p-6 sm:p-8 rounded-2xl bg-[#09090b] text-white border border-[#27272a] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md relative overflow-hidden">
                        <div className="space-y-2 z-10">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono font-semibold">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            5-STEP ROOM INTELLIGENCE WIZARD
                          </div>
                          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                            Commission a New Intelligence Room
                          </h3>
                          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                            Configure room basics, access permissions, roles, individual & team work expectations, and versioned AI privacy policies in a guided 5-step setup experience.
                          </p>
                        </div>

                        <button
                          onClick={() => setIsRoomWizardOpen(true)}
                          className="px-6 py-3 bg-white hover:bg-zinc-100 text-[#09090b] font-bold text-xs rounded-xl shadow-xs font-mono uppercase tracking-wider transition-all transform hover:scale-102 cursor-pointer shrink-0 flex items-center justify-center gap-2 z-10"
                        >
                          <Plus className="w-4 h-4 text-[#09090b]" />
                          Launch 5-Step Wizard
                        </button>
                      </div>

                      {/* Classroom Portal Card Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                        {groups.map(group => {
                          const groupOnlineCount = user?.activeGroup === group.name
                            ? (friends.filter(f => f.status !== 'offline').length + (user?.status !== 'offline' ? 1 : 0))
                            : Math.max(1, Math.round(group.members.length * 0.6));

                          const isConnected = user?.activeGroup === group.name;

                          return (
                            <div
                              key={group.id}
                              className="studio-card p-6 flex flex-col justify-between space-y-6"
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <h4 className="text-lg font-bold text-[#09090b] tracking-tight">
                                    {group.name}
                                  </h4>
                                  <span className={`text-[10px] font-mono font-semibold tracking-wider uppercase px-3 py-1 rounded-full border ${isConnected
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                      : "bg-zinc-100 text-zinc-600 border-zinc-200"
                                    }`}>
                                    {isConnected ? "Connected" : "Inactive"}
                                  </span>
                                </div>
                                <p className="text-xs text-[#71717a] font-mono leading-relaxed">{group.description}</p>
                              </div>

                              <div className="space-y-4 pt-3 border-t border-[#e4e4e7]">
                                <div className="flex justify-between items-center text-xs font-mono">
                                  <span className="text-[#71717a] font-semibold">Occupants: <strong className="text-[#09090b]">{group.members.length} peers</strong></span>
                                  <span className="flex items-center text-emerald-700 font-semibold">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                                    {groupOnlineCount} Live Online
                                  </span>
                                </div>
                                <button
                                  onClick={() => enterRoomChannel(group.name)}
                                  className="w-full py-2.5 rounded-lg bg-[#09090b] text-white text-xs font-semibold hover:bg-[#27272a] transition-all shadow-xs cursor-pointer"
                                >
                                  Enter Room Workspace
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Public Rooms Directory Search */}
                      <div className="mt-12 space-y-6 pt-8 border-t border-[#e4e4e7]">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-[#09090b] tracking-tight">Discover Public Rooms</h3>
                          <p className="text-xs text-[#71717a]">
                            Search for open guilds and teams to join across the EndoCore workspace.
                          </p>
                        </div>
                        
                        <div className="flex space-x-3">
                          <input
                            type="text"
                            placeholder="Search by room name or description..."
                            value={directoryQuery}
                            onChange={(e) => {
                              setDirectoryQuery(e.target.value);
                              searchDirectory(e.target.value);
                            }}
                            className={`flex-1 rounded-xl px-4 py-3 text-sm font-sans ${formInput} transition-all`}
                          />
                          <button
                            onClick={() => searchDirectory(directoryQuery)}
                            className="px-6 py-3 bg-[#09090b] hover:bg-[#27272a] text-white font-bold text-xs rounded-xl shadow-xs font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center"
                          >
                            {isSearchingDirectory ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                          {directoryGroups.length === 0 && !isSearchingDirectory ? (
                            <div className="col-span-1 md:col-span-2 p-8 text-center text-sm font-mono text-[#71717a] bg-zinc-50 rounded-xl border border-dashed border-[#e4e4e7]">
                              No public rooms available to join right now.
                            </div>
                          ) : (
                            directoryGroups.map(group => (
                              <div
                                key={group.id}
                                className="p-6 bg-white border border-[#e4e4e7] rounded-2xl flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
                              >
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between">
                                    <h4 className="text-md font-bold text-[#09090b] tracking-tight">{group.name}</h4>
                                    <span className="text-[10px] font-mono font-semibold tracking-wider uppercase px-2 py-1 rounded bg-zinc-100 text-zinc-600">
                                      {group.accessType === "REQUIRE_APPROVAL" ? "Approval Req." : "Public"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#71717a] font-mono leading-relaxed line-clamp-2">{group.description}</p>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                                  <span className="text-xs font-mono text-zinc-500">{group.memberCount} members</span>
                                  <button
                                    onClick={() => joinRoom(group.id)}
                                    className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 font-bold text-[10px] rounded-lg shadow-sm font-mono uppercase tracking-wider transition-all cursor-pointer"
                                  >
                                    Join Room
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Inside Room View */}
                      <div className="space-y-6">
                        <button
                          onClick={() => setSelectedRoomName(null)}
                          className="flex items-center space-x-2 text-xs font-mono text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          <span>Back to Rooms Directory</span>
                        </button>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h2 className="text-4xl font-serif italic tracking-tight font-medium">🏢 {selectedRoomName}</h2>
                            <p className={`text-xs ${textSub}`}>
                              {groups.find(g => g.name === selectedRoomName)?.description || "Collaborating workspace and focus channel."}
                            </p>
                          </div>

                          <div className="flex items-center space-x-4 bg-[#f5f4ef]/50 dark:bg-stone-900/40 px-4 py-2.5 rounded-xl border dark:border-neutral-850 border-stone-250/60 text-xs font-mono text-stone-400">
                            <span>Occupants: {groups.find(g => g.name === selectedRoomName)?.members.length || 0}</span>
                            <span className="h-3 w-px bg-zinc-700"></span>
                            <span className="flex items-center">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                              {friends.filter(f => f.status !== 'offline').length + (user?.status !== 'offline' ? 1 : 0)} Live
                            </span>
                          </div>
                        </div>

                        {/* Room Workspace Tabs */}
                        <div className="flex border-b dark:border-neutral-850 border-stone-200/50 space-x-6 text-[10px] font-mono mb-6 pb-2 overflow-x-auto select-none">
                          {["overview", "members", "live", "leaderboard", "ai-summary", "chat"].map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setRoomTab(tab as any)}
                              className={`pb-2 transition-all uppercase tracking-widest cursor-pointer ${roomTab === tab
                                  ? "border-b-2 border-stone-550 dark:border-stone-300 text-black dark:text-white font-semibold"
                                  : "text-stone-500 hover:text-stone-300"
                                }`}
                            >
                              {tab.replace("-", " ")}
                            </button>
                          ))}
                        </div>

                        {/* Room Tab Panels */}
                        <div className="space-y-6">

                          {/* OVERVIEW PANEL */}
                          {roomTab === "overview" && (
                            <div className="space-y-6">
                              <OwnerRoomDashboard
                                roomName={selectedRoomName}
                                roomDetails={groups.find(g => g.name === selectedRoomName)}
                                occupants={friends}
                                userRole="OWNER"
                                roomStatus={(groups.find(g => g.name === selectedRoomName) as any)?.status || "active"}
                                onRefreshAi={() => fetchAiBriefing(true)}
                                onNudgeMember={(name, id) => triggerPeerNudge(name, id)}
                                onToggleRoomStatus={(newStatus) => handleToggleRoomStatus(newStatus)}
                              />

                              {/* Quick AI co-working briefing */}
                              <div className={`p-6 md:p-8 rounded-3xl ${bgCard} border ${borderRule} relative overflow-hidden`}>
                                <div className="flex items-center justify-between mb-4.5">
                                  <div className="flex items-center space-x-3">
                                    <Sparkles className="h-5 w-5 text-zinc-500 dark:text-[#a09070]" />
                                    <h3 className="text-sm font-semibold font-mono tracking-widest uppercase text-stone-300">
                                      AI CO-WORKING BRIEFING
                                    </h3>
                                  </div>
                                  <button
                                    onClick={() => fetchAiBriefing(true)}
                                    disabled={loadingInsights}
                                    className="bg-transparent hover:bg-neutral-500/5 text-stone-500 hover:text-stone-300 border dark:border-[#222227] border-stone-250 p-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    <RefreshCw className={`h-4.5 w-4.5 ${loadingInsights ? "animate-spin" : ""}`} />
                                  </button>
                                </div>

                                {loadingInsights ? (
                                  <div className="py-2">
                                    <SkeletonLoader lines={3} />
                                    <span className="text-[10px] font-mono text-stone-500 mt-4 block">Retrieving intelligence briefs...</span>
                                  </div>
                                ) : (
                                  <div className="text-xs space-y-4 leading-relaxed font-sans mt-2">
                                    {aiInsights && aiInsights.text ? (
                                      aiInsights.text.split("\n").map((line: string, idx: number) => {
                                        if (line.startsWith("###") || line.startsWith("##") || line.startsWith("**")) {
                                          return (
                                            <h4 key={idx} className="text-zinc-800 dark:text-[#c4b69d] font-serif italic text-sm font-bold mt-4 mb-2">
                                              {line.replace(/[\*#]/g, "").trim()}
                                            </h4>
                                          );
                                        }
                                        if (!line.trim()) return null;
                                        return (
                                          <p key={idx} className={`pl-1 leading-relaxed ${textSub}`}>
                                            {line.startsWith("-") || line.startsWith("*") || line.startsWith("•") ? (
                                              <span className="flex items-start">
                                                <span className="text-neutral-400 dark:text-[#a5957b] mr-2">•</span>
                                                <span>{line.replace(/^[-*•]\s*/, "").trim()}</span>
                                              </span>
                                            ) : line}
                                          </p>
                                        );
                                      })
                                    ) : (
                                      <p className="text-stone-500 text-xs italic">No co-working briefing stored. Click reload icon above to fetch.</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* MEMBERS PANEL */}
                          {roomTab === "members" && (
                            <div className="space-y-6">
                              <div>
                                <h3 className="text-xl font-serif italic font-bold tracking-tight">Active Room Members</h3>
                                <p className={`text-xs mt-1 ${textSub}`}>
                                  Co-workers synced programmatically in real-time.
                                </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Array.isArray(friends) && friends.map((friend) => {
                                  const styleMeta = getStatusNodeMeta(friend.status as any);

                                  return (
                                    <div
                                      key={friend.id}
                                      className={`p-6 rounded-2xl border ${bgCard} ${borderRule} transition-all duration-200 group relative block space-y-5`}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3.5">
                                          <div className="relative">
                                            <img
                                              src={friend.avatarUrl}
                                              alt={friend.name}
                                              className="h-10 w-10 rounded-full object-cover border dark:border-zinc-800 border-zinc-200"
                                            />
                                            <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 ${themeMode === 'dark' ? 'border-[#121215]' : 'border-white'
                                              } ${styleMeta.color}`}></span>
                                          </div>
                                          <div className="min-w-0">
                                            <h4 className={`text-sm font-semibold truncate transition-colors ${themeMode === 'dark' ? 'group-hover:text-stone-300' : 'group-hover:text-black'
                                              }`}>
                                              {friend.name}
                                            </h4>
                                            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block leading-none mt-1">
                                              {friend.role}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="text-right">
                                          <span className={`inline-block text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${styleMeta.border} ${styleMeta.text}`}>
                                            {styleMeta.label}
                                          </span>
                                          <span className="text-[9px] font-mono text-stone-500 block mt-1.5 leading-none">
                                            {friend.todayFocusTime} Today
                                          </span>
                                        </div>
                                      </div>

                                      {/* Focus active state banner block */}
                                      <div className={`p-3.5 rounded-xl border dark:border-[#1e1e23] border-stone-200/50 flex items-center justify-between ${bgInternal}`}>
                                        <div className="flex items-center space-x-3">
                                          <div className="h-8 w-8 rounded flex items-center justify-center border dark:border-neutral-800/60 border-neutral-200 select-none text-xs text-stone-400">
                                            {friend.currentActivity.app === "VS Code" ? "💻" :
                                              friend.currentActivity.app === "Chrome" ? "🌐" :
                                                friend.currentActivity.app === "Figma" ? "🎨" :
                                                  friend.currentActivity.app === "Terminal" ? "👾" :
                                                    friend.currentActivity.app === "Spotify" ? "🎵" : "💬"}
                                          </div>
                                          <div className="min-w-0">
                                            <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest block leading-none">Running App</span>
                                            <span className="text-xs font-semibold text-stone-300 dark:text-white truncate block mt-0.5 leading-none">
                                              {friend.currentActivity.app}
                                            </span>
                                            <p className="text-[10px] font-mono text-zinc-500 truncate max-w-[200px] mt-1 leading-none">
                                              {friend.currentActivity.project}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="text-right pl-2 shrink-0">
                                          <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest block leading-none">Duration</span>
                                          <span className="text-xs font-bold font-mono text-stone-300 dark:text-zinc-200 block mt-1 leading-none">
                                            {friend.currentActivity.durationText}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Interactivity tools */}
                                      <div className="flex items-center justify-between pt-1">
                                        <div className="flex-1 mr-4">
                                          <div className="h-1 w-24 bg-stone-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-zinc-400 dark:bg-[#bfb5a3]"
                                              style={{ width: `${friend.focusScore}%` }}
                                            ></div>
                                          </div>
                                          <span className="text-[9px] font-mono text-stone-500 mt-1 block">Score: {friend.focusScore}%</span>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={() => triggerPeerNudge(friend.name, friend.id)}
                                            disabled={nudgedFriendIds[friend.id]}
                                            className={`px-3 py-1.5 border rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer ${nudgedFriendIds[friend.id]
                                                ? "bg-zinc-100 text-[#1a1a1f] dark:bg-stone-300 dark:text-black"
                                                : "bg-transparent text-stone-500 hover:text-stone-300 dark:border-neutral-800 border-stone-250 hover:border-neutral-500"
                                              }`}
                                          >
                                            {nudgedFriendIds[friend.id] ? "Waved!" : "Nudge"}
                                          </button>
                                          <button
                                            onClick={() => {
                                              setSelectedFriendId(friend.id);
                                              window.scrollTo({ top: 0, behavior: "smooth" });
                                            }}
                                            className="px-3 py-1.5 bg-transparent dark:text-stone-300 text-stone-700 hover:text-stone-900 dark:hover:text-white border dark:border-[#222227] border-stone-250 rounded-xl text-[10px] font-mono uppercase tracking-wider cursor-pointer"
                                          >
                                            View Trace
                                          </button>
                                        </div>
                                      </div>

                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* LIVE TELEMETRY ACTIVITY PANEL */}
                          {roomTab === "live" && (
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <h3 className="text-xl font-serif italic font-bold">Live Telemetry Event Log</h3>
                                <p className={`text-xs ${textSub}`}>Real-time focus and system app state transitions streamed from room workstations.</p>
                              </div>

                              <div className="bg-[#09090b] rounded-2xl shadow-lg border border-[#27272a] p-0 max-h-96 overflow-hidden">
                                {/* macOS-style window header */}
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
                                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                                  <span className="ml-3 text-[10px] text-white/30 font-mono tracking-widest">// rtime-pipeline · live stream</span>
                                </div>
                                <div className="p-5 font-mono text-xs space-y-2.5 max-h-80 overflow-y-auto">
                                  <AnimatePresence initial={false}>
                                    {friends.flatMap(f => f.timeline.map(t => ({ ...t, name: f.name }))).length > 0 ? (
                                      friends.flatMap(f => f.timeline.map(t => ({ ...t, name: f.name })))
                                        .sort((a, b) => b.time.localeCompare(a.time))
                                        .map((evt, idx) => (
                                          <motion.div 
                                            key={`${evt.name}-${evt.time}-${idx}`}
                                            layout
                                            initial={{ opacity: 0, x: -20, backgroundColor: "rgba(16, 185, 129, 0.2)" }}
                                            animate={{ opacity: 1, x: 0, backgroundColor: "rgba(0, 0, 0, 0)" }}
                                            transition={{ duration: 0.4 }}
                                            className="flex justify-between items-center py-1.5 border-b border-white/[0.04]"
                                          >
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="text-white/30">[{evt.time}]</span>
                                              <span className="text-violet-400 font-semibold">{evt.name}</span>
                                              <span className="text-white/40">active:</span>
                                              <span className="text-emerald-400 font-bold">{evt.app}</span>
                                              <span className="text-white/30">— {evt.project}</span>
                                            </div>
                                            <span className="text-white/25 shrink-0 ml-3">{evt.duration}</span>
                                          </motion.div>
                                        ))
                                    ) : (
                                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/30 italic py-4 text-center">No workspace event streams compiled.</motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* LEADERBOARD PANEL */}
                          {roomTab === "leaderboard" && (
                            <div className="space-y-6">
                              <div className="space-y-1">
                                <h3 className="text-xl font-serif italic font-bold">Weekly Focus Leaderboard</h3>
                                <p className={`text-xs ${textSub}`}>Rankings compiled from total logged deep focus hours this week.</p>
                              </div>

                              {fetchingLeaderboard ? (
                                <div className="space-y-4 py-8 text-center text-xs font-mono text-zinc-500">
                                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                                  Compiling rankings...
                                </div>
                              ) : roomLeaderboard.length > 0 ? (
                                <div className="space-y-8">
                                  {/* Podium Top 3 */}
                                  <div className="flex items-end justify-center pt-8 pb-4 max-w-md mx-auto">
                                    {/* 2nd Place */}
                                    {roomLeaderboard[1] && (
                                      <motion.div 
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                                        className="flex flex-col items-center space-y-2 flex-1"
                                      >
                                        <img src={roomLeaderboard[1].avatarUrl} className="h-10 w-10 rounded-full border border-neutral-700 object-cover" />
                                        <span className="text-xs font-semibold truncate max-w-[80px] text-stone-900 dark:text-white">{roomLeaderboard[1].name}</span>
                                        <div className={`w-full h-24 ${themeMode === 'dark' ? 'bg-zinc-800/60' : 'bg-neutral-200'} rounded-t-xl flex flex-col items-center justify-center border-t border-x dark:border-neutral-700`}>
                                          <span className="text-xl font-bold font-serif italic text-stone-400">2nd</span>
                                          <span className="text-[10px] font-mono text-stone-500"><NumberTicker value={roomLeaderboard[1].hours} decimals={1} />h</span>
                                        </div>
                                      </motion.div>
                                    )}

                                    {/* 1st Place */}
                                    {roomLeaderboard[0] && (
                                      <motion.div 
                                        initial={{ opacity: 0, y: 80 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                                        className="flex flex-col items-center space-y-2 flex-1"
                                      >
                                        <div className="relative">
                                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg">👑</span>
                                          <img src={roomLeaderboard[0].avatarUrl} className="h-12 w-12 rounded-full border-2 border-amber-400 object-cover" />
                                        </div>
                                        <span className="text-xs font-semibold truncate max-w-[80px] text-stone-900 dark:text-white">{roomLeaderboard[0].name}</span>
                                        <div className={`w-full h-32 ${themeMode === 'dark' ? 'bg-zinc-850' : 'bg-neutral-350'} rounded-t-xl flex flex-col items-center justify-center border-t border-x dark:border-amber-400/50`}>
                                          <span className="text-2xl font-bold font-serif italic text-amber-500">1st</span>
                                          <span className="text-[10px] font-mono text-stone-500"><NumberTicker value={roomLeaderboard[0].hours} decimals={1} />h</span>
                                        </div>
                                      </motion.div>
                                    )}

                                    {/* 3rd Place */}
                                    {roomLeaderboard[2] && (
                                      <motion.div 
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                                        className="flex flex-col items-center space-y-2 flex-1"
                                      >
                                        <img src={roomLeaderboard[2].avatarUrl} className="h-10 w-10 rounded-full border border-neutral-700 object-cover" />
                                        <span className="text-xs font-semibold truncate max-w-[80px] text-stone-900 dark:text-white">{roomLeaderboard[2].name}</span>
                                        <div className={`w-full h-18 ${themeMode === 'dark' ? 'bg-zinc-800/40' : 'bg-neutral-100'} rounded-t-xl flex flex-col items-center justify-center border-t border-x dark:border-neutral-800`}>
                                          <span className="text-base font-bold font-serif italic text-amber-700">3rd</span>
                                          <span className="text-[10px] font-mono text-stone-500"><NumberTicker value={roomLeaderboard[2].hours} decimals={1} />h</span>
                                        </div>
                                      </motion.div>
                                    )}
                                  </div>

                                  {/* List table */}
                                  <div className={`p-6 rounded-3xl ${bgCard} border ${borderRule} space-y-4`}>
                                    <h4 className="text-xs font-semibold font-mono tracking-widest uppercase text-stone-400">Rankings Overview</h4>
                                    <div className="space-y-3 font-mono text-xs">
                                      {roomLeaderboard.map((peer, idx) => (
                                        <motion.div 
                                          key={idx} 
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: 0.6 + (idx * 0.05), type: "spring", stiffness: 300 }}
                                          className="flex justify-between items-center py-2.5 border-b dark:border-neutral-850 border-stone-200/50"
                                        >
                                          <div className="flex items-center space-x-3">
                                            <span className="text-stone-500">0{idx + 1}.</span>
                                            <img src={peer.avatarUrl} className="h-6 w-6 rounded-full object-cover" />
                                            <span className="font-semibold text-stone-900 dark:text-white leading-none">{peer.name}</span>
                                          </div>
                                          <span className="text-stone-500">hours: <NumberTicker value={peer.hours} decimals={1} />h</span>
                                        </motion.div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-8 text-xs font-mono text-stone-500 italic">
                                  No rankings data compiled for this room.
                                </div>
                              )}
                            </div>
                          )}

                          {/* AI SUMMARY PANEL */}
                          {roomTab === "ai-summary" && (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <h3 className="text-xl font-serif italic font-bold">Gemini Room Summary Report</h3>
                                  <p className={`text-xs ${textSub}`}>Generative AI briefing compiled from room telemetry and activity statistics.</p>
                                </div>
                                <button
                                  onClick={() => fetchAiBriefing(true)}
                                  disabled={loadingInsights}
                                  className="bg-transparent hover:bg-neutral-500/5 text-stone-500 hover:text-stone-300 border dark:border-[#222227] border-stone-250 p-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                >
                                  <RefreshCw className={`h-4.5 w-4.5 ${loadingInsights ? "animate-spin" : ""}`} />
                                </button>
                              </div>

                              <div className={`p-6 md:p-8 rounded-3xl ${bgCard} border ${borderRule} relative overflow-hidden`}>
                                {loadingInsights ? (
                                  <div className="py-2">
                                    <SkeletonLoader lines={3} />
                                    <span className="text-[10px] font-mono text-stone-500 mt-4 block">Retrieving intelligence briefs...</span>
                                  </div>
                                ) : aiInsights && aiInsights.success ? (
                                  <div className="text-xs space-y-5 leading-relaxed font-sans mt-2">
                                    {/* Summary */}
                                    <div className="space-y-2">
                                      <h4 className={`font-serif italic text-sm font-bold ${themeMode === 'dark' ? 'text-[#c4b69d]' : 'text-zinc-800'}`}>Executive Summary</h4>
                                      <p className={`leading-relaxed ${textSub}`}>{aiInsights.summary}</p>
                                    </div>

                                    {/* Room Status */}
                                    {aiInsights.roomSummary && (
                                      <div className="space-y-2">
                                        <h4 className={`font-serif italic text-sm font-bold ${themeMode === 'dark' ? 'text-[#c4b69d]' : 'text-zinc-800'}`}>Room Analysis — {aiInsights.roomSummary.status}</h4>
                                        <div className="flex items-center gap-3">
                                          <div className="flex-1">
                                            <div className={`w-full rounded-full h-2 overflow-hidden ${themeMode === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                                              <div className={`h-full rounded-full transition-all duration-700 ${aiInsights.roomSummary.productivityPercentage >= 60 ? 'bg-emerald-500' : aiInsights.roomSummary.productivityPercentage >= 30 ? 'bg-amber-500' : 'bg-zinc-400'}`} style={{ width: `${aiInsights.roomSummary.productivityPercentage}%` }} />
                                            </div>
                                          </div>
                                          <span className="text-sm font-bold">{aiInsights.roomSummary.productivityPercentage}%</span>
                                        </div>
                                        <p className={textSub}>{aiInsights.roomSummary.description}</p>
                                        <span className={`text-[10px] font-mono ${textSub}`}>{aiInsights.roomSummary.activeCount} / {aiInsights.roomSummary.totalCount} developers active</span>
                                      </div>
                                    )}

                                    {/* Member Insights */}
                                    {aiInsights.memberInsights && aiInsights.memberInsights.length > 0 && (
                                      <div className="space-y-2">
                                        <h4 className={`font-serif italic text-sm font-bold ${themeMode === 'dark' ? 'text-[#c4b69d]' : 'text-zinc-800'}`}>Individual Member Analysis</h4>
                                        <div className="space-y-2">
                                          {aiInsights.memberInsights.map((mi: any, idx: number) => (
                                            <div key={idx} className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${themeMode === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-semibold truncate">{mi.name}</span>
                                                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${
                                                    mi.moodIndicator === 'deep_work' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                    mi.moodIndicator === 'focused' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                    mi.moodIndicator === 'idle' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                    'bg-zinc-100 text-zinc-500 border-zinc-200'
                                                  }`}>
                                                    {mi.moodIndicator === 'deep_work' ? '🧠 Deep Work' : mi.moodIndicator === 'focused' ? '🎯 Focused' : mi.moodIndicator === 'idle' ? '💤 Idle' : '⭘ Offline'}
                                                  </span>
                                                </div>
                                                <span className={`text-[10px] block mt-0.5 ${textSub}`}>{mi.currentFocus}</span>
                                                <span className={`text-[10px] italic block mt-0.5 ${textSub}`}>{mi.suggestion}</span>
                                              </div>
                                              <div className="text-right shrink-0">
                                                <span className={`text-sm font-bold ${mi.productivityScore >= 60 ? 'text-emerald-500' : mi.productivityScore >= 30 ? 'text-amber-500' : 'text-zinc-400'}`}>{mi.productivityScore >= 0 ? `${mi.productivityScore}%` : 'Private'}</span>
                                                <span className={`text-[9px] block ${textSub}`}>{mi.focusDuration}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Scrum Coordinator */}
                                    {aiInsights.agents?.scrumCoordinator && (
                                      <div className="space-y-2">
                                        <h4 className={`font-serif italic text-sm font-bold ${themeMode === 'dark' ? 'text-[#c4b69d]' : 'text-zinc-800'}`}>Scrum Coordinator Agent</h4>
                                        <div className="flex items-center gap-2">
                                          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${aiInsights.agents.scrumCoordinator.status === 'Optimal Alignment' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{aiInsights.agents.scrumCoordinator.status}</span>
                                        </div>
                                        <p className={textSub}>{aiInsights.agents.scrumCoordinator.recommendation}</p>
                                      </div>
                                    )}

                                    {/* Welfare Coach */}
                                    {aiInsights.agents?.welfareCoach && (
                                      <div className="space-y-2">
                                        <h4 className={`font-serif italic text-sm font-bold ${themeMode === 'dark' ? 'text-[#c4b69d]' : 'text-zinc-800'}`}>Welfare & Productivity Coach</h4>
                                        <div className="flex items-center gap-3">
                                          <span className={textSub}>Burnout Risk:</span>
                                          <span className={`font-bold ${aiInsights.agents.welfareCoach.burnoutRiskIndex > 60 ? 'text-red-500' : aiInsights.agents.welfareCoach.burnoutRiskIndex > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>{aiInsights.agents.welfareCoach.burnoutRiskIndex}/100</span>
                                        </div>
                                        <p className={textSub}>{aiInsights.agents.welfareCoach.ergonomicNudge}</p>
                                      </div>
                                    )}

                                    {/* Recommendations */}
                                    {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                                      <div className="space-y-2">
                                        <h4 className={`font-serif italic text-sm font-bold ${themeMode === 'dark' ? 'text-[#c4b69d]' : 'text-zinc-800'}`}>AI Recommendations</h4>
                                        <ul className="space-y-1.5">
                                          {aiInsights.recommendations.map((rec: string, idx: number) => (
                                            <li key={idx} className={`flex items-start ${textSub}`}>
                                              <span className="text-blue-500 mr-2">•</span>
                                              <span>{rec}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Focus Patterns */}
                                    {aiInsights.focusPatterns && (
                                      <div className="space-y-2">
                                        <h4 className={`font-serif italic text-sm font-bold ${themeMode === 'dark' ? 'text-[#c4b69d]' : 'text-zinc-800'}`}>Focus Pattern Analysis</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                          {[
                                            { label: 'Deep Work Streak', value: `${aiInsights.focusPatterns.deepWorkStreak}m` },
                                            { label: 'Context Switches', value: aiInsights.focusPatterns.contextSwitchCount },
                                            { label: 'Peak Window', value: aiInsights.focusPatterns.peakProductivityWindow },
                                            { label: 'Avg Session', value: aiInsights.focusPatterns.averageSessionLength },
                                          ].map((item, idx) => (
                                            <div key={idx} className={`p-2.5 rounded-lg border ${themeMode === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                                              <span className={`text-[9px] uppercase tracking-wider block ${textSub}`}>{item.label}</span>
                                              <span className="text-sm font-semibold block mt-0.5">{item.value}</span>
                                            </div>
                                          ))}
                                        </div>
                                        <p className={textSub}>Flow State: {aiInsights.focusPatterns.flowStateDetected ? '✅ Detected in current session' : '❌ Not detected yet'}</p>
                                      </div>
                                    )}

                                    {/* Prediction */}
                                    {aiInsights.prediction && (
                                      <div className="space-y-2">
                                        <h4 className={`font-serif italic text-sm font-bold ${themeMode === 'dark' ? 'text-[#c4b69d]' : 'text-zinc-800'}`}>Daily Completion Prediction</h4>
                                        <div className="flex items-center gap-3">
                                          <div className="flex-1">
                                            <div className={`w-full rounded-full h-2 overflow-hidden ${themeMode === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                                              <div className="bg-indigo-500 h-full rounded-full transition-all duration-700" style={{ width: `${aiInsights.prediction.completionPercentage}%` }} />
                                            </div>
                                          </div>
                                          <span className="text-sm font-bold">{aiInsights.prediction.completionPercentage}%</span>
                                        </div>
                                        <p className={`italic ${textSub}`}>{aiInsights.prediction.description}</p>
                                      </div>
                                    )}

                                    {/* Footer */}
                                    <div className={`pt-3 border-t ${themeMode === 'dark' ? 'border-zinc-800' : 'border-zinc-200'} flex items-center justify-between`}>
                                      <span className={`text-[9px] font-mono ${textSub}`}>
                                        {aiInsights.isFallback ? '⚙ Heuristic Engine' : '✦ Gemini AI'} • Collaboration: {aiInsights.collaborationScore}/100
                                      </span>
                                      <span className={`text-[9px] font-mono ${textSub}`}>
                                        {new Date(aiInsights.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-stone-500 text-xs italic">No co-working briefing stored. Click reload icon above to fetch.</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* ROOM CHAT PANEL */}
                          {roomTab === "chat" && (
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <h3 className="text-xl font-serif italic font-bold">Real-time Room Message Board</h3>
                                <p className={`text-xs ${textSub}`}>Chat instantly with coworkers in the selected room.</p>
                              </div>

                              {/* Scrollable messages container */}
                              <div className="h-80 glass border rounded-2xl p-4 overflow-y-auto space-y-4">
                                {roomChatMessages.length > 0 ? (
                                  roomChatMessages.map((msg) => {
                                    const isMe = msg.userId === user?.id;
                                    return (
                                      <div key={msg.id} className={`flex items-start gap-3.5 max-w-[85%] ${isMe ? "ml-auto flex-row-reverse" : ""}`}>
                                        <img src={msg.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} className="h-7 w-7 rounded-full object-cover shrink-0 border border-neutral-700" />
                                        <div className="space-y-1">
                                          <div className={`flex items-center gap-2 text-[10px] font-mono text-stone-500 ${isMe ? "justify-end" : ""}`}>
                                            <span className="font-semibold text-stone-400">{msg.userName}</span>
                                            <span>•</span>
                                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                          </div>
                                          <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${isMe ? "chat-bubble-me" : "chat-bubble-other"}`}>
                                            {msg.message}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="text-center py-20 space-y-3">
                                    <div className="text-3xl opacity-30">💬</div>
                                    <p className="text-xs font-mono t4 italic">No messages yet. Say hello to start the conversation!</p>
                                  </div>
                                )}
                                <div ref={chatEndRef} />
                              </div>

                              {/* Chat message input form */}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={roomChatInput}
                                  onChange={(e) => setRoomChatInput(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && sendRoomChatMessage()}
                                  className={`flex-1 rounded-xl px-4 py-3 text-xs tracking-wide ${formInput}`}
                                  placeholder="Type chat message to the room..."
                                />
                                <button
                                  onClick={sendRoomChatMessage}
                                  className="btn-primary shrink-0"
                                >
                                  Send
                                </button>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 🤝 MY CONNECTIONS VIEWPORT */}
              {activeTab === "connections" && (
                <div className="space-y-8">
                  {/* Title & Description */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <h2 className="text-4xl font-serif italic tracking-tight font-medium">My Connections</h2>
                      <p className={`text-xs ${textSub}`}>
                        Co-work and challenge peers in real-time Pomodoro sessions.
                      </p>
                    </div>

                    {/* Sub-tabs switch */}
                    <div className="flex bg-[#f5f4ef] dark:bg-[#18181c] p-1 rounded-xl border dark:border-[#222227] border-stone-200/50 select-none">
                      <button
                        onClick={() => setActiveConnectionsTab("lobby")}
                        className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${activeConnectionsTab === "lobby"
                          ? "bg-white dark:bg-stone-800 text-black dark:text-white shadow-sm font-semibold"
                          : "text-stone-500 hover:text-stone-305"
                        }`}
                      >
                        Lobby
                      </button>
                      <button
                        onClick={() => setActiveConnectionsTab("discover")}
                        className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${activeConnectionsTab === "discover"
                          ? "bg-white dark:bg-stone-800 text-black dark:text-white shadow-sm font-semibold"
                          : "text-stone-500 hover:text-stone-305"
                        }`}
                      >
                        Discover
                      </button>
                      <button
                        onClick={() => setActiveConnectionsTab("requests")}
                        className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${activeConnectionsTab === "requests"
                          ? "bg-white dark:bg-stone-800 text-black dark:text-white shadow-sm font-semibold"
                          : "text-stone-500 hover:text-stone-305"
                        }`}
                      >
                        Requests ({connectionsData.incoming.length + connectionsData.outgoing.length})
                      </button>
                    </div>
                  </div>

                  {/* 🔍 TOP-LEVEL ADD CONNECTION SEARCH BAR */}
                  <div className={`p-5 rounded-2xl border ${bgCard} ${borderRule} space-y-3`}>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold block">
                      Add Connection — Search User Profile by Email or Username
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-500" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            executeSearchUsers(e.target.value);
                          }}
                          className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs tracking-wide ${formInput}`}
                          placeholder="Enter user email address (e.g. ravi@example.com)..."
                        />
                      </div>
                      <button
                        onClick={() => executeSearchUsers(searchQuery)}
                        disabled={searchingUsers || !searchQuery.trim()}
                        className="btn-primary shrink-0 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Search className="h-3.5 w-3.5" />
                        <span>{searchingUsers ? "Searching..." : "Find & Connect"}</span>
                      </button>
                    </div>
                  </div>

                  {/* ⚡ REAL-TIME SEARCH RESULTS CARD (when typing email/name) */}
                  {searchQuery.trim() && (
                    <div className={`p-6 rounded-2xl border ${bgCard} border-amber-500/30 space-y-4 shadow-lg`}>
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-semibold font-mono tracking-widest uppercase text-amber-500 flex items-center gap-2">
                          <Search className="h-3.5 w-3.5" />
                          <span>Matching Profiles in User Database ("{searchQuery}")</span>
                        </h3>
                        <button
                          onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                          className="text-[10px] font-mono text-stone-500 hover:text-stone-300 underline cursor-pointer"
                        >
                          Clear Results
                        </button>
                      </div>

                      {searchingUsers ? (
                        <div className="text-center py-6 text-xs font-mono text-stone-500 animate-pulse">
                          Querying user database records...
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {searchResults.map((userItem) => (
                            <div key={userItem.id} className="p-4 rounded-xl bg-stone-900/60 border border-neutral-800 flex items-center justify-between gap-3">
                              <div className="flex items-center space-x-3 min-w-0">
                                <img
                                  src={userItem.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                                  alt={userItem.name}
                                  className="h-10 w-10 rounded-full object-cover shrink-0"
                                />
                                <div className="min-w-0">
                                  <h4 className="text-xs font-semibold text-stone-900 dark:text-white truncate">{userItem.name}</h4>
                                  <p className="text-[10px] font-mono text-stone-500 dark:text-amber-400/90 truncate">{userItem.email}</p>
                                  <p className="text-[10px] font-mono text-stone-400 dark:text-stone-500 truncate">@{userItem.username}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {userItem.connectionStatus === "friends" ? (
                                  <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono uppercase tracking-wider rounded-lg font-semibold">
                                    ✓ Connected
                                  </span>
                                ) : userItem.connectionStatus === "pending_sent" ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono uppercase tracking-wider rounded-lg font-semibold">
                                      ⏳ Pending
                                    </span>
                                    <button
                                      onClick={() => cancelConnectionRequest(userItem.requestId)}
                                      className="px-2 py-1.5 text-stone-500 hover:text-red-400 text-[10px] font-mono uppercase underline cursor-pointer"
                                      title="Cancel pending request"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : userItem.connectionStatus === "pending_received" ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => respondConnectionRequest(userItem.requestId, "accept")}
                                      className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-mono uppercase font-semibold rounded-lg cursor-pointer"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => respondConnectionRequest(userItem.requestId, "decline")}
                                      className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-400 text-[10px] font-mono uppercase rounded-lg cursor-pointer"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => sendConnectionRequest(userItem.id)}
                                    className="px-3.5 py-1.5 bg-white text-black hover:bg-neutral-200 text-[10px] font-mono uppercase font-semibold rounded-lg cursor-pointer transition-all shadow-sm flex items-center gap-1"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Send Request</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-xs font-mono text-stone-500 italic">
                          No registered user found for "{searchQuery}".
                        </div>
                      )}
                    </div>
                  )}

                  {/* Incoming Challenge Invites Bar */}
                  {incomingChallenges.length > 0 && (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {incomingChallenges.map((chal) => (
                          <motion.div 
                            key={chal.challengeId} 
                            layout
                            initial={{ opacity: 0, y: -50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="p-6 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4 origin-top"
                          >
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono uppercase tracking-widest text-amber-500 block font-bold">// Incoming 1v1 Challenge Invite</span>
                              <h4 className="text-sm font-semibold text-stone-900 dark:text-white">
                                {chal.creator.name} has challenged you to a {chal.durationMinutes}m {chal.challengeMode.replace("_", " ")} session!
                              </h4>
                              <p className="text-xs text-stone-400 italic">Objective: "{chal.creatorObjective || "Co-focus Pomodoro Sprints"}"</p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                              <input
                                type="text"
                                placeholder="Your objective..."
                                value={challengeObjectiveInput}
                                onChange={(e) => setChallengeObjectiveInput(e.target.value)}
                                className={`rounded-xl px-4 py-2.5 text-xs ${formInput}`}
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => respondFocusChallenge(chal.challengeId, "accept", challengeObjectiveInput)}
                                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-mono uppercase font-semibold cursor-pointer transition-all"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => respondFocusChallenge(chal.challengeId, "decline", "")}
                                  className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded-xl text-xs font-mono uppercase cursor-pointer transition-all border border-stone-700"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Active focus challenge dashboard */}
                  {activeChallenge && (
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-neutral-900 to-stone-900 border border-amber-500/20 space-y-6 relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 h-40 w-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
                      
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] block font-bold">
                            // ACTIVE FOCUS CHALLENGE MODE: {activeChallenge.challengeMode.replace("_", " ")}
                          </span>
                          <h3 className="text-xl font-serif italic text-white">
                            Pomodoro Co-Working Session
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => completeFocusChallenge(activeChallenge.challengeId)}
                            className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-xl text-[10px] font-mono uppercase tracking-wider cursor-pointer transition-all"
                          >
                            Finish Objective First 🏆
                          </button>
                          <button
                            onClick={() => cancelFocusChallenge(activeChallenge.challengeId)}
                            className="px-4 py-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 rounded-xl text-[10px] font-mono uppercase tracking-wider cursor-pointer transition-all"
                          >
                            Terminate
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="p-4 rounded-xl bg-stone-900/60 border border-neutral-800">
                          <span className="text-[9px] font-mono text-stone-500 uppercase font-semibold">Creator Objective ({activeChallenge.creator.name})</span>
                          <p className="text-xs text-white font-medium mt-1 truncate">
                            "{activeChallenge.creatorObjective || "Co-focus"}"
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-stone-900/60 border border-neutral-800">
                          <span className="text-[9px] font-mono text-stone-500 uppercase font-semibold">Invited Objective ({activeChallenge.invited.name})</span>
                          <p className="text-xs text-white font-medium mt-1 truncate">
                            "{activeChallenge.invitedObjective || "Co-focus"}"
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center py-6 space-y-3">
                        <div className="text-6xl font-mono font-bold tracking-tighter text-white">
                          {String(Math.floor(challengeSecondsLeft / 60)).padStart(2, '0')}:
                          {String(challengeSecondsLeft % 60).padStart(2, '0')}
                        </div>
                        <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400">
                          remaining challenge countdown
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 1. LOBBY TAB */}
                  {activeConnectionsTab === "lobby" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-semibold font-mono tracking-widest uppercase text-stone-400">
                          presence lobby
                        </h3>
                        <span className="text-[10px] font-mono text-stone-500 lowercase">
                          {connectionsData.friends.length} connections synced
                        </span>
                      </div>

                      {connectionsData.friends.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {connectionsData.friends.map((friend) => {
                            const presence = friend.presence || { state: "offline" };
                            const stateStr = presence.state.toLowerCase();
                            
                            let statusColor = "bg-stone-500";
                            let statusText = "Offline";
                            let cardBorder = "border-neutral-800/60";
                            
                            if (stateStr === "online") {
                              statusColor = "bg-emerald-500";
                              statusText = "Online";
                            } else if (stateStr === "focusing") {
                              statusColor = "bg-indigo-500 animate-pulse";
                              statusText = "Focusing";
                              cardBorder = "border-indigo-500/20";
                            } else if (stateStr === "break") {
                              statusColor = "bg-sky-500";
                              statusText = "Resting";
                            } else if (stateStr === "busy") {
                              statusColor = "bg-rose-500";
                              statusText = "Do Not Disturb";
                            }

                            return (
                              <div key={friend.connectionId} className={`p-6 rounded-2xl border ${bgCard} ${cardBorder} flex flex-col justify-between space-y-6 transition-all duration-200 group`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center space-x-3.5">
                                    <div className="relative">
                                      <img
                                        src={friend.profile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                                        alt={friend.profile.name}
                                        className="h-10 w-10 rounded-full object-cover border dark:border-zinc-800 border-zinc-200"
                                      />
                                      <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 ${themeMode === 'dark' ? 'border-[#121215]' : 'border-white'} ${statusColor}`}></span>
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="text-sm font-semibold truncate text-stone-900 dark:text-stone-300">
                                        {friend.profile.name}
                                      </h4>
                                      <p className="text-[10px] font-mono text-[#D4AF37] block truncate max-w-[170px]">
                                        {friend.profile.email || `@${friend.profile.username}`}
                                      </p>
                                      {friend.profile.headline && (
                                        <p className="text-[10px] text-stone-500 truncate max-w-[170px]">
                                          {friend.profile.headline}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <span className="inline-block text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border border-neutral-700 text-stone-400">
                                      {statusText}
                                    </span>
                                    {friend.focusMinutesToday !== undefined && (
                                      <span className="text-[9px] font-mono text-stone-500 block mt-1.5 leading-none">
                                        {friend.focusMinutesToday}m Focused Today
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {presence.state !== "offline" && (presence.appName || presence.appCategory) ? (
                                  <div className={`p-3.5 rounded-xl border dark:border-[#1e1e23] border-stone-200/50 flex items-center justify-between ${bgInternal}`}>
                                    <div className="min-w-0">
                                      <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest block leading-none">Activity telemetry</span>
                                      <span className="text-xs font-semibold text-stone-900 dark:text-white truncate block mt-1 leading-none">
                                        {presence.appName || presence.appCategory}
                                      </span>
                                      {presence.appCategory && presence.appName && (
                                        <p className="text-[10px] font-mono text-zinc-500 truncate max-w-[200px] mt-1 leading-none">
                                          Category: {presence.appCategory}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ) : null}

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t dark:border-neutral-850/60 border-stone-200/50">
                                  {friend.visibleRoom ? (
                                    <div className="flex-1 flex items-center justify-between">
                                      <span className="text-[9px] font-mono text-stone-500 uppercase">Room: {friend.visibleRoom.name}</span>
                                      
                                      {friend.visibleRoom.accessAction === "open" ? (
                                        <button
                                          onClick={() => enterRoomChannel(friend.visibleRoom!.name)}
                                          className="px-3 py-1.5 bg-[#D4AF37] hover:bg-amber-600 text-black text-[10px] font-mono uppercase tracking-wider font-semibold rounded-lg cursor-pointer"
                                        >
                                          Enter Room
                                        </button>
                                      ) : friend.visibleRoom.accessAction === "join" ? (
                                        <button
                                          onClick={() => submitProfileSettings({ activeGroup: friend.visibleRoom!.name })}
                                          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono uppercase tracking-wider rounded-lg cursor-pointer"
                                        >
                                          Join Room
                                        </button>
                                      ) : (
                                        <span className="text-[9px] font-mono text-stone-500 italic uppercase">
                                          {friend.visibleRoom.accessAction.replace("_", " ")}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex-1 text-[9px] font-mono text-stone-500 italic uppercase">
                                      No visible room workspace
                                    </div>
                                  )}

                                  <div className="flex items-center space-x-2 shrink-0">
                                    <button
                                      onClick={() => triggerPeerNudge(friend.profile.name, friend.profile.id)}
                                      disabled={nudgedFriendIds[friend.profile.id]}
                                      className={`px-3 py-1.5 border rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer ${nudgedFriendIds[friend.profile.id]
                                        ? "bg-stone-800 text-stone-400"
                                        : "bg-transparent text-stone-400 dark:border-neutral-850 hover:text-stone-300"
                                      }`}
                                    >
                                      {nudgedFriendIds[friend.profile.id] ? "Waved!" : "Wave"}
                                    </button>

                                    <button
                                      onClick={() => {
                                        setChallengeModalFriend(friend);
                                        setChallengeModalObjective("");
                                        setChallengeModalDuration(25);
                                        setChallengeModalMode("co_focus");
                                        setChallengeModalOpen(true);
                                      }}
                                      className="px-3 py-1.5 bg-black hover:bg-neutral-900 dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-white text-[9px] font-mono uppercase tracking-wider font-semibold rounded-lg cursor-pointer transition-all"
                                    >
                                      Challenge 1v1
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-20 text-xs font-mono text-stone-500 italic">
                          No connected peers online. Use the Search Bar above to find user emails and connect.
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. DISCOVER TAB */}
                  {activeConnectionsTab === "discover" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-mono tracking-widest text-[#a1a1aa] block">
                          discover coworkers by display name, username or email
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              executeSearchUsers(e.target.value);
                            }}
                            className={`w-full rounded-xl px-4 py-3 text-xs tracking-wide ${formInput}`}
                            placeholder="Type user email (e.g. ravi@example.com)..."
                          />
                        </div>
                      </div>

                      {searchingUsers ? (
                        <div className="text-center py-8 text-xs font-mono text-stone-500 animate-pulse">
                          Querying developer registry indexes...
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          {searchResults.map((userItem) => (
                            <div key={userItem.id} className={`p-6 rounded-2xl border ${bgCard} ${borderRule} flex items-center justify-between gap-4`}>
                              <div className="flex items-center space-x-3">
                                <img
                                  src={userItem.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                                  alt={userItem.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                                <div className="min-w-0">
                                  <h4 className="text-sm font-semibold truncate text-white dark:text-stone-300">
                                    {userItem.name}
                                  </h4>
                                  <p className="text-[10px] font-mono text-amber-400/90 truncate">
                                    {userItem.email}
                                  </p>
                                  <p className="text-[10px] font-mono text-stone-500 truncate">
                                    @{userItem.username}
                                  </p>
                                  {userItem.headline && (
                                    <p className="text-[10px] text-zinc-500 mt-1 truncate">{userItem.headline}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 shrink-0">
                                {userItem.connectionStatus === "friends" ? (
                                  <button
                                    onClick={() => removeConnection(userItem.requestId)}
                                    className="px-3 py-1.5 border border-dashed border-red-950/40 text-red-500 hover:text-red-400 hover:bg-red-950/20 text-[10px] font-mono uppercase tracking-wider rounded-lg cursor-pointer transition-all"
                                  >
                                    Unfriend
                                  </button>
                                ) : userItem.connectionStatus === "pending_sent" ? (
                                  <button
                                    onClick={() => cancelConnectionRequest(userItem.requestId)}
                                    className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono uppercase tracking-wider rounded-lg cursor-pointer"
                                  >
                                    ⏳ Pending Sent
                                  </button>
                                ) : userItem.connectionStatus === "pending_received" ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => respondConnectionRequest(userItem.requestId, "accept")}
                                      className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-mono uppercase tracking-wider font-semibold rounded-lg cursor-pointer"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => respondConnectionRequest(userItem.requestId, "decline")}
                                      className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-400 text-[10px] font-mono uppercase tracking-wider rounded-lg cursor-pointer border border-stone-700"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => sendConnectionRequest(userItem.id)}
                                    className="px-3 py-1.5 bg-white text-black dark:bg-stone-300 dark:hover:bg-neutral-200 text-[10px] font-mono uppercase tracking-wider font-semibold rounded-lg cursor-pointer transition-all flex items-center gap-1"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Connect</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => blockUser(userItem.id)}
                                  className="p-1.5 text-stone-500 hover:text-red-400 rounded-lg hover:bg-stone-800/40 cursor-pointer"
                                  title="Block Coworker"
                                >
                                  <VolumeX className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : searchQuery ? (
                        <div className="text-center py-12 text-xs font-mono text-stone-500 italic">
                          No matching developer records discovered.
                        </div>
                      ) : (
                        <div className="text-center py-16 text-xs font-mono text-stone-500 italic">
                          Search by email address above to index active users.
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. REQUESTS TAB */}
                  {activeConnectionsTab === "requests" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Incoming Requests */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-semibold font-mono tracking-widest uppercase text-stone-400">
                          incoming connection requests ({connectionsData.incoming.length})
                        </h4>

                        {connectionsData.incoming.length > 0 ? (
                          <div className="space-y-4">
                            {connectionsData.incoming.map((item) => (
                              <div key={item.requestId} className={`p-5 rounded-2xl border ${bgCard} ${borderRule} flex items-center justify-between gap-4`}>
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={item.profile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                  <div className="min-w-0">
                                    <h5 className="text-sm font-semibold truncate text-white dark:text-stone-300">
                                      {item.profile.name}
                                    </h5>
                                    <p className="text-[10px] font-mono text-amber-400/90 truncate">
                                      {item.profile.email || `@${item.profile.username}`}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => respondConnectionRequest(item.requestId, "accept")}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-mono uppercase tracking-wider font-semibold rounded-lg cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => respondConnectionRequest(item.requestId, "decline")}
                                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-400 text-[10px] font-mono uppercase tracking-wider rounded-lg cursor-pointer border border-stone-700"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-10 border border-dashed dark:border-neutral-850 border-stone-250/60 rounded-2xl text-xs font-mono text-stone-500 italic">
                            No incoming requests pending.
                          </div>
                        )}
                      </div>

                      {/* Outgoing Requests */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-semibold font-mono tracking-widest uppercase text-stone-400">
                          sent connection requests ({connectionsData.outgoing.length})
                        </h4>

                        {connectionsData.outgoing.length > 0 ? (
                          <div className="space-y-4">
                            {connectionsData.outgoing.map((item) => (
                              <div key={item.requestId} className={`p-5 rounded-2xl border ${bgCard} ${borderRule} flex items-center justify-between gap-4`}>
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={item.profile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                  <div className="min-w-0">
                                    <h5 className="text-sm font-semibold truncate text-white dark:text-stone-300">
                                      {item.profile.name}
                                    </h5>
                                    <p className="text-[10px] font-mono text-amber-400/90 truncate">
                                      {item.profile.email || `@${item.profile.username}`}
                                    </p>
                                    <span className="text-[9px] font-mono text-amber-400 block mt-0.5">
                                      ⏳ Request Pending...
                                    </span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => cancelConnectionRequest(item.requestId)}
                                  className="px-3 py-1.5 bg-stone-850 hover:bg-neutral-800 text-stone-450 text-[10px] font-mono uppercase tracking-wider rounded-lg cursor-pointer shrink-0"
                                >
                                  Cancel Request
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-10 border border-dashed dark:border-neutral-850 border-stone-250/60 rounded-2xl text-xs font-mono text-stone-500 italic">
                            No sent requests pending.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4️⃣ PROFILE PARAMETERS EDIT TAB VIEW */}
              {activeTab === "profile" && user && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-[#09090b]">Developer Identity Parameters</h2>
                    <p className="text-xs text-[#71717a]">
                      Aesthetic alignment fields mapping parameters directly to backend database buffers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Left aggregate info */}
                    <div className="studio-card p-5 text-center space-y-4 flex flex-col items-center justify-center">
                      <img
                        src={user.avatarUrl}
                        alt="Avatar profile"
                        className="h-24 w-24 rounded-full object-cover border-2 border-[#e4e4e7] shadow-sm"
                      />
                      <div className="space-y-0.5">
                        <h3 className="text-lg font-bold text-[#09090b]">{user.name}</h3>
                        <span className="text-xs font-mono text-[#71717a] block">{user.email}</span>
                      </div>

                      <div className="w-full text-left space-y-2 font-mono text-xs text-[#71717a] py-3 border-t border-[#e4e4e7]">
                        <div className="flex justify-between">
                          <span>Status msg</span>
                          <span className="truncate max-w-[120px] font-semibold text-[#09090b]">{user.customStatus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Focus goal</span>
                          <span className="font-semibold text-[#09090b]">{user.productivityGoal} hrs</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Privacy model</span>
                          <span className="font-semibold text-[#09090b]">{user.privacyMode}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right editable profile settings card */}
                    <div className="md:col-span-2 studio-card p-6 space-y-5">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#09090b]">
                        Edit Profile Parameters
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] block">Workspace Display Name</label>
                          <input
                            type="text"
                            value={profileNameInput}
                            onChange={(e) => setProfileNameInput(e.target.value)}
                            onBlur={() => submitProfileSettings({ name: profileNameInput })}
                            onKeyDown={(e) => e.key === "Enter" && submitProfileSettings({ name: profileNameInput })}
                            className="input-field"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] block">Connections Username</label>
                          <input
                            type="text"
                            value={usernameInput}
                            onChange={(e) => setUsernameInput(e.target.value)}
                            onBlur={() => submitProfileSettings({ username: usernameInput })}
                            onKeyDown={(e) => e.key === "Enter" && submitProfileSettings({ username: usernameInput })}
                            className="input-field"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] block">Connections Headline/Role</label>
                          <input
                            type="text"
                            value={headlineInput}
                            onChange={(e) => setHeadlineInput(e.target.value)}
                            onBlur={() => submitProfileSettings({ headline: headlineInput })}
                            onKeyDown={(e) => e.key === "Enter" && submitProfileSettings({ headline: headlineInput })}
                            className="input-field"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] block">Avatar Image</label>
                          <div className="flex gap-2 h-9">
                            <input
                              type="text"
                              value={profileAvatarInput}
                              onChange={(e) => setProfileAvatarInput(e.target.value)}
                              onBlur={() => submitProfileSettings({ avatarUrl: profileAvatarInput })}
                              onKeyDown={(e) => e.key === "Enter" && submitProfileSettings({ avatarUrl: profileAvatarInput })}
                              className="input-field font-mono flex-1"
                              placeholder="Image URL"
                            />
                            <div className="relative overflow-hidden inline-block shrink-0">
                              <button className="h-full flex items-center justify-center px-4 rounded-xl border dark:border-[#222227] border-stone-200/50 bg-[#fafafa] dark:bg-[#18181c] text-xs font-semibold text-[#09090b] dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#1f1f23] transition-colors cursor-pointer">
                                Upload
                              </button>
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="absolute left-0 top-0 opacity-0 w-full h-full cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] block">Active Status Label</label>
                          <input
                            type="text"
                            value={statusInput}
                            onChange={(e) => setStatusInput(e.target.value)}
                            onBlur={() => submitProfileSettings({ customStatus: statusInput })}
                            onKeyDown={(e) => e.key === "Enter" && submitProfileSettings({ customStatus: statusInput })}
                            className="input-field"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] block">Focus Hour Target</label>
                          <select
                            value={user.productivityGoal}
                            onChange={(e) => submitProfileSettings({ productivityGoal: parseInt(e.target.value) })}
                            className="input-field"
                          >
                            <option value="4">4 hours target-line</option>
                            <option value="6">6 hours target-line</option>
                            <option value="8">8 hours target-line</option>
                            <option value="10">10 hours target-line</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] block">Presence Visibility Rule</label>
                          <select
                            value={user.presenceVisibility || "connections"}
                            onChange={(e) => submitProfileSettings({ presenceVisibility: e.target.value })}
                            className="input-field"
                          >
                            <option value="everyone">Everyone</option>
                            <option value="connections">Connections Only</option>
                            <option value="room_members">Focus Room Members Only</option>
                            <option value="nobody">Nobody (Invisible)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] block">Telemetry Detail Level</label>
                          <select
                            value={user.activityVisibility || "status_only"}
                            onChange={(e) => submitProfileSettings({ activityVisibility: e.target.value })}
                            className="input-field"
                          >
                            <option value="app_name">Full App Name & Category</option>
                            <option value="app_category">App Category Only</option>
                            <option value="status_only">Presence Status Only</option>
                          </select>
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] block">Workstation Machine Tag</label>
                          <input
                            type="text"
                            value={profileDeviceInput}
                            onChange={(e) => setProfileDeviceInput(e.target.value)}
                            onBlur={() => submitProfileSettings({ deviceConnected: profileDeviceInput })}
                            onKeyDown={(e) => e.key === "Enter" && submitProfileSettings({ deviceConnected: profileDeviceInput })}
                            className="input-field font-mono"
                          />
                        </div>

                        <div className="sm:col-span-2 border-t border-[#e4e4e7] pt-4 space-y-3">
                          <h5 className="text-[10px] font-semibold uppercase tracking-wider text-[#09090b]">Connections Privacy Directives</h5>
                          
                          <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#e4e4e7]">
                            <span className="text-[#09090b]">Show focus duration today to connections</span>
                            <button
                              onClick={() => submitProfileSettings({ showDailyFocusTime: !user.showDailyFocusTime })}
                              className={user.showDailyFocusTime ? "badge badge-emerald cursor-pointer" : "badge badge-neutral cursor-pointer"}
                            >
                              {user.showDailyFocusTime ? "Shown" : "Hidden"}
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#e4e4e7]">
                            <span className="text-[#09090b]">Show active room shortcut to connections</span>
                            <button
                              onClick={() => submitProfileSettings({ showCurrentRoom: !user.showCurrentRoom })}
                              className={user.showCurrentRoom ? "badge badge-emerald cursor-pointer" : "badge badge-neutral cursor-pointer"}
                            >
                              {user.showCurrentRoom ? "Shown" : "Hidden"}
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#e4e4e7]">
                            <span className="text-[#09090b]">Allow connections to send focus challenges</span>
                            <button
                              onClick={() => submitProfileSettings({ allowFocusInvites: !user.allowFocusInvites })}
                              className={user.allowFocusInvites ? "badge badge-emerald cursor-pointer" : "badge badge-neutral cursor-pointer"}
                            >
                              {user.allowFocusInvites ? "Allowed" : "Muted"}
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* 5️⃣ CONTROL SETTINGS CONFIGS TAB VIEW */}
              {activeTab === "settings" && user && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-[#09090b]">Control Dashboard Configurations</h2>
                    <p className="text-xs text-[#71717a]">
                      Options managing toast notifications, visual themes, and automated pipeline signals.
                    </p>
                  </div>

                  <div className="studio-card max-w-2xl p-6 space-y-6">

                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#09090b]">
                        Notification Directives
                      </h3>

                      <div className="space-y-3">

                        <div className="flex items-center justify-between py-2 border-b border-[#e4e4e7]">
                          <div>
                            <span className="text-xs font-semibold text-[#09090b] block">Waved Peer Indicators</span>
                            <p className="text-[11px] text-[#71717a]">Enable real-time wave push signals triggered from adjacent room co-workers.</p>
                          </div>
                          <button
                            onClick={() => submitProfileSettings({
                              notifications: { ...user.notifications, friendUpdates: !user.notifications.friendUpdates }
                            })}
                            className={`badge cursor-pointer transition-all ${user.notifications.friendUpdates ? "badge-emerald" : "badge-neutral"}`}
                          >
                            {user.notifications.friendUpdates ? "Enabled" : "Muted"}
                          </button>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-[#e4e4e7]">
                          <div>
                            <span className="text-xs font-semibold text-[#09090b] block">Idle Stretch Recommendations</span>
                            <p className="text-[11px] text-[#71717a]">Receive active stretch reminders when workstation tracking runs past 45m.</p>
                          </div>
                          <button
                            onClick={() => submitProfileSettings({
                              notifications: { ...user.notifications, breakReminders: !user.notifications.breakReminders }
                            })}
                            className={`badge cursor-pointer transition-all ${user.notifications.breakReminders ? "badge-emerald" : "badge-neutral"}`}
                          >
                            {user.notifications.breakReminders ? "Enabled" : "Muted"}
                          </button>
                        </div>

                        <div className="flex items-center justify-between py-2 border-b border-[#e4e4e7]">
                          <div>
                            <span className="text-xs font-semibold text-[#09090b] block">Generative AI Compilation Alerts</span>
                            <p className="text-[11px] text-[#71717a]">Show notification toasts on active compiling triggers.</p>
                          </div>
                          <button
                            onClick={() => submitProfileSettings({
                              notifications: { ...user.notifications, aiNudges: !user.notifications.aiNudges }
                            })}
                            className={`badge cursor-pointer transition-all ${user.notifications.aiNudges ? "badge-emerald" : "badge-neutral"}`}
                          >
                            {user.notifications.aiNudges ? "Enabled" : "Muted"}
                          </button>
                        </div>

                      </div>
                    </div>

                    <div className="pt-2 space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#09090b]">
                        Co-Working Pipeline Overview
                      </h3>
                      <div className="studio-panel p-4 font-mono text-xs text-[#09090b] space-y-1.5">
                        <p className="font-semibold text-[#71717a] mb-1">Workspace Details:</p>
                        <p>Express Socket: <span className="font-bold">ws://localhost:3000/rtime-pipeline</span></p>
                        <p>Database Engine: <span className="font-bold">In-memory dynamic simulated ticks</span></p>
                        <p>Aesthetic System: <span className="font-bold">Arctic Slate Studio (Light Mode)</span></p>
                        <p>Session ID: <span className="font-bold">3c832fe5-3b56-440d-91da-8d3c67a9f</span></p>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

        </div>
      </main>

      {/* 5-Step Room Creation Wizard Modal */}
      <RoomCreationWizard
        isOpen={isRoomWizardOpen}
        onClose={() => setIsRoomWizardOpen(false)}
        onSuccess={(newRoom) => {
          fetchGroups();
          triggerToast(`🚀 Room ${newRoom.name} created successfully!`);
        }}
      />

      {/* In-App Confirm Modal (replaces native confirm() dialogs) */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmModal(null); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-neutral-700/60 shadow-2xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, #141414 0%, #1c1a16 100%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-7 pt-7 pb-5">
              <h3 className="text-sm font-semibold text-white mb-2">{confirmModal.title}</h3>
              <p className="text-xs text-stone-400 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="px-7 pb-7 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wide text-stone-400 hover:text-stone-200 border border-neutral-700 hover:border-neutral-600 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wide font-bold bg-red-500/90 hover:bg-red-400 text-white transition-all cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Challenge 1v1 Modal */}
      {challengeModalOpen && challengeModalFriend && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setChallengeModalOpen(false); }}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-amber-500/20 shadow-2xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, #141414 0%, #1c1a16 100%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-8 pt-8 pb-6 border-b border-neutral-800/60">
              <span className="text-[9px] font-mono uppercase tracking-widest text-amber-500 font-bold block mb-2">
                // INITIATE 1v1 FOCUS CHALLENGE
              </span>
              <div className="flex items-center gap-3">
                <img
                  src={challengeModalFriend.profile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                  alt={challengeModalFriend.profile.name}
                  className="h-10 w-10 rounded-full object-cover border border-amber-500/30"
                />
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Challenge <span className="text-amber-400">{challengeModalFriend.profile.name}</span>
                  </h3>
                  <p className="text-[10px] font-mono text-stone-500">{challengeModalFriend.profile.email || `@${challengeModalFriend.profile.username}`}</p>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-bold">
                  Your Session Objective
                </label>
                <input
                  type="text"
                  autoFocus
                  value={challengeModalObjective}
                  onChange={(e) => setChallengeModalObjective(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && challengeModalObjective.trim()) {
                      setChallengeModalOpen(false);
                      sendFocusChallenge(challengeModalFriend.profile.id, challengeModalDuration, challengeModalMode, challengeModalObjective.trim());
                    }
                  }}
                  placeholder="e.g. Ship auth module, refactor DB schema..."
                  className="w-full rounded-xl px-4 py-3 text-xs font-mono bg-stone-900 border border-neutral-700 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500/60 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-bold">
                  Session Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 25, 45, 60].map((min) => (
                    <button
                      key={min}
                      onClick={() => setChallengeModalDuration(min)}
                      className={`py-2 rounded-xl text-[10px] font-mono uppercase tracking-wide font-semibold border transition-all cursor-pointer ${
                        challengeModalDuration === min
                          ? "bg-amber-500 border-amber-500 text-black"
                          : "bg-stone-900 border-neutral-700 text-stone-400 hover:border-amber-500/40 hover:text-stone-300"
                      }`}
                    >
                      {min}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-bold">
                  Challenge Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "co_focus", label: "Co-Focus" },
                    { value: "deep_work", label: "Deep Work" },
                    { value: "sprint", label: "Sprint" },
                  ].map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setChallengeModalMode(m.value)}
                      className={`py-2 rounded-xl text-[10px] font-mono uppercase tracking-wide font-semibold border transition-all cursor-pointer ${
                        challengeModalMode === m.value
                          ? "bg-amber-500/10 border-amber-500/60 text-amber-400"
                          : "bg-stone-900 border-neutral-700 text-stone-500 hover:border-amber-500/30 hover:text-stone-300"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-8 pb-8 flex items-center justify-end gap-3">
              <button
                onClick={() => setChallengeModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wide text-stone-400 hover:text-stone-200 border border-neutral-700 hover:border-neutral-600 bg-transparent transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!challengeModalObjective.trim()}
                onClick={() => {
                  setChallengeModalOpen(false);
                  sendFocusChallenge(challengeModalFriend.profile.id, challengeModalDuration, challengeModalMode, challengeModalObjective.trim());
                }}
                className="px-6 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wide font-bold bg-amber-500 hover:bg-amber-400 text-black transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
              >
                Send Challenge
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 🚀 SESSION SETUP & CUSTOM APPLICATION ADDITION MODAL */}
      <AnimatePresence>
        {showSessionModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 border border-[#e4e4e7] shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#e4e4e7] pb-3.5">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-600">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#09090b]">Active Workstation Session</h3>
                    <p className="text-[11px] text-[#71717a]">Select active application and current task</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="text-[#71717a] hover:text-[#09090b] p-1.5 rounded-lg hover:bg-[#f4f4f5] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#09090b]">Active Application</label>
                    <button
                      onClick={() => {
                        const name = prompt("Enter new custom application name (e.g. PyCharm, Postman, Blender):");
                        if (name && name.trim()) {
                          const cleanName = name.trim();
                          if (!customApps.includes(cleanName)) {
                            setCustomApps(prev => [...prev, cleanName]);
                          }
                          setSessionAppInput(cleanName);
                        }
                      }}
                      className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Application
                    </button>
                  </div>
                  <select
                    value={sessionAppInput}
                    onChange={(e) => setSessionAppInput(e.target.value)}
                    className="input-field cursor-pointer text-xs"
                  >
                    {customApps.map(app => (
                      <option key={app} value={app}>{app}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#09090b]">Next Active Task / Project</label>
                  <input
                    type="text"
                    value={sessionTaskInput}
                    onChange={(e) => setSessionTaskInput(e.target.value)}
                    className="input-field text-xs"
                    placeholder="e.g. Building EndoCore Workspace"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#e4e4e7]">
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="btn-secondary py-2 px-4 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowSessionModal(false);
                    await updateMyActiveTracker(sessionAppInput, sessionTaskInput, false);
                    triggerToast(`Session active: ${sessionAppInput} — ${sessionTaskInput}`);
                  }}
                  className="btn-primary py-2 px-4 text-xs font-semibold"
                >
                  Turn ON Session & Sync
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CommandPalette 
        isOpen={cmdKOpen} 
        onClose={() => setCmdKOpen(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          if (tab === "rooms") {
            setSelectedRoomName(null);
          }
        }}
        onJoinRoom={(room) => {
          setSelectedRoomName(room);
          setActiveTab("rooms");
        }}
      />
    </div>
  );
}
