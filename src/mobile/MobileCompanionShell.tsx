import React from "react";
import { useMobileNavigation } from "./hooks/useMobileNavigation";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNavigation } from "./MobileBottomNavigation";
import { MobileHomeScreen } from "./screens/MobileHomeScreen";
import { MobileRoomsScreen } from "./screens/MobileRoomsScreen";
import { MobileConnectionsScreen } from "./screens/MobileConnectionsScreen";
import { MobileAlertsScreen } from "./screens/MobileAlertsScreen";
import { MobileProfileScreen } from "./screens/MobileProfileScreen";
import { UserProfile, Activity as UserActivity, Friend, Group, AnalyticsData } from "../types";

export interface MobileCompanionShellProps {
  user: UserProfile | null;
  myActivity: UserActivity | null;
  friends: Friend[];
  groups: Group[];
  analytics: AnalyticsData | null;
  aiInsights: string | null;
  connectionsData: {
    friends: any[];
    incoming: any[];
    outgoing: any[];
  };
  themeMode: "dark" | "light";
  electronTracking?: boolean;
  onToggleTheme: (theme: "dark" | "light") => void;
  onSignOut: () => void;
  onUpdateActivity: (app?: string, project?: string, togglePause?: boolean) => void;
  onSubmitSettings: (updates: Partial<UserProfile>) => void;
  onTriggerNudge: (friendName: string, id: string) => void;
  nudgedFriendIds: Record<string, boolean>;
  onEnterRoom?: (roomName: string) => void;
  onRespondConnectionRequest?: (requestId: string, action: "accept" | "decline") => void;
  recentWaves?: Array<{ id: string; senderId: string; senderName: string; timestamp: string }>;
}

export const MobileCompanionShell: React.FC<MobileCompanionShellProps> = ({
  user,
  myActivity,
  friends,
  groups,
  analytics,
  aiInsights,
  connectionsData,
  themeMode = "dark",
  electronTracking = false,
  onToggleTheme,
  onSignOut,
  onUpdateActivity,
  onSubmitSettings,
  onTriggerNudge,
  nudgedFriendIds,
  onEnterRoom,
  onRespondConnectionRequest,
  recentWaves = [],
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

  const userName = user?.name || "";
  const avatarUrl = user?.avatarUrl;
  const workstationName = user?.deviceConnected || "";
  const isConnected = !!user;

  // Unread alerts counter (incoming requests + nudges)
  const unreadAlertsCount = (connectionsData?.incoming?.length || 0) + (aiInsights ? 1 : 0);

  return (
    <div
      data-theme={themeMode}
      className={`min-h-screen ${themeMode === "dark" ? "mesh-bg text-white" : "bg-[#F8F8FA] text-[#18181B]"} flex flex-col font-sans selection:bg-violet-500 selection:text-white transition-colors duration-300 pb-[68px]`}
    >
      {/* Fixed Mobile Header */}
      <MobileHeader
        userInitials={userName ? userName.split(" ").map(n => n[0]).join("") : "TB"}
        avatarUrl={avatarUrl}
        workstationName={workstationName}
        isConnected={isConnected}
        unreadAlertsCount={unreadAlertsCount}
        activeTab={activeTab}
        onTabSelect={setActiveTab}
        themeMode={themeMode}
        onToggleTheme={() => onToggleTheme(themeMode === "dark" ? "light" : "dark")}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "home" && (
          <MobileHomeScreen
            user={user}
            myActivity={myActivity}
            analytics={analytics}
            aiInsights={aiInsights}
            groups={groups}
            themeMode={themeMode}
            onUpdateActivity={onUpdateActivity}
            onEnterRoom={onEnterRoom}
          />
        )}
        {activeTab === "rooms" && (
          <MobileRoomsScreen
            subTab={roomsSubTab}
            onSelectSubTab={setRoomsSubTab}
            groups={groups}
            user={user}
            friends={friends}
            aiInsights={aiInsights}
            onTriggerNudge={onTriggerNudge}
            nudgedFriendIds={nudgedFriendIds}
            onEnterRoom={onEnterRoom}
          />
        )}
        {activeTab === "connect" && (
          <MobileConnectionsScreen
            subTab={connectionsSubTab}
            onSelectSubTab={setConnectionsSubTab}
            connectionsData={connectionsData}
            friends={friends}
            onTriggerNudge={onTriggerNudge}
            nudgedFriendIds={nudgedFriendIds}
            onRespondConnectionRequest={onRespondConnectionRequest}
          />
        )}
        {activeTab === "alerts" && (
          <MobileAlertsScreen
            activeFilter={alertsFilter}
            onSelectFilter={setAlertsFilter}
            connectionsData={connectionsData}
            aiInsights={aiInsights}
            onRespondConnectionRequest={onRespondConnectionRequest}
            recentWaves={recentWaves}
            onTriggerNudge={onTriggerNudge}
            nudgedFriendIds={nudgedFriendIds}
          />
        )}
        {activeTab === "profile" && (
          <MobileProfileScreen
            user={user}
            themeMode={themeMode}
            electronTracking={electronTracking}
            onSignOut={onSignOut}
            onSubmitSettings={onSubmitSettings}
            onToggleTheme={onToggleTheme}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <MobileBottomNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unreadAlertsCount={unreadAlertsCount}
      />
    </div>
  );
};
