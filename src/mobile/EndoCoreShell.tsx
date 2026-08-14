import React, { useState } from "react";
import { EC } from "./theme/tokens";
import { PremiumHeader } from "./PremiumHeader";
import { BottomNav } from "./BottomNav";
import { HomeScreen } from "./screens/HomeScreen";
import { FocusScreen } from "./screens/FocusScreen";
import { InsightsScreen } from "./screens/InsightsScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { UserProfile, Activity as UserActivity, Group, AnalyticsData } from "../types";

export type NavTab = "home" | "focus" | "insights" | "profile";

export interface EndoCoreShellProps {
  user: UserProfile | null;
  myActivity: UserActivity | null;
  friends?: any[];
  groups?: Group[];
  analytics: AnalyticsData | null;
  aiInsights: string | null;
  connectionsData?: {
    friends: any[];
    incoming: any[];
    outgoing: any[];
  };
  themeMode?: "dark" | "light";
  electronTracking?: boolean;
  onToggleTheme?: (theme: "dark" | "light") => void;
  onSignOut: () => void;
  onUpdateActivity?: (app?: string, project?: string, togglePause?: boolean) => void;
  onSubmitSettings?: (updates: Partial<UserProfile>) => void;
  onTriggerNudge?: (friendName: string, id: string) => void;
  nudgedFriendIds?: Record<string, boolean>;
  onEnterRoom?: (roomName: string) => void;
  onRespondConnectionRequest?: (requestId: string, action: "accept" | "decline") => void;
  recentWaves?: Array<{ id: string; senderId: string; senderName: string; timestamp: string }>;
}

/**
 * EndoCoreShell — the root mobile container.
 * Fixed header + scrollable content + fixed bottom navigation.
 * Routes between the 4 primary screens.
 */
export const EndoCoreShell: React.FC<EndoCoreShellProps> = ({
  user,
  myActivity,
  groups = [],
  analytics,
  aiInsights,
  connectionsData = { friends: [], incoming: [], outgoing: [] },
  themeMode = "dark",
  electronTracking = false,
  onToggleTheme,
  onSignOut,
  onUpdateActivity,
  onSubmitSettings,
  onTriggerNudge,
  nudgedFriendIds = {},
  onEnterRoom,
  onRespondConnectionRequest,
  recentWaves = [],
}) => {
  const [activeTab, setActiveTab] = useState<NavTab>("home");

  const unreadCount = (connectionsData?.incoming?.length || 0);

  // Derived greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" :
    hour < 17 ? "Good afternoon" :
                "Good evening";

  const userName = user?.name?.split(" ")[0] || "there";

  return (
    <div
      style={{
        backgroundColor: EC.bg,
        color: EC.textPrimary,
        fontFamily: "var(--font-sans)",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
        position: "relative",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* ── Fixed Header ────────────────────────────────── */}
      <PremiumHeader
        unreadCount={unreadCount}
        user={user}
      />

      {/* ── Scrollable Content Area ─────────────────────── */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          // Padding bottom = bottom nav height + safe area
          paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
          paddingTop: "64px", // header height
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        {activeTab === "home" && (
          <HomeScreen
            user={user}
            myActivity={myActivity}
            analytics={analytics}
            aiInsights={aiInsights}
            greeting={greeting}
            userName={userName}
            onUpdateActivity={onUpdateActivity}
            onNavigateFocus={() => setActiveTab("focus")}
          />
        )}
        {activeTab === "focus" && (
          <FocusScreen
            user={user}
            myActivity={myActivity}
            onUpdateActivity={onUpdateActivity}
          />
        )}
        {activeTab === "insights" && (
          <InsightsScreen
            analytics={analytics}
            aiInsights={aiInsights}
            myActivity={myActivity}
          />
        )}
        {activeTab === "profile" && (
          <ProfileScreen
            user={user}
            myActivity={myActivity}
            electronTracking={electronTracking}
            onSignOut={onSignOut}
            onSubmitSettings={onSubmitSettings}
          />
        )}
      </main>

      {/* ── Fixed Bottom Navigation ─────────────────────── */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unreadCount={unreadCount}
      />
    </div>
  );
};
