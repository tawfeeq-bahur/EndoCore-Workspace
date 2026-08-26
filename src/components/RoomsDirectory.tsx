import React, { useState } from "react";
import { 
  LayoutGrid, Activity, Users, Sparkles, TrendingUp, Target, 
  Search, Plus, ChevronDown, Grid, List, MoreVertical, ArrowRight, 
  Code, PenTool, Microscope, Megaphone, Cloud, Database, Package,
  User, Check, Clock, Shield
} from "lucide-react";

interface RoomItem {
  id: string;
  name: string;
  description: string;
  status: "ACTIVE" | "LIVE SESSION" | "QUIET" | "INACTIVE";
  iconType: "code" | "design" | "research" | "focus" | "marketing" | "devops" | "data" | "product";
  iconBg: string;
  membersCount: number;
  onlineCount: number;
  avatars: string[];
  extraAvatarsCount: number;
  focusHours: string;
  tasksCompleted: string;
  aiStatus: "ON" | "OFF" | "IDLE" | "COACH";
  recentActivity: string;
  recentTime: string;
  isMyRoom?: boolean;
}

interface RoomsDirectoryProps {
  groups: any[];
  directoryGroups: any[];
  user?: any;
  onEnterRoom: (roomName: string) => void;
  onOpenWizard: () => void;
  onJoinDirectoryGroup?: (groupId: string) => void;
  triggerToast?: (msg: string) => void;
}

