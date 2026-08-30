import React from "react";
import { Bell, Sun, Moon, Laptop, Wifi } from "lucide-react";
import { MobileTab } from "./types";

interface MobileHeaderProps {
  userInitials?: string;
  avatarUrl?: string;
  workstationName?: string;
  isConnected?: boolean;
  isWaking?: boolean;
  unreadAlertsCount?: number;
  activeTab: MobileTab;
  onTabSelect: (tab: MobileTab) => void;
  themeMode?: "dark" | "light";
  onToggleTheme?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  userInitials = "TB",
  avatarUrl,
  workstationName = "WS-WORKSTATION-11",
  isConnected = true,
  isWaking = false,
  unreadAlertsCount = 0,
  activeTab,
  onTabSelect,
  themeMode = "light",
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#e4e4e7] px-4 pt-3 pb-3 flex flex-col gap-2.5 shadow-xs">
      {/* Top row */}
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[#09090b] flex items-center justify-center font-bold text-xs text-white shadow-xs">
            E
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-sm text-[#09090b] tracking-tight">
              EndoCore
            </span>
            <span className="font-mono text-[8px] uppercase tracking-widest text-[#71717a]">
              Mobile Studio
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Bell */}
          <button
            onClick={() => onTabSelect("alerts")}
            aria-label={`View alerts (${unreadAlertsCount} unread)`}
            className="relative p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-[#09090b] transition-colors cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-mono text-[8px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-white">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          <button
            onClick={() => onTabSelect("profile")}
            aria-label="Open Profile"
            className="h-8 w-8 rounded-full bg-[#09090b] flex items-center justify-center font-bold text-xs text-white overflow-hidden border border-[#e4e4e7] cursor-pointer"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              userInitials
            )}
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between text-[10px] font-mono bg-[#f4f4f5] border border-[#e4e4e7] rounded-lg px-3 py-1.5 text-[#09090b]">
        <div className="flex items-center gap-2 min-w-0">
          <Laptop className="h-3 w-3 text-[#71717a] shrink-0" />
          <span className="font-semibold text-[#09090b] truncate">{workstationName}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`h-2 w-2 rounded-full ${
            isWaking ? "bg-amber-500" : isConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
          }`} />
          <span className={`font-semibold ${
            isWaking ? "text-amber-700" : isConnected ? "text-emerald-700" : "text-zinc-500"
          }`}>
            {isWaking ? "Waking..." : isConnected ? "Connected" : "Offline"}
          </span>
        </div>
      </div>
    </header>
  );
};

