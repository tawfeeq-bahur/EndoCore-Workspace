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
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  UserProfile, 
  Activity as UserActivity, 
  Friend, 
  Group, 
  AnalyticsData, 
  TimelineItem,
  ChatMessage
} from "./types";

export default function App() {
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
  const [currentTimeText, setCurrentTimeText] = useState<string>("");

  // Nudge reaction status Map
  const [nudgedFriendIds, setNudgedFriendIds] = useState<Record<string, boolean>>({});

  // Authentication states
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authName, setAuthName] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  const getAuthHeaders = () => {
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  const socketRef = useRef<any>(null);
  const chatEndRef = useRef<any>(null);

  // Bootstrap data loop, polling for updates and setting up WebSocket connection
  useEffect(() => {
    if (!token) return;

    fetchProfile();
    fetchActivity();
    fetchFriends();
    fetchAnalytics();
    fetchGroups();
    fetchAiBriefing();

    const updateTime = () => {
      const now = new Date();
      setCurrentTimeText(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);

    // Slower fallback polling for other database states
    const dataSyncInterval = setInterval(() => {
      fetchActivity();
      silentFetchAnalytics();
      fetchProfile();
    }, 8000);

    // Initialize Socket.io connection
    const socket = io({
      auth: { token }
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("WebSocket connected");
      if (user?.activeGroup) {
        socket.emit("join-group", user.activeGroup);
      }
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

    return () => {
      clearInterval(clockInterval);
      clearInterval(dataSyncInterval);
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [token]);

  // Keep WebSocket room membership in sync with user's active group
  useEffect(() => {
    if (socketRef.current && user?.activeGroup) {
      socketRef.current.emit("join-group", user.activeGroup);
      fetchFriends();
    }
  }, [user?.activeGroup]);

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
      const res = await fetch("/api/user", { headers: getAuthHeaders() });
      const data = await res.json();
      setUser(data);
      setStatusInput(data.customStatus || "");
      if (data.theme === "light") {
        setThemeMode("light");
      }
    } catch (e) {
      console.error("API Fetch Error (Profile):", e);
    }
  };

  const fetchActivity = async () => {
    try {
      const res = await fetch("/api/my-activity", { headers: getAuthHeaders() });
      const data = await res.json();
      setMyActivity(data);
    } catch (e) {
      console.error("API Fetch Error (My Activity):", e);
    }
  };

  const fetchFriends = async () => {
    try {
      const groupParam = user?.activeGroup ? `?group=${encodeURIComponent(user.activeGroup)}` : "";
      const res = await fetch(`/api/friends${groupParam}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setFriends(data);
      } else {
        setFriends([]);
      }
    } catch (e) {
      console.error("API Fetch Error (Friends):", e);
      setFriends([]);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics", { headers: getAuthHeaders() });
      const data = await res.json();
      setAnalytics(data);
    } catch (e) {
      console.error("API Fetch Error (Analytics):", e);
    }
  };

  const silentFetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics", { headers: getAuthHeaders() });
      const data = await res.json();
      setAnalytics(prev => {
        if (!prev) return data;
        // Blend in real-time values smoothly
        return {
          ...data,
          weeklyTotalHours: prev.weeklyTotalHours,
          weeklyProdGoalAchieved: prev.weeklyProdGoalAchieved
        };
      });
    } catch (e) {
      // Slient fail
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups", { headers: getAuthHeaders() });
      const data = await res.json();
      setGroups(data);
    } catch (e) {
      console.error("API Fetch Error (Groups):", e);
    }
  };

  const fetchAiBriefing = async (force: boolean = false) => {
    setLoadingInsights(true);
    setInsightsError(false);
    try {
      const res = await fetch(`/api/ai-insights${force ? "?force=true" : ""}`, { headers: getAuthHeaders() });
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
      const res = await fetch("/api/my-activity", {
        method: "POST",
        headers: getAuthHeaders(),
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
      await fetch("/api/my-activity", {
        method: "POST",
        headers: getAuthHeaders(),
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
      await fetch("/api/my-activity", {
        method: "POST",
        headers: getAuthHeaders(),
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
      const res = await fetch(`/api/chat/${g.id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setRoomChatMessages(data);
    } catch (e) {
      console.error("Failed to fetch chat:", e);
    }
  };

  const fetchRoomLeaderboard = async (roomName: string) => {
    if (!token) return;
    setFetchingLeaderboard(true);
    try {
      const res = await fetch(`/api/leaderboard?group=${encodeURIComponent(roomName)}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setRoomLeaderboard(data);
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
      
      const res = await fetch("/api/my-activity", {
        method: "POST",
        headers: getAuthHeaders(),
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
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.profile);
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
      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: getAuthHeaders(),
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
      setToken(data.token);
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
      setToken(data.token);
      triggerToast("Account created successfully!");
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setMyActivity(null);
    setFriends([]);
    setAnalytics(null);
    setGroups([]);
    setAiInsights(null);
    triggerToast("Logged out successfully");
  };

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
      if (isToday) {
        const hours = myActivity ? myActivity.durationSeconds / 3600 : 0;
        if (hours === 0) level = 0;
        else if (hours < 1) level = 1;
        else if (hours < 3) level = 2;
        else if (hours < 5) level = 3;
        else level = 4;
      } else {
        const hash = (currentDate.getFullYear() * 31 + currentDate.getMonth() * 7 + currentDate.getDate()) % 13;
        if (hash === 0 || hash === 3 || hash === 8) level = 0;
        else if (hash === 1 || hash === 5) level = 1;
        else if (hash === 2 || hash === 9 || hash === 11) level = 2;
        else if (hash === 4 || hash === 10) level = 3;
        else level = 4;
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
                          className={`w-3.5 h-3.5 rounded-sm transition-all duration-300 ${levelColors[day.level]} ${
                            day.isToday ? "ring-2 ring-blue-500 dark:ring-stone-300" : ""
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
              className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-full shadow-2xl flex items-center space-x-3 text-xs tracking-wide font-mono ${
                themeMode === "dark" ? "bg-white text-black border border-neutral-100" : "bg-neutral-900 text-white border border-neutral-800"
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

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-350 ease-out font-sans ${bgMain}`}>
      
      {/* ⚡ PREMIUM MINIMAL TOAST ALERT */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-full shadow-2xl flex items-center space-x-3 text-xs tracking-wide font-mono ${
              themeMode === "dark" ? "bg-white text-black border border-neutral-100" : "bg-neutral-900 text-white border border-neutral-800"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-stone-500 animate-ping"></span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🕊️ LEFT SYSTEM BRAND & WORKSPACE COMMAND PANEL */}
      <aside className={`w-full md:w-64 border-r flex flex-col shrink-0 ${bgCard} ${borderRule}`}>
        
        {/* Elegant Top Branding Section */}
        <div className={`p-6 border-b ${borderRule} space-y-1`}>
          <div className="flex items-center space-x-2">
            <span className="font-serif italic text-2xl font-semibold tracking-tight">EndoCore.</span>
            <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 border rounded opacity-70">v1.0</span>
          </div>
          <p className="text-[10px] font-mono tracking-wider uppercase opacity-65 flex items-center">
            <span className="h-1.5 w-1.5 bg-zinc-600 dark:bg-[#bfb5a3] rounded-full inline-block mr-2 animate-pulse"></span>
            WORKSTATION PIPELINE
          </p>
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
                onChange={(e) => submitProfileSettings({ activeGroup: e.target.value })}
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
              onClick={() => { setActiveTab("dashboard"); setSelectedRoomName(null); setSelectedFriendId(null); }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                activeTab === "dashboard" && !selectedRoomName && !selectedFriendId
                  ? (themeMode === 'dark' ? "bg-[#1c1c22] text-white font-medium" : "bg-[#f3f2eb] text-black font-semibold")
                  : `text-stone-500 hover:${themeMode === 'dark' ? 'text-white' : 'text-black'}`
              }`}
            >
              <Home className="h-4 w-4 shrink-0 opacity-80" />
              <span>My Productivity</span>
            </button>

            <button 
              onClick={() => { setActiveTab("analytics"); setSelectedRoomName(null); setSelectedFriendId(null); }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                activeTab === "analytics"
                  ? (themeMode === 'dark' ? "bg-[#1c1c22] text-white font-medium" : "bg-[#f3f2eb] text-black font-semibold")
                  : `text-stone-500 hover:${themeMode === 'dark' ? 'text-white' : 'text-black'}`
              }`}
            >
              <BarChart3 className="h-4 w-4 shrink-0 opacity-80" />
              <span>My Analytics</span>
            </button>

            <button 
              onClick={() => { setActiveTab("focus"); setSelectedRoomName(null); setSelectedFriendId(null); }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                activeTab === "focus"
                  ? (themeMode === 'dark' ? "bg-[#1c1c22] text-white font-medium" : "bg-[#f3f2eb] text-black font-semibold")
                  : `text-stone-500 hover:${themeMode === 'dark' ? 'text-white' : 'text-black'}`
              }`}
            >
              <Target className="h-4 w-4 shrink-0 opacity-80" />
              <span>My Goals</span>
            </button>
          </div>

          {/* Rooms Section */}
          <div className="space-y-1">
            <div 
              onClick={() => { setActiveTab("groups"); setSelectedRoomName(null); setSelectedFriendId(null); }}
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
                      onClick={() => enterRoomChannel(group.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all duration-150 cursor-pointer ${
                        isSelected
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
                          onClick={() => setRoomTab("overview")}
                          className={`w-full flex items-center space-x-2 px-2 py-1.5 text-[11px] font-mono rounded transition-colors cursor-pointer text-left ${
                            roomTab === "overview" ? "text-white font-medium bg-zinc-850/40" : "text-stone-500 hover:text-stone-300"
                          }`}
                        >
                          <LayoutDashboard className="h-3 w-3 opacity-70" />
                          <span>Overview</span>
                        </button>

                        <button
                          onClick={() => setRoomTab("members")}
                          className={`w-full flex items-center space-x-2 px-2 py-1.5 text-[11px] font-mono rounded transition-colors cursor-pointer text-left ${
                            roomTab === "members" ? "text-white font-medium bg-zinc-850/40" : "text-stone-500 hover:text-stone-300"
                          }`}
                        >
                          <Users className="h-3 w-3 opacity-70" />
                          <span>Members</span>
                        </button>

                        <button
                          onClick={() => setRoomTab("live")}
                          className={`w-full flex items-center space-x-2 px-2 py-1.5 text-[11px] font-mono rounded transition-colors cursor-pointer text-left ${
                            roomTab === "live" ? "text-white font-medium bg-zinc-850/40" : "text-stone-500 hover:text-stone-300"
                          }`}
                        >
                          <Activity className="h-3 w-3 opacity-70" />
                          <span>Live Activity</span>
                        </button>

                        <button
                          onClick={() => setRoomTab("leaderboard")}
                          className={`w-full flex items-center space-x-2 px-2 py-1.5 text-[11px] font-mono rounded transition-colors cursor-pointer text-left ${
                            roomTab === "leaderboard" ? "text-white font-medium bg-zinc-850/40" : "text-stone-500 hover:text-stone-300"
                          }`}
                        >
                          <Award className="h-3 w-3 opacity-70" />
                          <span>Leaderboard</span>
                        </button>

                        <button
                          onClick={() => setRoomTab("ai-summary")}
                          className={`w-full flex items-center space-x-2 px-2 py-1.5 text-[11px] font-mono rounded transition-colors cursor-pointer text-left ${
                            roomTab === "ai-summary" ? "text-white font-medium bg-zinc-850/40" : "text-stone-500 hover:text-stone-300"
                          }`}
                        >
                          <Sparkles className="h-3 w-3 opacity-70" />
                          <span>AI Summary</span>
                        </button>

                        <button
                          onClick={() => setRoomTab("chat")}
                          className={`w-full flex items-center space-x-2 px-2 py-1.5 text-[11px] font-mono rounded transition-colors cursor-pointer text-left ${
                            roomTab === "chat" ? "text-white font-medium bg-zinc-850/40" : "text-stone-500 hover:text-stone-300"
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
              onClick={() => { setActiveTab("profile"); setSelectedRoomName(null); setSelectedFriendId(null); }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                activeTab === "profile"
                  ? (themeMode === 'dark' ? "bg-[#1c1c22] text-white font-medium" : "bg-[#f3f2eb] text-black font-semibold")
                  : `text-stone-500 hover:${themeMode === 'dark' ? 'text-white' : 'text-black'}`
              }`}
            >
              <User className="h-4 w-4 shrink-0 opacity-80" />
              <span>Profile</span>
            </button>

            <button 
              onClick={() => { setActiveTab("settings"); setSelectedRoomName(null); setSelectedFriendId(null); }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                activeTab === "settings"
                  ? (themeMode === 'dark' ? "bg-[#1c1c22] text-white font-medium" : "bg-[#f3f2eb] text-black font-semibold")
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

            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 bg-[#f5f4ef]/30 dark:bg-[#18181c]/50 p-2.5 rounded-lg border dark:border-[#222227] border-stone-200/50">
              <div className="flex items-center space-x-1">
                <Laptop className="h-3 w-3 inline opacity-60" />
                <span className="truncate max-w-[80px]">{user.deviceConnected}</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider text-stone-400">Synced ✓</span>
            </div>

            <button
              onClick={handleLogout}
              className="w-full text-center py-2 border dark:border-neutral-800/80 border-stone-200/55 text-[10px] font-mono uppercase tracking-wider rounded-lg text-red-500 hover:text-red-400 dark:hover:bg-red-950/20 hover:bg-red-50/50 cursor-pointer transition-all duration-150"
            >
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* 🚀 CENTRAL VIEW CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        
        {/* Elegant Top Header with Minimalist Meta Controls */}
        <header className={`h-16 border-b shrink-0 px-6 md:px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md ${borderRule} ${
          themeMode === "dark" ? "bg-[#09090b]/80" : "bg-[#fbfbfa]/80"
        }`}>
          <div className="flex items-center space-x-4 flex-1">
            <h1 className="text-lg font-serif italic tracking-tight font-medium">Workspace Status</h1>
            <span className="h-3.5 w-px bg-neutral-400/20"></span>
            
            <p className="text-[10px] font-mono text-[#a1a1aa] leading-none uppercase hidden sm:block">
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
        <div className="p-6 md:p-8 space-y-8 max-w-5xl w-full mx-auto">
          
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
                  <div className="space-y-2">
                    <h2 className="text-4xl md:text-5xl font-serif italic font-medium tracking-tight leading-tight">
                      {getGreeting()}
                    </h2>
                    <p className={`text-sm tracking-wide ${textSub}`}>
                      Here's your productivity overview for today. Keep your momentum going!
                    </p>
                  </div>

                  {/* CARDS GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                    {/* Focus Time */}
                    <div className={`p-5 rounded-2xl border ${bgCard} ${borderRule} flex flex-col justify-between h-32`}>
                      <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block">Focus Time</span>
                      <div className="space-y-1">
                        <div className="text-2xl font-serif italic font-semibold">{myActivity ? (myActivity.durationSeconds / 3600).toFixed(1) : "0.0"} hrs</div>
                        <div className="text-[10px] text-zinc-500 font-mono">Goal: {user?.productivityGoal || 6} hrs</div>
                      </div>
                    </div>
                    {/* Productivity Score */}
                    <div className={`p-5 rounded-2xl border ${bgCard} ${borderRule} flex flex-col justify-between h-32`}>
                      <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block">Productivity Score</span>
                      <div className="space-y-1">
                        <div className="text-2xl font-serif italic font-semibold">{myActivity ? Math.min(100, Math.round(((myActivity.durationSeconds / 3600) / (user?.productivityGoal || 6)) * 100)) : 0}%</div>
                        <div className="text-[10px] text-zinc-500 font-mono">Today's target achieved</div>
                      </div>
                    </div>
                    {/* Current Session */}
                    <div className={`p-5 rounded-2xl border ${bgCard} ${borderRule} flex flex-col justify-between h-32`}>
                      <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block">Current Session</span>
                      <div className="space-y-1">
                        <div className="text-lg font-serif italic font-semibold truncate">{myActivity ? myActivity.app : "Inactive"}</div>
                        <div className="text-[10px] text-zinc-500 font-mono truncate">Proj: {myActivity ? myActivity.project : "None"}</div>
                      </div>
                    </div>
                    {/* Goals Completed */}
                    <div className={`p-5 rounded-2xl border ${bgCard} ${borderRule} flex flex-col justify-between h-32`}>
                      <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block">Goals Completed</span>
                      <div className="space-y-1">
                        <div className="text-2xl font-serif italic font-semibold">{pomodoroSessionCount} cycles</div>
                        <div className="text-[10px] text-zinc-500 font-mono">Pomodoro focus block</div>
                      </div>
                    </div>
                    {/* Weekly Trend */}
                    <div className={`p-5 rounded-2xl border ${bgCard} ${borderRule} flex flex-col justify-between h-32`}>
                      <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block">Weekly Trend</span>
                      <div className="space-y-1">
                        <div className="text-2xl font-serif italic font-semibold">{analytics ? analytics.weeklyTotalHours.toFixed(1) : "0.0"} hrs</div>
                        <div className="text-[10px] text-zinc-500 font-mono">Daily Avg: {analytics ? analytics.averageDailyFocus : 0} hrs</div>
                      </div>
                    </div>
                  </div>

                  {/* TODAY'S PROGRESS / TRACKER & TIMELINE SPLIT GRID */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Today's Progress / Activity Tracker */}
                    <div className="lg:col-span-2">
                      {myActivity && (
                        <div className={`p-6 md:p-8 rounded-3xl ${bgCard} border ${borderRule} h-full relative overflow-hidden transition-all duration-300`}>
                          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                            <Terminal className="h-64 w-64 text-zinc-400" />
                          </div>

                          <div className="flex flex-col justify-between h-full space-y-6 relative z-10">
                            <div className="space-y-4">
                              <div className="inline-flex items-center space-x-2">
                                <span className="text-[10px] font-mono uppercase tracking-widest text-[#a1a1aa] bg-stone-100 dark:bg-zinc-800/60 border dark:border-neutral-800/50 border-neutral-200 px-3 py-1 rounded-full">
                                  Today's Progress / Activity Tracker
                                </span>
                                {myActivity.isPaused && (
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full animate-pulse">
                                    Paused
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* App Selector Custom Node */}
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 block">Select Active Application</label>
                                  <select 
                                    value={myActivity.app}
                                    onChange={(e) => updateMyActiveTracker(e.target.value, undefined, undefined)}
                                    className={`w-full rounded-xl px-4 py-3 text-xs font-mono ${formInput} transition-all cursor-pointer`}
                                  >
                                    <option value="VS Code">VS Code</option>
                                    <option value="Chrome">Chrome Browser</option>
                                    <option value="Figma">Figma Design</option>
                                    <option value="Terminal">Terminal / Shell</option>
                                    <option value="Spotify">Spotify Music</option>
                                    <option value="Slack">Slack Chat</option>
                                  </select>
                                </div>

                                {/* Project description inline apply */}
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 block">Active Project / Task Details</label>
                                  <div className="flex items-center space-x-2">
                                    <input 
                                      type="text"
                                      value={projectInput}
                                      onChange={(e) => setProjectInput(e.target.value)}
                                      className={`w-full rounded-xl px-4 py-3 text-xs tracking-wide ${formInput} transition-all`}
                                      placeholder="What are you building?"
                                      onKeyDown={(e) => e.key === "Enter" && updateMyActiveTracker(undefined, projectInput, undefined)}
                                    />
                                    <button 
                                      onClick={() => updateMyActiveTracker(undefined, projectInput, undefined)}
                                      className="bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-white text-xs px-4 py-3 rounded-xl tracking-wide font-mono uppercase font-semibold transition-all cursor-pointer shrink-0"
                                    >
                                      Sync
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* High precision countdown box */}
                            <div className={`p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 border ${bgInternal} dark:border-[#222227] border-stone-200/50`}>
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">Current Session Duration</span>
                                <div className="text-xl font-mono tracking-tight text-stone-350 font-bold flex items-center">
                                  <Clock className="h-4.5 w-4.5 text-zinc-400 mr-2 shrink-0 animate-pulse" />
                                  <span>{parsedDurationText(myActivity.durationSeconds || 0)}</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 select-none border-t sm:border-y-0 sm:border-l dark:border-[#222227] border-stone-200/50 pt-4 sm:pt-0 sm:pl-4">
                                <button 
                                  onClick={() => updateMyActiveTracker(undefined, undefined, !myActivity.isPaused)}
                                  className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                    myActivity.isPaused 
                                      ? "bg-stone-850 dark:bg-stone-300 dark:text-black text-white" 
                                      : "bg-[#2563EB]/10 border border-[#2563EB]/30 hover:bg-[#2563EB]/25 text-blue-450 dark:text-blue-350"
                                  }`}
                                  title={myActivity.isPaused ? "Resume focus tracking session" : "Temporarily pause activity tracker"}
                                >
                                  {myActivity.isPaused ? <Play className="h-4.5 w-4.5" /> : <Pause className="h-4.5 w-4.5" />}
                                </button>
                                
                                <button 
                                  onClick={async () => {
                                    const res = await fetch("/api/my-activity", {
                                      method: "POST",
                                      headers: getAuthHeaders(),
                                      body: JSON.stringify({ resetTimer: true })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setMyActivity(data.activity);
                                      triggerToast("Focus session duration timer reset successfully");
                                      fetchProfile();
                                    }
                                  }}
                                  className="h-11 w-11 bg-transparent hover:bg-stone-500/10 text-stone-500 hover:text-stone-300 border dark:border-[#222227] border-stone-200/50 rounded-xl flex items-center justify-center cursor-pointer"
                                  title="Restart Timer"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Personal Recent Focus Timeline */}
                    <div className={`p-6 md:p-8 rounded-3xl ${bgCard} border ${borderRule} flex flex-col justify-between`}>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b dark:border-[#222227] border-stone-200/50 pb-2">
                          <h3 className="text-xs font-semibold font-mono tracking-widest uppercase text-stone-400 flex items-center">
                            <Activity className="h-4 w-4 mr-1.5 text-zinc-500" />
                            Recent Focus Timeline
                          </h3>
                          <span className="text-[10px] font-mono text-zinc-500">My sessions</span>
                        </div>

                        <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
                          {user?.timeline && user.timeline.length > 0 ? (
                            user.timeline.map((item, idx) => (
                              <div key={idx} className="flex items-start space-x-3 text-xs border-b dark:border-zinc-900 border-stone-150 pb-3 last:border-0 last:pb-0">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0 animate-pulse" />
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono font-semibold text-[#e4e4e7] truncate">{item.app}</span>
                                    <span className="font-mono text-[9px] text-zinc-500 shrink-0">{item.time}</span>
                                  </div>
                                  <p className="text-[11px] text-zinc-400 truncate leading-snug">{item.project}</p>
                                  <span className="text-[9px] font-mono text-zinc-550 dark:text-zinc-450 bg-stone-100 dark:bg-zinc-800/40 border dark:border-neutral-800/50 border-neutral-250 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                    {item.duration} elapsed
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-stone-550 text-xs font-mono py-12 text-center">
                              No recent focus sessions logged. Start tracking to populate timeline!
                            </div>
                          )}
                        </div>
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
                            
                            {/* VS Code: 45% */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#787880" strokeWidth="3.5" 
                                    strokeDasharray="45 100" strokeDashoffset="0" />
                            {/* Figma: 20% */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#bfb5a3" strokeWidth="3.5" 
                                    strokeDasharray="20 100" strokeDashoffset="-45" />
                            {/* Chrome: 18% */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#d4af37" strokeWidth="3.5" 
                                    strokeDasharray="18 100" strokeDashoffset="-65" />
                            {/* Other: 10% */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6b7280" strokeWidth="3.5" 
                                    strokeDasharray="10 100" strokeDashoffset="-83" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-serif italic text-white dark:text-stone-300 font-bold">45%</span>
                            <span className="text-[9px] uppercase font-mono tracking-widest text-[#a1a1aa] mt-0.5">Coding Focus</span>
                          </div>
                        </div>

                        <div className="space-y-2.5 flex-1 w-full sm:w-auto">
                          {analytics.appBreakdown.map((item, id) => (
                            <div key={id} className="flex justify-between items-center text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: id === 0 ? "#787880" : id === 1 ? "#bfb5a3" : id === 2 ? "#d4af37" : "#4b5563" }}></span>
                                <span className="font-mono text-[11px] text-stone-500 lowercase">{item.name}</span>
                              </div>
                              <span className="font-mono text-[11px] text-[#bfb5a3] font-bold">{item.value}%</span>
                            </div>
                          ))}
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
                            strokeDashoffset={(1 - ( (pomodoroMinutesLeft * 60 + pomodoroSecondsLeft) / (pomodoroMode === "focus" ? 1500 : 300) )) * 565.48} 
                            strokeLinecap="round" 
                            className="transition-all duration-1000 ease-linear"
                          />
                        </svg>
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
                          <div className="text-4xl font-mono font-bold tracking-tight text-white dark:text-stone-300">
                            {String(pomodoroMinutesLeft).padStart(2, '0')}:{String(pomodoroSecondsLeft).padStart(2, '0')}
                          </div>
                          <span className={`text-[9px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-full ${
                            pomodoroMode === "focus" 
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
                          className={`px-8 py-3.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                            pomodoroActive 
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
                          className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                            pomodoroMode === "focus" 
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
                          className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                            pomodoroMode === "break" 
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
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border ${
                            (user?.distractionsCount || 0) === 0 
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

                      {/* Room creation dialog form */}
                      <div className={`p-6 rounded-3xl ${bgCard} border ${borderRule}`}>
                        <h3 className="text-xs font-semibold font-mono tracking-widest uppercase text-stone-400 flex items-center mb-4">
                          <Plus className="h-4.5 w-4.5 mr-1" />
                          COMMISSION NEW CHANNEL
                        </h3>

                        <form onSubmit={executeCreateGroup} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase font-mono tracking-widest text-[#a1a1aa] block">Guild/Room Name</label>
                            <input 
                              type="text"
                              required
                              value={newGroupName}
                              onChange={(e) => setNewGroupName(e.target.value)}
                              className={`w-full rounded-xl px-4 py-3 text-xs tracking-wide ${formInput}`}
                              placeholder="e.g. Research Team"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase font-mono tracking-widest text-[#a1a1aa] block">Brief Channel Manifest</label>
                            <div className="flex items-center space-x-2">
                              <input 
                                type="text"
                                value={newGroupDesc}
                                onChange={(e) => setNewGroupDesc(e.target.value)}
                                className={`w-full rounded-xl px-4 py-3 text-xs tracking-wide ${formInput}`}
                                placeholder="Deep focus study group..."
                              />
                              <button 
                                type="submit"
                                disabled={creatingGroup}
                                className="bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-black text-white text-xs px-6 py-3 rounded-xl font-mono uppercase tracking-wide font-semibold shrink-0 cursor-pointer disabled:opacity-50"
                              >
                                {creatingGroup ? "Deploying..." : "Launch"}
                              </button>
                            </div>
                          </div>
                        </form>
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
                                  <span className={`text-[9px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded border ${
                                    user?.activeGroup === group.name 
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
                              className={`pb-2 transition-all uppercase tracking-widest cursor-pointer ${
                                roomTab === tab 
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
                              {/* 3 metrics cards */}
                              {analytics && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                  <div className={`p-6 rounded-2xl border ${bgCard} ${borderRule}`}>
                                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block mb-1">Active Guild Average</span>
                                    <div className="text-3xl font-serif italic font-semibold">{analytics.averageDailyFocus} hrs</div>
                                    <p className="text-[10px] text-zinc-500 font-mono mt-1">// Group focus duration average</p>
                                  </div>
                                  <div className={`p-6 rounded-2xl border ${bgCard} ${borderRule}`}>
                                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block mb-1">Total Room Focus</span>
                                    <div className="text-3xl font-serif italic font-semibold">{analytics.weeklyTotalHours} hrs</div>
                                    <p className="text-[10px] text-zinc-500 font-mono mt-1">// Accumulated group hours</p>
                                  </div>
                                  <div className={`p-6 rounded-2xl border ${bgCard} ${borderRule}`}>
                                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block mb-1">Group Goal Progress</span>
                                    <div className="text-3xl font-serif italic font-semibold">{analytics.weeklyProdGoalAchieved}%</div>
                                    <p className="text-[10px] text-zinc-500 font-mono mt-1">// Room productivity index</p>
                                  </div>
                                </div>
                              )}

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
                                  const styleMeta = getStatusNodeMeta(friend.status);

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
                                            <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 ${
                                              themeMode === 'dark' ? 'border-[#121215]' : 'border-white'
                                            } ${styleMeta.color}`}></span>
                                          </div>
                                          <div className="min-w-0">
                                            <h4 className={`text-sm font-semibold truncate transition-colors ${
                                              themeMode === 'dark' ? 'group-hover:text-stone-300' : 'group-hover:text-black'
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
                                            className={`px-3 py-1.5 border rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                                              nudgedFriendIds[friend.id]
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
                                    .sort((a,b) => b.time.localeCompare(a.time))
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
                                          <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                                            isMe 
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
                          <label className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">Workspace Display Username</label>
                          <input 
                            type="text"
                            value={user.name}
                            onChange={(e) => submitProfileSettings({ name: e.target.value })}
                            className={`w-full rounded-xl px-4 py-3 text-xs tracking-wide ${formInput}`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">Avatar image pointer link</label>
                          <input 
                            type="text"
                            value={user.avatarUrl}
                            onChange={(e) => submitProfileSettings({ avatarUrl: e.target.value })}
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
                          <label className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">Peer visibility mode</label>
                          <select 
                            value={user.privacyMode}
                            onChange={(e) => submitProfileSettings({ privacyMode: e.target.value })}
                            className={`w-full rounded-xl px-4 py-3 text-xs font-mono lowercase ${formInput}`}
                          >
                            <option value="Level 1: Full Detail">Level 1: Full Detail (Friends)</option>
                            <option value="Level 2: Category Only">Level 2: Category Only (Family)</option>
                            <option value="Level 3: Summary Only">Level 3: Summary Only (Parents)</option>
                            <option value="Level 4: Private">Level 4: Private (Self)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-stone-500 block">Workstation Machine Tag</label>
                          <input 
                            type="text"
                            value={user.deviceConnected}
                            onChange={(e) => submitProfileSettings({ deviceConnected: e.target.value })}
                            className={`w-full rounded-xl px-4 py-3 text-xs font-mono ${formInput}`}
                          />
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
                            className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded border cursor-pointer ${
                              user.notifications.friendUpdates 
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
                            className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded border cursor-pointer ${
                              user.notifications.breakReminders 
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
                            className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded border cursor-pointer ${
                              user.notifications.aiNudges 
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

    </div>
  );
}
