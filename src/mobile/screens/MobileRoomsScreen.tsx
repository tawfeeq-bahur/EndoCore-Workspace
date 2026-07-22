import React from "react";
import { RoomsSubTab } from "../types";

interface MobileRoomsScreenProps {
  subTab: RoomsSubTab;
  onSelectSubTab: (tab: RoomsSubTab) => void;
}

export const MobileRoomsScreen: React.FC<MobileRoomsScreenProps> = ({
  subTab,
  onSelectSubTab,
}) => {
  const tabs: { id: RoomsSubTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "members", label: "Members" },
    { id: "tasks", label: "Tasks" },
    { id: "activity", label: "Activity" },
    { id: "ai", label: "AI Brief" },
  ];

  return (
    <div className="p-4 space-y-4 pb-20 text-white font-sans">
      {/* Header & Room Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-serif italic text-white">Rooms</h1>
        <button className="h-8 w-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-md">
          +
        </button>
      </div>

      {/* Active Room Card */}
      <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-white">Engineering Team</h2>
          <p className="text-xs text-stone-400 font-mono">Sprint delivery workspace</p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          3 online
        </span>
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
          {/* Key Metrics Sparkline Grid */}
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-2">
              <span className="text-[10px] text-stone-400 uppercase tracking-widest block">
                Team Effort
              </span>
              <div className="text-2xl font-bold text-emerald-400">68%</div>
              <span className="text-[10px] text-stone-400 block">On schedule</span>
            </div>

            <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-2">
              <span className="text-[10px] text-stone-400 uppercase tracking-widest block">
                Delivery Progress
              </span>
              <div className="text-2xl font-bold text-indigo-400">42%</div>
              <span className="text-[10px] text-stone-400 block">5 of 12 tasks</span>
            </div>
          </div>

          {/* Current Milestone */}
          <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between border-b border-[#1E1E2A] pb-2 text-stone-400 font-mono text-[10px] uppercase">
              <span>Current Milestone</span>
              <span className="text-stone-200 font-semibold">Room system MVP</span>
            </div>
            <div className="flex justify-between text-stone-300 py-1 font-mono">
              <span>Tasks Completed</span>
              <span className="text-white font-semibold">5 / 12</span>
            </div>
            <div className="flex justify-between text-stone-300 py-1 font-mono">
              <span>Forecast</span>
              <span className="text-emerald-400 font-semibold">On schedule</span>
            </div>
            <div className="flex justify-between text-stone-300 py-1 font-mono">
              <span>Deadline</span>
              <span className="text-stone-300 font-semibold">24 Jul 2026 (in 5 days)</span>
            </div>
          </div>

          {/* Top Activity Today */}
          <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-stone-400 border-b border-[#1E1E2A] pb-2">
              Top Activity (Today)
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center font-mono font-bold text-[10px]">
                    TB
                  </div>
                  <div>
                    <span className="font-semibold block text-stone-200">Tawfeeq</span>
                    <span className="text-[10px] font-mono text-emerald-400">Focusing • Codex</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="block font-bold text-stone-200">2h 34m</span>
                  <span className="text-[10px] text-stone-400">68% goal</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="h-7 w-7 rounded-full bg-purple-600 flex items-center justify-center font-mono font-bold text-[10px]">
                    RV
                  </div>
                  <div>
                    <span className="font-semibold block text-stone-200">Ravi</span>
                    <span className="text-[10px] font-mono text-stone-400">Available • Activity hidden</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="block font-bold text-stone-200">1h 12m</span>
                  <span className="text-[10px] text-stone-400">42% goal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab: Members */}
      {subTab === "members" && (
        <div className="space-y-3 font-sans">
          <div className="flex justify-between items-center text-xs font-mono text-stone-400 px-1">
            <span>Room Members (4)</span>
            <span className="text-emerald-400">3 Online</span>
          </div>

          {[
            { name: "Tawfeeq Bahur", role: "Owner", status: "Focusing", app: "Codex", initials: "TB", color: "bg-blue-600", isOnline: true },
            { name: "Ravi Varma", role: "Member", status: "Available", app: "Activity hidden", initials: "RV", color: "bg-purple-600", isOnline: true },
            { name: "Meera Patel", role: "Member", status: "Focusing", app: "Figma", initials: "MP", color: "bg-pink-600", isOnline: true },
            { name: "Karthik Raja", role: "Member", status: "Offline", app: "Last seen 2h ago", initials: "KR", color: "bg-stone-600", isOnline: false },
          ].map((m, idx) => (
            <div key={idx} className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`h-9 w-9 rounded-full ${m.color} flex items-center justify-center font-mono font-bold text-xs relative`}>
                  {m.initials}
                  <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#121216] ${m.isOnline ? "bg-emerald-500" : "bg-stone-500"}`} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-xs text-stone-100">{m.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-800 text-stone-400 border border-stone-700">{m.role}</span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 block">{m.status} • {m.app}</span>
                </div>
              </div>
              <button className="px-2.5 py-1 rounded-xl bg-[#1A1A22] border border-[#2A2A36] text-stone-300 text-[10px] font-mono hover:text-white">
                Wave
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tab: Tasks */}
      {subTab === "tasks" && (
        <div className="space-y-3 font-sans">
          <div className="flex justify-between items-center text-xs font-mono text-stone-400 px-1">
            <span>Milestone: Room System MVP</span>
            <span className="text-indigo-400 font-semibold">5/12 Done</span>
          </div>

          {[
            { title: "Mobile Companion Shell & Navigation", done: true, assignee: "Tawfeeq", priority: "High" },
            { title: "Realtime WebSocket status telemetry", done: true, assignee: "Ravi", priority: "High" },
            { title: "AI Coach brief generator endpoint", done: true, assignee: "Tawfeeq", priority: "Medium" },
            { title: "Notification preference settings UI", done: false, assignee: "Meera", priority: "Medium" },
            { title: "Automated end-to-end sync verification", done: false, assignee: "Unassigned", priority: "Low" },
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
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                t.priority === "High" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
              }`}>
                {t.priority}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tab: Activity */}
      {subTab === "activity" && (
        <div className="space-y-3 font-mono text-xs">
          <div className="text-xs text-stone-400 px-1 uppercase tracking-wider">Recent Guild Activity</div>
          {[
            { user: "Tawfeeq", action: "completed a 45-min focus session", target: "Codex App", time: "12m ago" },
            { user: "Meera", action: "joined room", target: "Engineering Team", time: "34m ago" },
            { user: "Ravi", action: "updated task status to Done", target: "WebSocket telemetry", time: "1h ago" },
            { user: "System", action: "Milestone reach:", target: "68% daily target", time: "2h ago" },
          ].map((a, idx) => (
            <div key={idx} className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 flex items-start justify-between">
              <div>
                <span className="text-stone-200 font-bold">{a.user} </span>
                <span className="text-stone-400">{a.action} </span>
                <span className="text-indigo-400 font-semibold">[{a.target}]</span>
              </div>
              <span className="text-[10px] text-stone-500 shrink-0 ml-2">{a.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tab: AI Brief */}
      {subTab === "ai" && (
        <div className="space-y-4 font-sans text-xs">
          <div className="bg-gradient-to-br from-indigo-950/40 via-[#121216] to-purple-950/30 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-indigo-300 flex items-center gap-1.5">
                ✨ Daily Room Synthesis
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Generated 5m ago
              </span>
            </div>
            <p className="text-stone-300 leading-relaxed">
              Engineering Team is currently running <strong>14% ahead</strong> of target delivery pace. Primary focus is centered around Codex and UI components.
            </p>
            <div className="space-y-2 pt-2 border-t border-indigo-500/20">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-400">Predicted completion date:</span>
                <span className="text-emerald-400 font-mono font-bold">24 Jul 2026</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-400">Team focus score:</span>
                <span className="text-indigo-400 font-mono font-bold">88 / 100</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
