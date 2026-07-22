import React from "react";
import { Bell, Sun, Moon, Laptop } from "lucide-react";
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
  unreadAlertsCount = 3,
  activeTab,
  onTabSelect,
  themeMode = "dark",
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#09090B]/90 dark:bg-[#09090B]/95 backdrop-blur-md border-b border-[#1F1F24] px-4 py-3 text-white flex flex-col gap-2">
      {/* Top row: Brand + Notifications + Theme toggle + User Avatar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center font-bold text-xs shadow-md">
            E
          </div>
          <span className="font-serif italic text-base font-bold tracking-tight text-white">
            EndoCore
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-stone-800 rounded bg-[#121215] text-stone-400">
            MOBILE
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Unread Bell Notification Trigger */}
          <button
            onClick={() => onTabSelect("alerts")}
            aria-label={`View alerts (${unreadAlertsCount} unread)`}
            className="relative p-2 rounded-full bg-[#141418] border border-[#24242C] text-stone-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Bell className="h-4 w-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white font-mono text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-[#09090B]">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Dark / Light Mode Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              aria-label="Toggle theme mode"
              className="p-2 rounded-full bg-[#141418] border border-[#24242C] text-stone-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              {themeMode === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Profile Quick Avatar */}
          <button
            onClick={() => onTabSelect("profile")}
            aria-label="Open User Profile"
            className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-indigo-400/40 flex items-center justify-center font-mono text-xs font-bold text-white shadow-sm overflow-hidden min-w-[44px] min-h-[44px]"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="User Avatar" className="h-full w-full object-cover" />
            ) : (
              userInitials
            )}
          </button>
        </div>
      </div>

      {/* Sub-bar: Workstation & Cloud backend status indicator */}
      <div className="flex items-center justify-between text-[10px] font-mono bg-[#111116] border border-[#1E1E26] rounded-lg px-3 py-1.5 text-stone-400">
        <div className="flex items-center space-x-2 truncate">
          <Laptop className="h-3.5 w-3.5 text-stone-500 shrink-0" />
          <span className="font-semibold text-stone-200 truncate">{workstationName}</span>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <span
            className={`h-2 w-2 rounded-full ${
              isWaking
                ? "bg-amber-400 animate-spin"
                : isConnected
                ? "bg-emerald-500 animate-pulse"
                : "bg-stone-500"
            }`}
          />
          <span
            className={
              isWaking
                ? "text-amber-400 font-medium"
                : isConnected
                ? "text-emerald-400 font-medium"
                : "text-stone-500"
            }
          >
            {isWaking ? "Waking Backend..." : isConnected ? "Connected" : "Offline"}
          </span>
        </div>
      </div>
    </header>
  );
};
