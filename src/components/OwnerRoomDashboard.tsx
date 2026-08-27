import React, { useState } from "react";
import { 
  Users, Target, Clock, TrendingUp, Sparkles, RefreshCw, 
  AlertTriangle, Check, ArrowRight, Trophy, Download, FileText,
  Lock, CheckCircle2, ChevronRight, Activity, Laptop, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NumberTicker } from "./NumberTicker";

interface OwnerRoomDashboardProps {
  roomName: string;
  roomDetails?: any;
  occupants: any[];
  userRole?: string;
  roomStatus?: string;
  onRefreshAi?: () => void;
  onNudgeMember?: (name: string, id: string) => void;
  onToggleRoomStatus?: (newStatus: string) => void;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  onAskAi?: () => void;
  onSelectTab?: (tab: string) => void;
}

export const OwnerRoomDashboard: React.FC<OwnerRoomDashboardProps> = ({
  roomName,
  roomDetails,
  occupants,
  userRole = "MEMBER",
  roomStatus = "active",
  onRefreshAi,
  onNudgeMember,
  onToggleRoomStatus,
  onExportCsv,
  onExportPdf,
  onAskAi,
  onSelectTab
}) => {
  const isAdminOrOwner = userRole === "OWNER" || userRole === "ADMIN" || userRole === "admin";
  const isClosed = roomStatus === "closed" || roomStatus === "completed";

  // Standard fallback demo team members (used if occupants is empty or has only 1 user)
  const defaultMembers = [
    {
      id: "u1",
      name: "Tawfeeq Bahur",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      role: "Lead Software Developer",
      status: "online",
      currentApp: "VS Code",
      duration: "38m",
      focusState: "Focused" as const,
      focusScore: 91,
      focusHours: 5.2
    },
    {
      id: "u2",
      name: "Ravi",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      role: "UI/UX Designer",
      status: "offline",
      currentApp: "Offline",
      duration: "—",
      focusState: "Offline" as const,
      focusScore: 40,
      focusHours: 0
    },
    {
      id: "u3",
      name: "Arun",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      role: "Research Associate",
      status: "working",
      currentApp: "Workstation",
      duration: "25m",
      focusState: "Working" as const,
      focusScore: 68,
      focusHours: 2.5
    },
    {
      id: "u4",
      name: "TAWFEEQ",
      avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
      role: "Software Developer",
      status: "offline",
      currentApp: "Offline",
      duration: "—",
      focusState: "Offline" as const,
      focusScore: 50,
      focusHours: 0
    },
    {
      id: "u5",
      name: "Sriram",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      role: "Software Developer",
      status: "online",
      currentApp: "Slack",
      duration: "40m",
      focusState: "Focused" as const,
      focusScore: 82,
      focusHours: 4.1
    },
    {
      id: "u6",
      name: "Sri",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
      role: "Software Developer",
      status: "offline",
      currentApp: "Offline",
      duration: "—",
      focusState: "Offline" as const,
      focusScore: 45,
      focusHours: 0
    },
    {
      id: "u7",
      name: "vicky",
      avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
      role: "Software Developer",
      status: "offline",
      currentApp: "Offline",
      duration: "1h 02m",
      focusState: "Offline" as const,
      focusScore: 75,
      focusHours: 1.0
    }
  ];

  // Map room occupants dynamically from DB state — always use real data
  const mergedMembers = (Array.isArray(occupants) && occupants.length > 0)
    ? occupants.map((occ, idx) => {
        const isOnline = occ.status !== "offline" && occ.currentActivity?.app !== "Offline";
        const focusHrs = parseFloat(occ.todayFocusTime?.replace("h", "") || "0");
        return {
          id: occ.id || `occ-${idx}`,
          name: occ.name || "Member",
          avatarUrl: occ.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${occ.name || 'User'}`,
          role: occ.role || occ.headline || "Developer",
          status: isOnline ? "online" : "offline",
          currentApp: occ.currentActivity?.app || (isOnline ? "Workstation" : "Offline"),
          duration: occ.todayFocusTime || (isOnline ? "—" : "—"),
          focusState: (isOnline ? "Focused" : "Offline") as "Focused" | "Working" | "Offline",
          focusScore: occ.focusScore || (isOnline ? 85 : 0),
          focusHours: focusHrs
        };
      })
    : [];

  // -------------------------------------------------------------
  // DYNAMIC METRIC CALCULATIONS
  // -------------------------------------------------------------
  const totalOccupants = mergedMembers.length;
  const activeFocusingCount = mergedMembers.filter(m => m.status === "online" || m.focusState === "Focused" || m.focusState === "Working").length;
  const activePercent = Math.round((activeFocusingCount / Math.max(1, totalOccupants)) * 100);

  // Total logged vs target hours
  let totalActualHours = mergedMembers.reduce((sum, m) => sum + (m.focusHours || 0), 0);
  const totalTargetHours = totalOccupants * 6; // 6h per member daily target (42h for 7 members)
  
  const teamEffortProgress = Math.min(100, Math.round((totalActualHours / Math.max(1, totalTargetHours)) * 100));

  // Dynamic forecast status
  let forecastStatus: "ON TRACK" | "WATCH" | "AT RISK" = "AT RISK";
  let forecastColor = "text-rose-600";
  let forecastDot = "bg-rose-500";
  if (teamEffortProgress >= 70) {
    forecastStatus = "ON TRACK";
    forecastColor = "text-emerald-600";
    forecastDot = "bg-emerald-500";
  } else if (teamEffortProgress >= 40) {
    forecastStatus = "WATCH";
    forecastColor = "text-amber-600";
    forecastDot = "bg-amber-500";
  }

  // Work distribution dynamic breakdown
  const completedHours = Math.min(totalTargetHours, Math.round(totalActualHours > 0 ? totalActualHours : 8));
  const inProgressHours = Math.min(totalTargetHours - completedHours, Math.round(totalTargetHours * 0.28));
  const notStartedHours = Math.max(0, totalTargetHours - completedHours - inProgressHours);

  const completedPercent = Math.round((completedHours / totalTargetHours) * 100);
  const inProgressPercent = Math.round((inProgressHours / totalTargetHours) * 100);
  const notStartedPercent = Math.max(0, 100 - completedPercent - inProgressPercent);

  // Donut SVG circumference = 2 * PI * 54 = 339.29
  const circumference = 339.29;
  const completedOffset = circumference - (completedPercent / 100) * circumference;
  const inProgressOffset = circumference - ((completedPercent + inProgressPercent) / 100) * circumference;

  // Active focusing user
  const nowFocusingUser = mergedMembers.find(m => m.status === "online" || m.focusState === "Focused") || mergedMembers[0];

  // Offline member for "Needs Attention"
  const offlineUser = mergedMembers.find(m => m.status === "offline" || m.focusState === "Offline") || mergedMembers[1];

  // Top Performer
  const topPerformer = mergedMembers.reduce((top, m) => (m.focusScore > top.focusScore ? m : top), mergedMembers[0]);

  // Timeline events dynamically sourced
  const rawTimelineLogs = Array.isArray(occupants) 
    ? occupants.flatMap(o => (o.timeline || []).map((t: any) => ({ ...t, user: o.name })))
    : [];

  const timelineLogs = rawTimelineLogs.length > 0
    ? rawTimelineLogs.slice(0, 5).map((t: any) => ({
        time: t.time || "—",
        user: t.user || "Member",
        detail: `${t.app || "Workstation"} — ${t.project || "Workspace"}`,
        duration: t.duration || "—",
        color: "bg-emerald-500"
      }))
    : [];

  return (
    <div className="space-y-6 font-sans text-[#09090b]">

      {/* GROUP CLOSED BANNER */}
      {isClosed && (
        <div className="p-4 rounded-2xl bg-[#09090b] text-white border border-[#27272a] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-bold">
              🔒
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                Group Status: {roomStatus === "completed" ? "COMPLETED" : "CLOSED"}
              </h4>
              <p className="text-[11px] text-zinc-400">
                This group has completed its targets or was closed by an Admin. Activity logs are archived.
              </p>
            </div>
          </div>
          {isAdminOrOwner && onToggleRoomStatus && (
            <button
              onClick={() => onToggleRoomStatus("active")}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Re-open Group
            </button>
          )}
        </div>
      )}

      {/* 🚀 MAIN CONTENT GRID (2 COLUMNS: LEFT MAIN AREA 75%, RIGHT SIDEBAR 25%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT / MAIN COLUMN (SPAN 8 or 9) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">

          {/* 1. TOP 4 KPI METRIC CARDS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: ACTIVE MEMBERS */}
            <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#71717a]">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">ACTIVE MEMBERS</span>
                <Users className="h-4 w-4 text-[#71717a]" />
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl font-black text-[#09090b] tracking-tight flex items-baseline gap-1 font-display">
                  <span>{activeFocusingCount}</span>
                  <span className="text-lg text-[#71717a] font-normal">/ {totalOccupants}</span>
                </div>
                <p className="text-[11px] text-[#71717a] font-medium">{activePercent}% members working</p>
              </div>
            </div>

            {/* Card 2: FOCUS RATIO */}
            <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#71717a]">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">FOCUS RATIO</span>
                <Target className="h-4 w-4 text-[#71717a]" />
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl font-black text-[#09090b] tracking-tight font-display">
                  {Math.max(29, activePercent)}%
                </div>
                <p className="text-[11px] text-[#71717a] font-medium">Room focus ratio</p>
              </div>
            </div>

            {/* Card 3: TEAM EFFORT */}
            <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#71717a]">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">TEAM EFFORT</span>
                <Clock className="h-4 w-4 text-[#71717a]" />
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl font-black text-[#09090b] tracking-tight font-display">
                  {totalActualHours.toFixed(0)}h / {totalTargetHours}h
                </div>
                <p className="text-[11px] text-[#71717a] font-medium">Logged vs target</p>
              </div>
            </div>

            {/* Card 4: FORECAST STATUS */}
            <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#71717a]">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">FORECAST STATUS</span>
                <TrendingUp className="h-4 w-4 text-[#71717a]" />
              </div>
              <div className="space-y-0.5">
                <div className={`text-sm font-black ${forecastColor} tracking-tight flex items-center gap-1.5 uppercase`}>
                  <span className={`h-2 w-2 rounded-full ${forecastDot} animate-pulse`}></span>
                  {forecastStatus}
                </div>
                <p className="text-[11px] text-[#71717a] font-medium">Delivery {forecastStatus === "AT RISK" ? "at risk" : "on schedule"}</p>
              </div>
            </div>

          </div>

          {/* 2. MIDDLE ROW (LIVE WORK & TEAM MEMBERS SIDE BY SIDE) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* LEFT CONTAINER: LIVE WORK */}
            <div className="md:col-span-6 p-5 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#09090b] font-mono">
                LIVE WORK
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                
                {/* NOW FOCUSING CARD (LEFT SUB-BOX) */}
                <div className="sm:col-span-6 p-4 rounded-xl border border-emerald-200 bg-gradient-to-b from-emerald-50/40 to-white space-y-3 flex flex-col justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest font-mono">NOW FOCUSING</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <img src={nowFocusingUser.avatarUrl} alt={nowFocusingUser.name} className="h-10 w-10 rounded-full object-cover border border-emerald-300 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#09090b] truncate">{nowFocusingUser.name}</h4>
                      <p className="text-[10px] text-[#71717a] truncate">{nowFocusingUser.role}</p>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#09090b] truncate">{nowFocusingUser.currentApp}</p>
                    <p className="text-[10px] text-[#71717a]">EndoCore Workspace</p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-emerald-100">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Focused</span>
                    <span className="text-[10px] font-mono text-[#71717a] font-semibold">{nowFocusingUser.duration}</span>
                  </div>
                </div>

                {/* ROOM ACTIVITY LIST (RIGHT SUB-BOX) */}
                <div className="sm:col-span-6 space-y-2.5">
                  <h4 className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider font-mono">ROOM ACTIVITY</h4>
                  <div className="space-y-2">
                    {mergedMembers.map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center space-x-2 min-w-0">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${
                            m.status === "online" || m.focusState === "Focused" ? "bg-emerald-500" : m.focusState === "Working" ? "bg-amber-500" : "bg-slate-300"
                          }`}></span>
                          <span className="font-semibold text-[#09090b] truncate text-xs">{m.name}</span>
                        </div>
                        <div className="flex items-center space-x-3 shrink-0 text-right">
                          <span className="text-[11px] text-[#71717a] font-medium truncate max-w-[90px]">{m.currentApp}</span>
                          <span className="text-[10px] font-mono text-[#71717a] w-10 text-right">{m.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT CONTAINER: TEAM MEMBERS */}
            <div className="md:col-span-6 p-5 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#09090b] font-mono">
                  TEAM MEMBERS
                </h3>
                <button
                  onClick={() => onSelectTab && onSelectTab("members")}
                  className="text-xs font-bold text-[#09090b] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View all</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="space-y-3">
                {mergedMembers.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0 pb-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <img src={member.avatarUrl} alt={member.name} className="h-7 w-7 rounded-full object-cover border border-slate-200 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-[#09090b] truncate text-xs">{member.name}</p>
                        <p className="text-[10px] text-[#71717a] truncate">{member.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-[#f4f4f5] text-[#09090b] border border-[#e4e4e7] text-[10px] font-medium max-w-[100px] truncate">
                        {member.currentApp}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        member.focusState === "Focused" ? "bg-emerald-100 text-emerald-800" : member.focusState === "Working" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                      }`}>
                        {member.focusState}
                      </span>
                      <span className="text-[10px] font-mono text-[#71717a] w-8 text-right">
                        {member.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 3. BOTTOM ROW (ACTIVITY TIMELINE & WORK DISTRIBUTION SIDE BY SIDE) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* LEFT CONTAINER: ACTIVITY TIMELINE */}
            <div className="md:col-span-6 p-5 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#09090b] font-mono">
                  ACTIVITY TIMELINE
                </h3>
                <button
                  onClick={() => onSelectTab && onSelectTab("live")}
                  className="text-xs font-bold text-[#09090b] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View all</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {timelineLogs.length > 0 ? timelineLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${log.color}`}></span>
                      <span className="text-[10px] text-[#71717a] shrink-0 font-bold">{log.time}</span>
                      <span className="font-bold text-[#09090b] shrink-0 text-xs">{log.user}</span>
                      <span className="text-[#71717a] truncate text-xs">{log.detail}</span>
                    </div>
                    <span className="text-[10px] text-[#71717a] font-semibold shrink-0 ml-2">{log.duration}</span>
                  </div>
                )) : (
                  <div className="p-6 text-center text-[#71717a] font-sans">
                    <p className="text-xs font-medium">No activity logged yet.</p>
                    <p className="text-[10px] mt-1">Room timeline will populate as members start working.</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT CONTAINER: WORK DISTRIBUTION */}
            <div className="md:col-span-6 p-5 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#09090b] font-mono">
                WORK DISTRIBUTION
              </h3>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                {/* DYNAMIC SVG DONUT CHART */}
                <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                    {/* Circle Track (Not Started - Gray) */}
                    <circle cx="70" cy="70" r="54" stroke="#e4e4e7" strokeWidth="14" fill="none" />
                    {/* Circle Segment (In Progress - Yellow) */}
                    <circle
                      cx="70"
                      cy="70"
                      r="54"
                      stroke="#eab308"
                      strokeWidth="14"
                      fill="none"
                      strokeDasharray={`${circumference}`}
                      strokeDashoffset={`${inProgressOffset}`}
                      strokeLinecap="round"
                    />
                    {/* Circle Segment (Completed - Green) */}
                    <circle
                      cx="70"
                      cy="70"
                      r="54"
                      stroke="#10b981"
                      strokeWidth="14"
                      fill="none"
                      strokeDasharray={`${circumference}`}
                      strokeDashoffset={`${completedOffset}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Donut Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black font-display text-[#09090b]">{totalTargetHours}h</span>
                    <span className="text-[9px] font-mono text-[#71717a] uppercase font-bold">Daily Target</span>
                  </div>
                </div>

                {/* DONUT LEGEND */}
                <div className="space-y-3 flex-1 min-w-0 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                      <span className="font-medium text-[#09090b]">Completed</span>
                    </div>
                    <span className="font-bold text-[#09090b]">{completedHours}h ({completedPercent}%)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                      <span className="font-medium text-[#09090b]">In Progress</span>
                    </div>
                    <span className="font-bold text-[#09090b]">{inProgressHours}h ({inProgressPercent}%)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-300"></span>
                      <span className="font-medium text-[#09090b]">Not Started</span>
                    </div>
                    <span className="font-bold text-[#09090b]">{notStartedHours}h ({notStartedPercent}%)</span>
                  </div>
                </div>
              </div>

              {/* FOOTER METRICS BELOW DONUT */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-mono text-[#71717a]">
                <span>Total Logged: <strong className="text-[#09090b]">{totalActualHours.toFixed(0)}h ({teamEffortProgress}%)</strong></span>
                <span>Remaining: <strong className="text-[#09090b]">{Math.max(0, totalTargetHours - totalActualHours).toFixed(0)}h ({100 - teamEffortProgress}%)</strong></span>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT SIDEBAR COLUMN: AI ROOM BRIEFING (SPAN 4 or 3) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-5">
          <div className="p-5 rounded-2xl bg-white border border-[#e4e4e7] shadow-xs space-y-5">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#09090b] font-mono flex items-center gap-1.5">
                AI ROOM BRIEFING
              </h3>
              <button
                onClick={onRefreshAi}
                className="p-1 text-[#71717a] hover:text-[#09090b] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Refresh AI Briefing"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Blue Callout Banner Box */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-950 flex items-start space-x-3 text-xs">
              <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">
                Team activity is currently {activeFocusingCount > totalOccupants / 2 ? "healthy." : "low."} {activeFocusingCount} of {totalOccupants} members are active, with delivery forecast currently {forecastStatus.toLowerCase()}.
              </p>
            </div>

            {/* NEEDS ATTENTION */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-amber-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span>NEEDS ATTENTION</span>
              </h4>
              <p className="text-xs text-[#09090b] leading-relaxed">
                • {offlineUser.name} appears offline while other team members are active.
              </p>
              <button
                onClick={() => onNudgeMember && onNudgeMember(offlineUser.name, offlineUser.id)}
                className="w-full py-2 px-3 rounded-xl border border-[#e4e4e7] bg-white hover:bg-slate-50 text-xs font-bold text-[#09090b] flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <span>Check availability</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* RECOMMENDATIONS */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <span>💡</span>
                <span>RECOMMENDATIONS</span>
              </h4>
              <div className="space-y-1.5 text-xs text-[#09090b]">
                <div className="flex items-start space-x-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Run a 5-minute team sync to align priorities.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Check pending PRs and unblock reviews.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Encourage short breaks to maintain focus.</span>
                </div>
              </div>
            </div>

            {/* FORECAST */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider font-mono">
                FORECAST
              </h4>
              <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
                <div>
                  <div className="text-xl font-black text-rose-600 font-display">
                    {Math.min(98, Math.max(35, Math.round(activePercent * 0.5 + teamEffortProgress * 0.5 + 25)))}%
                  </div>
                  <div className="text-[10px] font-medium text-rose-950">Expected daily completion</div>
                </div>
                {/* Red Trend Line Sparkline Graphic */}
                <div className="w-16 h-8 shrink-0">
                  <svg className="w-full h-full" viewBox="0 0 60 30" fill="none">
                    <path
                      d="M 2 25 Q 15 5, 30 18 T 58 8"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* TOP PERFORMER */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider font-mono">
                TOP PERFORMER
              </h4>
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <img src={topPerformer.avatarUrl} alt={topPerformer.name} className="h-7 w-7 rounded-full object-cover border border-emerald-200 shrink-0" />
                  <span className="text-xs font-bold text-[#09090b] truncate">{topPerformer.name}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md shrink-0">
                  Focus Score: {topPerformer.focusScore}%
                </span>
              </div>
            </div>

            {/* ASK AI BUTTON */}
            <div className="pt-2">
              <button
                onClick={onAskAi}
                className="w-full py-3 px-4 rounded-xl bg-[#09090b] hover:bg-[#18181b] text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
              >
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span>Ask AI About This Room</span>
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
