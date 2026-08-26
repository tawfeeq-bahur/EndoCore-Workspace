import React from "react";
import { RoomsSubTab } from "../types";
import { UserProfile, Friend, Group } from "../../types";
import { Sparkles, Users, Wifi } from "lucide-react";

interface MobileRoomsScreenProps {
  subTab: RoomsSubTab;
  onSelectSubTab: (tab: RoomsSubTab) => void;
  groups: Group[];
  user: UserProfile | null;
  friends: Friend[];
  aiInsights: string | null;
  onTriggerNudge?: (friendName: string, id: string) => void;
  nudgedFriendIds?: Record<string, boolean>;
  onEnterRoom?: (roomName: string) => void;
}

const renderAiContent = (content: string | null | undefined) => {
  if (!content) return "Room channel is running on target delivery pace. Primary focus is centered around EndoCore Workspace.";
  try {
    if (content.trim().startsWith("{")) {
      const parsed = JSON.parse(content);
      if (parsed.summary) return parsed.summary;
      if (parsed.roomSummary) {
        const rs = parsed.roomSummary;
        return `${rs.description || rs.status || "Guild active"}. ${rs.summary || ""}`;
      }
    }
  } catch (e) {
    // raw text string
  }
  return content;
};

// Tasks injected conditionally for showcase demo inside the component
export const MobileRoomsScreen: React.FC<MobileRoomsScreenProps> = ({
  subTab,
  onSelectSubTab,
  groups,
  user,
  friends,
  aiInsights,
  onTriggerNudge,
  nudgedFriendIds = {},
  onEnterRoom,
}) => {
  const tabs: { id: RoomsSubTab; label: string }[] = [
    { id: "overview",  label: "Overview"  },
    { id: "members",   label: "Members"   },
    { id: "tasks",     label: "Tasks"     },
    { id: "activity",  label: "Activity"  },
    { id: "ai",        label: "AI Brief"  },
  ];

  const activeGroupName = user?.activeGroup || (groups.length > 0 ? groups[0].name : "");

  const tasks = user?.email === "showcase@endocore.io" ? [
    { title: "Mobile Companion Shell & Navigation", done: true, assignee: "Tawfeeq", priority: "High" },
    { title: "Realtime Telemetry & Sockets", done: true, assignee: "EndoCore System", priority: "High" },
    { title: "Authentication Flow MVP", done: true, assignee: "Sriram", priority: "Medium" },
    { title: "Room Access Modes UI", done: false, assignee: "Unassigned", priority: "High" }
  ] : [];

  const doneCount = tasks.filter((t: any) => t.done).length;

  let totalActualHours = 0;
  let totalTargetHours = 0;
  [user, ...friends].forEach((occ: any) => {
    if (!occ) return;
    const focusHrs = parseFloat(occ.todayFocusTime?.replace("h", "") || "0");
    const targetHrs = occ.productivityGoal || 6;
    totalActualHours += focusHrs;
    totalTargetHours += targetHrs;
  });
  const teamEffortProgress = totalTargetHours > 0 ? Math.min(100, Math.round((totalActualHours / totalTargetHours) * 100)) : 0;

  return (
    <div className="p-4 space-y-4 pb-32 bg-[#fafafa] font-sans min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-xl text-[#09090b] tracking-tight">Focus Rooms</h1>
        <span className="text-[10px] font-mono font-semibold text-[#09090b] bg-zinc-100 border border-[#e4e4e7] px-3 py-1 rounded-full">
          {groups.length} Guilds
        </span>
      </div>

      {/* Room Selector */}
      <div className="studio-card p-4 space-y-2">
        <label className="text-[9px] font-mono uppercase tracking-widest text-[#71717a] block">Active Room Channel</label>
        <select
          value={activeGroupName}
          onChange={(e) => onEnterRoom?.(e.target.value)}
          className="w-full bg-white text-sm font-semibold text-[#09090b] focus:outline-none cursor-pointer border border-[#e4e4e7] rounded-lg p-2"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.name} className="bg-white text-[#09090b]">#{g.name}</option>
          ))}
        </select>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelectSubTab(t.id)}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap text-xs font-semibold transition-all cursor-pointer border ${
              subTab === t.id
                ? "bg-[#09090b] text-white border-[#09090b] shadow-xs"
                : "bg-white text-[#71717a] border-[#e4e4e7] hover:bg-zinc-100 hover:text-[#09090b]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {subTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="studio-card p-4 space-y-1.5">
              <span className="text-[9px] font-mono text-[#71717a] uppercase tracking-widest block">Team Effort</span>
              <span className="font-bold text-2xl text-emerald-700">{teamEffortProgress}%</span>
              <span className="text-[10px] text-[#71717a] font-mono block">{teamEffortProgress > 40 ? "On schedule" : "At risk"}</span>
            </div>
            <div className="studio-card p-4 space-y-1.5">
              <span className="text-[9px] font-mono text-[#71717a] uppercase tracking-widest block">Online Now</span>
              <span className="font-bold text-2xl text-[#09090b]">{friends.length + 1}</span>
              <span className="text-[10px] text-[#71717a] font-mono block">Active members</span>
            </div>
          </div>

          <div className="studio-card p-4 space-y-2.5 text-xs">
            {[
              { label: "Active Channel", value: `#${activeGroupName}`, valueClass: "text-[#09090b] font-bold" },
              { label: "Co-Workers",     value: `${friends.length} friends`,      valueClass: "text-[#09090b] font-semibold"   },
              { label: "Telemetry Sync", value: "Live Socket ✓",       valueClass: "text-emerald-700 font-bold" },
            ].map((row, i) => (
              <div key={i} className="flex justify-between text-[#71717a] font-mono border-b border-[#e4e4e7] pb-2 last:border-0 last:pb-0">
                <span>{row.label}</span>
                <span className={row.valueClass}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      {subTab === "members" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px] font-mono text-[#71717a] px-1">
            <span>Room Members ({friends.length + 1})</span>
            <span className="text-emerald-700 font-semibold">{friends.length + 1} Online</span>
          </div>

          {/* Self row */}
          <div className="studio-card p-4 flex items-center justify-between border-zinc-300">
            <div className="flex items-center gap-3">
              <img
                src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
                className="h-10 w-10 rounded-full object-cover border border-[#e4e4e7]"
                alt="You"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#09090b]">{user?.name || "You"}</span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-[#09090b] border border-zinc-200 font-semibold">Owner</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 font-semibold">● Active</span>
              </div>
            </div>
          </div>

          {/* Friend rows */}
          {friends.map((m) => (
            <div key={m.id} className="studio-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={m.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${m.name}`}
                    className="h-10 w-10 rounded-full object-cover border border-[#e4e4e7]"
                    alt={m.name}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 animate-pulse" />
                </div>
                <div>
                  <p className="font-bold text-sm text-[#09090b]">{m.name}</p>
                  <p className="text-[10px] font-mono text-[#71717a]">{m.currentActivity?.app || "Offline"}</p>
                </div>
              </div>
              <button
                onClick={() => onTriggerNudge?.(m.name, m.id)}
                disabled={nudgedFriendIds[m.id]}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  nudgedFriendIds[m.id]
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-[#09090b] text-white border-[#09090b] hover:bg-[#27272a]"
                }`}
              >
                {nudgedFriendIds[m.id] ? "✓ Waved!" : "Wave 👋"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tasks */}
      {subTab === "tasks" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px] font-mono text-[#71717a] px-1">
            <span>Workspace Pipeline MVP</span>
            <span className="text-[#09090b] font-bold">{doneCount}/{tasks.length} Done</span>
          </div>

          {/* Progress bar */}
          <div className="bg-zinc-100 border border-[#e4e4e7] rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#09090b]"
              style={{ width: `${tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0}%` }}
            />
          </div>

          {tasks.map((t, idx) => (
            <div key={idx} className="studio-card p-4 flex items-center gap-3 text-xs">
              <div className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border ${t.done ? "bg-[#09090b] border-[#09090b]" : "border-zinc-300"}`}>
                {t.done && <span className="text-white text-[8px] font-bold">✓</span>}
              </div>
              <div className="min-w-0 flex-1">
                <span className={`font-semibold block truncate ${t.done ? "line-through text-[#71717a]" : "text-[#09090b]"}`}>
                  {t.title}
                </span>
                <span className="text-[10px] font-mono text-[#71717a]">↳ {t.assignee}</span>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-semibold shrink-0 border ${
                t.priority === "High" ? "text-rose-800 bg-rose-50 border-rose-200" :
                t.priority === "Medium" ? "text-amber-800 bg-amber-50 border-amber-200" :
                "text-zinc-600 bg-zinc-100 border-zinc-200"
              }`}>{t.priority}</span>
            </div>
          ))}
        </div>
      )}

      {/* Activity */}
      {subTab === "activity" && (
        <div className="space-y-3">
          <div className="studio-card p-4 flex items-start gap-3">
            <div className="h-7 w-7 rounded-full bg-zinc-100 border border-[#e4e4e7] flex items-center justify-center shrink-0 mt-0.5">
              <Wifi className="h-4 w-4 text-[#09090b]" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[#09090b] leading-relaxed">
                <strong className="text-[#09090b] font-bold">{user?.name || "You"}</strong>{" "}
                <span className="text-[#71717a]">is active in</span>{" "}
                <strong className="text-[#09090b] font-mono">#{activeGroupName}</strong>
              </p>
              <span className="text-[10px] font-mono text-[#71717a]">Just now</span>
            </div>
          </div>
        </div>
      )}

      {/* AI Brief */}
      {subTab === "ai" && (
        <div className="studio-card p-4 space-y-3 border-indigo-200 bg-indigo-50/40">
          <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
            <h3 className="font-bold text-sm text-indigo-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-700" /> Daily Room Synthesis
            </h3>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold">
              Gemini AI
            </span>
          </div>
          <p className="text-xs text-[#27272a] leading-relaxed font-sans">
            {renderAiContent(aiInsights)}
          </p>
        </div>
      )}
    </div>
  );
};

