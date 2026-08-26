export type MobileTab = "home" | "rooms" | "connect" | "alerts" | "profile";
export type RoomsSubTab = "overview" | "members" | "tasks" | "activity" | "ai";
export type ConnectionsSubTab = "lobby" | "discover" | "requests" | "friends";
export type AlertsFilter = "all" | "waves" | "system" | "challenges" | "social" | "ai" | "rooms";

export interface MobileNavigationState {
  activeTab: MobileTab;
  setActiveTab: (tab: MobileTab) => void;
  roomsSubTab: RoomsSubTab;
  setRoomsSubTab: (tab: RoomsSubTab) => void;
  connectionsSubTab: ConnectionsSubTab;
  setConnectionsSubTab: (tab: ConnectionsSubTab) => void;
  alertsFilter: AlertsFilter;
  setAlertsFilter: (filter: AlertsFilter) => void;
}
