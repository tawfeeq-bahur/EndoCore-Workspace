import React from "react";
import { RoomsSubTab } from "../types";
import { UserProfile, Friend, Group } from "../../types";

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
    { id: "overview", label: "Overview" },
    { id: "members", label: "Members" },
    { id: "tasks", label: "Tasks" },
    { id: "activity", label: "Activity" },
    { id: "ai", label: "AI Brief" },
  ];

  const activeGroupName = user?.activeGroup || (groups.length > 0 ? groups[0].name : "Engineering Team");

  return (
    <div className="p-4 space-y-4 pb-20 text-white font-sans">
      {/* Header & Room Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-serif italic text-white">Focus Rooms</h1>
        <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
          {groups.length} Guilds
        </span>
      </div>

      {/* Guild Room selector parameters */}
      <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-2">
        <label className="text-[9px] font-mono uppercase tracking-widest text-stone-400 block">
          Select Active Room Channel
        </label>
        <select
          value={activeGroupName}
          onChange={(e) => onEnterRoom?.(e.target.value)}
          className="w-full bg-[#181820] border border-[#2A2A36] rounded-xl px-3 py-2.5 text-xs font-mono text-white cursor-pointer"
        >
          {groups.map(g => (
            <option key={g.id} value={g.name} className="bg-[#121216]">
              #{g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Horizontally Scrollable Sub-tabs */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelectSubTab(t.id)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              subTab === t.id
                ? "bg-indigo-600 text-white font-semibold shadow-md"
                : "bg-[#141418] text-stone-400 border border-[#22222A] hover:text-stone-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content based on sub-tab */}
      {subTab === "overview" && (
        <div className="space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-2">
              <span className="text-[10px] text-stone-400 uppercase tracking-widest block">
                Team Effort
              </span>
              <div className="text-2xl font-bold text-emerald-400">78%</div>
              <span className="text-[10px] text-stone-400 block">On schedule</span>
            </div>

            <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-2">
              <span className="text-[10px] text-stone-400 uppercase tracking-widest block">
                Occupants Online
              </span>
              <div className="text-2xl font-bold text-indigo-400">{friends.length + 1}</div>
              <span className="text-[10px] text-stone-400 block">Active members</span>
            </div>
          </div>

          {/* Current Milestone */}
          <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between border-b border-[#1E1E2A] pb-2 text-stone-400 font-mono text-[10px] uppercase">
              <span>Active Channel</span>
              <span className="text-indigo-400 font-semibold">#{activeGroupName}</span>
            </div>
            <div className="flex justify-between text-stone-300 py-1 font-mono">
              <span>Co-Workers Connected</span>
              <span className="text-white font-semibold">{friends.length} friends</span>
            </div>
            <div className="flex justify-between text-stone-300 py-1 font-mono">
              <span>Telemetry Sync</span>
              <span className="text-emerald-400 font-semibold">Live Socket ✓</span>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab: Members */}
      {subTab === "members" && (
        <div className="space-y-3 font-sans">
          <div className="flex justify-between items-center text-xs font-mono text-stone-400 px-1">
            <span>Room Members ({friends.length + 1})</span>
            <span className="text-emerald-400">{friends.length + 1} Online</span>
          </div>

          {/* User Self Row */}
          <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} className="h-9 w-9 rounded-full object-cover border border-indigo-500/40" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-xs text-stone-100">{user?.name || "Tawfeeq"} (You)</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Owner</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 block">● Active</span>
              </div>
            </div>
          </div>

          {/* Friends Members */}
          {friends.map((m) => (
            <div key={m.id} className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={m.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} className="h-9 w-9 rounded-full object-cover border border-stone-800" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-xs text-stone-100">{m.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-800 text-stone-400 border border-stone-700">{m.role || "Member"}</span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 block">{m.currentActivity?.app || "Offline"}</span>
                </div>
              </div>
              <button
                onClick={() => onTriggerNudge?.(m.name, m.id)}
                disabled={nudgedFriendIds[m.id]}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  nudgedFriendIds[m.id]
                    ? "bg-stone-300 text-black font-bold"
                    : "bg-[#1A1A22] border border-[#2A2A36] text-stone-300 hover:text-white"
                }`}
              >
                {nudgedFriendIds[m.id] ? "Waved!" : "Wave 👋"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tab: Tasks */}
      {subTab === "tasks" && (
        <div className="space-y-3 font-sans">
          <div className="flex justify-between items-center text-xs font-mono text-stone-400 px-1">
            <span>Milestone: Workspace Pipeline MVP</span>
            <span className="text-indigo-400 font-semibold">3/5 Done</span>
          </div>

          {[
            { title: "Mobile Companion Shell & Navigation", done: true, assignee: "Tawfeeq", priority: "High" },
            { title: "Realtime Telemetry & Sockets", done: true, assignee: "EndoCore System", priority: "High" },
            { title: "Gemini AI Briefing Synthesis", done: true, assignee: "Tawfeeq", priority: "Medium" },
            { title: "Notification preference settings UI", done: false, assignee: "Team", priority: "Medium" },
            { title: "Automated end-to-end sync verification", done: false, assignee: "Team", priority: "Low" },
          ].map((t, idx) => (
            <div key={idx} className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3 min-w-0">
                <input
                  type="checkbox"
                  checked={t.done}
                  readOnly
                  className="h-4 w-4 rounded accent-indigo-600 bg-[#1A1A22] border-[#2A2A36]"
                />
                <div className="min-w-0">
                  <span className={`font-semibold block truncate ${t.done ? "line-through text-stone-500" : "text-stone-200"}`}>
                    {t.title}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">Assigned: {t.assignee}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tab: Activity */}
      {subTab === "activity" && (
        <div className="space-y-3 font-mono text-xs">
          <div className="text-xs text-stone-400 px-1 uppercase tracking-wider">Recent Guild Activity</div>
          <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-2">
            <span className="text-stone-200 font-bold">{user?.name || "Tawfeeq"} </span>
            <span className="text-stone-400">active focus in </span>
            <span className="text-indigo-400 font-semibold">[{user?.activeGroup || "Engineering Team"}]</span>
          </div>
        </div>
      )}

      {/* Sub-tab: AI Brief */}
      {subTab === "ai" && (
        <div className="space-y-4 font-sans text-xs">
          <div className="bg-gradient-to-br from-indigo-950/40 via-[#121216] to-purple-950/30 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-indigo-300 flex items-center gap-1.5 font-serif italic">
                ✨ Daily Room Synthesis
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Gemini AI
              </span>
            </div>
            <p className="text-stone-300 leading-relaxed font-sans">
              {aiInsights || "Room channel is running on target delivery pace. Primary focus is centered around EndoCore Workspace."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
