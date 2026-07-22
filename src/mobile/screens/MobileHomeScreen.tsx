import React from "react";
import { MobileHomeViewModel } from "../types";

interface MobileHomeScreenProps {
  viewModel?: MobileHomeViewModel;
  isLoading?: boolean;
}

export const MobileHomeScreen: React.FC<MobileHomeScreenProps> = ({
  viewModel,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-24 bg-[#141418] rounded-2xl border border-[#24242C]" />
        <div className="h-48 bg-[#141418] rounded-2xl border border-[#24242C]" />
        <div className="h-32 bg-[#141418] rounded-2xl border border-[#24242C]" />
      </div>
    );
  }

  const focusMinutes = viewModel?.today.focusMinutes ?? 154;
  const targetMinutes = viewModel?.today.targetMinutes ?? 360;
  const hours = Math.floor(focusMinutes / 60);
  const mins = focusMinutes % 60;
  const targetHours = Math.round(targetMinutes / 60);
  const progressPercentage = viewModel?.today.progressPercentage ?? Math.min(100, Math.round((focusMinutes / targetMinutes) * 100));
  const strokeDashoffset = 339.29 - (Math.min(1, Math.max(0, progressPercentage / 100)) * 339.29);

  const diffMins = viewModel?.today.differenceFromYesterdayMinutes ?? 18;

  return (
    <div className="p-4 space-y-4 pb-20 text-white font-sans">
      {/* 1. Workstation Status Banner */}
      <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block">
            Workstation Connected
          </span>
          <h2 className="text-sm font-semibold text-white mt-0.5">
            {viewModel?.workstation.name || "WS-WORKSTATION-11"}
          </h2>
          <span className="text-[10px] text-stone-400 font-mono block">
            Last synced: {viewModel?.workstation.lastSyncAt || "8s ago"}
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          ● {viewModel?.workstation.state || "CONNECTED"}
        </span>
      </div>

      {/* 2. Today's Focus Progress */}
      <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center text-xs font-mono text-stone-400">
          <span className="uppercase tracking-wider">Today's Focus</span>
          <span>Daily goal: {targetHours}h</span>
        </div>

        {/* Dynamic Progress Ring Mockup */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="72" cy="72" r="54" fill="none" stroke="#1E1E26" strokeWidth="8" />
              <circle
                cx="72"
                cy="72"
                r="54"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeDasharray="339.29"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none text-center">
              <span className="text-2xl font-mono font-bold text-white">{hours}h {mins}m</span>
              <span className="text-[10px] text-stone-400 font-mono mt-1">of {targetHours}h goal</span>
              <span className="text-[10px] font-mono text-emerald-400 mt-1">{progressPercentage}% completed</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 mt-2">
            ↑ {diffMins}m vs yesterday
          </span>
        </div>
      </div>

      {/* 3. Current Focus Session Card */}
      <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">
            Current Session
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            ● {viewModel?.currentSession?.state || "Focusing"}
          </span>
        </div>

        <div>
          <h3 className="font-semibold text-sm text-stone-100">
            {viewModel?.currentSession?.taskName || "Room creation wizard"}
          </h3>
          <p className="text-xs text-stone-400 font-mono">
            {viewModel?.currentSession?.applicationName || "Codex"} • {viewModel?.currentSession?.projectName || "EndoCore Workspace"}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-[#1E1E26] pt-3">
          <div className="font-mono text-2xl font-bold text-indigo-400">38:12</div>
          <div className="flex space-x-2">
            <button className="px-3 py-1.5 rounded-xl text-xs font-mono bg-[#1A1A22] border border-[#2A2A36] text-stone-300 hover:text-white">
              Pause
            </button>
            <button className="px-3 py-1.5 rounded-xl text-xs font-mono bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md">
              Finish Session
            </button>
          </div>
        </div>
      </div>

      {/* 4. AI Productivity Coach Card */}
      <div className="bg-gradient-to-r from-indigo-950/30 to-purple-950/20 border border-indigo-500/20 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
            ✨ AI Coach
          </span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
            Live
          </span>
        </div>
        <p className="text-xs text-stone-300 leading-relaxed">
          You have maintained consistent focus for 38 minutes. Continue for another 22 minutes to complete a strong one-hour work block.
        </p>
        <button className="text-xs font-mono text-indigo-400 hover:underline">
          View full insight →
        </button>
      </div>

      {/* 5. Room Snapshot Card */}
      <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-xs text-stone-200">Engineering Team</h3>
          <span className="text-[10px] font-mono text-emerald-400">3 online</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-[#181820] p-2.5 rounded-xl border border-[#22222E]">
            <span className="text-[9px] text-stone-400 block">Team Effort</span>
            <span className="text-base font-bold text-emerald-400">68%</span>
          </div>
          <div className="bg-[#181820] p-2.5 rounded-xl border border-[#22222E]">
            <span className="text-[9px] text-stone-400 block">Delivery Progress</span>
            <span className="text-base font-bold text-indigo-400">42%</span>
          </div>
        </div>
      </div>

      {/* 6. Quick Actions */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <button className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold shadow-md text-center">
          Start Focus
        </button>
        <button className="py-2.5 px-3 rounded-xl bg-[#1A1A22] hover:bg-[#22222D] border border-[#2A2A36] text-stone-200 font-mono text-xs font-semibold text-center">
          Join Room
        </button>
      </div>
    </div>
  );
};