export const RoomsDirectory: React.FC<RoomsDirectoryProps> = ({
  groups,
  directoryGroups,
  user,
  onEnterRoom,
  onOpenWizard,
  onJoinDirectoryGroup,
  triggerToast
}) => {
  const [activeFilter, setActiveFilter] = useState<"all" | "my" | "active" | "archived">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Recently Active");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const isShowcase = user?.email === "showcase@endocore.io";

  // Fallback demo rooms for showcase account
  const demoRooms: RoomItem[] = [
    {
      id: "r1",
      name: "Engineering Team",
      description: "Development, API integrations and infrastructure.",
      status: "ACTIVE",
      iconType: "code",
      iconBg: "bg-indigo-600 text-white",
      membersCount: 7,
      onlineCount: 3,
      avatars: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
      ],
      extraAvatarsCount: 4,
      focusHours: "42h",
      tasksCompleted: "18 / 40",
      aiStatus: "ON",
      recentActivity: "Tawfeeq started a focus session",
      recentTime: "4m ago",
      isMyRoom: true
    },
    {
      id: "r2",
      name: "Design Team",
      description: "UI/UX design, branding and product experience.",
      status: "ACTIVE",
      iconType: "design",
      iconBg: "bg-rose-500 text-white",
      membersCount: 5,
      onlineCount: 2,
      avatars: [
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"
      ],
      extraAvatarsCount: 2,
      focusHours: "31h",
      tasksCompleted: "12 / 25",
      aiStatus: "ON",
      recentActivity: "Ravi uploaded a new Figma file",
      recentTime: "11m ago",
      isMyRoom: true
    },
    {
      id: "r3",
      name: "Research Team",
      description: "Research, analysis and experimentation.",
      status: "QUIET",
      iconType: "research",
      iconBg: "bg-blue-600 text-white",
      membersCount: 6,
      onlineCount: 0,
      avatars: [
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100",
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100"
      ],
      extraAvatarsCount: 3,
      focusHours: "12h",
      tasksCompleted: "8 / 30",
      aiStatus: "IDLE",
      recentActivity: "Arun ended a session",
      recentTime: "2h ago",
      isMyRoom: true
    },
    {
      id: "r4",
      name: "Focus Guild",
      description: "Deep work sessions and productivity challenges.",
      status: "LIVE SESSION",
      iconType: "focus",
      iconBg: "bg-emerald-600 text-white",
      membersCount: 12,
      onlineCount: 8,
      avatars: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100",
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100"
      ],
      extraAvatarsCount: 7,
      focusHours: "68h",
      tasksCompleted: "28 / 50",
      aiStatus: "COACH",
      recentActivity: "Sri started a focus sprint",
      recentTime: "3m ago",
      isMyRoom: true
    }
  ];

  // DYNAMICALLY BUILD ROOMS LIST FROM REAL DATABASE GROUPS FOR REAL ACCOUNTS
  const displayRooms: RoomItem[] = [];

  if (Array.isArray(groups) && groups.length > 0) {
    groups.forEach((g: any, idx: number) => {
      const iconTypes: Array<RoomItem["iconType"]> = ["code", "design", "research", "focus", "devops", "data", "product", "marketing"];
      const iconBgs = ["bg-indigo-600 text-white", "bg-rose-500 text-white", "bg-blue-600 text-white", "bg-emerald-600 text-white", "bg-sky-500 text-white", "bg-purple-600 text-white", "bg-amber-500 text-white"];

      displayRooms.push({
        id: g.id || `g-${idx}`,
        name: g.name,
        description: g.description || "Collaborating workspace and focus channel.",
        status: g.status === "closed" ? "INACTIVE" : (g.status === "live" ? "LIVE SESSION" : "ACTIVE"),
        iconType: iconTypes[idx % iconTypes.length],
        iconBg: iconBgs[idx % iconBgs.length],
        membersCount: Array.isArray(g.members) ? g.members.length : 1,
        onlineCount: g.onlineCount !== undefined ? g.onlineCount : (Array.isArray(g.members) ? Math.max(1, Math.round(g.members.length * 0.6)) : 1),
        avatars: [
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100"
        ],
        extraAvatarsCount: Math.max(0, (Array.isArray(g.members) ? g.members.length : 1) - 3),
        focusHours: g.focusHours || `${(idx + 1) * 12 + 8}h`,
        tasksCompleted: g.tasksCompleted || `${(idx + 1) * 5} / ${(idx + 1) * 10 + 15}`,
        aiStatus: g.aiStatus || (idx % 2 === 0 ? "ON" : "COACH"),
        recentActivity: g.recentActivity || `${user?.name?.split(" ")[0] || "Member"} active in workspace`,
        recentTime: g.recentTime || "Just now",
        isMyRoom: true
      });
    });
  }

  // Include discovery groups if available
  if (Array.isArray(directoryGroups) && directoryGroups.length > 0) {
    directoryGroups.forEach((dg: any, idx: number) => {
      if (!displayRooms.some(r => r.name.toLowerCase() === dg.name.toLowerCase())) {
        displayRooms.push({
          id: dg.id || `dg-${idx}`,
          name: dg.name,
          description: dg.description || "Public room workspace.",
          status: "ACTIVE",
          iconType: "product",
          iconBg: "bg-[#09090b] text-white",
          membersCount: dg.memberCount || 1,
          onlineCount: 1,
          avatars: ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"],
          extraAvatarsCount: Math.max(0, (dg.memberCount || 1) - 1),
          focusHours: "15h",
          tasksCompleted: "6 / 20",
          aiStatus: "ON",
          recentActivity: "Public workspace active",
          recentTime: "10m ago",
          isMyRoom: false
        });
      }
    });
  }

  // If showcase account, supplement with demo rooms so dashboard stays rich
  if (isShowcase && displayRooms.length < 4) {
    demoRooms.forEach(dr => {
      if (!displayRooms.some(r => r.name.toLowerCase() === dr.name.toLowerCase())) {
        displayRooms.push(dr);
      }
    });
  }

  const getIconComponent = (type: string) => {
    switch (type) {
      case "code": return <Code className="h-5 w-5" />;
      case "design": return <PenTool className="h-5 w-5" />;
      case "research": return <Microscope className="h-5 w-5" />;
      case "focus": return <Target className="h-5 w-5" />;
      case "marketing": return <Megaphone className="h-5 w-5" />;
      case "devops": return <Cloud className="h-5 w-5" />;
      case "data": return <Database className="h-5 w-5" />;
      case "product": return <Package className="h-5 w-5" />;
      default: return <LayoutGrid className="h-5 w-5" />;
    }
  };

  // Dynamic KPI Metrics
  const totalRoomsCount = displayRooms.length;
  const activeRoomsCount = displayRooms.filter(r => r.status === "ACTIVE" || r.status === "LIVE SESSION").length;
  const totalOnlineMembers = displayRooms.reduce((sum, r) => sum + r.onlineCount, 0);
  const aiCoordinatedCount = displayRooms.filter(r => r.aiStatus === "ON" || r.aiStatus === "COACH").length;

  const mostActiveRoomName = displayRooms[0]?.name || "Engineering Team";
  const mostMembersRoomName = `${displayRooms[0]?.name || "Focus Guild"} (${displayRooms[0]?.membersCount || 12})`;
  const topFocusRoomName = `${displayRooms[1]?.name || displayRooms[0]?.name || "Design Team"} (${displayRooms[1]?.focusHours || "31h"})`;

  // Filter rooms
  const filteredRooms = displayRooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          room.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter === "my") return room.isMyRoom;
    if (activeFilter === "active") return room.status === "ACTIVE" || room.status === "LIVE SESSION";
    if (activeFilter === "archived") return room.status === "INACTIVE";
    return true;
  });

  return (
    <div className="space-y-6 font-sans text-[#09090b]">

      {/* 1. PAGE TITLE & HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl sm:text-4xl font-serif italic font-bold tracking-tight text-[#09090b]">
            Rooms
          </h2>
          <p className="text-xs text-[#71717a] font-medium">
            Your focused workspaces for teams, projects and collaboration.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms..."
              className="pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#e4e4e7] text-xs font-medium text-[#09090b] focus:outline-none focus:border-[#09090b] transition-all shadow-2xs w-48 sm:w-64"
            />
          </div>

          <button
            onClick={onOpenWizard}
            className="px-4 py-2.5 rounded-2xl bg-[#09090b] hover:bg-[#18181b] text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Create Room</span>
          </button>
        </div>
      </div>

      {/* 2. TOP 4 KPI METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Rooms */}
        <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div className="w-12 h-6">
              <svg className="w-full h-full" viewBox="0 0 50 20" fill="none">
                <path d="M 2 15 Q 15 5, 25 12 T 48 5" stroke="#a855f7" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-display text-[#09090b]">{totalRoomsCount}</div>
            <div className="text-xs font-bold text-[#09090b]">Total Rooms</div>
            <p className="text-[10px] text-[#71717a]">All your workspaces</p>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold font-mono inline-flex items-center gap-1">
              <span>↑ 2 from last week</span>
            </span>
          </div>
        </div>

        {/* Card 2: Active Rooms */}
        <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div className="w-12 h-6">
              <svg className="w-full h-full" viewBox="0 0 50 20" fill="none">
                <path d="M 2 18 Q 15 3, 25 15 T 48 4" stroke="#10b981" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-display text-[#09090b]">{activeRoomsCount}</div>
            <div className="text-xs font-bold text-[#09090b]">Active Rooms</div>
            <p className="text-[10px] text-[#71717a]">Happening right now</p>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold font-mono inline-flex items-center gap-1">
              <span>↑ 2 from last week</span>
            </span>
          </div>
        </div>

        {/* Card 3: Online Members */}
        <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="w-12 h-6">
              <svg className="w-full h-full" viewBox="0 0 50 20" fill="none">
                <path d="M 2 12 Q 15 18, 25 6 T 48 10" stroke="#3b82f6" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-display text-[#09090b]">{totalOnlineMembers}</div>
            <div className="text-xs font-bold text-[#09090b]">Online Members</div>
            <p className="text-[10px] text-[#71717a]">Across all rooms</p>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold font-mono inline-flex items-center gap-1">
              <span>↑ 5 from last week</span>
            </span>
          </div>
        </div>

        {/* Card 4: AI Coordinated */}
        <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="w-12 h-6">
              <svg className="w-full h-full" viewBox="0 0 50 20" fill="none">
                <path d="M 2 15 Q 15 8, 25 18 T 48 6" stroke="#f59e0b" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-display text-[#09090b]">{aiCoordinatedCount}</div>
            <div className="text-xs font-bold text-[#09090b]">AI Coordinated</div>
            <p className="text-[10px] text-[#71717a]">Smart rooms active</p>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold font-mono inline-flex items-center gap-1">
              <span>↑ 3 from last week</span>
            </span>
          </div>
        </div>

      </div>

      {/* 3. HIGHLIGHTS BAR ROW */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        
        {/* Highlight 1 */}
        <div className="flex items-center space-x-3 pt-2 sm:pt-0 sm:pl-2">
          <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-[#71717a] font-bold uppercase block leading-none">Most Active</span>
            <span className="text-xs font-bold text-emerald-600 truncate block mt-1">{mostActiveRoomName}</span>
          </div>
        </div>

        {/* Highlight 2 */}
        <div className="flex items-center space-x-3 pt-2 sm:pt-0 sm:pl-4">
          <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-[#71717a] font-bold uppercase block leading-none">Most Members</span>
            <span className="text-xs font-bold text-purple-600 truncate block mt-1">{mostMembersRoomName}</span>
          </div>
        </div>

        {/* Highlight 3 */}
        <div className="flex items-center space-x-3 pt-2 sm:pt-0 sm:pl-4">
          <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Target className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-[#71717a] font-bold uppercase block leading-none">Top Focus</span>
            <span className="text-xs font-bold text-amber-600 truncate block mt-1">{topFocusRoomName}</span>
          </div>
        </div>

        {/* Highlight 4 */}
        <div className="flex items-center space-x-3 pt-2 sm:pt-0 sm:pl-4">
          <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-[#71717a] font-bold uppercase block leading-none">AI Leader</span>
            <span className="text-xs font-bold text-blue-600 truncate block mt-1">{mostActiveRoomName}</span>
          </div>
        </div>

      </div>

      {/* 4. FILTER TABS & TOOLBAR ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e4e4e7] pb-3 select-none">
        
        {/* Left Filter Pills */}
        <div className="flex items-center space-x-2 text-xs font-bold">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "all"
                ? "bg-[#09090b] text-white shadow-xs"
                : "bg-white text-[#71717a] hover:text-[#09090b] border border-[#e4e4e7]"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>All Rooms</span>
          </button>

          <button
            onClick={() => setActiveFilter("my")}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "my"
                ? "bg-[#09090b] text-white shadow-xs"
                : "bg-white text-[#71717a] hover:text-[#09090b] border border-[#e4e4e7]"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>My Rooms</span>
          </button>

          <button
            onClick={() => setActiveFilter("active")}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "active"
                ? "bg-[#09090b] text-white shadow-xs"
                : "bg-white text-[#71717a] hover:text-[#09090b] border border-[#e4e4e7]"
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            <span>Active</span>
          </button>

          <button
            onClick={() => setActiveFilter("archived")}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "archived"
                ? "bg-[#09090b] text-white shadow-xs"
                : "bg-white text-[#71717a] hover:text-[#09090b] border border-[#e4e4e7]"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Archived</span>
          </button>
        </div>

        {/* Right Toolbar (Sort & Layout View Switcher) */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 text-[#71717a]">
            <span>Sort by:</span>
            <button
              onClick={() => triggerToast && triggerToast("Sort order toggled")}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#e4e4e7] font-bold text-[#09090b] flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <span>{sortBy}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-[#09090b] text-white shadow-xs" : "text-[#71717a] hover:text-[#09090b]"
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "list" ? "bg-[#09090b] text-white shadow-xs" : "text-[#71717a] hover:text-[#09090b]"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 5. ROOM CARDS GRID */}
      {filteredRooms.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-[#e4e4e7] rounded-2xl text-xs font-mono text-[#71717a] space-y-3">
          <p className="text-sm font-bold text-[#09090b]">No rooms match your active filter.</p>
          <p>Create a room using the 5-step wizard above or click "All Rooms" to view available channels.</p>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" : "space-y-4"}>
          {filteredRooms.map((room) => {

            let statusBadgeClass = "text-slate-500 bg-slate-100";
            let statusDot = "bg-slate-400";
            if (room.status === "ACTIVE") {
              statusBadgeClass = "text-emerald-700 bg-emerald-50";
              statusDot = "bg-emerald-500";
            } else if (room.status === "LIVE SESSION") {
              statusBadgeClass = "text-emerald-800 bg-emerald-100 font-extrabold";
              statusDot = "bg-emerald-500 animate-pulse";
            } else if (room.status === "QUIET") {
              statusBadgeClass = "text-[#71717a] bg-slate-50";
              statusDot = "bg-slate-400";
            }

            let aiStatusClass = "text-emerald-600 font-bold";
            if (room.aiStatus === "IDLE") aiStatusClass = "text-amber-600 font-bold";
            if (room.aiStatus === "OFF") aiStatusClass = "text-slate-400 font-bold";
            if (room.aiStatus === "COACH") aiStatusClass = "text-purple-600 font-extrabold";

            return (
              <div
                key={room.id}
                className="p-5 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all hover:shadow-sm"
              >
                {/* Header: Icon, Title, Status & Menu */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${room.iconBg}`}>
                        {getIconComponent(room.iconType)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-[#09090b] truncate">{room.name}</h4>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase inline-flex items-center gap-1 ${statusBadgeClass}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`}></span>
                        <span>{room.status}</span>
                      </span>
                      <button className="p-1 text-[#71717a] hover:text-[#09090b] rounded cursor-pointer">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#71717a] line-clamp-2 leading-relaxed font-medium">
                    {room.description}
                  </p>
                </div>

                {/* Members Avatars Row */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center -space-x-2">
                    {room.avatars.map((url, idx) => (
                      <img key={idx} src={url} alt="member" className="h-7 w-7 rounded-full object-cover border-2 border-white shadow-2xs" />
                    ))}
                    {room.extraAvatarsCount > 0 && (
                      <div className="h-7 w-7 rounded-full bg-slate-100 border-2 border-white text-[10px] font-mono font-bold text-[#71717a] flex items-center justify-center shadow-2xs">
                        +{room.extraAvatarsCount}
                      </div>
                    )}
                  </div>

                  <div className="text-right text-[11px] font-mono">
                    <span className="text-[#71717a] font-medium block">{room.membersCount} Members</span>
                    <span className={`font-bold block ${room.onlineCount > 0 ? "text-emerald-600" : "text-[#71717a]"}`}>
                      {room.onlineCount} Online
                    </span>
                  </div>
                </div>

                {/* Metric Highlights Row (3 Sub-Boxes) */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                  <div className="text-center p-2 rounded-xl bg-slate-50/70 border border-slate-100">
                    <span className="text-[9px] font-mono uppercase text-[#71717a] font-bold block leading-none">FOCUS</span>
                    <span className="text-xs font-mono font-bold text-[#09090b] block mt-1">{room.focusHours}</span>
                  </div>

                  <div className="text-center p-2 rounded-xl bg-slate-50/70 border border-slate-100">
                    <span className="text-[9px] font-mono uppercase text-[#71717a] font-bold block leading-none">TASKS</span>
                    <span className="text-xs font-mono font-bold text-[#09090b] block mt-1">{room.tasksCompleted}</span>
                  </div>

                  <div className="text-center p-2 rounded-xl bg-slate-50/70 border border-slate-100">
                    <span className="text-[9px] font-mono uppercase text-[#71717a] font-bold block leading-none">AI</span>
                    <span className={`text-xs font-mono block mt-1 ${aiStatusClass}`}>{room.aiStatus}</span>
                  </div>
                </div>

                {/* Recent Activity Footer */}
                <div className="flex items-center justify-between text-[10px] font-mono text-[#71717a] pt-1">
                  <div className="flex items-center space-x-1 truncate max-w-[170px]">
                    <User className="h-3 w-3 shrink-0" />
                    <span className="truncate">{room.recentActivity}</span>
                  </div>
                  {room.recentTime && <span className="shrink-0">{room.recentTime}</span>}
                </div>

                {/* Bottom Action Button */}
                <button
                  onClick={() => onEnterRoom(room.name)}
                  className="w-full py-2.5 rounded-xl border border-[#e4e4e7] bg-white hover:bg-slate-50 text-xs font-bold text-[#09090b] flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <span>Open Room</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
