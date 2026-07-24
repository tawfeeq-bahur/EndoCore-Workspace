import React, { useState } from "react";
import { UserProfile } from "../../types";

interface MobileProfileScreenProps {
  user: UserProfile | null;
  themeMode?: "dark" | "light";
  electronTracking?: boolean;
  onSignOut?: () => void;
  onSubmitSettings?: (updates: Partial<UserProfile>) => void;
  onToggleTheme?: (theme: "dark" | "light") => void;
}

export const MobileProfileScreen: React.FC<MobileProfileScreenProps> = ({
  user,
  themeMode = "dark",
  electronTracking = false,
  onSignOut,
  onSubmitSettings,
  onToggleTheme,
}) => {
  const [statusInput, setStatusInput] = useState(user?.customStatus || "");
  const userName = user?.name || "Tawfeeq Bahur";
  const userEmail = user?.email || "user@endocore.dev";
  const userRole = (user as any)?.role || "Software Developer";

  const isDark = themeMode === "dark";

  return (
    <div className="p-4 space-y-4 pb-20 text-white font-sans">
      <h1 className="text-xl font-bold font-serif italic text-white">Profile & Workstation</h1>

      {/* User Identity Card */}
      <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-5 flex items-center space-x-4">
        <img
          src={user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
          alt={userName}
          className="h-14 w-14 rounded-full object-cover border-2 border-indigo-500/50 shadow-md shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-white truncate">{userName}</h2>
          <span className="text-xs text-stone-400 font-mono block">{userRole}</span>
          <span className="text-[10px] text-stone-500 font-mono block truncate">{userEmail}</span>
        </div>
      </div>

      {/* Connected Workstation Status Card */}
      <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-3">
        <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">
          Connected Workstation
        </span>
        <div className="flex items-center justify-between text-xs font-mono">
          <div>
            <span className="font-semibold text-stone-200 block">{user?.deviceConnected || "WS-WORKSTATION-11"}</span>
            <span className={`text-[10px] ${electronTracking ? "text-emerald-400 font-semibold" : "text-stone-400"}`}>
              {electronTracking ? "Electron Desktop Agent Active ✓" : "Synced to EndoCore Cloud ✓"}
            </span>
          </div>
        </div>
      </div>

      {/* Custom Status Message Form */}
      <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-3">
        <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block border-b border-[#1E1E2A] pb-2">
          Custom Status Message
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            value={statusInput}
            onChange={(e) => setStatusInput(e.target.value)}
            placeholder="Set status..."
            className="flex-1 bg-[#181820] border border-[#2A2A36] rounded-xl px-3 py-2 text-xs font-mono text-stone-200"
          />
          <button
            onClick={() => onSubmitSettings?.({ customStatus: statusInput })}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono rounded-xl font-semibold cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>

      {/* Focus Preferences */}
      <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-3 text-xs font-mono">
        <span className="text-[10px] text-stone-400 uppercase tracking-widest block border-b border-[#1E1E2A] pb-2">
          Focus Parameters
        </span>
        <div className="flex justify-between items-center py-1 text-stone-300">
          <span>Daily focus target</span>
          <select
            value={user?.productivityGoal || 6}
            onChange={(e) => onSubmitSettings?.({ productivityGoal: parseInt(e.target.value) })}
            className="bg-[#181820] border border-[#2A2A36] rounded-lg px-2.5 py-1 text-xs text-indigo-400 font-bold cursor-pointer"
          >
            <option value="4">4 hours</option>
            <option value="6">6 hours</option>
            <option value="8">8 hours</option>
            <option value="10">10 hours</option>
          </select>
        </div>

        <div className="flex justify-between items-center py-1 text-stone-300">
          <span>Interface theme</span>
          <button
            onClick={() => onToggleTheme?.(isDark ? "light" : "dark")}
            className="px-3 py-1 rounded-lg bg-[#181820] border border-[#2A2A36] text-stone-200 font-mono text-xs cursor-pointer"
          >
            {isDark ? "🌙 Dark Obsidian" : "☀️ Amber Light"}
          </button>
        </div>
      </div>

      {/* Account Sign Out Action */}
      <div className="pt-2">
        <button
          onClick={onSignOut}
          className="w-full py-3.5 bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-mono uppercase font-bold tracking-wider rounded-xl text-center hover:bg-red-950/40 cursor-pointer transition-all"
        >
          Sign Out of Workstation
        </button>
      </div>
    </div>
  );
};
