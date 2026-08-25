import React, { useState } from "react";
import { UserProfile } from "../../types";
import { LogOut, Cpu, Target, MessageSquare } from "lucide-react";

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
  electronTracking = false,
  onSignOut,
  onSubmitSettings,
}) => {
  const [statusInput, setStatusInput] = useState(user?.customStatus || "");
  const userName  = user?.name  || "Developer";
  const userEmail = user?.email || "user@endocore.dev";
  const userRole  = (user as any)?.role || "Software Developer";

  return (
    <div className="p-4 space-y-4 pb-32 bg-[#fafafa] font-sans min-h-screen text-[#09090b]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-xl tracking-tight text-[#09090b]">Profile</h1>
      </div>

      {/* Identity Card */}
      <div className="studio-card p-5 flex items-center gap-4">
        <div className="relative shrink-0">
          <img
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${userName}`}
            alt={userName}
            className="h-16 w-16 rounded-full object-cover border-2 border-[#09090b] shadow-xs"
          />
          <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-base text-[#09090b] truncate">{userName}</h2>
          <p className="text-xs text-[#71717a] font-mono">{userRole}</p>
          <p className="text-[10px] text-[#71717a] font-mono truncate mt-0.5">{userEmail}</p>
          <span className="inline-block mt-1.5 text-[9px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-100 text-[#09090b] border border-[#e4e4e7] font-semibold">
            EndoCore Member
          </span>
        </div>
      </div>

      {/* Workstation Card */}
      <div className="studio-card p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="h-4 w-4 text-[#09090b]" />
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#71717a]">Workstation</span>
        </div>
        <p className="font-bold text-sm text-[#09090b]">{user?.deviceConnected || "WS-WORKSTATION-11"}</p>
        <p className={`text-[10px] font-mono flex items-center gap-1.5 ${electronTracking ? "text-emerald-700 font-semibold" : "text-[#71717a]"}`}>
          <span className={`h-2 w-2 rounded-full ${electronTracking ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
          {electronTracking ? "Electron Desktop Agent Active" : "Synced to EndoCore Cloud"}
        </p>
      </div>

      {/* Custom Status */}
      <div className="studio-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#09090b]" />
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#71717a]">Custom Status</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={statusInput}
            onChange={(e) => setStatusInput(e.target.value)}
            placeholder="What are you working on?"
            className="flex-1 bg-white border border-[#e4e4e7] rounded-lg px-3 py-2 text-xs font-sans text-[#09090b] focus:outline-none focus:border-[#09090b] placeholder-zinc-400 shadow-xs"
          />
          <button
            onClick={() => onSubmitSettings?.({ customStatus: statusInput })}
            className="px-4 py-2 bg-[#09090b] text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-[#27272a] transition-all shadow-xs"
          >
            Save
          </button>
        </div>
      </div>

      {/* Focus Settings */}
      <div className="studio-card p-4 space-y-3">
        <div className="flex items-center gap-2 border-b border-[#e4e4e7] pb-3">
          <Target className="h-4 w-4 text-[#09090b]" />
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#71717a]">Focus Settings</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-[#71717a] font-mono text-xs">Daily target</span>
          <select
            value={user?.productivityGoal || 6}
            onChange={(e) => onSubmitSettings?.({ productivityGoal: parseInt(e.target.value) })}
            className="bg-white border border-[#e4e4e7] rounded-lg px-3 py-1.5 text-xs font-mono text-[#09090b] font-bold focus:outline-none cursor-pointer"
          >
            <option value="4">4 hours</option>
            <option value="6">6 hours</option>
            <option value="8">8 hours</option>
            <option value="10">10 hours</option>
          </select>
        </div>
      </div>

      {/* Sign Out */}
      <div className="pt-2">
        <button
          onClick={onSignOut}
          className="w-full py-3 rounded-lg border border-rose-200 bg-rose-50/50 text-rose-700 text-xs font-semibold uppercase tracking-wider text-center cursor-pointer transition-all hover:bg-rose-100/60 flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

