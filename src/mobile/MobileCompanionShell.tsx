import React from "react";
import { useMobileNavigation } from "./hooks/useMobileNavigation";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNavigation } from "./MobileBottomNavigation";
import { MobileHomeScreen } from "./screens/MobileHomeScreen";
import { MobileRoomsScreen } from "./screens/MobileRoomsScreen";
import { MobileConnectionsScreen } from "./screens/MobileConnectionsScreen";
import { MobileAlertsScreen } from "./screens/MobileAlertsScreen";
import { MobileProfileScreen } from "./screens/MobileProfileScreen";

interface MobileCompanionShellProps {
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
  workstationName?: string;
  isConnected?: boolean;
  onSignOut?: () => void;
  themeMode?: "dark" | "light";
  onToggleTheme?: () => void;
}

export const MobileCompanionShell: React.FC<MobileCompanionShellProps> = ({
  userName = "Tawfeeq Bahur",
  userEmail = "tawfeeq@example.com",
  avatarUrl,
  workstationName = "WS-WORKSTATION-11",
  isConnected = true,
  onSignOut,
  themeMode = "dark",
  onToggleTheme,
}) => {
  const {
    activeTab,
    setActiveTab,
    roomsSubTab,
    setRoomsSubTab,
    connectionsSubTab,
    setConnectionsSubTab,
    alertsFilter,
    setAlertsFilter,
  } = useMobileNavigation();

  return (
    <div className="min-h-screen bg-[#09090B] text-white flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Fixed Header */}
      <MobileHeader
        userInitials={userName ? userName.split(" ").map(n => n[0]).join("") : "TB"}
        avatarUrl={avatarUrl}
        workstationName={workstationName}
        isConnected={isConnected}
        unreadAlertsCount={3}
        activeTab={activeTab}
        onTabSelect={setActiveTab}
        themeMode={themeMode}
        onToggleTheme={onToggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "home" && <MobileHomeScreen />}
        {activeTab === "rooms" && (
          <MobileRoomsScreen subTab={roomsSubTab} onSelectSubTab={setRoomsSubTab} />
        )}
        {activeTab === "connect" && (
          <MobileConnectionsScreen
            subTab={connectionsSubTab}
            onSelectSubTab={setConnectionsSubTab}
          />
        )}
        {activeTab === "alerts" && (
          <MobileAlertsScreen
            activeFilter={alertsFilter}
            onSelectFilter={setAlertsFilter}
          />
        )}
        {activeTab === "profile" && (
          <MobileProfileScreen
            userName={userName}
            userEmail={userEmail}
            onSignOut={onSignOut}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <MobileBottomNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unreadAlertsCount={3}
      />
    </div>
  );
};
