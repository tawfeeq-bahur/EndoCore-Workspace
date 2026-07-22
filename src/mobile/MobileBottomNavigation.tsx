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
    { id: "home", label: "Home", icon: <Home className="h-5 w-5" /> },
    { id: "rooms", label: "Rooms", icon: <LayoutGrid className="h-5 w-5" /> },
    { id: "connect", label: "Connect", icon: <Users className="h-5 w-5" /> },
    { id: "alerts", label: "Alerts", icon: <Bell className="h-5 w-5" /> },
    { id: "profile", label: "Profile", icon: <User className="h-5 w-5" /> },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 h-16 bg-[#09090B]/95 border-t border-[#1F1F24] backdrop-blur-lg z-50 flex items-center justify-around px-2 pb-safe"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            aria-label={`Navigate to ${tab.label}`}
            aria-current={isActive ? "page" : undefined}
            className={`relative flex flex-col items-center justify-center space-y-1 py-1 px-3 min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 cursor-pointer ${
              isActive
                ? "text-indigo-400 font-semibold scale-105"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <div className="relative">
              {tab.icon}
              {tab.id === "alerts" && unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-500 text-white font-mono text-[8px] font-bold h-3.5 min-w-[14px] px-0.5 rounded-full flex items-center justify-center border border-[#09090B]">
                  {unreadAlertsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono tracking-wider">{tab.label}</span>

            {/* Active Indicator Bar */}
            {isActive && (
              <span className="absolute bottom-0 h-0.5 w-6 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
