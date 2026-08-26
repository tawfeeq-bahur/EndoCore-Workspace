import { useState } from "react";
import { MobileTab, RoomsSubTab, ConnectionsSubTab, AlertsFilter, MobileNavigationState } from "../types";

export function useMobileNavigation(initialTab: MobileTab = "home"): MobileNavigationState {
  const [activeTab, setActiveTab] = useState<MobileTab>(initialTab);
  const [roomsSubTab, setRoomsSubTab] = useState<RoomsSubTab>("overview");
  const [connectionsSubTab, setConnectionsSubTab] = useState<ConnectionsSubTab>("lobby");
  const [alertsFilter, setAlertsFilter] = useState<AlertsFilter>("all");

  return {
    activeTab,
    setActiveTab,
    roomsSubTab,
    setRoomsSubTab,
    connectionsSubTab,
    setConnectionsSubTab,
    alertsFilter,
    setAlertsFilter,
  };
}
