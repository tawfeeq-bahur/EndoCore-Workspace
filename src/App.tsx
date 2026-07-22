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
  VolumeX
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
import { MobileCompanionShell } from "./mobile/MobileCompanionShell";
import { usePlatformMode } from "./mobile/hooks/usePlatformMode";

export default function App() {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<"control" | "room" | "me">("control");

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
  const [pomodoroActive, setPomodoroActive] = useState<boolean>(false);
  const [pomodoroMode, setPomodoroMode] = useState<"focus" | "break">("focus");
  const [pomodoroSessionCount, setPomodoroSessionCount] = useState<number>(0);
  const [distractionsManualCount, setDistractionsManualCount] = useState<number>(0);

  // Theme support
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");

  // Server-state synchronize mirrors
  const [user, setUser] = useState<UserProfile | null>(null);
  const [myActivity, setMyActivity] = useState<UserActivity | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
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
  const [appInput, setAppInput] = useState<string>("VS Code");
  const [projectInput, setProjectInput] = useState<string>("EndoCore Workspace");
  const [statusInput, setStatusInput] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState<string>("");
  const [newGroupDesc, setNewGroupDesc] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [profileNameInput, setProfileNameInput] = useState<string>("");
  const [profileAvatarInput, setProfileAvatarInput] = useState<string>("");
  const [profileDeviceInput, setProfileDeviceInput] = useState<string>("");
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [headlineInput, setHeadlineInput] = useState<string>("");
  const [currentTimeText, setCurrentTimeText] = useState<string>("");

  // Nudge reaction status Map
  const [nudgedFriendIds, setNudgedFriendIds] = useState<Record<string, boolean>>({});

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

  // Responsive layout state
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isRoomWizardOpen, setIsRoomWizardOpen] = useState<boolean>(false);

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

    socket.on("peer-nudge", (data: { senderId: string; senderName: string }) => {
      triggerToast(`🕊️ ${data.senderName} waved at you!`);
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
    });

    socket.on("challenge:canceled", (data: any) => {
      triggerToast("⚠️ Focus challenge was canceled.");
      setActiveChallenge(prev => prev && prev.challengeId === data.challengeId ? null : prev);
      setIncomingChallenges(prev => prev.filter(c => c.challengeId !== data.challengeId));
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

  // Sync token and start tracking with Electron desktop agent if available
  useEffect(() => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI) return;

    if (token && user?.email) {
      electronAPI.saveConfig({ token, email: user.email });
      electronAPI.startTracking();
    } else {
      electronAPI.stopTracking();
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
      if (left === 0) {
        triggerToast("🏆 Focus challenge completed!");
        setActiveChallenge(null);
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
          setStatusInput(data.customStatus || "");
          setProfileNameInput(data.name || "");
          setProfileAvatarInput(data.avatarUrl || "");
          setProfileDeviceInput(data.deviceConnected || "");
          setUsernameInput(data.username || "");
          setHeadlineInput(data.headline || "");
          if (data.theme === "light") {
            setThemeMode("light");
          }
          return;
        }
      }
      if (res.status === 401 || res.status === 403) {
        setToken(null);
        localStorage.removeItem("token");
      }
    } catch (e) {
      console.error("API Fetch Error (Profile):", e);
      // On network error or session expiration, fallback to login
      setToken(null);
      localStorage.removeItem("token");
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
    if (!confirm("Are you sure you want to remove this connection?")) return;
    try {
      const res = await apiFetch(`/api/connections/${connectionId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        triggerToast("Connection removed.");
        fetchConnections();
      }
    } catch (e) {
      console.error("Error removing connection:", e);
    }
  };

  const blockUser = async (userId: string) => {
    if (!confirm("Are you sure you want to block this user?")) return;
    try {
      const res = await apiFetch(`/api/users/${userId}/block`, {
        method: "POST"
      });
      if (res.ok) {
        triggerToast("User blocked.");
        fetchConnections();
        if (searchQuery) executeSearchUsers(searchQuery);
      }
    } catch (e) {
      console.error("Error blocking user:", e);
    }
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
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-300">
          <span>Started focus in</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-blue-550/10 text-blue-400 border border-blue-500/20 shadow-sm">
            {item.app}
          </span>
          {item.project && (
            <>
              <span>on</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-emerald-550/10 text-emerald-450 border border-emerald-500/20 shadow-sm max-w-[200px] truncate" title={item.project}>
                {item.project}
              </span>
            </>
          )}
        </div>
      );
    }

    if (item.type === "room_entry" && item.project) {
      return (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-300">
          <span>Entered workspace room</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-purple-550/10 text-purple-400 border border-purple-500/20 shadow-sm">
            #{item.project}
          </span>
        </div>
      );
    }

    if (item.type === "pomodoro") {
      return (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-300">
          <span>Completed focus sprint</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-amber-550/10 text-amber-400 border border-amber-500/20 shadow-sm">
            Pomodoro block
          </span>
        </div>
      );
    }

    return <span className="text-stone-300">{item.text}</span>;
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
      setAiInsights(data.text);
      if (data.error) {
        setInsightsError(true);
      }
      if (force) {
        triggerToast("Compiled a fresh co-working briefing with Gemini AI");
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
            setPomodoroMinutesLeft(5);
            setPomodoroSecondsLeft(0);
            completePomodoroSession();
          } else {
            triggerToast("🔋 Break session completed! Ready to focus?");
            setPomodoroMode("focus");
            setPomodoroMinutesLeft(25);
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
      fetchProfile();
      triggerToast("Logged in successfully! Welcome to EndoCore.");
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
      fetchProfile();
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

  // Send interactive co-working nudge
  const triggerPeerNudge = (friendName: string, id: string) => {
    setNudgedFriendIds(prev => ({ ...prev, [id]: true }));
    triggerToast(`Sent continuous work support signal to ${friendName} 🕊️`);

    if (socketRef.current) {
      socketRef.current.emit("send-nudge", { targetUserId: id });
    }

    setTimeout(() => {
      setNudgedFriendIds(prev => ({ ...prev, [id]: false }));
    }, 3000);
  };

  const handleManualThemeChange = (newTheme: "dark" | "light") => {
    setThemeMode(newTheme);
    submitProfileSettings({ theme: newTheme });
    triggerToast(`Switched interface language: ${newTheme === "light" ? "Luxury Amber Chalk" : "Pure Slate Obsidian"}`);
  };

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
    const name = user ? user.name.split(" ")[0] : "Developer";
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

  // High fidelity style bindings based on premium theme mode
  const bgMain = themeMode === "dark" ? "bg-[#09090b] text-[#e4e4e7]" : "bg-[#fbfbfa] text-[#1c1c1f]";
  const bgCard = themeMode === "dark" ? "bg-[#121215] border-[#222227]" : "bg-white border-[#ecebe6]";
  const bgInternal = themeMode === "dark" ? "bg-[#18181c]" : "bg-[#f5f4ef]";
  const textTitle = themeMode === "dark" ? "text-white" : "text-[#121215]";
  const textSub = themeMode === "dark" ? "text-[#a1a1aa]" : "text-[#62626e]";
  const borderRule = themeMode === "dark" ? "border-[#222227]" : "border-[#ecebe6]";
  const formInput = themeMode === "dark" ? "bg-[#0a0a0c] border-[#222227] text-white focus:border-neutral-500" : "bg-white border-[#dcdcd4] text-[#1c1c1f] focus:border-[#101012]";

  // Reusable Sidebar Render Helper (closed over App states)
  const renderSidebar = (isMobileDrawer: boolean = false) => {
    return (
      <aside className={`${isMobileDrawer ? 'w-full h-full' : 'hidden md:flex w-64 border-r h-screen sticky top-0'} flex flex-col shrink-0 ${bgCard} ${borderRule}`}>

        {/* Elegant Top Branding Section */}
        <div className={`p-6 border-b ${borderRule} space-y-1 flex items-center justify-between`}>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-serif italic text-2xl font-semibold tracking-tight">EndoCore.</span>
              <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 border rounded opacity-70">v1.0</span>
            </div>
            <p className="text-[10px] font-mono tracking-wider uppercase opacity-65 flex items-center">
              <span className={`h-1.5 w-1.5 rounded-full inline-block mr-2 animate-pulse ${socketStatus === "connected" && apiStatus === "online" && dbStatus === "connected"
                  ? "bg-emerald-500"
                  : "bg-red-500 animate-ping"
                }`}></span>
              WORKSTATION PIPELINE
            </p>
          </div>
          {isMobileDrawer && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-stone-500 hover:text-stone-300 rounded-full hover:bg-neutral-800/40 cursor-pointer"
              title="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Dynamic Guild Selector */}
        {user && (
          <div className={`p-4 border-b ${borderRule} ${themeMode === 'dark' ? 'bg-[#151518]/40' : 'bg-[#fafafa]/50'}`}>
            <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block mb-1.5">
              Active Focus Guild
            </label>
            <div className="relative">
              <select
                value={user.activeGroup}
                onChange={(e) => {
                  submitProfileSettings({ activeGroup: e.target.value });
                  if (isMobileDrawer) setMobileMenuOpen(false);
                }}
                className="w-full bg-transparent border-0 font-mono text-xs text-stone-500 hover:text-stone-300 focus:ring-0 cursor-pointer text-ellipsis overflow-hidden"
              >
                {groups.map(g => (
                  <option key={g.id} value={g.name} className={themeMode === 'dark' ? 'bg-zinc-900' : 'bg-white'}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Elegant Minimalist Navigation List */}
        <nav className="p-4 flex-1 select-none overflow-y-auto space-y-6">
          {/* HOME Section */}
          <div className="space-y-1">
            <div className="px-3 mb-2 text-[9px] font-mono tracking-widest text-zinc-500 uppercase">
              HOME
            </div>

            <button
              onClick={() => {
                setActiveTab("dashboard");
                setSelectedRoomName(null);
                setSelectedFriendId(null);
                if (isMobileDrawer) setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer ${activeTab === "dashboard" && !selectedRoomName && !selectedFriendId
                  ? (themeMode === 'dark' ? "bg-[#1c1c22] text-[#D4AF37] font-semibold" : "bg-[#f3f2eb] text-[#D4AF37] font-semibold")
                  : `text-stone-500 hover:${themeMode === 'dark' ? 'text-white' : 'text-black'}`
                }`}
            >
              <Home className="h-4 w-4 shrink-0 opacity-80" />
              <span>My Productivity</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("analytics");
                setSelectedRoomName(null);
                setSelectedFriendId(null);
                if (isMobileDrawer) setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer ${activeTab === "analytics"
                  ? (themeMode === 'dark' ? "bg-[#1c1c22] text-[#D4AF37] font-semibold" : "bg-[#f3f2eb] text-[#D4AF37] font-semibold")
                  : `text-stone-500 hover:${themeMode === 'dark' ? 'text-white' : 'text-black'}`
                }`}
            >
              <BarChart3 className="h-4 w-4 shrink-0 opacity-80" />
              <span>My Analytics</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("focus");
                setSelectedRoomName(null);
                setSelectedFriendId(null);
                if (isMobileDrawer) setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer ${activeTab === "focus"
                  ? (themeMode === 'dark' ? "bg-[#1c1c22] text-[#D4AF37] font-semibold" : "bg-[#f3f2eb] text-[#D4AF37] font-semibold")
                  : `text-stone-500 hover:${themeMode === 'dark' ? 'text-white' : 'text-black'}`
                }`}
            >
              <Target className="h-4 w-4 shrink-0 opacity-80" />
              <span>My Goals</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("connections");
                setSelectedRoomName(null);
                setSelectedFriendId(null);
                fetchConnections();
                if (isMobileDrawer) setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer ${activeTab === "connections"
                  ? (themeMode === 'dark' ? "bg-[#1c1c22] text-[#D4AF37] font-semibold" : "bg-[#f3f2eb] text-[#D4AF37] font-semibold")
                  : `text-stone-500 hover:${themeMode === 'dark' ? 'text-white' : 'text-black'}`
                }`}
            >
              <Users className="h-4 w-4 shrink-0 opacity-80" />
              <span>My Connections</span>
            </button>
          </div>

          {/* Rooms Section */}
          <div className="space-y-1">
            <div
              onClick={() => {
                setActiveTab("groups");
                setSelectedRoomName(null);
                setSelectedFriendId(null);
                if (isMobileDrawer) setMobileMenuOpen(false);
              }}
              className="px-3 mb-2 text-[9px] font-mono tracking-widest text-zinc-500 uppercase cursor-pointer hover:text-stone-300 flex items-center justify-between"
            >
              <span>ROOMS</span>
              <Plus className="h-3 w-3 hover:text-white" onClick={(e) => { e.stopPropagation(); setActiveTab("groups"); setSelectedRoomName(null); }} />
            </div>

            <div className="space-y-2">
              {groups.map((group) => {
                const isSelected = selectedRoomName === group.name;
                return (
                  <div key={group.id} className="space-y-1">
                    <button
                      onClick={() => {
                        enterRoomChannel(group.name);
                        if (isMobileDrawer) setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all duration-150 cursor-pointer ${isSelected
                          ? (themeMode === 'dark' ? "bg-[#1c1c22] text-white font-medium" : "bg-[#f3f2eb] text-black font-semibold")
                          : "text-stone-500 hover:text-stone-300"
                        }`}
                    >
                      <div className="flex items-center space-x-3 text-ellipsis overflow-hidden">
                        <span className="text-zinc-650 font-mono">#</span>
                        <span className="truncate">{group.name}</span>
                      </div>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    </button>

                    {/* Indented room sub-navigation */}
                    {isSelected && (
                      <div className="pl-4 border-l border-zinc-800 space-y-1 ml-4 mt-1">
                        <button
                          onClick={() => {
                            setActiveTab("groups");
                            setRoomTab("overview");
                            if (isMobileDrawer) setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center space-x-2 px-2 py-1.5 text-[11px] font-mono rounded transition-colors cursor-pointer text-left ${roomTab === "overview" && activeTab === "groups" ? "text-white font-medium bg-zinc-850/40" : "text-stone-500 hover:text-stone-300"
                            }`}
                        >
                          <LayoutDashboard className="h-3 w-3 opacity-70" />
                          <span>Overview</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab("groups");
                            setRoomTab("members");
                            if (isMobileDrawer) setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center space-x-2 px-2 py-1.5 text-[11px] font-mono rounded transition-colors cursor-pointer text-left ${roomTab === "members" && activeTab === "groups" ? "text-white font-medium bg-zinc-850/40" : "text-stone-500 hover:text-stone-300"
                            }`}
                        >
                          <Users className="h-3 w-3 opacity-70" />
                          <span>Members</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab("groups");
                            setRoomTab("live");
                            if (isMobileDrawer) setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center space-x-2 px-2 py-1.5 text-[11px] font-mono rounded transition-colors cursor-pointer text-left ${roomTab === "live" && activeTab === "groups" ? "text-white font-medium bg-zinc-850/40" : "text-stone-500 hover:text-stone-300"
                            }`}
                        >
                          <Activity className="h-3 w-3 opacity-70" />
                          <span>Live Activity</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab("groups");
                            setRoomTab("leaderboard");
                            if (isMobileDrawer) setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center space-x-2 px-2 py-1.5 text-[11px] font-mono rounded transition-colors cursor-pointer text-left ${roomTab === "leaderboard" && activeTab === "groups" ? "text-white font-medium bg-zinc-850/40" : "text-stone-500 hover:text-stone-300"
                            }`}
                        >
                          <Award className="h-3 w-3 opacity-70" />
                          <span>Leaderboard</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab("groups");
                            setRoomTab("ai-summary");
                            if (isMobileDrawer) setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center space-x-2 px-2 py-1.5 text-[11px] font-mono rounded transition-colors cursor-pointer text-left ${roomTab === "ai-summary" && activeTab === "groups" ? "text-white font-medium bg-zinc-850/40" : "text-stone-500 hover:text-stone-300"
                            }`}
                        >
                          <Sparkles className="h-3 w-3 opacity-70" />
                          <span>AI Summary</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab("groups");
                            setRoomTab("chat");
                            if (isMobileDrawer) setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center space-x-2 px-2 py-1.5 text-[11px] font-mono rounded transition-colors cursor-pointer text-left ${roomTab === "chat" && activeTab === "groups" ? "text-white font-medium bg-zinc-850/40" : "text-stone-500 hover:text-stone-300"
                            }`}
                        >
                          <MessageSquare className="h-3 w-3 opacity-70" />
                          <span>Chat</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Account Section */}
          <div className="space-y-1">
            <div className="px-3 mb-2 text-[9px] font-mono tracking-widest text-zinc-500 uppercase">
              ACCOUNT
            </div>

            <button
              onClick={() => {
                setActiveTab("profile");
                setSelectedRoomName(null);
                setSelectedFriendId(null);
                if (isMobileDrawer) setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer ${activeTab === "profile"
                  ? (themeMode === 'dark' ? "bg-[#1c1c22] text-[#D4AF37] font-semibold" : "bg-[#f3f2eb] text-[#D4AF37] font-semibold")
                  : `text-stone-500 hover:${themeMode === 'dark' ? 'text-white' : 'text-black'}`
                }`}
            >
              <User className="h-4 w-4 shrink-0 opacity-80" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("settings");
                setSelectedRoomName(null);
                setSelectedFriendId(null);
                if (isMobileDrawer) setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer ${activeTab === "settings"
                  ? (themeMode === 'dark' ? "bg-[#1c1c22] text-[#D4AF37] font-semibold" : "bg-[#f3f2eb] text-[#D4AF37] font-semibold")
                  : `text-stone-500 hover:${themeMode === 'dark' ? 'text-white' : 'text-black'}`
                }`}
            >
              <Settings className="h-4 w-4 shrink-0 opacity-80" />
              <span>Settings</span>
            </button>
          </div>
        </nav>

        {/* Bottom Profile Status Card */}
        {user && (
          <div className={`p-5 border-t ${borderRule} space-y-4`}>
            <div className="flex items-center space-x-3">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className={`h-9 w-9 rounded-full object-cover border ${themeMode === 'dark' ? 'border-neutral-800' : 'border-neutral-200'}`}
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-medium truncate">{user.name}</h4>
                <p className="text-[10px] opacity-60 font-mono truncate lowercase">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-550 bg-[#f5f4ef]/35 dark:bg-[#18181c]/50 p-2.5 rounded-lg border dark:border-[#222227] border-stone-200/50">
              <div className="flex items-center space-x-1">
                <Laptop className="h-3 w-3 inline opacity-60" />
                <span className="truncate max-w-[80px]">{user.deviceConnected}</span>
              </div>
              <span className={`text-[9px] uppercase tracking-wider ${electronTracking ? "text-emerald-500 font-semibold" : "text-stone-400"}`}>
                {electronTracking ? "Agent: Tracking ✓" : "Synced ✓"}
              </span>
            </div>

            <button
              onClick={() => {
                handleLogout();
                if (isMobileDrawer) setMobileMenuOpen(false);
              }}
              className="w-full text-center py-2 border dark:border-neutral-800/80 border-stone-200/55 text-[10px] font-mono uppercase tracking-wider rounded-lg text-red-500 hover:text-red-400 dark:hover:bg-red-950/20 hover:bg-red-50/50 cursor-pointer transition-all duration-150"
            >
              Sign Out
            </button>
          </div>
        )}
      </aside>
    );
  };

  // Selected friend detailed side navigation pane helper
  const rightPaneFriend = friends.find(f => f.id === selectedFriendId);

  if (!token) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-350 ease-out font-sans ${bgMain}`}>
        {/* ⚡ PREMIUM MINIMAL TOAST ALERT */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
              animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
              className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-full shadow-2xl flex items-center space-x-3 text-xs tracking-wide font-mono ${themeMode === "dark" ? "bg-white text-black border border-neutral-100" : "bg-neutral-900 text-white border border-neutral-800"
                }`}
            >
              <span className="h-2 w-2 rounded-full bg-stone-500 animate-ping"></span>
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md p-8 rounded-3xl ${bgCard} border shadow-2xl space-y-8`}
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
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-white text-xs py-3.5 rounded-xl tracking-wider font-mono uppercase font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {authLoading ? "Verifying Traces..." : "Connect Workspace"}
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

              <div className="mt-4 p-4 rounded-2xl border border-dashed dark:border-neutral-800/80 border-stone-200/50 text-[10px] font-mono text-zinc-500 space-y-1 bg-[#fafafa]/50 dark:bg-[#151518]/20">
                <p className="font-semibold text-stone-400">Demo workstation credentials:</p>
                <p>Email: <span className="dark:text-stone-300 select-all">tawfeeqbahur@gmail.com</span></p>
                <p>Password: <span className="dark:text-stone-300 select-all">password123</span></p>
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
                className="w-full bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-white text-xs py-3.5 rounded-xl tracking-wider font-mono uppercase font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {authLoading ? "Registering Identity..." : "Establish Clearances"}
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

  // --- START OF MOBILE COMPANION VIEW ---
  const renderMobileView = () => {
    const activeGroupName = user?.activeGroup || (groups.length > 0 ? groups[0].name : "");
    const occupants = roomsOccupants[activeGroupName] || [];
    const todayFocusHours = myActivity ? (myActivity.durationSeconds / 3600).toFixed(1) : "0.0";
    const productivityScore = myActivity ? Math.min(100, Math.round(((myActivity.durationSeconds / 3600) / (user?.productivityGoal || 6)) * 100)) : 0;

    return (
      <div className={`min-h-screen flex flex-col transition-colors duration-350 ease-out font-sans ${bgMain} pb-16`}>

        {/* ⚡ PREMIUM MINIMAL TOAST ALERT */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
              animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
              className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 text-[10px] tracking-wide font-mono ${themeMode === "dark" ? "bg-white text-black border border-neutral-100" : "bg-neutral-900 text-white border border-neutral-800"
                }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-stone-500 animate-ping"></span>
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimal Companion Header */}
        <header className={`h-14 border-b shrink-0 px-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md ${borderRule} ${themeMode === "dark" ? "bg-[#09090b]/80" : "bg-[#fbfbfa]/80"
          }`}>
          <div className="flex items-center space-x-2">
            <span className="font-serif italic text-base font-semibold tracking-tight">EndoCore.</span>
            <span className="font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.2 border rounded opacity-75">mobile</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick status dot for PC tracking agent connection state */}
            <div className="flex items-center space-x-1 bg-[#f5f4ef] dark:bg-[#18181c] px-2 py-0.5 rounded-full border dark:border-[#222227] border-stone-200/50 text-[9px] font-mono text-stone-400">
              <span className={`h-1.5 w-1.5 rounded-full ${electronTracking ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"}`}></span>
              <span>{electronTracking ? "PC CONNECTED" : "PC IDLE"}</span>
            </div>

            {/* Mini light-dark theme switch */}
            <button
              onClick={() => handleManualThemeChange(themeMode === "dark" ? "light" : "dark")}
              className="p-1 rounded-full text-stone-500 hover:text-stone-300"
            >
              {themeMode === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </div>
        </header>

        {/* Main scrollable body viewport */}
        <main className="flex-grow overflow-y-auto px-4 py-4 space-y-4">

          {/* TAB 1: WORKSPACE CONTROL SCREEN */}
          {mobileTab === "control" && myActivity && (
            <div className="space-y-4">

              {/* Circular productivity summary card */}
              <div className={`p-5 rounded-2xl border ${bgCard} ${borderRule} flex items-center justify-between bg-gradient-to-br from-[#121215] to-[#181820]/30`}>
                <div className="space-y-1 flex-1">
                  <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest block">Workstation Focus Dashboard</span>
                  <h3 className="text-base font-serif italic font-semibold text-white mt-1">Hello, {user ? user.name.split(" ")[0] : "Developer"}</h3>

                  <div className="flex items-baseline space-x-1 pt-2">
                    <span className="text-3xl font-mono font-bold tracking-tight text-white">{todayFocusHours}</span>
                    <span className="text-xs text-stone-500 font-mono">hrs focus today</span>
                  </div>
                  <span className="text-[10px] text-zinc-550 dark:text-zinc-500 font-mono block">Workstation: {user?.deviceConnected || "Default PC"}</span>
                </div>

                {/* Score percentage circle display */}
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="30" fill="none" stroke={themeMode === "dark" ? "#1a1a20" : "#f1f0ea"} strokeWidth="4" />
                    <circle cx="40" cy="40" r="30" fill="none" stroke="#D4AF37" strokeWidth="4.5"
                      strokeDasharray="188.4" strokeDashoffset={188.4 - (productivityScore / 100) * 188.4}
                      strokeLinecap="round" className="transition-all duration-700" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                    <span className="text-sm font-mono font-bold text-white">{productivityScore}%</span>
                    <span className="text-[7px] text-stone-500 uppercase tracking-wider mt-0.5">Score</span>
                  </div>
                </div>
              </div>

              {/* Large Controller Action Trigger */}
              <div className={`p-4 rounded-2xl border ${bgCard} ${borderRule} space-y-4 text-center`}>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-[#a1a1aa] bg-stone-100 dark:bg-zinc-800/60 border dark:border-neutral-800 px-2 py-0.5 rounded-full inline-block">
                    Telemetry Action Controller
                  </span>
                  <div className="text-xs text-stone-400 mt-1">
                    Current Running App: <span className="font-semibold text-white font-mono">{myActivity.app}</span>
                  </div>
                </div>

                <button
                  onClick={() => updateMyActiveTracker(undefined, undefined, !myActivity?.isPaused)}
                  disabled={updatingActivity}
                  className={`w-full py-4 rounded-xl font-mono text-xs font-bold tracking-widest uppercase border transition-all duration-300 shadow-md cursor-pointer ${myActivity.isPaused
                      ? "bg-red-950/20 text-red-400 border-red-900/30 hover:bg-red-900/10"
                      : "bg-emerald-950/20 text-emerald-400 border-emerald-900/30 hover:bg-emerald-900/10"
                    }`}
                >
                  {myActivity.isPaused ? "▶️ Resume PC Tracking" : "⏸️ Pause PC Tracking"}
                </button>
              </div>

              {/* Workstation Quick Switcher parameters */}
              <div className={`p-5 rounded-2xl border ${bgCard} ${borderRule} space-y-4`}>
                <h4 className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block border-b border-zinc-850 pb-2">
                  Update PC Tracking Details
                </h4>

                {/* Switch App Focus Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-mono tracking-widest text-stone-500 block leading-none">Select Active Application</label>
                  <select
                    value={myActivity.app}
                    onChange={(e) => updateMyActiveTracker(e.target.value, undefined, undefined)}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-mono ${formInput} transition-all cursor-pointer`}
                  >
                    {myActivity.openApps && myActivity.openApps.length > 0 ? (
                      <>
                        <optgroup label="Open Apps on PC" className="text-[9px] font-mono text-zinc-550 bg-[#121215]">
                          {!myActivity.openApps.includes(myActivity.app) && myActivity.app !== "Offline" && myActivity.app !== "Inactive" && (
                            <option value={myActivity.app}>{myActivity.app}</option>
                          )}
                          {myActivity.openApps.map(app => (
                            <option key={app} value={app}>{app}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Default Presets" className="text-[9px] font-mono text-zinc-550 bg-[#121215]">
                          <option value="VS Code">VS Code</option>
                          <option value="Chrome">Chrome Browser</option>
                          <option value="Figma">Figma Design</option>
                          <option value="Terminal">Terminal / Shell</option>
                          <option value="Spotify">Spotify Music</option>
                        </optgroup>
                      </>
                    ) : (
                      <>
                        <option value="VS Code">VS Code</option>
                        <option value="Chrome">Chrome Browser</option>
                        <option value="Figma">Figma Design</option>
                        <option value="Terminal">Terminal / Shell</option>
                        <option value="Spotify">Spotify Music</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Edit Project Title Details */}
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-mono tracking-widest text-stone-500 block leading-none">Active Project / Task Name</label>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="text"
                      value={projectInput}
                      onChange={(e) => setProjectInput(e.target.value)}
                      className={`w-full rounded-xl px-3 py-2 text-xs ${formInput} transition-all`}
                      placeholder="e.g. EndoCore Workspace"
                      onKeyDown={(e) => e.key === "Enter" && updateMyActiveTracker(undefined, projectInput, undefined)}
                    />
                    <button
                      onClick={() => updateMyActiveTracker(undefined, projectInput, undefined)}
                      className="bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-white text-xs px-4 py-2 rounded-xl font-mono uppercase font-semibold transition-all cursor-pointer shrink-0"
                    >
                      Sync
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ROOM STATUS BOARD & CHAT SCREEN */}
          {mobileTab === "room" && (
            <div className="space-y-4 pb-4">

              {/* Guild Room selector parameters */}
              <div className={`p-4 rounded-2xl border ${bgCard} ${borderRule} space-y-2`}>
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block">
                    Focus Guild channel
                  </label>
                  <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded-full font-mono font-semibold animate-pulse">
                    Live
                  </span>
                </div>
                <select
                  value={activeGroupName}
                  onChange={(e) => {
                    enterRoomChannel(e.target.value);
                  }}
                  className={`w-full rounded-xl px-3 py-2.5 text-xs font-mono ${formInput} transition-all cursor-pointer`}
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.name} className={themeMode === 'dark' ? 'bg-[#121215]' : 'bg-white'}>
                      #{g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Members horizontal carousel lists */}
              <div className={`p-4 rounded-2xl border ${bgCard} ${borderRule} space-y-3`}>
                <div className="flex justify-between items-center text-[9px] font-mono text-stone-500 uppercase tracking-widest border-b border-zinc-850 pb-2">
                  <span>Room occupants ({occupants.length})</span>
                  <span>Co-workers online</span>
                </div>

                {occupants.length === 0 ? (
                  <p className="text-[10px] text-stone-500 font-mono italic py-2">No other co-workers in this room currently.</p>
                ) : (
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {occupants.map((occ) => {
                      const isOnline = occ.status !== "offline";
                      const styleMeta = getStatusNodeMeta(occ.status as any);

                      return (
                        <div key={occ.id} className="p-2.5 bg-black/10 dark:bg-black/35 rounded-xl border dark:border-neutral-850 border-stone-200/30 flex items-center justify-between text-[11px] font-mono">
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className="relative shrink-0">
                              <img
                                src={occ.avatarUrl}
                                alt={occ.name}
                                className="h-6.5 w-6.5 rounded-full object-cover border dark:border-neutral-800 border-neutral-200"
                              />
                              <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-black ${styleMeta.color}`} />
                            </div>
                            <div className="min-w-0">
                              <span className="font-sans font-semibold text-xs text-stone-200 truncate block leading-tight">{occ.name}</span>
                              <span className="text-[8px] text-stone-500 uppercase tracking-wider block">{occ.role}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="bg-zinc-850 text-zinc-300 px-1.5 py-0.5 rounded text-[8px] font-medium border border-zinc-800 max-w-[65px] truncate">
                              {occ.currentActivity?.app || "Offline"}
                            </span>
                            <button
                              onClick={() => triggerPeerNudge(occ.name, occ.id)}
                              disabled={nudgedFriendIds[occ.id]}
                              className={`px-2 py-1 rounded border text-[8px] font-mono uppercase tracking-wider transition-all ${nudgedFriendIds[occ.id]
                                  ? "bg-stone-300 text-black border-stone-300"
                                  : "text-stone-500 hover:text-stone-300 dark:border-neutral-800 border-stone-250"
                                }`}
                            >
                              {nudgedFriendIds[occ.id] ? "Waved!" : "Wave"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Simplified Room chat viewport */}
              <div className={`p-4 rounded-2xl border ${bgCard} ${borderRule} space-y-3`}>
                <div className="flex justify-between items-center text-[9px] font-mono text-stone-500 uppercase tracking-widest border-b border-zinc-850 pb-2">
                  <span>Room conversation board</span>
                  <span>#{activeGroupName} Chat</span>
                </div>

                {/* Chat items scroll box */}
                <div className="h-56 bg-black/10 dark:bg-black/20 rounded-xl p-3 border dark:border-neutral-850 border-stone-200/50 overflow-y-auto space-y-3">
                  {roomChatMessages.length > 0 ? (
                    roomChatMessages.map((msg) => {
                      const isMe = msg.userId === user?.id;
                      return (
                        <div key={msg.id} className={`flex items-start gap-2 max-w-[90%] ${isMe ? "ml-auto flex-row-reverse" : ""}`}>
                          <img src={msg.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} className="h-6 w-6 rounded-full object-cover shrink-0 mt-0.5 border border-zinc-800" />
                          <div className="space-y-0.5">
                            <div className={`flex items-center gap-1.5 text-[8px] font-mono text-stone-500 ${isMe ? "justify-end" : ""}`}>
                              <span className="font-semibold text-stone-400">{msg.userName.split(" ")[0]}</span>
                              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className={`px-3 py-2 rounded-xl text-[11px] leading-relaxed ${isMe
                                ? "bg-stone-800 text-white dark:bg-stone-300 dark:text-black rounded-tr-none"
                                : `bg-zinc-800/40 dark:bg-[#151518] text-stone-300 border ${borderRule} rounded-tl-none`
                              }`}>
                              {msg.message}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-[10px] font-mono text-stone-500 italic">
                      No chat logs. Write a message to connect!
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Message input elements */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomChatInput}
                    onChange={(e) => setRoomChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendRoomChatMessage()}
                    className={`flex-grow rounded-xl px-3 py-2 text-xs tracking-wide ${formInput}`}
                    placeholder="Type message to room..."
                  />
                  <button
                    onClick={sendRoomChatMessage}
                    className="bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-white text-xs px-4 py-2 rounded-xl font-mono uppercase font-semibold cursor-pointer shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: USER PERSONAL IDENTITY & SETTINGS SCREEN */}
          {mobileTab === "me" && user && (
            <div className="space-y-4">

              {/* Profile summary details */}
              <div className={`p-6 rounded-2xl border ${bgCard} ${borderRule} flex flex-col items-center justify-center text-center space-y-3 bg-[#121215]`}>
                <img
                  src={user.avatarUrl}
                  alt="Avatar profile"
                  className="h-16 w-16 rounded-full object-cover border dark:border-[#D4AF37] border-zinc-300 shadow-md animate-pulse"
                />
                <div className="space-y-0.5">
                  <h3 className="text-base font-serif italic font-bold text-white">{user.name}</h3>
                  <span className="text-[10px] font-mono text-stone-500 lowercase block">{user.email}</span>
                </div>
              </div>

              {/* Settings configuration form */}
              <div className={`p-5 rounded-2xl border ${bgCard} ${borderRule} space-y-4`}>
                <h4 className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block border-b border-zinc-850 pb-2">
                  Personal Settings & Goals
                </h4>

                {/* Update custom status text */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono tracking-widest text-stone-500 block leading-none">Custom Status Message</label>
                  <input
                    type="text"
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    onBlur={() => submitProfileSettings({ customStatus: statusInput })}
                    onKeyDown={(e) => e.key === "Enter" && submitProfileSettings({ customStatus: statusInput })}
                    className={`w-full rounded-xl px-3 py-2.5 text-xs ${formInput} transition-all`}
                    placeholder="Set what you are doing..."
                  />
                </div>

                {/* Focus Target Hours selector */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono tracking-widest text-stone-500 block leading-none">Daily Focus Goal Hour Line</label>
                  <select
                    value={user.productivityGoal}
                    onChange={(e) => submitProfileSettings({ productivityGoal: parseInt(e.target.value) })}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-mono lowercase ${formInput} transition-all cursor-pointer`}
                  >
                    <option value="4">4 hours target</option>
                    <option value="6">6 hours target</option>
                    <option value="8">8 hours target</option>
                    <option value="10">10 hours target</option>
                  </select>
                </div>
              </div>

              {/* Sign Out Trigger action */}
              <div className="pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full py-3.5 border dark:border-red-950 border-red-200 dark:hover:bg-red-950/20 hover:bg-red-50 text-xs font-mono uppercase tracking-wider rounded-xl text-red-500 cursor-pointer transition-all text-center"
                >
                  Sign Out Workspace
                </button>
              </div>

            </div>
          )}

        </main>

        {/* Sticky Premium Glassmorphic Bottom Navigation Bar */}
        <nav className={`fixed bottom-0 left-0 right-0 h-16 border-t backdrop-blur-lg flex items-center justify-around z-50 ${borderRule} ${themeMode === "dark" ? "bg-[#09090b]/90" : "bg-[#fbfbfa]/90"
          }`}>
          {/* Tab Button: Control */}
          <button
            onClick={() => setMobileTab("control")}
            className={`flex flex-col items-center space-y-1 py-1 cursor-pointer transition-colors ${mobileTab === "control" ? "text-[#D4AF37]" : "text-stone-500"
              }`}
          >
            <Laptop className="h-5 w-5" />
            <span className="text-[9px] font-mono uppercase tracking-wider">Control</span>
          </button>

          {/* Tab Button: Room */}
          <button
            onClick={() => setMobileTab("room")}
            className={`flex flex-col items-center space-y-1 py-1 cursor-pointer transition-colors ${mobileTab === "room" ? "text-[#D4AF37]" : "text-stone-500"
              }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-[9px] font-mono uppercase tracking-wider">Room</span>
          </button>

          {/* Tab Button: Me */}
          <button
            onClick={() => setMobileTab("me")}
            className={`flex flex-col items-center space-y-1 py-1 cursor-pointer transition-colors ${mobileTab === "me" ? "text-[#D4AF37]" : "text-stone-500"
              }`}
          >
            <User className="h-5 w-5" />
            <span className="text-[9px] font-mono uppercase tracking-wider">Me</span>
          </button>
        </nav>

      </div>
    );
  };

  const platformMode = usePlatformMode();

  // Mobile layout branch check – use the inline mobile view connected to real app state
  if (platformMode === "mobile-companion" || platformMode === "responsive-web") {
    // Show loading splash while profile data is being fetched
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
    return renderMobileView();
  }
  // --- END OF MOBILE COMPANION VIEW ---

  // Loading splash – shown after login while profile data is being fetched
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


  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-350 ease-out font-sans ${bgMain}`}>

      {/* ⚡ PREMIUM MINIMAL TOAST ALERT */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-full shadow-2xl flex items-center space-x-3 text-xs tracking-wide font-mono ${themeMode === "dark" ? "bg-white text-black border border-neutral-100" : "bg-neutral-900 text-white border border-neutral-800"
              }`}
          >
            <span className="h-2 w-2 rounded-full bg-stone-500 animate-ping"></span>
            <span>{toastMessage}</span>
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
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">

        {/* Elegant Top Header with Minimalist Meta Controls */}
        <header className={`h-16 border-b shrink-0 px-6 md:px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md ${borderRule} ${themeMode === "dark" ? "bg-[#09090b]/80" : "bg-[#fbfbfa]/80"
          }`}>
          <div className="flex items-center space-x-3 flex-1">
            {/* Mobile Hamburger Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-stone-500 hover:text-stone-300 rounded-lg hover:bg-neutral-800/40 cursor-pointer"
              title="Open Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <h1 className="text-lg font-serif italic tracking-tight font-medium">Workspace Status</h1>

            {/* System Status Quick Indicator */}
            <div className="flex items-center space-x-1.5 bg-[#f5f4ef]/40 dark:bg-stone-900/40 px-2.5 py-1 rounded-full border dark:border-neutral-850 border-stone-250/60 text-[9px] font-mono text-stone-400">
              <span className={`h-1.5 w-1.5 rounded-full inline-block ${socketStatus === "connected" && apiStatus === "online" && dbStatus === "connected"
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-red-500 animate-ping"
                }`}></span>
              <span className="hidden sm:inline">
                {socketStatus === "connected" && apiStatus === "online" && dbStatus === "connected"
                  ? "Pipeline Healthy"
                  : "Pipeline Error"}
              </span>
            </div>

            <span className="h-3.5 w-px bg-neutral-400/20 hidden md:block"></span>
            <p className="text-[10px] font-mono text-[#a1a1aa] leading-none uppercase hidden md:block">
              {user ? `Active guild: ${user.activeGroup}` : ""}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Minimal Dark/Light Toggle Icon */}
            <div className="flex items-center bg-[#f5f4ef] dark:bg-[#18181c] p-1 rounded-full border dark:border-[#222227] border-stone-200/60">
              <button
                onClick={() => handleManualThemeChange("light")}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${themeMode === "light" ? "bg-white text-[#1c1c1f] shadow-sm" : "text-stone-500 hover:text-white"}`}
                title="Light Mode"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleManualThemeChange("dark")}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${themeMode === "dark" ? "bg-[#121215] text-[#e4e4e7] shadow-sm" : "text-stone-400 hover:text-[#1c1c1f]"}`}
                title="Dark Mode"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Live Clock with UTC stamp */}
            <div className="text-[11px] font-mono opacity-80 tracking-widest hidden md:inline-block">
              {currentTimeText} UTC
            </div>
          </div>
        </header>

        {/* 📚 PRIMARY SCROLLABLE BODY */}
        <div className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-8 max-w-5xl w-full mx-auto">

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
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >

              {/* 1⃣ MAIN DASHBOARD TAB VIEW */}
              {activeTab === "dashboard" && (
                <>
                  {/* EDITORIAL HERO TITLE BLOCK */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold tracking-tight leading-tight">
                        {getGreeting()}
                      </h2>
                      <p className={`text-xs sm:text-sm tracking-wide ${textSub}`}>
                        Here's your productivity overview for today. Keep your momentum going!
                      </p>
                    </div>

                    {/* Quick controls pill container */}
                    <div className="flex flex-wrap items-center gap-2 bg-[#121215]/60 border border-[#222227] p-1.5 rounded-2xl sm:rounded-full w-fit">
                      {/* Agent Active/Paused Toggle */}
                      <button
                        onClick={() => updateMyActiveTracker(undefined, undefined, !myActivity?.isPaused)}
                        disabled={updatingActivity}
                        className={`px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${myActivity?.isPaused
                            ? "bg-red-950/40 text-red-400 border-red-900/35"
                            : "bg-emerald-950/40 text-emerald-400 border-emerald-900/35"
                          }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${myActivity?.isPaused ? "bg-red-500 animate-pulse" : "bg-emerald-500 animate-ping"}`} />
                        <span>{myActivity?.isPaused ? "AGENT PAUSED" : "AGENT ACTIVE"}</span>
                      </button>

                      <span className="h-4 w-px bg-zinc-800 hidden sm:block"></span>

                      {/* Private Status Toggle */}
                      <button
                        onClick={() => submitProfileSettings({ privacyMode: "Private" })}
                        className={`px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${user?.privacyMode === "Private"
                            ? "bg-amber-950/40 text-amber-400 border-amber-900/35"
                            : "bg-transparent text-stone-500 border-transparent hover:text-stone-300"
                          }`}
                      >
                        <Lock className="h-3 w-3" />
                        <span>PRIVATE</span>
                      </button>

                      {/* Team Status Toggle */}
                      <button
                        onClick={() => submitProfileSettings({ privacyMode: "Team" })}
                        className={`px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${user?.privacyMode === "Team"
                            ? "bg-purple-950/40 text-purple-400 border-purple-900/35"
                            : "bg-transparent text-stone-500 border-transparent hover:text-stone-300"
                          }`}
                      >
                        <Users className="h-3 w-3" />
                        <span>TEAM</span>
                      </button>

                      {/* Public Status Toggle */}
                      <button
                        onClick={() => submitProfileSettings({ privacyMode: "Public" })}
                        className={`px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${user?.privacyMode === "Public" || (!user?.privacyMode || user?.privacyMode === "Level 1: Full Detail")
                            ? "bg-blue-950/40 text-blue-400 border-blue-900/35"
                            : "bg-transparent text-stone-500 border-transparent hover:text-stone-300"
                          }`}
                      >
                        <Globe className="h-3 w-3" />
                        <span>PUBLIC</span>
                      </button>
                    </div>
                  </div>

                  {/* WORKSPACE PIPELINE DIAGNOSTICS & SYSTEM STATUS */}
                  <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border ${bgCard} ${borderRule} space-y-4`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-xs font-semibold font-mono tracking-widest uppercase text-stone-400 flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-zinc-505" />
                          Workspace Pipeline Connectivity Status
                        </h3>
                        <p className={`text-[11px] ${textSub}`}>
                          Live telemetry integrity check across development cluster microservices.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            triggerToast("Running diagnostics health-check...");
                            await checkHealth();
                            if (socketRef.current) {
                              if (!socketRef.current.connected) {
                                socketRef.current.connect();
                              }
                            }
                          }}
                          className="border dark:border-[#222227] border-neutral-300 hover:border-[#D4AF37] dark:hover:bg-zinc-900/30 hover:bg-zinc-100/50 dark:text-white text-neutral-800 hover:text-[#D4AF37] text-[10px] px-4 py-2 rounded-xl font-mono uppercase tracking-wide font-semibold transition-all duration-150 cursor-pointer bg-transparent"
                        >
                          Run diagnostics
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                      {/* 1. REST API */}
                      <div className="p-3.5 rounded-2xl bg-black/10 dark:bg-black/35 border dark:border-[#222227]/40 border-stone-200/20 flex flex-col justify-between h-20 transition-all hover:border-zinc-700/40">
                        <span className="text-[9px] font-mono text-stone-500 uppercase tracking-wider block">REST API</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`h-2.5 w-2.5 rounded-full ${apiStatus === "online" ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 animate-ping shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`} />
                          <span className="text-xs font-mono font-bold text-stone-300">{apiStatus === "online" ? "ONLINE" : "OFFLINE"}</span>
                        </div>
                      </div>

                      {/* 2. WebSockets */}
                      <div className="p-3.5 rounded-2xl bg-black/10 dark:bg-black/35 border dark:border-[#222227]/40 border-stone-200/20 flex flex-col justify-between h-20 transition-all hover:border-zinc-700/40">
                        <span className="text-[9px] font-mono text-stone-500 uppercase tracking-wider block">Websockets</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`h-2.5 w-2.5 rounded-full ${socketStatus === "connected"
                              ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                              : socketStatus === "error"
                                ? "bg-red-500 animate-ping shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                : "bg-neutral-500 shadow-[0_0_8px_rgba(115,115,115,0.5)]"
                            }`} />
                          <span className="text-xs font-mono font-bold text-stone-300">
                            {socketStatus === "connected" ? "CONNECTED" : socketStatus === "error" ? "ERROR STATE" : "DISCONNECTED"}
                          </span>
                        </div>
                      </div>

                      {/* 3. Supabase Database */}
                      <div className="p-3.5 rounded-2xl bg-black/10 dark:bg-black/35 border dark:border-[#222227]/40 border-stone-200/20 flex flex-col justify-between h-20 transition-all hover:border-zinc-700/40">
                        <span className="text-[9px] font-mono text-stone-500 uppercase tracking-wider block">Supabase DB</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`h-2.5 w-2.5 rounded-full ${dbStatus === "connected" ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 animate-ping shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`} />
                          <span className="text-xs font-mono font-bold text-stone-300">
                            {dbStatus === "connected" ? "CONNECTED" : dbStatus === "checking" ? "CHECKING..." : "ERROR STATE"}
                          </span>
                        </div>
                      </div>

                      {/* 4. Desktop Agent */}
                      <div className="p-3.5 rounded-2xl bg-black/10 dark:bg-black/35 border dark:border-[#222227]/40 border-stone-200/20 flex flex-col justify-between h-20 transition-all hover:border-zinc-700/40">
                        <span className="text-[9px] font-mono text-stone-500 uppercase tracking-wider block">Desktop Agent</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`h-2.5 w-2.5 rounded-full ${electronTracking ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-neutral-500 shadow-[0_0_8px_rgba(115,115,115,0.5)]"}`} />
                          <span className="text-xs font-mono font-bold text-stone-300">{electronTracking ? "SYNCED" : "OFFLINE / IDLE"}</span>
                        </div>
                      </div>

                      {/* 5. Gemini AI Engine */}
                      <div className="p-3.5 rounded-2xl bg-black/10 dark:bg-black/35 border dark:border-[#222227]/40 border-stone-200/20 flex flex-col justify-between h-20 transition-all hover:border-zinc-700/40">
                        <span className="text-[9px] font-mono text-stone-500 uppercase tracking-wider block">Gemini AI</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`h-2.5 w-2.5 rounded-full ${aiStatus === "configured" && !insightsError
                              ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                              : "bg-red-500 animate-ping shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                            }`} />
                          <span className="text-xs font-mono font-bold text-stone-300">
                            {aiStatus === "configured" && !insightsError ? "ACTIVE" : aiStatus === "checking" ? "CHECKING..." : "ERROR STATE"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARDS GRID */}
                  <div className="grid grid-cols-12 gap-3 sm:gap-5">
                    {/* Focus Time */}
                    <div className={`col-span-12 sm:col-span-6 lg:col-span-2 p-4 sm:p-5 rounded-2xl border ${bgCard} ${borderRule} flex flex-col justify-between h-28 sm:h-32`}>
                      <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block">Focus Time</span>
                      <div className="space-y-1">
                        <div className="text-2xl font-serif font-semibold">{myActivity ? (myActivity.durationSeconds / 3600).toFixed(1) : "0.0"} hrs</div>
                        <div className="text-[10px] text-zinc-500 font-mono">Goal: {user?.productivityGoal || 6} hrs</div>
                      </div>
                    </div>
                    {/* Productivity Score */}
                    <div className={`col-span-12 sm:col-span-6 lg:col-span-2 p-4 sm:p-5 rounded-2xl border ${bgCard} ${borderRule} flex flex-col justify-between h-28 sm:h-32`}>
                      <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block">Productivity Score</span>
                      <div className="space-y-1">
                        <div className="text-2xl font-serif font-semibold">{myActivity ? Math.min(100, Math.round(((myActivity.durationSeconds / 3600) / (user?.productivityGoal || 6)) * 100)) : 0}%</div>
                        <div className="text-[10px] text-zinc-500 font-mono">Today's target achieved</div>
                      </div>
                    </div>
                    {/* Current Session */}
                    <div className={`col-span-12 sm:col-span-6 lg:col-span-2 p-4 sm:p-5 rounded-2xl border ${bgCard} ${borderRule} flex flex-col justify-between h-28 sm:h-32`}>
                      <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block">Current Session</span>
                      <div className="space-y-1">
                        <div className="text-lg font-serif font-semibold truncate">{myActivity ? myActivity.app : "Inactive"}</div>
                        <div className="text-[10px] text-zinc-500 font-mono truncate">Proj: {myActivity ? myActivity.project : "None"}</div>
                      </div>
                    </div>
                    {/* Today's Progress / Activity Tracker Controls */}
                    {myActivity && (
                      <div className={`col-span-12 sm:col-span-12 lg:col-span-6 p-4 sm:p-5 rounded-2xl border ${bgCard} ${borderRule} flex flex-col justify-between min-h-32`}>
                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center space-x-2">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-[#a1a1aa] bg-stone-100 dark:bg-zinc-800/60 border dark:border-neutral-800/50 border-neutral-200 px-2.5 py-0.5 rounded-full">
                              Today's Progress / Activity Tracker
                            </span>
                            {myActivity.isPaused && (
                              <span className="text-[9px] font-mono uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full animate-pulse">
                                Paused
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                          {/* App Selector Custom Node */}
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block leading-none">Select Active Application</label>
                            <select
                              value={myActivity.app}
                              onChange={(e) => updateMyActiveTracker(e.target.value, undefined, undefined)}
                              className={`w-full rounded-xl px-3 py-2 text-[11px] font-mono ${formInput} transition-all cursor-pointer`}
                            >
                              {myActivity.openApps && myActivity.openApps.length > 0 ? (
                                <>
                                  <optgroup label="Currently Open Apps" className="text-[9px] font-mono text-zinc-550 bg-[#121215] border-[#222227]">
                                    {!myActivity.openApps.includes(myActivity.app) && myActivity.app !== "Offline" && myActivity.app !== "Inactive" && (
                                      <option value={myActivity.app}>{myActivity.app}</option>
                                    )}
                                    {myActivity.openApps.map(app => (
                                      <option key={app} value={app}>{app}</option>
                                    ))}
                                  </optgroup>
                                  <optgroup label="Default Workstation Apps" className="text-[9px] font-mono text-zinc-550 bg-[#121215] border-[#222227]">
                                    <option value="VS Code">VS Code</option>
                                    <option value="Chrome">Chrome Browser</option>
                                    <option value="Figma">Figma Design</option>
                                    <option value="Terminal">Terminal / Shell</option>
                                    <option value="Spotify">Spotify Music</option>
                                    <option value="Slack">Slack Chat</option>
                                  </optgroup>
                                </>
                              ) : (
                                <>
                                  <option value="VS Code">VS Code</option>
                                  <option value="Chrome">Chrome Browser</option>
                                  <option value="Figma">Figma Design</option>
                                  <option value="Terminal">Terminal / Shell</option>
                                  <option value="Spotify">Spotify Music</option>
                                  <option value="Slack">Slack Chat</option>
                                </>
                              )}
                            </select>
                          </div>

                          {/* Project description inline apply */}
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-550 block leading-none">Active Project / Task Details</label>
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="text"
                                value={projectInput}
                                onChange={(e) => setProjectInput(e.target.value)}
                                className={`w-full rounded-xl px-3 py-2 text-[11px] tracking-wide ${formInput} transition-all`}
                                placeholder="What are you building?"
                                onKeyDown={(e) => e.key === "Enter" && updateMyActiveTracker(undefined, projectInput, undefined)}
                              />
                              <button
                                onClick={() => updateMyActiveTracker(undefined, projectInput, undefined)}
                                className="bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-white text-[11px] px-3.5 py-2 rounded-xl tracking-wide font-mono uppercase font-semibold transition-all cursor-pointer shrink-0"
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
                        <div className={`p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl ${bgCard} border ${borderRule} h-full relative overflow-hidden transition-all duration-300`}>
                          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                            <Terminal className="h-64 w-64 text-zinc-400" />
                          </div>

                          <div className="flex flex-col justify-between h-full space-y-6 relative z-10">
                            {/* Team & Scrum Telemetry Section */}
                            <div className={`p-5 rounded-2xl border dark:border-[#222227]/80 border-stone-200/50 ${bgInternal} space-y-4`}>
                              <div className="flex items-center justify-between">
                                <h3 className="text-xs font-mono uppercase tracking-widest text-stone-300 flex items-center gap-1.5">
                                  <Users className="h-4 w-4 text-zinc-500" />
                                  <span>Team & Scrum Telemetry</span>
                                </h3>
                                <div className="flex items-center space-x-2">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                  <span className="text-[10px] font-mono text-zinc-550 dark:text-zinc-400 uppercase tracking-widest">Live Synced</span>
                                </div>
                              </div>

                              {/* Active Room Members Grid */}
                              <div className="space-y-3">
                                {(() => {
                                  const activeGroupName = user?.activeGroup || (groups.length > 0 ? groups[0].name : null);
                                  if (!activeGroupName) {
                                    return (
                                      <p className="text-[10px] font-mono text-stone-500 italic">No active workspace group selected.</p>
                                    );
                                  }

                                  const occupants = activeGroupName === user?.activeGroup && friends && friends.length > 0
                                    ? friends
                                    : (roomsOccupants[activeGroupName] || []);

                                  return (
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center text-[10px] font-mono text-zinc-455 dark:text-zinc-400 border-b dark:border-neutral-800 border-stone-200/50 pb-1.5">
                                        <span>Guild: #{activeGroupName}</span>
                                        <span>{occupants.length} Co-workers</span>
                                      </div>

                                      {occupants.length === 0 ? (
                                        <p className="text-[10px] font-mono text-stone-500 italic">No other co-workers in this room currently.</p>
                                      ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                                          {occupants.map((occ) => {
                                            const occOnline = occ.status !== "offline";
                                            const activityApp = occ.currentActivity?.app || "Offline";
                                            const activityProject = occ.currentActivity?.project || "None";
                                            const duration = occ.currentActivity?.durationText || "";

                                            return (
                                              <div key={occ.id} className="p-3 bg-black/20 dark:bg-black/35 rounded-xl border dark:border-[#222227]/40 border-stone-200/20 flex flex-col justify-between space-y-2 hover:border-zinc-700/40 transition-all duration-200">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center space-x-2 min-w-0">
                                                    <div className="relative shrink-0">
                                                      <img
                                                        src={occ.avatarUrl}
                                                        alt={occ.name}
                                                        className="h-6 w-6 rounded-full object-cover border dark:border-neutral-850 border-neutral-200"
                                                      />
                                                      <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#121215] ${occOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-650"
                                                        }`} />
                                                    </div>
                                                    <div className="min-w-0">
                                                      <span className="font-sans font-semibold text-xs text-stone-200 truncate block leading-tight">{occ.name}</span>
                                                      <span className="text-[8px] font-mono uppercase tracking-wider text-stone-500 block">{occ.role}</span>
                                                    </div>
                                                  </div>
                                                  <span className="text-[9px] font-mono text-zinc-500 shrink-0">{duration}</span>
                                                </div>

                                                {occOnline ? (
                                                  <div className="flex items-center justify-between text-[10px] font-mono bg-black/10 dark:bg-[#121215]/30 p-1.5 rounded-lg border dark:border-[#222227]/20 border-stone-200/10">
                                                    <span className="text-stone-300 font-semibold truncate flex items-center space-x-1">
                                                      <span className="text-emerald-450">⚡</span>
                                                      <span>{activityApp}</span>
                                                    </span>
                                                    {activityProject !== "None" && (
                                                      <span className="text-[9px] text-zinc-550 dark:text-zinc-400 max-w-[100px] truncate" title={activityProject}>
                                                        {activityProject}
                                                      </span>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <span className="text-[9px] font-mono text-zinc-600 block pl-1">Offline</span>
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
                              <div className="pt-2 border-t dark:border-neutral-80 border-stone-200/50">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-1.5">
                                    <Sparkles className="h-4 w-4 text-amber-500/80" />
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-stone-405 font-bold">Scrum Coordinator Brief</span>
                                  </div>
                                  <button
                                    onClick={() => fetchAiBriefing(true)}
                                    disabled={loadingInsights}
                                    className="p-1 rounded bg-transparent hover:bg-neutral-800 text-stone-500 hover:text-stone-300 transition-all cursor-pointer disabled:opacity-50"
                                    title="Regenerate Scrum Alignment Brief"
                                  >
                                    <RefreshCw className={`h-3 w-3 ${loadingInsights ? "animate-spin" : ""}`} />
                                  </button>
                                </div>

                                {loadingInsights ? (
                                  <div className="space-y-2 py-1">
                                    <div className="h-2 bg-stone-300/10 dark:bg-zinc-800/50 rounded w-1/3 animate-pulse"></div>
                                    <div className="h-2 bg-stone-300/10 dark:bg-zinc-800/50 rounded w-full animate-pulse"></div>
                                    <div className="h-2 bg-stone-300/10 dark:bg-zinc-800/50 rounded w-5/6 animate-pulse"></div>
                                  </div>
                                ) : aiInsights ? (() => {
                                  let parsedBrief: any = null;
                                  try {
                                    parsedBrief = JSON.parse(aiInsights);
                                  } catch (e) {
                                    // Fallback if not JSON
                                  }

                                  if (parsedBrief && parsedBrief.roomSummary) {
                                    // Sanitize to prevent crashes on undefined properties
                                    const summaryObj = parsedBrief.roomSummary;
                                    const roomSummary = {
                                      status: typeof summaryObj.status === "string" ? summaryObj.status : "Active Room",
                                      productivityPercentage: typeof summaryObj.productivityPercentage === "number" ? summaryObj.productivityPercentage : 50,
                                      description: typeof summaryObj.description === "string" ? summaryObj.description : "No description available.",
                                      activeCount: typeof summaryObj.activeCount === "number" ? summaryObj.activeCount : 0,
                                      totalCount: typeof summaryObj.totalCount === "number" ? summaryObj.totalCount : 1
                                    };

                                    const performerObj = parsedBrief.topPerformer || {};
                                    const topPerformer = {
                                      name: typeof performerObj.name === "string" ? performerObj.name : "None",
                                      focusTime: typeof performerObj.focusTime === "string" ? performerObj.focusTime : "0h",
                                      apps: Array.isArray(performerObj.apps) ? performerObj.apps : ["VS Code"],
                                      score: typeof performerObj.score === "number" ? performerObj.score : 0,
                                      reason: typeof performerObj.reason === "string" ? performerObj.reason : ""
                                    };

                                    const attentionObj = parsedBrief.needsAttention || {};
                                    const needsAttention = {
                                      name: typeof attentionObj.name === "string" ? attentionObj.name : "None",
                                      idleTime: typeof attentionObj.idleTime === "string" ? attentionObj.idleTime : "0m",
                                      reason: typeof attentionObj.reason === "string" ? attentionObj.reason : ""
                                    };

                                    const recommendations = Array.isArray(parsedBrief.recommendations) ? parsedBrief.recommendations : [];
                                    
                                    const predictionObj = parsedBrief.prediction || {};
                                    const prediction = {
                                      completionPercentage: typeof predictionObj.completionPercentage === "number" ? predictionObj.completionPercentage : 50,
                                      description: typeof predictionObj.description === "string" ? predictionObj.description : ""
                                    };

                                    const summary = typeof parsedBrief.summary === "string" ? parsedBrief.summary : "";

                                    const telemetryRoomName = selectedRoomName || user?.activeGroup || (groups.length > 0 ? groups[0].name : null) || "";
                                    const cycledOccupants = (telemetryRoomName === user?.activeGroup && friends && friends.length > 0
                                      ? friends
                                      : (Array.isArray(roomsOccupants[telemetryRoomName]) ? roomsOccupants[telemetryRoomName] : [])).filter(o => o && o.id);

                                    // Calculate mini stats card metrics
                                    const myHours = myActivity ? (myActivity.durationSeconds / 3600) : 0;
                                    const myScore = Math.min(100, Math.round((myHours / (user?.productivityGoal || 6)) * 100)) || 0;
                                    
                                    const safeFloat = (val: any) => {
                                      const parsed = parseFloat(val);
                                      return isNaN(parsed) ? 0 : parsed;
                                    };

                                    const friendsScores = (cycledOccupants || []).map(o => {
                                      const hours = safeFloat(o.todayFocusTime);
                                      return Math.min(100, Math.round((hours / 6) * 100));
                                    });
                                    const avgProductivity = Math.round((myScore + friendsScores.reduce((a,b)=>a+b, 0)) / (friendsScores.length + 1)) || 0;

                                    const maxHoursVal = Math.max(
                                      myHours,
                                      ...(cycledOccupants || []).map(o => safeFloat(o.todayFocusTime))
                                    );
                                    const maxHoursStr = isNaN(maxHoursVal) 
                                      ? "0h 0m" 
                                      : `${Math.floor(maxHoursVal)}h ${Math.round((maxHoursVal % 1) * 60)}m`;

                                    const switchesCount = user?.timeline ? user.timeline.filter(t => t.app !== "Offline").length : 12;

                                    const totalMembers = cycledOccupants.length + 1;
                                    const onlineMembers = cycledOccupants.filter(o => o.status !== "offline").length + (myActivity && myActivity.app !== "Offline" ? 1 : 0);
                                    const teamEnergyPct = Math.round((onlineMembers / totalMembers) * 100) || 50;

                                    return (
                                      <div className="space-y-4">
                                        {/* Mini Cards Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                          <div className="p-2.5 bg-black/20 dark:bg-black/35 rounded-xl border dark:border-[#222227]/40 border-stone-200/10 text-center">
                                            <span className="text-[7.5px] font-mono uppercase tracking-wider text-zinc-500 block">Productivity</span>
                                            <span className="text-xs font-bold text-[#E5D3B3] block mt-0.5">{avgProductivity}%</span>
                                            <span className="text-[7px] font-mono text-emerald-450 block mt-0.5">{avgProductivity >= 75 ? "Above Average" : "On Track"}</span>
                                          </div>
                                          <div className="p-2.5 bg-black/20 dark:bg-black/35 rounded-xl border dark:border-[#222227]/40 border-stone-200/10 text-center">
                                            <span className="text-[7.5px] font-mono uppercase tracking-wider text-zinc-500 block">Deep Work</span>
                                            <span className="text-xs font-bold text-[#E5D3B3] block mt-0.5">{maxHoursStr}</span>
                                            <span className="text-[7px] font-mono text-emerald-450 block mt-0.5">Highest today</span>
                                          </div>
                                          <div className="p-2.5 bg-black/20 dark:bg-black/35 rounded-xl border dark:border-[#222227]/40 border-stone-200/10 text-center">
                                            <span className="text-[7.5px] font-mono uppercase tracking-wider text-zinc-500 block">Switches</span>
                                            <span className="text-xs font-bold text-[#E5D3B3] block mt-0.5">{switchesCount}</span>
                                            <span className="text-[7px] font-mono text-amber-500/80 block mt-0.5">{switchesCount > 15 ? "High switching" : "Low switching"}</span>
                                          </div>
                                          <div className="p-2.5 bg-black/20 dark:bg-black/35 rounded-xl border dark:border-[#222227]/40 border-stone-200/10 text-center">
                                            <span className="text-[7.5px] font-mono uppercase tracking-wider text-zinc-500 block">Team Energy</span>
                                            <span className="text-xs font-bold text-[#E5D3B3] block mt-0.5">{teamEnergyPct}%</span>
                                            <span className="text-[7px] font-mono text-emerald-450 block mt-0.5">{teamEnergyPct >= 70 ? "Excellent" : "Quiet"}</span>
                                          </div>
                                        </div>

                                        {/* Scrum Coordinator Panel */}
                                        <div className="text-[10.5px] leading-relaxed font-sans max-h-[380px] overflow-y-auto pr-1 text-stone-300 bg-black/10 dark:bg-black/35 rounded-2xl p-4 border dark:border-[#222227]/45 border-stone-200/20 space-y-4">
                                          
                                          {/* Room Status */}
                                          <div className="space-y-1.5 pb-3 border-b dark:border-[#222227]/60 border-stone-200/15">
                                            <div className="flex justify-between items-center text-[10px] font-mono">
                                              <span className="text-stone-300 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                                                <span className="text-emerald-500">🟢</span> Room Summary
                                              </span>
                                              <span className="text-[#E5D3B3] font-bold">{roomSummary.productivityPercentage}%</span>
                                            </div>
                                            <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden border dark:border-[#222227]/45 border-stone-200/10">
                                              <div 
                                                className="bg-emerald-500 h-full rounded-full transition-all duration-700" 
                                                style={{ width: `${roomSummary.productivityPercentage}%` }}
                                              />
                                            </div>
                                            <p className="text-[10px] text-zinc-400 mt-1.5 leading-normal">
                                              {roomSummary.description}
                                            </p>
                                            <div className="flex gap-3 text-[9px] font-mono text-zinc-550 pt-1">
                                              <span>• {roomSummary.activeCount} / {roomSummary.totalCount} developers active</span>
                                              <span>• Room focus state synced</span>
                                            </div>
                                          </div>

                                          {/* Top Performer */}
                                          {topPerformer && topPerformer.name !== "None" && (
                                            <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/15 space-y-2">
                                              <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                                                  🏆 Top Performer
                                                </span>
                                                <span className="text-[9px] font-mono bg-amber-500/20 text-amber-200 px-1.5 py-0.2 rounded font-semibold">
                                                  Score: {topPerformer.score}%
                                                </span>
                                              </div>
                                              <div className="flex items-center justify-between text-[10px]">
                                                <span className="font-semibold text-stone-200">{topPerformer.name}</span>
                                                <span className="text-stone-400 font-mono">Focus: {topPerformer.focusTime}</span>
                                              </div>
                                              <div className="text-[9px] text-zinc-400">
                                                <span className="font-mono text-zinc-555">Apps: </span>
                                                {topPerformer.apps.join(" • ")}
                                              </div>
                                              <p className="text-[9.5px] italic text-amber-200/70 border-t border-amber-500/10 pt-1.5">
                                                {topPerformer.reason}
                                              </p>
                                            </div>
                                          )}

                                          {/* Needs Attention */}
                                          {needsAttention && needsAttention.name !== "None" && (
                                            <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/15 space-y-1.5">
                                              <span className="text-[10px] font-mono font-bold text-rose-300 uppercase tracking-wider block">
                                                ⚠️ Needs Attention
                                              </span>
                                              <div className="flex items-center justify-between text-[10px]">
                                                <span className="font-semibold text-stone-200">{needsAttention.name}</span>
                                                <span className="text-rose-300/80 font-mono">Idle: {needsAttention.idleTime}</span>
                                              </div>
                                              <p className="text-[9.5px] text-rose-200/60 leading-normal">
                                                {needsAttention.reason}
                                              </p>
                                            </div>
                                          )}

                                          {/* Recommendations */}
                                          {recommendations && recommendations.length > 0 && (
                                            <div className="space-y-1.5">
                                              <span className="text-[10px] font-mono font-bold text-blue-300 uppercase tracking-wider block">
                                                🤖 AI Recommendations
                                              </span>
                                              <ul className="space-y-1 pl-1">
                                                {recommendations.map((rec: string, idx: number) => (
                                                  <li key={idx} className="flex items-start text-[9.5px] text-stone-300">
                                                    <span className="text-blue-400 mr-2 mt-0.5">•</span>
                                                    <span>{rec}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}

                                          {/* Prediction */}
                                          {prediction && (
                                            <div className="space-y-1.5 pt-2.5 border-t dark:border-[#222227]/60 border-stone-200/15">
                                              <div className="flex justify-between items-center text-[10px] font-mono">
                                                <span className="text-purple-300 font-bold uppercase tracking-wider">
                                                  🔮 Estimated Room Completion
                                                </span>
                                                <span className="text-purple-300 font-bold">{prediction.completionPercentage}%</span>
                                              </div>
                                              <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden border dark:border-[#222227]/45 border-stone-200/10">
                                                <div 
                                                  className="bg-purple-500 h-full rounded-full transition-all duration-700" 
                                                  style={{ width: `${prediction.completionPercentage}%` }}
                                                />
                                              </div>
                                              <p className="text-[9.5px] text-zinc-400 italic">
                                                {prediction.description}
                                              </p>
                                            </div>
                                          )}

                                          {/* Summary */}
                                          <div className="pt-3 border-t border-stone-200/15 dark:border-[#222227]/60 text-[10px] text-zinc-400 italic font-sans leading-normal">
                                            {summary}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }

                                  // Fallback to original text rendering if JSON parse failed
                                  return (
                                    <div className="text-[10.5px] leading-relaxed font-sans max-h-36 overflow-y-auto pr-1 text-stone-400 bg-black/10 dark:bg-black/35 rounded-xl p-3 border dark:border-[#222227]/30 border-stone-200/20">
                                      {aiInsights.split("\n").slice(0, 8).map((line, idx) => {
                                        if (line.startsWith("###") || line.startsWith("##") || line.startsWith("**")) {
                                          return (
                                            <h5 key={idx} className="text-zinc-300 dark:text-[#c4b69d] font-semibold font-serif italic text-[11px] mt-2 mb-1">
                                              {line.replace(/[\*#]/g, "").trim()}
                                            </h5>
                                          );
                                        }
                                        return (
                                          <p key={idx} className="mb-1">
                                            {line.startsWith("-") || line.startsWith("*") ? (
                                              <span className="flex items-start">
                                                <span className="text-amber-500/80 mr-1.5">•</span>
                                                <span>{line.substring(2).trim()}</span>
                                              </span>
                                            ) : line}
                                          </p>
                                        );
                                      })}
                                    </div>
                                  );
                                })() : (
                                  <p className="text-[10px] text-stone-500 font-mono italic">No active scrum alignments logged. Click the reload icon to generate.</p>
                                )}
                              </div>
                            </div>


                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Unified Sync & Room Hub */}
                    <div className="space-y-6">
                      <div className={`p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl ${bgCard} border ${borderRule} space-y-6 flex flex-col justify-between`}>
                        {/* Tab Switcher */}
                        <div className="flex items-center justify-between border-b dark:border-[#222227] border-stone-200/50 pb-4">
                          <div className="flex space-x-4">
                            <button
                              onClick={() => setHubTab("timeline")}
                              className={`text-xs font-semibold font-mono tracking-widest uppercase pb-2 border-b-2 transition-all cursor-pointer ${hubTab === "timeline"
                                  ? "text-white border-white dark:border-white"
                                  : "text-zinc-500 border-transparent hover:text-zinc-300"
                                }`}
                            >
                              Timeline
                            </button>
                            <button
                              onClick={() => setHubTab("rooms")}
                              className={`text-xs font-semibold font-mono tracking-widest uppercase pb-2 border-b-2 transition-all cursor-pointer ${hubTab === "rooms"
                                  ? "text-white border-white dark:border-white"
                                  : "text-zinc-500 border-transparent hover:text-zinc-300"
                                }`}
                            >
                              Rooms & Sync
                            </button>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-550 dark:text-zinc-450 uppercase tracking-widest">
                            {hubTab === "timeline" ? "Personal Activity" : "Live Workspace"}
                          </span>
                        </div>

                        {hubTab === "timeline" && (
                          <div className="space-y-6">
                            {/* Today's Work Breakdown Card (Inlined) */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-stone-550 dark:text-stone-400 uppercase tracking-widest block">Today's Work Breakdown</span>
                                <span className="text-[10px] font-mono text-zinc-550 dark:text-zinc-450">Distribution</span>
                              </div>

                              <div className="space-y-3">
                                {(() => {
                                  const todayBreakdown = getTodayWorkBreakdown();
                                  const maxSeconds = todayBreakdown.length > 0 ? Math.max(...todayBreakdown.map(x => x.seconds)) : 1;

                                  if (todayBreakdown.length === 0) {
                                    return (
                                      <div className="text-stone-550 text-xs font-mono py-2 text-center">
                                        No activity tracked today yet.
                                      </div>
                                    );
                                  }

                                  return todayBreakdown.map((item, idx) => {
                                    const percent = Math.min(100, Math.round((item.seconds / maxSeconds) * 100));
                                    return (
                                      <div key={idx} className="space-y-1">
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="font-mono font-semibold truncate flex items-center space-x-2">
                                            <span className={`h-2 w-2 rounded-full ${getAppColor(item.app)} shrink-0`}></span>
                                            <span>{item.app}</span>
                                          </span>
                                          <span className="font-mono text-[10px] text-zinc-500 shrink-0">{item.hoursText}</span>
                                        </div>
                                        <div className="h-1.5 bg-[#f5f4ef] dark:bg-stone-900 rounded-full overflow-hidden border dark:border-neutral-850 border-stone-200/50">
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

                            <hr className="border-stone-200/50 dark:border-[#222227]" />

                            {/* Daily Activity Feed */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between pb-2">
                                <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#a1a1aa] flex items-center">
                                  <Target className="h-4 w-4 mr-1.5 text-zinc-500" />
                                  Recent Activity Logs
                                </h4>
                                {myActivity && (
                                  <div className="flex items-center space-x-2 bg-neutral-100 dark:bg-zinc-800/60 border dark:border-neutral-800/80 border-stone-200/50 px-2.5 py-1 rounded-full shrink-0">
                                    <div className="flex items-center text-[10px] font-mono font-bold text-stone-700 dark:text-stone-300">
                                      <Clock className="h-3 w-3 text-stone-500 mr-1.5 shrink-0 animate-pulse" />
                                      <span>{parsedDurationText(myActivity.durationSeconds || 0)}</span>
                                    </div>
                                    <span className="h-3 w-[1px] bg-neutral-300 dark:bg-neutral-850"></span>
                                    <button
                                      onClick={() => updateMyActiveTracker(undefined, undefined, !myActivity.isPaused)}
                                      className="text-stone-500 hover:text-stone-300 transition-all cursor-pointer bg-transparent border-0 p-0 flex items-center justify-center"
                                      title={myActivity.isPaused ? "Resume focus tracking session" : "Temporarily pause activity tracker"}
                                    >
                                      {myActivity.isPaused ? (
                                        <Play className="h-2.5 w-2.5 text-emerald-500 fill-emerald-500/20" />
                                      ) : (
                                        <Pause className="h-2.5 w-2.5 text-amber-500 fill-amber-500/20" />
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
                                      className="text-stone-550 hover:text-stone-350 transition-all cursor-pointer bg-transparent border-0 p-0 flex items-center justify-center"
                                      title="Restart Timer"
                                    >
                                      <RefreshCw className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-6 max-h-[350px] overflow-y-auto pr-1">
                                {(() => {
                                  const grouped = getGroupedEvents();

                                  if (grouped.length === 0) {
                                    return (
                                      <p className="text-stone-550 text-xs italic text-center py-12 font-mono">
                                        No activities logged yet.
                                      </p>
                                    );
                                  }

                                  return grouped.map(([groupLabel, items]) => (
                                    <div key={groupLabel} className="space-y-3">
                                      {/* Group Label */}
                                      <h4 className="text-[10px] font-bold font-mono tracking-wider text-zinc-500 uppercase flex items-center">
                                        <span className="bg-zinc-200 dark:bg-zinc-800/80 px-2.5 py-0.5 rounded-full text-[9px] font-medium text-stone-550 dark:text-stone-450">
                                          {groupLabel}
                                        </span>
                                      </h4>

                                      {/* Items list with vertical connector */}
                                      <div className="relative pl-6 border-l border-zinc-200 dark:border-zinc-800/80 ml-3 space-y-4">
                                        {items.map((item, idx) => {
                                          return (
                                            <div key={idx} className="relative">
                                              {/* Timeline dot */}
                                              <div className="absolute -left-[29px] top-1.5 h-2 w-2 rounded-full bg-emerald-500 border border-[#121215] dark:border-[#121215] shadow-sm animate-pulse" />
                                              <div className="flex flex-col space-y-0.5">
                                                <div className="flex items-start justify-between">
                                                  {renderTimelineItemText(item)}
                                                  <span className="font-mono text-[9px] text-zinc-500 shrink-0 ml-2 mt-0.5">{item.time}</span>
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
                          <div className="space-y-6 max-h-[550px] overflow-y-auto pr-1">
                            {groups.length === 0 ? (
                              <p className="text-stone-550 text-xs italic text-center py-12 font-mono">
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
                                    className={`p-4 rounded-2xl border ${bgInternal} dark:border-[#222227] space-y-4 transition-all hover:border-zinc-700/50`}
                                  >
                                    {/* Room Header with Toggle Sync */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex flex-col min-w-0">
                                        <div className="flex items-center space-x-1.5">
                                          <span className="text-zinc-550 font-mono">#</span>
                                          <span className="font-mono text-xs font-bold text-stone-350 truncate">{group.name}</span>
                                        </div>
                                        <span className="text-[9px] text-zinc-550 dark:text-zinc-450 truncate mt-0.5 font-mono">{group.description}</span>
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        <span className={`text-[9px] font-mono tracking-widest uppercase ${isSyncing ? "text-emerald-450" : "text-stone-500"}`}>
                                          {isSyncing ? "Syncing" : "Muted"}
                                        </span>
                                        <button
                                          onClick={() => toggleRoomSync(group.name, isSyncing)}
                                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-zinc-700/30 transition-colors duration-200 ease-in-out focus:outline-none ${isSyncing ? "bg-emerald-500" : "bg-zinc-800"
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
                                    <div className="space-y-2 border-t border-b dark:border-[#222227]/60 border-stone-200/50 py-3">
                                      <span className="text-[9px] font-mono text-zinc-550 dark:text-zinc-450 uppercase tracking-widest block">Room Members Activity</span>
                                      {occupants.length === 0 ? (
                                        <p className="text-[10px] text-stone-550 font-mono italic">No other occupants in room</p>
                                      ) : (
                                        <div className="space-y-2.5">
                                          {occupants.map((occ) => {
                                            const isOnline = occ.status !== "offline";
                                            const activityApp = occ.currentActivity?.app || "Offline";
                                            const activityProject = occ.currentActivity?.project || "None";
                                            const duration = occ.currentActivity?.durationText || "";

                                            return (
                                              <div key={occ.id} className="flex items-center justify-between text-[11px] font-mono">
                                                <div className="flex items-center space-x-2 min-w-0">
                                                  <div className="relative">
                                                    <img
                                                      src={occ.avatarUrl}
                                                      alt={occ.name}
                                                      className="h-5 w-5 rounded-full object-cover border dark:border-neutral-850 border-neutral-200"
                                                    />
                                                    <span className={`absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border border-black ${isOnline ? "bg-emerald-500" : "bg-zinc-650"
                                                      }`} />
                                                  </div>
                                                  <span className="font-semibold text-stone-300 truncate">{occ.name}</span>
                                                </div>

                                                <div className="flex items-center space-x-1.5 shrink-0 text-zinc-400">
                                                  {isOnline ? (
                                                    <>
                                                      <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded text-[9px] font-medium border border-zinc-700/50">
                                                        {activityApp}
                                                      </span>
                                                      {activityProject !== "None" && (
                                                        <span className="text-[9px] text-zinc-550 dark:text-zinc-450 max-w-[80px] truncate" title={activityProject}>
                                                          ({activityProject})
                                                        </span>
                                                      )}
                                                      <span className="text-[9px] text-zinc-550 dark:text-zinc-450">{duration}</span>
                                                    </>
                                                  ) : (
                                                    <span className="text-[9px] text-zinc-650">offline</span>
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
                                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Latest Message</span>
                                      {lastMessage ? (
                                        <div className="bg-black/10 dark:bg-[#121215]/40 rounded-xl p-2.5 border dark:border-[#222227]/50 border-stone-200/30 flex items-start space-x-2">
                                          <img
                                            src={lastMessage.avatarUrl}
                                            alt={lastMessage.userName}
                                            className="h-4.5 w-4.5 rounded-full object-cover shrink-0 mt-0.5"
                                          />
                                          <div className="min-w-0 flex-1 font-mono text-[10px]">
                                            <div className="flex justify-between items-center">
                                              <span className="font-semibold text-stone-350">{lastMessage.userName}</span>
                                              <span className="text-[8px] text-zinc-500">
                                                {new Date(lastMessage.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                              </span>
                                            </div>
                                            <p className="text-stone-450 truncate mt-0.5">{lastMessage.message}</p>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-[10px] text-zinc-550 font-mono italic">No recent messages</p>
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

              {/* 2⃣ ANALYTICS COMPILATIONS TAB VIEW */}
              {activeTab === "analytics" && analytics && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-serif italic tracking-tight font-medium">My Analytics</h2>
                    <p className={`text-xs ${textSub}`}>
                      Analyzing application distribution, focus history charts, and deep work contribution logs.
                    </p>
                  </div>

                  {/* GitHub-style focus calendar heatmap */}
                  {renderContributionCalendar()}

                  {/* Summary blocks */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className={`p-6 rounded-2xl border ${bgCard} ${borderRule}`}>
                      <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block mb-1">Average Daily Focus</span>
                      <div className="text-3xl font-serif italic font-semibold">{analytics.averageDailyFocus} hrs</div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1">// Calculated on active window durations</p>
                    </div>
                    <div className={`p-6 rounded-2xl border ${bgCard} ${borderRule}`}>
                      <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block mb-1">Daily Focus Goal</span>
                      <div className="text-3xl font-serif italic font-semibold">{user?.productivityGoal || 6} hrs</div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1">// Configured target parameters</p>
                    </div>
                    <div className={`p-6 rounded-2xl border ${bgCard} ${borderRule}`}>
                      <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block mb-1">Weekly Goal Achievement</span>
                      <div className="text-3xl font-serif italic font-semibold">{analytics.weeklyProdGoalAchieved}%</div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1">// Goal compliance indicator</p>
                    </div>
                  </div>

                  {/* HIGH-END HAND-CRAFTED SVG VISUAL CHART BLOCKS */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Circle chart */}
                    <div className={`p-6 rounded-2xl border ${bgCard} ${borderRule} space-y-6`}>
                      <h3 className="text-xs font-semibold font-mono tracking-widest uppercase text-stone-400">
                        APP CONCENTRIC DISTRIBUTION Share
                      </h3>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <div className="relative w-44 h-44 shrink-0">
                          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke={themeMode === "dark" ? "#1a1a20" : "#f1f0ea"} strokeWidth="3" />

                            {(() => {
                              let currentOffset = 0;
                              const colors = ["#787880", "#bfb5a3", "#d4af37", "#6b7280", "#a855f7", "#3b82f6", "#10b981", "#f59e0b"];
                              return analytics.appBreakdown.map((item, id) => {
                                const percentage = item.value;
                                const strokeDashoffset = -currentOffset;
                                currentOffset += percentage;
                                const strokeColor = item.color || colors[id % colors.length];

                                return (
                                  <circle
                                    key={id}
                                    cx="18"
                                    cy="18"
                                    r="15.915"
                                    fill="none"
                                    stroke={strokeColor}
                                    strokeWidth="3.5"
                                    strokeDasharray={`${percentage} 100`}
                                    strokeDashoffset={strokeDashoffset}
                                    className="transition-all duration-500"
                                  />
                                );
                              });
                            })()}
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                            <span className="text-xl font-serif italic text-white dark:text-stone-300 font-bold">
                              {analytics.appBreakdown && analytics.appBreakdown.length > 0
                                ? `${analytics.appBreakdown[0].value}%`
                                : "0%"}
                            </span>
                            <span className="text-[9px] uppercase font-mono tracking-widest text-[#a1a1aa] mt-0.5 truncate max-w-[120px]">
                              {analytics.appBreakdown && analytics.appBreakdown.length > 0
                                ? `${analytics.appBreakdown[0].name} Focus`
                                : "No Data"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2.5 flex-1 w-full sm:w-auto">
                          {analytics.appBreakdown.map((item, id) => {
                            const colors = ["#787880", "#bfb5a3", "#d4af37", "#6b7280", "#a855f7", "#3b82f6", "#10b981", "#f59e0b"];
                            const color = item.color || colors[id % colors.length];
                            return (
                              <div key={id} className="flex justify-between items-center text-xs">
                                <div className="flex items-center space-x-2">
                                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }}></span>
                                  <span className="font-mono text-[11px] text-stone-500 lowercase">{item.name}</span>
                                </div>
                                <span className="font-mono text-[11px] text-[#bfb5a3] font-bold">{item.value}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Bar chart */}
                    <div className={`p-6 rounded-2xl border ${bgCard} ${borderRule} space-y-6`}>
                      <h3 className="text-xs font-semibold font-mono tracking-widest uppercase text-stone-400">
                        WEEKLY RETENTION TRENDSCORE
                      </h3>

                      <div className="space-y-4 pt-2">
                        {analytics.focusScoreHistory.map((item, id) => (
                          <div key={id} className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-[#a1a1aa]">{item.day}</span>
                              <span className="text-stone-500">score: // {item.score}% / ideal {item.ideal}%</span>
                            </div>
                            <div className="h-2 w-full bg-[#f5f4ef]/80 dark:bg-stone-900 rounded-full border dark:border-neutral-850 border-neutral-200/50 overflow-hidden relative">
                              <div
                                className="h-full bg-stone-500 dark:bg-[#bfb5a3] rounded-full transition-all duration-300"
                                style={{ width: `${item.score}%` }}
                              ></div>
                              <div
                                className="absolute top-0 bottom-0 w-px bg-red-400 opacity-60"
                                style={{ left: `${item.ideal}%` }}
                                title="Goal baseline margin"
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* 🎯 MY FOCUS TAB VIEWPORT */}
              {activeTab === "focus" && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-serif italic tracking-tight font-medium">My Focus Cockpit</h2>
                    <p className={`text-xs ${textSub}`}>
                      Run Pomodoro cycles, track distraction levels, and monitor your focus streak.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left: Pomodoro Timer circular card */}
                    <div className={`lg:col-span-2 p-6 md:p-8 rounded-3xl ${bgCard} border ${borderRule} flex flex-col items-center justify-center space-y-8 relative overflow-hidden`}>
                      <div className="text-center space-y-2">
                        <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block">
                          {pomodoroMode === "focus" ? "Deep Focus Session" : "Short Break Time"}
                        </span>
                        <h3 className="text-sm font-semibold font-mono tracking-wider text-stone-300">
                          {myActivity?.project ? `Active Task: ${myActivity.project}` : "No Active Task"}
                        </h3>
                      </div>

                      {/* Visual Circular Timer */}
                      <div className="relative w-64 h-64 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="128" cy="128" r="90" fill="none" stroke={themeMode === "dark" ? "#18181c" : "#f5f4ef"} strokeWidth="6" />
                          <circle
                            cx="128"
                            cy="128"
                            r="90"
                            fill="none"
                            stroke={pomodoroMode === "focus" ? "#10b981" : "#3b82f6"}
                            strokeWidth="8"
                            strokeDasharray="565.48"
                            strokeDashoffset={(1 - ((pomodoroMinutesLeft * 60 + pomodoroSecondsLeft) / (pomodoroMode === "focus" ? 1500 : 300))) * 565.48}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-linear"
                          />
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
                          <div className="text-4xl font-mono font-bold tracking-tight text-white dark:text-stone-300">
                            {String(pomodoroMinutesLeft).padStart(2, '0')}:{String(pomodoroSecondsLeft).padStart(2, '0')}
                          </div>
                          <span className={`text-[9px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-full ${pomodoroMode === "focus"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}>
                            {pomodoroMode === "focus" ? "Focusing" : "Resting"}
                          </span>
                        </div>
                      </div>

                      {/* Controls Button Group */}
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setPomodoroActive(!pomodoroActive)}
                          className={`px-8 py-3.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all cursor-pointer ${pomodoroActive
                              ? "bg-stone-800 hover:bg-stone-700 text-stone-300 border border-neutral-700/50"
                              : "bg-emerald-500 hover:bg-emerald-600 text-white"
                            }`}
                        >
                          {pomodoroActive ? "Pause Session" : "Start Focus"}
                        </button>

                        <button
                          onClick={() => {
                            setPomodoroActive(false);
                            setPomodoroMinutesLeft(pomodoroMode === "focus" ? 25 : 5);
                            setPomodoroSecondsLeft(0);
                            triggerToast("Pomodoro timer reset successfully");
                          }}
                          className="h-12 w-12 bg-transparent hover:bg-stone-500/10 text-stone-500 hover:text-stone-300 border dark:border-[#222227] border-stone-250 rounded-xl flex items-center justify-center cursor-pointer"
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
                              setPomodoroMinutesLeft(5);
                              triggerToast("Skipped focus. Time for a short break.");
                            } else {
                              setPomodoroMode("focus");
                              setPomodoroMinutesLeft(25);
                              triggerToast("Skipped break. Ready to focus?");
                            }
                          }}
                          className="px-4 py-3.5 bg-transparent hover:bg-stone-500/10 text-stone-400 hover:text-stone-200 border dark:border-[#222227] border-stone-250 rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer"
                        >
                          Skip
                        </button>
                      </div>

                      {/* Mode Quick Toggle */}
                      <div className="flex items-center bg-[#f5f4ef] dark:bg-[#18181c] p-1.5 rounded-xl border dark:border-[#222227] border-stone-200/50">
                        <button
                          onClick={() => {
                            setPomodoroActive(false);
                            setPomodoroMode("focus");
                            setPomodoroMinutesLeft(25);
                            setPomodoroSecondsLeft(0);
                          }}
                          className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${pomodoroMode === "focus"
                              ? "bg-white dark:bg-stone-800 text-black dark:text-emerald-400 shadow-sm"
                              : "text-stone-500 hover:text-stone-300"
                            }`}
                        >
                          Focus Mode (25m)
                        </button>
                        <button
                          onClick={() => {
                            setPomodoroActive(false);
                            setPomodoroMode("break");
                            setPomodoroMinutesLeft(5);
                            setPomodoroSecondsLeft(0);
                          }}
                          className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${pomodoroMode === "break"
                              ? "bg-white dark:bg-stone-800 text-black dark:text-blue-400 shadow-sm"
                              : "text-stone-500 hover:text-stone-300"
                            }`}
                        >
                          Break Mode (5m)
                        </button>
                      </div>

                      {/* Task config sync inside cockpit */}
                      <div className="w-full max-w-md border-t dark:border-neutral-850 border-stone-250/50 pt-6 space-y-3">
                        <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 block text-center">Sync Task to Workstation Agent</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={projectInput}
                            onChange={(e) => setProjectInput(e.target.value)}
                            className={`w-full rounded-xl px-4 py-3 text-xs tracking-wide ${formInput} transition-all`}
                            placeholder="Type active task name..."
                          />
                          <button
                            onClick={() => updateMyActiveTracker(undefined, projectInput, undefined)}
                            className="bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-white text-xs px-6 py-3 rounded-xl tracking-wide font-mono uppercase font-semibold transition-all cursor-pointer shrink-0"
                          >
                            Sync Task
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Focus Stats */}
                    <div className="space-y-6">
                      {/* Streak Card */}
                      <div className={`p-6 rounded-3xl ${bgCard} border ${borderRule} space-y-4 relative overflow-hidden`}>
                        <div className="flex items-center space-x-3 text-amber-500">
                          <Flame className="h-6 w-6 animate-pulse" />
                          <h4 className="text-xs font-semibold font-mono tracking-widest uppercase">Focus Streak</h4>
                        </div>

                        <div className="space-y-2">
                          <div className="text-3xl font-serif italic font-semibold text-white dark:text-stone-300">
                            {user?.focusStreak || 0} Day Streak
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-relaxed">
                            Maintain your streak by meeting your daily goal of {user?.productivityGoal || 6} hours. Pomodoro cycles completed automatically update this record.
                          </p>
                        </div>

                        <div className="h-1 bg-[#f5f4ef] dark:bg-stone-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                            style={{ width: `${Math.min(100, ((user?.focusStreak || 0) / 7) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500 block">// {7 - ((user?.focusStreak || 0) % 7)} days remaining for weekly reward</span>
                      </div>

                      {/* Distraction Card */}
                      <div className={`p-6 rounded-3xl ${bgCard} border ${borderRule} space-y-5`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 text-stone-400">
                            <Activity className="h-5 w-5" />
                            <h4 className="text-xs font-semibold font-mono tracking-widest uppercase">Distraction Log</h4>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border ${(user?.distractionsCount || 0) === 0
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : (user?.distractionsCount || 0) <= 3
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}>
                            {(user?.distractionsCount || 0) === 0 ? "Zen State" : (user?.distractionsCount || 0) <= 3 ? "Low Noise" : "High Noise"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#18181c]/30 dark:bg-[#18181c]/50 p-4 rounded-xl border dark:border-[#222227] border-stone-200/40 text-center">
                            <span className="text-[9px] text-stone-500 font-mono uppercase block">Agent Flags</span>
                            <span className="text-2xl font-bold text-stone-300 block mt-1">{user?.distractionsCount || 0}</span>
                          </div>
                          <div className="bg-[#18181c]/30 dark:bg-[#18181c]/50 p-4 rounded-xl border dark:border-[#222227] border-stone-200/40 text-center">
                            <span className="text-[9px] text-stone-500 font-mono uppercase block">Manual Log</span>
                            <span className="text-2xl font-bold text-stone-300 block mt-1">{distractionsManualCount}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleIncrementDistraction}
                            className="flex-1 text-center py-2.5 border dark:border-neutral-850 border-stone-250 text-[10px] font-mono uppercase tracking-wider rounded-xl text-stone-300 hover:text-white dark:hover:bg-[#18181c] hover:bg-stone-50 cursor-pointer transition-all"
                          >
                            Log Distraction
                          </button>
                          <button
                            onClick={handleResetDistractions}
                            className="px-4 py-2.5 border border-dashed dark:border-red-950/40 border-red-200/50 text-[10px] font-mono uppercase tracking-wider rounded-xl text-red-500 hover:text-red-400 dark:hover:bg-red-950/20 hover:bg-red-50/50 cursor-pointer transition-all"
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
                <div className="space-y-8">
                  {selectedRoomName === null ? (
                    <>
                      {/* Directory View */}
                      <div className="space-y-2">
                        <h2 className="text-4xl font-serif italic tracking-tight font-medium">Rooms Directory</h2>
                        <p className={`text-xs ${textSub}`}>
                          Select a room workspace to collaborate, monitor active telemetry, or commission a new channel.
                        </p>
                      </div>

                      {/* 5-Step Room Creation Wizard Launch Card */}
                      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                        <div className="space-y-2 z-10">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
                            <Sparkles className="w-3.5 h-3.5" />
                            5-STEP ROOM INTELLIGENCE WIZARD
                          </div>
                          <h3 className="text-xl sm:text-2xl font-serif italic font-bold text-white">
                            Commission a New Intelligence Room
                          </h3>
                          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                            Configure room basics, access permissions, roles, individual & team work expectations, and versioned AI privacy policies in a guided 5-step setup experience.
                          </p>
                        </div>

                        <button
                          onClick={() => setIsRoomWizardOpen(true)}
                          className="px-6 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-2xl shadow-lg shadow-cyan-500/25 font-mono uppercase tracking-wider transition-all transform hover:scale-105 cursor-pointer shrink-0 flex items-center justify-center gap-2 z-10"
                        >
                          <Plus className="w-4 h-4" />
                          Launch 5-Step Wizard
                        </button>
                      </div>

                      {/* Classroom Portal Card Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {groups.map(group => {
                          const groupOnlineCount = user?.activeGroup === group.name
                            ? (friends.filter(f => f.status !== 'offline').length + (user?.status !== 'offline' ? 1 : 0))
                            : Math.max(1, Math.round(group.members.length * 0.6));

                          return (
                            <div
                              key={group.id}
                              className={`p-6 rounded-3xl border ${bgCard} ${borderRule} flex flex-col justify-between space-y-6`}
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-serif italic text-lg font-bold text-stone-300 dark:text-white">
                                    {group.name}
                                  </h4>
                                  <span className={`text-[9px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded border ${user?.activeGroup === group.name
                                      ? "bg-stone-300 text-black border-stone-400"
                                      : "text-stone-500 dark:border-neutral-800 border-stone-250"
                                    }`}>
                                    {user?.activeGroup === group.name ? "Connected" : "Inactive"}
                                  </span>
                                </div>
                                <p className={`text-xs leading-relaxed ${textSub}`}>{group.description}</p>
                              </div>

                              <div className="space-y-4 pt-3 border-t dark:border-neutral-850/60 border-stone-200/50">
                                <div className="flex justify-between items-center text-[10px] font-mono text-stone-500">
                                  <span>Occupants: {group.members.length} peers</span>
                                  <span className="flex items-center">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                                    {groupOnlineCount} Live Online
                                  </span>
                                </div>
                                <button
                                  onClick={() => enterRoomChannel(group.name)}
                                  className="w-full text-center py-2.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-white text-xs font-mono uppercase tracking-wider font-semibold rounded-xl transition-all cursor-pointer"
                                >
                                  Enter Room Workspace
                                </button>
                              </div>
                            </div>
                          );
                        })}
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
                                onRefreshAi={() => fetchAiBriefing(true)}
                                onNudgeMember={(name, id) => triggerPeerNudge(name, id)}
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
                                  <div className="space-y-4 py-2">
                                    <div className="h-3 bg-stone-300/10 dark:bg-zinc-800/50 rounded w-1/4 animate-pulse"></div>
                                    <div className="h-3 bg-stone-300/10 dark:bg-zinc-800/50 rounded w-full animate-pulse"></div>
                                    <div className="h-3 bg-stone-300/10 dark:bg-zinc-800/50 rounded w-5/6 animate-pulse"></div>
                                    <span className="text-[10px] font-mono text-stone-500">Retrieving intelligence briefs...</span>
                                  </div>
                                ) : (
                                  <div className="text-xs space-y-4 leading-relaxed font-sans mt-2">
                                    {aiInsights ? (
                                      aiInsights.split("\n").map((line, idx) => {
                                        if (line.startsWith("###") || line.startsWith("##") || line.startsWith("**")) {
                                          return (
                                            <h4 key={idx} className="text-zinc-800 dark:text-[#c4b69d] font-serif italic text-sm font-bold mt-4 mb-2">
                                              {line.replace(/[\*#]/g, "").trim()}
                                            </h4>
                                          );
                                        }
                                        return (
                                          <p key={idx} className={`pl-1 leading-relaxed ${textSub}`}>
                                            {line.startsWith("-") || line.startsWith("*") ? (
                                              <span className="flex items-start">
                                                <span className="text-neutral-400 dark:text-[#a5957b] mr-2">•</span>
                                                <span>{line.substring(2).trim()}</span>
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

                              <div className="bg-[#0a0a0c] p-6 rounded-2xl border dark:border-neutral-850 border-stone-250 font-mono text-xs space-y-3 max-h-96 overflow-y-auto">
                                <div className="text-zinc-500">// Streaming Real-time workspace logs</div>
                                {friends.flatMap(f => f.timeline.map(t => ({ ...t, name: f.name }))).length > 0 ? (
                                  friends.flatMap(f => f.timeline.map(t => ({ ...t, name: f.name })))
                                    .sort((a, b) => b.time.localeCompare(a.time))
                                    .map((evt, idx) => (
                                      <div key={idx} className="flex justify-between items-center py-1.5 border-b dark:border-neutral-900 border-stone-200/40">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-stone-500">[{evt.time}]</span>
                                          <span className="text-stone-300 font-semibold">{evt.name}</span>
                                          <span className="text-stone-400">active:</span>
                                          <span className="text-emerald-400 font-bold">{evt.app}</span>
                                          <span className="text-stone-550">— {evt.project}</span>
                                        </div>
                                        <span className="text-zinc-600">{evt.duration}</span>
                                      </div>
                                    ))
                                ) : (
                                  <div className="text-stone-500 italic">No workspace event streams compiled. Ensure team members are focused.</div>
                                )}
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
                                      <div className="flex flex-col items-center space-y-2 flex-1">
                                        <img src={roomLeaderboard[1].avatarUrl} className="h-10 w-10 rounded-full border border-neutral-700 object-cover" />
                                        <span className="text-xs font-semibold truncate max-w-[80px]">{roomLeaderboard[1].name}</span>
                                        <div className={`w-full h-24 ${themeMode === 'dark' ? 'bg-zinc-800/60' : 'bg-neutral-200'} rounded-t-xl flex flex-col items-center justify-center border-t border-x dark:border-neutral-700`}>
                                          <span className="text-xl font-bold font-serif italic text-stone-400">2nd</span>
                                          <span className="text-[10px] font-mono text-stone-500">{roomLeaderboard[1].hours}h</span>
                                        </div>
                                      </div>
                                    )}

                                    {/* 1st Place */}
                                    {roomLeaderboard[0] && (
                                      <div className="flex flex-col items-center space-y-2 flex-1">
                                        <div className="relative">
                                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg">👑</span>
                                          <img src={roomLeaderboard[0].avatarUrl} className="h-12 w-12 rounded-full border-2 border-amber-400 object-cover" />
                                        </div>
                                        <span className="text-xs font-semibold truncate max-w-[80px]">{roomLeaderboard[0].name}</span>
                                        <div className={`w-full h-32 ${themeMode === 'dark' ? 'bg-zinc-850' : 'bg-neutral-350'} rounded-t-xl flex flex-col items-center justify-center border-t border-x dark:border-amber-400/50`}>
                                          <span className="text-2xl font-bold font-serif italic text-amber-500">1st</span>
                                          <span className="text-[10px] font-mono text-stone-500">{roomLeaderboard[0].hours}h</span>
                                        </div>
                                      </div>
                                    )}

                                    {/* 3rd Place */}
                                    {roomLeaderboard[2] && (
                                      <div className="flex flex-col items-center space-y-2 flex-1">
                                        <img src={roomLeaderboard[2].avatarUrl} className="h-10 w-10 rounded-full border border-neutral-700 object-cover" />
                                        <span className="text-xs font-semibold truncate max-w-[80px]">{roomLeaderboard[2].name}</span>
                                        <div className={`w-full h-18 ${themeMode === 'dark' ? 'bg-zinc-800/40' : 'bg-neutral-100'} rounded-t-xl flex flex-col items-center justify-center border-t border-x dark:border-neutral-800`}>
                                          <span className="text-base font-bold font-serif italic text-amber-700">3rd</span>
                                          <span className="text-[10px] font-mono text-stone-500">{roomLeaderboard[2].hours}h</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* List table */}
                                  <div className={`p-6 rounded-3xl ${bgCard} border ${borderRule} space-y-4`}>
                                    <h4 className="text-xs font-semibold font-mono tracking-widest uppercase text-stone-400">Rankings Overview</h4>
                                    <div className="space-y-3 font-mono text-xs">
                                      {roomLeaderboard.map((peer, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-2.5 border-b dark:border-neutral-850 border-stone-200/50">
                                          <div className="flex items-center space-x-3">
                                            <span className="text-stone-500">0{idx + 1}.</span>
                                            <img src={peer.avatarUrl} className="h-6 w-6 rounded-full object-cover" />
                                            <span className="font-semibold text-stone-300 dark:text-white leading-none">{peer.name}</span>
                                          </div>
                                          <span className="text-stone-500">hours: {peer.hours}h</span>
                                        </div>
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
                                  <div className="space-y-4 py-2">
                                    <div className="h-3 bg-stone-300/10 dark:bg-zinc-800/50 rounded w-1/4 animate-pulse"></div>
                                    <div className="h-3 bg-stone-300/10 dark:bg-zinc-800/50 rounded w-full animate-pulse"></div>
                                    <div className="h-3 bg-stone-300/10 dark:bg-zinc-800/50 rounded w-5/6 animate-pulse"></div>
                                    <span className="text-[10px] font-mono text-stone-500">Retrieving intelligence briefs...</span>
                                  </div>
                                ) : (
                                  <div className="text-xs space-y-4 leading-relaxed font-sans mt-2">
                                    {aiInsights ? (
                                      aiInsights.split("\n").map((line, idx) => {
                                        if (line.startsWith("###") || line.startsWith("##") || line.startsWith("**")) {
                                          return (
                                            <h4 key={idx} className="text-zinc-800 dark:text-[#c4b69d] font-serif italic text-sm font-bold mt-4 mb-2">
                                              {line.replace(/[\*#]/g, "").trim()}
                                            </h4>
                                          );
                                        }
                                        return (
                                          <p key={idx} className={`pl-1 leading-relaxed ${textSub}`}>
                                            {line.startsWith("-") || line.startsWith("*") ? (
                                              <span className="flex items-start">
                                                <span className="text-neutral-400 dark:text-[#a5957b] mr-2">•</span>
                                                <span>{line.substring(2).trim()}</span>
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

                          {/* ROOM CHAT PANEL */}
                          {roomTab === "chat" && (
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <h3 className="text-xl font-serif italic font-bold">Real-time Room Message Board</h3>
                                <p className={`text-xs ${textSub}`}>Chat instantly with coworkers in the selected room.</p>
                              </div>

                              {/* Scrollable messages container */}
                              <div className="h-80 border dark:border-neutral-850 border-stone-250 bg-[#151518]/30 dark:bg-stone-900/20 rounded-2xl p-4 overflow-y-auto space-y-4">
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
                                          <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${isMe
                                              ? "bg-stone-800 text-white dark:bg-stone-300 dark:text-black rounded-tr-none"
                                              : `bg-[#18181c]/60 dark:bg-[#151518] text-stone-300 border ${borderRule} rounded-tl-none`
                                            }`}>
                                            {msg.message}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="text-center py-20 text-xs font-mono text-stone-500 italic">
                                    No chat messages posted. Say hello to start the conversation!
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
                                  className="bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-white text-xs px-6 py-3 rounded-xl font-mono uppercase tracking-wide font-semibold cursor-pointer shrink-0"
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
                        className="bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-white text-xs px-6 py-2.5 rounded-xl font-mono uppercase tracking-wide font-semibold cursor-pointer shrink-0 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
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
                                  <h4 className="text-xs font-semibold text-white truncate">{userItem.name}</h4>
                                  <p className="text-[10px] font-mono text-amber-400/90 truncate">{userItem.email}</p>
                                  <p className="text-[10px] font-mono text-stone-500 truncate">@{userItem.username}</p>
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
                      {incomingChallenges.map((chal) => (
                        <div key={chal.challengeId} className="p-6 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-amber-500 block font-bold">// Incoming 1v1 Challenge Invite</span>
                            <h4 className="text-sm font-semibold text-white">
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
                        </div>
                      ))}
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

                        <button
                          onClick={() => cancelFocusChallenge(activeChallenge.challengeId)}
                          className="px-4 py-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 rounded-xl text-[10px] font-mono uppercase tracking-wider cursor-pointer transition-all"
                        >
                          Terminate Challenge
                        </button>
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
                                      <h4 className="text-sm font-semibold truncate text-white dark:text-stone-300">
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
                                      <span className="text-xs font-semibold text-stone-300 dark:text-white truncate block mt-1 leading-none">
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
                                        const obj = prompt("Enter objective for this challenge session (e.g. Code database schemas):");
                                        if (obj !== null) {
                                          sendFocusChallenge(friend.profile.id, 25, "co_focus", obj);
                                        }
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
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-serif italic tracking-tight font-medium font-semibold">Developer identity parameters</h2>
                    <p className={`text-xs ${textSub}`}>
                      Aesthetic alignment fields mapping parameters directly to backend database buffers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Left aggregate info */}
                    <div className={`p-6 rounded-2xl border ${bgCard} text-center space-y-4 flex flex-col items-center justify-center`}>
                      <img
                        src={user.avatarUrl}
                        alt="Avatar profile"
                        className="h-24 w-24 rounded-full object-cover border-2 dark:border-[#bfb5a3] border-zinc-300 shadow-xl"
                      />
                      <div className="space-y-1">
                        <h3 className="text-lg font-serif italic font-bold">{user.name}</h3>
                        <span className="text-xs font-mono text-stone-500 lowercase block">{user.email}</span>
                      </div>

                      <div className="w-full text-left space-y-2.5 font-mono text-[11px] text-stone-500 py-3 border-t dark:border-neutral-850 border-stone-200/50">
                        <div className="flex justify-between">
                          <span>Status msg</span>
                          <span className="truncate max-w-[120px] text-stone-400">{user.customStatus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Focus goal</span>
                          <span className="text-stone-300">{user.productivityGoal} hrs</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Privacy model</span>
                          <span className="text-stone-300">{user.privacyMode}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right editable profile settings card */}
                    <div className={`md:col-span-2 p-6 rounded-2xl border ${bgCard} space-y-6`}>
                      <h4 className="text-xs font-semibold font-mono tracking-widest uppercase text-stone-400">
                        LOAD EDIT PARAMETERS
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">Workspace Display Name</label>
                          <input
                            type="text"
                            value={profileNameInput}
                            onChange={(e) => setProfileNameInput(e.target.value)}
                            onBlur={() => submitProfileSettings({ name: profileNameInput })}
                            onKeyDown={(e) => e.key === "Enter" && submitProfileSettings({ name: profileNameInput })}
                            className={`w-full rounded-xl px-4 py-3 text-xs tracking-wide ${formInput}`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">Connections Username</label>
                          <input
                            type="text"
                            value={usernameInput}
                            onChange={(e) => setUsernameInput(e.target.value)}
                            onBlur={() => submitProfileSettings({ username: usernameInput })}
                            onKeyDown={(e) => e.key === "Enter" && submitProfileSettings({ username: usernameInput })}
                            className={`w-full rounded-xl px-4 py-3 text-xs tracking-wide ${formInput}`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">Connections Headline/Role</label>
                          <input
                            type="text"
                            value={headlineInput}
                            onChange={(e) => setHeadlineInput(e.target.value)}
                            onBlur={() => submitProfileSettings({ headline: headlineInput })}
                            onKeyDown={(e) => e.key === "Enter" && submitProfileSettings({ headline: headlineInput })}
                            className={`w-full rounded-xl px-4 py-3 text-xs tracking-wide ${formInput}`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">Avatar image pointer link</label>
                          <input
                            type="text"
                            value={profileAvatarInput}
                            onChange={(e) => setProfileAvatarInput(e.target.value)}
                            onBlur={() => submitProfileSettings({ avatarUrl: profileAvatarInput })}
                            onKeyDown={(e) => e.key === "Enter" && submitProfileSettings({ avatarUrl: profileAvatarInput })}
                            className={`w-full rounded-xl px-4 py-3 text-xs font-mono lowercase ${formInput}`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">Active Status Label</label>
                          <input
                            type="text"
                            value={statusInput}
                            onChange={(e) => setStatusInput(e.target.value)}
                            onBlur={() => submitProfileSettings({ customStatus: statusInput })}
                            onKeyDown={(e) => e.key === "Enter" && submitProfileSettings({ customStatus: statusInput })}
                            className={`w-full rounded-xl px-4 py-3 text-xs tracking-wide ${formInput}`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">Focus hour target</label>
                          <select
                            value={user.productivityGoal}
                            onChange={(e) => submitProfileSettings({ productivityGoal: parseInt(e.target.value) })}
                            className={`w-full rounded-xl px-4 py-3 text-xs font-mono lowercase ${formInput}`}
                          >
                            <option value="4">4 hours target-line</option>
                            <option value="6">6 hours target-line</option>
                            <option value="8">8 hours target-line</option>
                            <option value="10">10 hours target-line</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">Presence Visibility Rule</label>
                          <select
                            value={user.presenceVisibility || "connections"}
                            onChange={(e) => submitProfileSettings({ presenceVisibility: e.target.value })}
                            className={`w-full rounded-xl px-4 py-3 text-xs font-mono lowercase ${formInput}`}
                          >
                            <option value="everyone">Everyone</option>
                            <option value="connections">Connections Only</option>
                            <option value="room_members">Focus Room Members Only</option>
                            <option value="nobody">Nobody (Invisible)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">Activity Telemetry Detail Level</label>
                          <select
                            value={user.activityVisibility || "status_only"}
                            onChange={(e) => submitProfileSettings({ activityVisibility: e.target.value })}
                            className={`w-full rounded-xl px-4 py-3 text-xs font-mono lowercase ${formInput}`}
                          >
                            <option value="app_name">Full App Name & Category</option>
                            <option value="app_category">App Category Only</option>
                            <option value="status_only">Presence Status Only</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">Workstation Machine Tag</label>
                          <input
                            type="text"
                            value={profileDeviceInput}
                            onChange={(e) => setProfileDeviceInput(e.target.value)}
                            onBlur={() => submitProfileSettings({ deviceConnected: profileDeviceInput })}
                            onKeyDown={(e) => e.key === "Enter" && submitProfileSettings({ deviceConnected: profileDeviceInput })}
                            className={`w-full rounded-xl px-4 py-3 text-xs font-mono ${formInput}`}
                          />
                        </div>

                        <div className="sm:col-span-2 border-t dark:border-neutral-850 border-stone-200/50 pt-5 space-y-4">
                          <h5 className="text-[10px] uppercase font-mono tracking-widest text-stone-400 font-bold">Connections Privacy Directives</h5>
                          
                          <div className="flex items-center justify-between text-xs py-1 border-b dark:border-neutral-850/40 border-stone-200/30">
                            <span className="text-stone-300">Show focus duration today to connections</span>
                            <button
                              onClick={() => submitProfileSettings({ showDailyFocusTime: !user.showDailyFocusTime })}
                              className={`px-3 py-1 text-[9px] font-mono uppercase tracking-wider rounded border cursor-pointer ${user.showDailyFocusTime ? "bg-white text-black" : "text-stone-550"}`}
                            >
                              {user.showDailyFocusTime ? "Shown" : "Hidden"}
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-xs py-1 border-b dark:border-neutral-850/40 border-stone-200/30">
                            <span className="text-stone-300">Show active room shortcut to connections</span>
                            <button
                              onClick={() => submitProfileSettings({ showCurrentRoom: !user.showCurrentRoom })}
                              className={`px-3 py-1 text-[9px] font-mono uppercase tracking-wider rounded border cursor-pointer ${user.showCurrentRoom ? "bg-white text-black" : "text-stone-550"}`}
                            >
                              {user.showCurrentRoom ? "Shown" : "Hidden"}
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-xs py-1 border-b dark:border-neutral-850/40 border-stone-200/30">
                            <span className="text-stone-300">Allow connections to send focus challenges</span>
                            <button
                              onClick={() => submitProfileSettings({ allowFocusInvites: !user.allowFocusInvites })}
                              className={`px-3 py-1 text-[9px] font-mono uppercase tracking-wider rounded border cursor-pointer ${user.allowFocusInvites ? "bg-white text-black" : "text-stone-550"}`}
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
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-serif italic tracking-tight font-semibold font-medium">Control dashboard configurations</h2>
                    <p className={`text-xs ${textSub}`}>
                      Subtle options managing toast synchronizations, visual theme maps, and automated signals.
                    </p>
                  </div>

                  <div className={`p-6 rounded-2xl border ${bgCard} max-w-2xl space-y-6`}>

                    <div className="space-y-5">
                      <h3 className="text-xs font-semibold font-mono tracking-widest uppercase text-stone-400">
                        NOTIFICATION NOTIFIERS DIRECTIVES
                      </h3>

                      <div className="space-y-4">

                        <div className="flex items-center justify-between py-1.5 border-b dark:border-neutral-850 border-stone-200/50">
                          <div>
                            <span className="text-xs font-semibold text-stone-300 dark:text-white block">Waved peer indicators</span>
                            <p className="text-[11px] text-stone-500">Enable real-time wave push signals triggered from adjacent room co-workers.</p>
                          </div>
                          <button
                            onClick={() => submitProfileSettings({
                              notifications: { ...user.notifications, friendUpdates: !user.notifications.friendUpdates }
                            })}
                            className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded border cursor-pointer ${user.notifications.friendUpdates
                                ? (themeMode === 'dark' ? "bg-stone-300 text-black" : "bg-neutral-800 text-white")
                                : "text-stone-500 dark:border-neutral-800"
                              }`}
                          >
                            {user.notifications.friendUpdates ? "Enabled" : "Muted"}
                          </button>
                        </div>

                        <div className="flex items-center justify-between py-1.5 border-b dark:border-neutral-850 border-stone-200/50">
                          <div>
                            <span className="text-xs font-semibold text-stone-300 dark:text-white block">Idle stretch recommendations</span>
                            <p className="text-[11px] text-stone-500">Receive active stretch reminders when workstation tracking runs past 45m.</p>
                          </div>
                          <button
                            onClick={() => submitProfileSettings({
                              notifications: { ...user.notifications, breakReminders: !user.notifications.breakReminders }
                            })}
                            className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded border cursor-pointer ${user.notifications.breakReminders
                                ? (themeMode === 'dark' ? "bg-stone-300 text-black" : "bg-neutral-800 text-white")
                                : "text-stone-500 dark:border-neutral-800"
                              }`}
                          >
                            {user.notifications.breakReminders ? "Enabled" : "Muted"}
                          </button>
                        </div>

                        <div className="flex items-center justify-between py-1.5 border-b dark:border-neutral-850 border-stone-200/50">
                          <div>
                            <span className="text-xs font-semibold text-stone-300 dark:text-white block">Generative AI compilation alerts</span>
                            <p className="text-[11px] text-stone-500">Show notification toasts on active compiling triggers with Gemini 3.5 Flash.</p>
                          </div>
                          <button
                            onClick={() => submitProfileSettings({
                              notifications: { ...user.notifications, aiNudges: !user.notifications.aiNudges }
                            })}
                            className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded border cursor-pointer ${user.notifications.aiNudges
                                ? (themeMode === 'dark' ? "bg-stone-300 text-black" : "bg-neutral-800 text-white")
                                : "text-stone-500 dark:border-neutral-800"
                              }`}
                          >
                            {user.notifications.aiNudges ? "Enabled" : "Muted"}
                          </button>
                        </div>

                      </div>
                    </div>

                    <div className="pt-4 space-y-4">
                      <h3 className="text-xs font-semibold font-mono tracking-widest uppercase text-stone-400">
                        CO-WORKING PIPELINE METRICS PORT OVERVIEW
                      </h3>
                      <div className="font-mono text-[11px] text-stone-500 space-y-1 bg-[#f5f4ef]/35 dark:bg-stone-900/50 p-4 border dark:border-[#222227] border-stone-200/50 rounded-xl">
                        <p className="text-stone-400 font-semibold mb-2">Workspace Configuration details:</p>
                        <p>Express Socket: ws://localhost:3000/rtime-pipeline</p>
                        <p>Database Engine: In-memory dynamic simulated ticks</p>
                        <p>Aesthetic pairing: newsreader-lora-serif-geometric-inter</p>
                        <p>Session ID: 3c832fe5-3b56-440d-91da-8d3c67a9f-session-token</p>
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
    </div>
  );
}
