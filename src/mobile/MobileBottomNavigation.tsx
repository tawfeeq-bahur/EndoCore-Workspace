import React from "react";
import { Home, LayoutGrid, Users, Bell, User } from "lucide-react";
import { MobileTab } from "./types";

interface MobileBottomNavigationProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  unreadAlertsCount?: number;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  activeTab,
  onSelectTab,
  unreadAlertsCount = 0,
}) => {
  const tabs: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
    { id: "home",    label: "Home",    icon: <Home    className="h-4.5 w-4.5" /> },
    { id: "rooms",   label: "Rooms",   icon: <LayoutGrid className="h-4.5 w-4.5" /> },
    { id: "connect", label: "Connect", icon: <Users   className="h-4.5 w-4.5" /> },
    { id: "alerts",  label: "Alerts",  icon: <Bell    className="h-4.5 w-4.5" /> },
    { id: "profile", label: "Profile", icon: <User    className="h-4.5 w-4.5" /> },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 h-[64px] bg-white border-t border-[#e4e4e7] z-50 flex items-center justify-around px-2 shadow-lg"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            aria-label={`Navigate to ${tab.label}`}
            aria-current={isActive ? "page" : undefined}
            className={`relative flex flex-col items-center justify-center gap-1 py-1.5 px-3 min-w-[56px] rounded-xl transition-all duration-150 cursor-pointer ${
              isActive
                ? "bg-[#09090b] text-white font-semibold shadow-xs"
                : "text-[#71717a] hover:text-[#09090b] hover:bg-zinc-100"
            }`}
          >
            <div className="relative flex items-center justify-center">
              <span>{tab.icon}</span>

              {tab.id === "alerts" && unreadAlertsCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white font-mono text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-white">
                  {unreadAlertsCount}
                </span>
              )}
            </div>

            <span className={`text-[10px] font-medium tracking-tight ${isActive ? "text-white font-semibold" : "text-[#71717a]"}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

