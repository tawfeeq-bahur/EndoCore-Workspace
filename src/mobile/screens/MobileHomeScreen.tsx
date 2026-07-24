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
  themeMode = "dark",
  onUpdateActivity,
  onEnterRoom,
}) => {
  const [projectInput, setProjectInput] = useState(myActivity?.project || "EndoCore Workspace");

  const focusSeconds = myActivity ? myActivity.durationSeconds : 0;
  const focusMinutes = Math.floor(focusSeconds / 60);
  const hours = (focusSeconds / 3600).toFixed(1);
  const targetHours = user?.productivityGoal || 6;
  const targetMinutes = targetHours * 60;
  const progressPercentage = Math.min(100, Math.round((focusSeconds / (targetHours * 3600)) * 100));
  const strokeDashoffset = 339.29 - (Math.min(1, Math.max(0, progressPercentage / 100)) * 339.29);

  const activeGroupName = user?.activeGroup || (groups.length > 0 ? groups[0].name : "Engineering Team");

  return (
    <div className="p-4 space-y-4 pb-20 text-white font-sans">
      {/* 1. Workstation Status Banner */}
      <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">
            Workstation Connected
          </span>
          <h2 className="text-sm font-semibold text-white mt-0.5">
            {user?.deviceConnected || "WS-WORKSTATION-11"}
          </h2>
          <span className="text-[10px] text-stone-400 font-mono block">
            User: {user?.name || "Tawfeeq Bahur"}
          </span>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-medium ${
          myActivity?.isPaused 
            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        }`}>
          ● {myActivity?.isPaused ? "PAUSED" : "ACTIVE"}
        </span>
      </div>

      {/* 2. Today's Focus Progress Ring Card */}
      <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center text-xs font-mono text-stone-400">
          <span className="uppercase tracking-wider">Today's Focus Progress</span>
          <span>Daily goal: {targetHours}h</span>
        </div>

        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="72" cy="72" r="54" fill="none" stroke="#1E1E26" strokeWidth="8" />
              <circle
                cx="72"
                cy="72"
                r="54"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="8"
                strokeDasharray="339.29"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none text-center">
              <span className="text-2xl font-mono font-bold text-white">{hours}h</span>
              <span className="text-[10px] text-stone-400 font-mono mt-1">of {targetHours}h target</span>
              <span className="text-[10px] font-mono text-indigo-400 mt-1">{progressPercentage}% score</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 mt-2">
            ● Realtime Telemetry Sync Active
          </span>
        </div>
      </div>

      {/* 3. Current Focus Session & Control Actions Card */}
      <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">
            Active App Tracker
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono border ${
            myActivity?.isPaused 
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
              : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
          }`}>
            ● {myActivity?.isPaused ? "Tracking Suspended" : "Focus Telemetry On"}
          </span>
        </div>

        <div>
          <h3 className="font-semibold text-sm text-stone-100 font-mono">
            {myActivity?.app || "VS Code"}
          </h3>
          <p className="text-xs text-stone-400 font-mono truncate">
            Project: {myActivity?.project || "EndoCore Workspace"}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-[#1E1E26] pt-3">
          <div className="font-mono text-xl font-bold text-indigo-400">
            {Math.floor(focusMinutes / 60)}h {focusMinutes % 60}m
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onUpdateActivity?.(undefined, undefined, !myActivity?.isPaused)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer shadow-md ${
                myActivity?.isPaused
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-red-950/40 border border-red-900/50 text-red-400 hover:bg-red-900/30"
              }`}
            >
              {myActivity?.isPaused ? "▶ Resume" : "⏸ Pause"}
            </button>
          </div>
        </div>

        {/* Quick App & Task Switcher */}
        <div className="pt-2 border-t border-[#1E1E26] space-y-2">
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-mono text-stone-400 block">Switch App Focus</label>
            <select
              value={myActivity?.app || "VS Code"}
              onChange={(e) => onUpdateActivity?.(e.target.value, undefined, undefined)}
              className="w-full bg-[#181820] border border-[#2A2A36] rounded-xl px-3 py-2 text-xs font-mono text-stone-200"
            >
              <option value="VS Code">VS Code</option>
              <option value="Chrome">Chrome Browser</option>
              <option value="Figma">Figma Design</option>
              <option value="Terminal">Terminal / Shell</option>
              <option value="Spotify">Spotify Music</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] uppercase font-mono text-stone-400 block">Active Task / Project</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={projectInput}
                onChange={(e) => setProjectInput(e.target.value)}
                className="flex-1 bg-[#181820] border border-[#2A2A36] rounded-xl px-3 py-2 text-xs font-sans text-stone-200"
                placeholder="Task name..."
              />
              <button
                onClick={() => onUpdateActivity?.(undefined, projectInput, undefined)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono rounded-xl font-semibold cursor-pointer"
              >
                Sync
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. AI Productivity Coach Card */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-[#121216] to-purple-950/30 border border-indigo-500/25 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5 font-serif italic">
            ✨ AI Co-Working Coach
          </span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
            Gemini Live
          </span>
        </div>
        <p className="text-xs text-stone-300 leading-relaxed font-sans">
          {aiInsights || "Maintain consistent focus blocks to boost your weekly velocity. You're doing great on EndoCore Workspace!"}
        </p>
      </div>

      {/* 5. Active Room Snapshot Card */}
      <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-xs text-stone-200">#{activeGroupName}</h3>
          <span className="text-[10px] font-mono text-emerald-400">● Live Room</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-[#181820] p-2.5 rounded-xl border border-[#22222E]">
            <span className="text-[9px] text-stone-400 block">Team Effort</span>
            <span className="text-base font-bold text-emerald-400">{progressPercentage}%</span>
          </div>
          <div className="bg-[#181820] p-2.5 rounded-xl border border-[#22222E]">
            <span className="text-[9px] text-stone-400 block">Active Guild</span>
            <span className="text-base font-bold text-indigo-400 truncate block">{activeGroupName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
