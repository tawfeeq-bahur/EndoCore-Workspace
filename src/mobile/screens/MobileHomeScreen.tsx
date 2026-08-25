import React, { useState } from "react";
import { UserProfile, Activity as UserActivity, Group, AnalyticsData } from "../../types";

interface MobileHomeScreenProps {
  user: UserProfile | null;
  myActivity: UserActivity | null;
  analytics: AnalyticsData | null;
  aiInsights: string | null;
  groups: Group[];
  themeMode?: "dark" | "light";
  onUpdateActivity?: (app?: string, project?: string, togglePause?: boolean) => void;
  onEnterRoom?: (roomName: string) => void;
}

export const MobileHomeScreen: React.FC<MobileHomeScreenProps> = ({
  user,
  myActivity,
  analytics,
  aiInsights,
  groups,
  themeMode = "light",
  onUpdateActivity,
  onEnterRoom,
}) => {
  const [projectInput, setProjectInput] = useState(myActivity?.project || "");

  const focusSeconds = myActivity ? myActivity.durationSeconds : 0;
  const focusMinutes = Math.floor(focusSeconds / 60);
  const hours = (focusSeconds / 3600).toFixed(1);
  const targetHours = user?.productivityGoal || 6;
  const progressPercentage = Math.min(100, Math.round((focusSeconds / (targetHours * 3600)) * 100));
  const strokeDashoffset = 339.29 - (Math.min(1, Math.max(0, progressPercentage / 100)) * 339.29);
  const activeGroupName = user?.activeGroup || (groups.length > 0 ? groups[0].name : "Engineering Team");
  const isPaused = myActivity?.isPaused;

  return (
    <div className="p-4 space-y-4 pb-32 bg-[#fafafa] font-sans min-h-screen">

      {/* ── Greeting Banner ── */}
      <div className="studio-card p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest mb-0.5">Workstation Active</p>
          <h2 className="font-bold text-base text-[#09090b]">
            {user?.deviceConnected || "Unknown Device"}
          </h2>
          <p className="text-[11px] text-[#71717a] font-mono mt-0.5">{user?.name || ""}</p>
        </div>
        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-semibold border ${
          isPaused
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-emerald-50 text-emerald-700 border-emerald-200"
        }`}>
          <span className={`h-2 w-2 rounded-full ${isPaused ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
          {isPaused ? "PAUSED" : "ACTIVE"}
        </span>
      </div>

      {/* ── Focus Progress Ring ── */}
      <div className="studio-card p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-[#e4e4e7] pb-3">
          <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-widest">Today's Focus Telemetry</span>
          <span className="text-[10px] font-mono text-[#09090b] font-semibold">Goal: {targetHours}h</span>
        </div>

        <div className="flex flex-col items-center py-2">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="72" cy="72" r="54" fill="none" stroke="#e4e4e7" strokeWidth="8" />
              <circle
                cx="72" cy="72" r="54" fill="none"
                stroke="#18181b"
                strokeWidth="8"
                strokeDasharray="339.29"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-black text-2xl text-[#09090b]">{hours}h</span>
              <span className="text-[9px] text-[#71717a] font-mono">of {targetHours}h target</span>
              <span className="text-[11px] font-mono text-emerald-700 font-bold mt-0.5">{progressPercentage}%</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 flex items-center gap-1.5 mt-3 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Realtime Telemetry Active
          </span>
        </div>
      </div>

      {/* ── Active Session Card ── */}
      <div className="studio-card p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-[#e4e4e7] pb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717a]">Active Workstation Session</span>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono border ${
            isPaused
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-indigo-50 text-indigo-700 border-indigo-200"
          }`}>
            {isPaused ? "⏸ Suspended" : "⚡ Live"}
          </span>
        </div>

        <div>
          <p className="font-semibold text-sm text-[#09090b]">{myActivity?.app || "No Active App"}</p>
          <p className="text-[11px] text-[#71717a] font-mono truncate mt-0.5">↳ {myActivity?.project || "No Project"}</p>
        </div>

        <div className="flex items-center justify-between border-t border-[#e4e4e7] pt-3">
          <div className="font-mono text-2xl font-bold text-[#09090b]">
            {Math.floor(focusMinutes / 60)}h {focusMinutes % 60}m
          </div>
          <button
            onClick={() => onUpdateActivity?.(undefined, undefined, !isPaused)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              isPaused
                ? "bg-[#09090b] text-white border-[#09090b]"
                : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
            }`}
          >
            {isPaused ? "▶ Resume" : "⏸ Pause"}
          </button>
        </div>

        {/* App & Project switchers */}
        <div className="pt-3 border-t border-[#e4e4e7] space-y-3">
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-mono text-[#71717a] tracking-wider block">Switch Application Focus</label>
            <select
              value={myActivity?.app || ""}
              onChange={(e) => onUpdateActivity?.(e.target.value, undefined, undefined)}
              className="w-full bg-white border border-[#e4e4e7] rounded-lg px-3 py-2 text-xs font-mono text-[#09090b] focus:outline-none focus:border-[#09090b] cursor-pointer"
            >
              <option value="">Select App...</option>
              <option value="VS Code">VS Code</option>
              <option value="Chrome">Chrome Browser</option>
              <option value="Figma">Figma Design</option>
              <option value="Terminal">Terminal / Shell</option>
              <option value="Spotify">Spotify Music</option>
            </select>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={projectInput}
              onChange={(e) => setProjectInput(e.target.value)}
              className="flex-1 bg-white border border-[#e4e4e7] rounded-lg px-3 py-2 text-xs font-sans text-[#09090b] focus:outline-none focus:border-[#09090b] placeholder-zinc-400"
              placeholder="Active task / project..."
            />
            <button
              onClick={() => onUpdateActivity?.(undefined, projectInput, undefined)}
              className="px-4 py-2 bg-[#09090b] text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-[#27272a] transition-all"
            >
              Sync
            </button>
          </div>
        </div>
      </div>

      {/* ── AI Coach Card ── */}
      <div className="studio-card p-4 space-y-2 border-indigo-200 bg-indigo-50/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
            ✨ AI Co-Working Coach
          </span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold">
            Gemini Live
          </span>
        </div>
        <p className="text-xs text-[#27272a] leading-relaxed font-sans">
          {aiInsights || "Maintain consistent focus blocks to boost your weekly velocity. Keep pushing — EndoCore is your edge."}
        </p>
      </div>

      {/* ── Room Snapshot ── */}
      <div className="studio-card p-4 space-y-3">
        <div className="flex justify-between items-center border-b border-[#e4e4e7] pb-2">
          <h3 className="font-bold text-sm text-[#09090b]">#{activeGroupName}</h3>
          <span className="text-[10px] font-mono text-emerald-700 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />Live Guild Room
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#f4f4f5] border border-[#e4e4e7] rounded-lg p-3 space-y-1">
            <span className="text-[9px] font-mono text-[#71717a] uppercase tracking-widest block">Team Effort</span>
            <span className="font-bold text-xl text-emerald-700">{progressPercentage}%</span>
          </div>
          <div className="bg-[#f4f4f5] border border-[#e4e4e7] rounded-lg p-3 space-y-1">
            <span className="text-[9px] font-mono text-[#71717a] uppercase tracking-widest block">Active Guild</span>
            <span className="font-bold text-xl text-[#09090b] truncate block">{activeGroupName}</span>
          </div>
        </div>
      </div>

    </div>
  );
};

