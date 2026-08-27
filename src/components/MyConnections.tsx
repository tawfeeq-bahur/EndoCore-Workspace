import React, { useState } from "react";
import { 
  Users, UserCheck, UserX, Target, Laptop, Search, Plus, 
  Sparkles, ArrowRight, Clock, MessageSquare, Shield, ChevronDown, 
  MoreVertical, Check, HelpCircle, UserPlus, Zap, ArrowLeftRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MyConnectionsProps {
  connectionsData: {
    friends: any[];
    incoming: any[];
    outgoing: any[];
  };
  myActivity?: any;
  user?: any;
  onNudge?: (name: string, id: string) => void;
  onChallenge?: (friend: any) => void;
  onSearchUsers?: (query: string) => void;
  onConnect?: (userId: string) => void;
  onAcceptRequest?: (reqId: string) => void;
  onDeclineRequest?: (reqId: string) => void;
  onJoinSession?: (roomOrUser: string) => void;
  triggerToast?: (msg: string) => void;
}

export const MyConnections: React.FC<MyConnectionsProps> = ({
  connectionsData,
  myActivity,
  user,
  onNudge,
  onChallenge,
  onSearchUsers,
  onConnect,
  onAcceptRequest,
  onDeclineRequest,
  onJoinSession,
  triggerToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"lobby" | "discover" | "requests">("lobby");
  const [searchQuery, setSearchQuery] = useState("");
  const [nudgedState, setNudgedState] = useState<Record<string, boolean>>({});

  const handleNudgeClick = (name: string, id: string) => {
    setNudgedState(prev => ({ ...prev, [id]: true }));
    if (onNudge) onNudge(name, id);
    if (triggerToast) triggerToast(`👋 Waved at ${name}!`);
  };

  // Extract online/offline metrics
  const friendsList = connectionsData.friends || [];
  const incomingList = connectionsData.incoming || [];

  const onlineFriends = friendsList.filter(f => f.presence?.state !== "offline");
  const offlineFriends = friendsList.filter(f => f.presence?.state === "offline");
  const focusingCount = friendsList.filter(f => f.presence?.state === "focusing" || f.presence?.state === "online").length;

  // Fallback demo peers if friends list has few items
  const demoOnlinePeers = [
    {
      id: "p1",
      name: "Tawfeeq Bahur",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      role: "Software Developer",
      badge: "FOCUSING",
      duration: "38m",
      app: "VS Code • EndoCore Workspace",
      note: "Deep focus session",
      focusTimeMin: 38,
      lastInteraction: "12 min ago"
    },
    {
      id: "p2",
      name: "Sri",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      role: "Software Developer",
      badge: "",
      duration: "40m",
      app: "Slack • Engineering Team",
      note: "Team communication",
      focusTimeMin: 40,
      lastInteraction: "8 min ago"
    }
  ];

  const demoRecommendations = [
    {
      id: "r1",
      name: "Ravi",
      role: "UI/UX Designer",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      room: "Engineering Team",
      app: "Figma",
      shared: "2 shared rooms",
      match: "82%"
    },
    {
      id: "r2",
      name: "Arun",
      role: "Research Associate",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      room: "Engineering Team",
      app: "Research",
      shared: "1 shared project",
      match: "76%"
    },
    {
      id: "r3",
      name: "Vicky",
      role: "Software Developer",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
      room: "Engineering Team",
      app: "VS Code, TypeScript",
      shared: "2 shared rooms",
      match: "71%"
    }
  ];

  const sessionActivities = [
    { id: "sa1", icon: "👤+", text: "Sri joined Engineering Team", time: "2m ago", color: "text-emerald-600 bg-emerald-50" },
    { id: "sa2", icon: "👋", text: "Ravi waved at you", time: "18m ago", color: "text-amber-600 bg-amber-50" },
    { id: "sa3", icon: "🎯", text: "Arun started a focus session", time: "32m ago", color: "text-indigo-600 bg-indigo-50" },
    { id: "sa4", icon: "🔗", text: "Vicky connected with you", time: "1h ago", color: "text-blue-600 bg-blue-50" },
    { id: "sa5", icon: "🕒", text: "Tawfeeq ended a session", time: "2h ago", color: "text-slate-600 bg-slate-50" }
  ];

  const recentCollaborations = [
    {
      id: "rc1",
      user1: { name: "Tawfeeq Bahur", app: "VS Code", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
      user2: { name: "Sri", app: "Slack", avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80" },
      duration: "38m",
      time: "Today, 8:42 PM"
    },
    {
      id: "rc2",
      user1: { name: "Ravi", app: "Figma", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
      user2: { name: "You", app: "Engineering Team", avatarUrl: user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
      duration: "24m",
      time: "Today, 7:18 PM"
    },
    {
      id: "rc3",
      user1: { name: "Arun", app: "Private Workspace", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
      user2: { name: "You", app: "Engineering Team", avatarUrl: user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
      duration: "52m",
      time: "Today, 6:26 PM"
    }
  ];

  return (
    <div className="space-y-6 font-sans text-[#09090b]">

      {/* SUB-HEADER & NAVIGATION TABS ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e4e4e7] pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-6 text-xs font-semibold select-none">
          <button
            onClick={() => setActiveSubTab("lobby")}
            className={`pb-3 transition-all uppercase cursor-pointer tracking-wider ${
              activeSubTab === "lobby"
                ? "border-b-2 border-[#09090b] text-[#09090b] font-extrabold"
                : "text-[#71717a] hover:text-[#09090b]"
            }`}
          >
            LOBBY
          </button>
          <button
            onClick={() => setActiveSubTab("discover")}
            className={`pb-3 transition-all uppercase cursor-pointer tracking-wider ${
              activeSubTab === "discover"
                ? "border-b-2 border-[#09090b] text-[#09090b] font-extrabold"
                : "text-[#71717a] hover:text-[#09090b]"
            }`}
          >
            DISCOVER
          </button>
          <button
            onClick={() => setActiveSubTab("requests")}
            className={`pb-3 transition-all uppercase cursor-pointer tracking-wider flex items-center gap-1.5 ${
              activeSubTab === "requests"
                ? "border-b-2 border-[#09090b] text-[#09090b] font-extrabold"
                : "text-[#71717a] hover:text-[#09090b]"
            }`}
          >
            <span>REQUESTS</span>
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
              {incomingList.length}
            </span>
          </button>
        </div>

        {/* YOUR STATUS CARD (TOP-RIGHT STATUS BOX) */}
        <div className="p-3 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs flex items-center justify-between space-x-4 shrink-0">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#71717a] block">YOUR STATUS</span>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              <span className="text-xs font-bold text-[#09090b]">Focusing</span>
            </div>
            <p className="text-[10px] text-[#71717a] font-medium">VS Code • 38m</p>
          </div>
          <button
            onClick={() => triggerToast && triggerToast("Status preference menu opened")}
            className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-[#09090b] flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>Change status</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* SEARCH BAR ROW */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (onSearchUsers) onSearchUsers(e.target.value);
            }}
            placeholder="Search by email address or username..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-[#e4e4e7] text-xs font-medium text-[#09090b] focus:outline-none focus:border-[#09090b] transition-all shadow-2xs"
          />
        </div>
        <button
          onClick={() => {
            if (onSearchUsers && searchQuery) onSearchUsers(searchQuery);
            if (triggerToast) triggerToast(`Searching developer network for "${searchQuery || 'peers'}"`);
          }}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#09090b] hover:bg-[#18181b] text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          <span>Find & Connect</span>
        </button>
      </div>

      {/* TOP 4 KPI METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Online */}
        <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs flex items-center space-x-4">
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black font-display text-[#09090b]">{onlineFriends.length}</div>
            <div className="text-xs font-bold text-[#09090b]">Online</div>
            <p className="text-[10px] text-[#71717a]">Available to connect</p>
          </div>
        </div>

        {/* Card 2: Offline */}
        <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs flex items-center space-x-4">
          <div className="h-11 w-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
            <UserX className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black font-display text-[#09090b]">{offlineFriends.length}</div>
            <div className="text-xs font-bold text-[#09090b]">Offline</div>
            <p className="text-[10px] text-[#71717a]">Not currently active</p>
          </div>
        </div>

        {/* Card 3: Focusing */}
        <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs flex items-center space-x-4">
          <div className="h-11 w-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black font-display text-[#09090b]">{focusingCount}</div>
            <div className="text-xs font-bold text-[#09090b]">Focusing</div>
            <p className="text-[10px] text-[#71717a]">Deep work in progress</p>
          </div>
        </div>

        {/* Card 4: In Session */}
        <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs flex items-center space-x-4">
          <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Laptop className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black font-display text-[#09090b]">0</div>
            <div className="text-xs font-bold text-[#09090b]">In Session</div>
            <p className="text-[10px] text-[#71717a]">Active Pomodoro session</p>
          </div>
        </div>

      </div>

      {/* MAIN CONTENT GRID (2 COLUMNS: LEFT 75%, RIGHT 25%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: ONLINE NOW & RECOMMENDATIONS */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">

          {/* ONLINE NOW SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#09090b] font-mono">
                  ONLINE NOW
                </h3>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <button
                onClick={() => setActiveSubTab("lobby")}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer font-mono"
              >
                <span>{onlineFriends.length} online</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* PEER CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {onlineFriends.length > 0 ? onlineFriends.map((peer: any) => (
                <div key={peer.id} className="p-5 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-4 flex flex-col justify-between hover:border-emerald-300 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img src={peer.profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${peer.profile?.name}`} alt={peer.profile?.name} className="h-12 w-12 rounded-full object-cover border-2 border-emerald-400" />
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#09090b] truncate">{peer.profile?.name}</h4>
                        <p className="text-[11px] text-[#71717a] truncate">{peer.profile?.headline || peer.profile?.role || "Developer"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      onClick={() => handleNudgeClick(peer.profile?.name, peer.id)}
                      disabled={nudgedState[peer.id]}
                      className="px-3 py-1.5 rounded-xl border border-[#e4e4e7] bg-white hover:bg-slate-50 text-xs font-bold text-[#09090b] transition-all cursor-pointer shadow-2xs"
                    >
                      {nudgedState[peer.id] ? "Waved! 👋" : "Wave"}
                    </button>
                    <button
                      onClick={() => {
                        if (onJoinSession) onJoinSession(peer.profile?.name);
                        if (triggerToast) triggerToast(`Joining session with ${peer.profile?.name}`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#09090b] hover:bg-[#18181b] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Join Session</span>
                    </button>
                  </div>
                </div>
              )) : (
                <div className="md:col-span-2 p-8 text-center bg-white border border-dashed border-[#e4e4e7] rounded-2xl">
                  <UserCheck className="h-8 w-8 text-[#d4d4d8] mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#09090b]">No connections online</p>
                  <p className="text-xs text-[#71717a] mt-1">Connect with peers to see their live activity here.</p>
                </div>
              )}
            </div>
          </div>

          {/* RECOMMENDED FOR YOU SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#09090b] font-mono flex items-center gap-1.5">
                  <span>⭐</span>
                  <span>RECOMMENDED FOR YOU</span>
                </h3>
                <p className="text-[11px] text-[#71717a]">People you may want to connect with</p>
              </div>
              <button
                onClick={() => setActiveSubTab("discover")}
                className="text-xs font-bold text-[#09090b] hover:underline flex items-center gap-1 cursor-pointer font-mono"
              >
                <span>View all</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* RECOMMENDATIONS CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {friendsList.length > 0 ? (
                <div className="sm:col-span-3 p-8 text-center bg-white border border-dashed border-[#e4e4e7] rounded-2xl">
                  <Sparkles className="h-8 w-8 text-[#d4d4d8] mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#09090b]">Recommendations coming soon</p>
                  <p className="text-xs text-[#71717a] mt-1">As you connect with more peers, we'll suggest people you may want to collaborate with.</p>
                </div>
              ) : (
                <div className="sm:col-span-3 p-8 text-center bg-white border border-dashed border-[#e4e4e7] rounded-2xl">
                  <UserPlus className="h-8 w-8 text-[#d4d4d8] mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#09090b]">No connections yet</p>
                  <p className="text-xs text-[#71717a] mt-1">Search for peers by email or username above to start building your network.</p>
                </div>
              )}
            </div>
          </div>

          {/* BUILD STRONGER CONNECTIONS BOTTOM BANNER */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 border border-[#e4e4e7] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 text-xl">
                👥
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-[#09090b]">Build stronger connections</h4>
                <p className="text-[11px] text-[#71717a]">
                  Wave at a co-worker or challenge them to a 1v1 Pomodoro session and boost your productivity together.
                </p>
              </div>
            </div>
            <button
              onClick={() => triggerToast && triggerToast("1v1 Pomodoro co-working challenge guide opened")}
              className="px-4 py-2 rounded-xl border border-[#e4e4e7] bg-white hover:bg-slate-50 text-xs font-bold text-[#09090b] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
            >
              <HelpCircle className="h-4 w-4 text-[#71717a]" />
              <span>How it works</span>
            </button>
          </div>

        </div>

        {/* RIGHT SIDEBAR COLUMN: SESSION ACTIVITY & RECENT COLLABORATION */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">

          {/* SESSION ACTIVITY FEED */}
          <div className="p-5 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#09090b] font-mono flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-indigo-600" />
                  <span>SESSION ACTIVITY</span>
                </h3>
                <p className="text-[10px] text-[#71717a]">Live updates from your network</p>
              </div>
              <button
                onClick={() => triggerToast && triggerToast("Network session updates feed refreshed")}
                className="text-xs font-bold text-[#09090b] hover:underline cursor-pointer font-mono"
              >
                View all
              </button>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="p-6 text-center text-[#71717a]">
                <p className="text-xs font-medium">No activity yet.</p>
                <p className="text-[10px] mt-1">Session updates from your connections will appear here.</p>
              </div>
            </div>
          </div>

          {/* RECENT COLLABORATION */}
          <div className="p-5 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#09090b] font-mono flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-600" />
                  <span>RECENT COLLABORATION</span>
                </h3>
                <p className="text-[10px] text-[#71717a]">Your recent co-work history</p>
              </div>
              <button
                onClick={() => triggerToast && triggerToast("Co-working history log opened")}
                className="text-xs font-bold text-[#09090b] hover:underline cursor-pointer font-mono"
              >
                View all
              </button>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="p-6 text-center text-[#71717a]">
                <p className="text-xs font-medium">No collaborations yet.</p>
                <p className="text-[10px] mt-1">Your co-work sessions with connections will appear here.</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
