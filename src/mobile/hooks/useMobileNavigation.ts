import { useState } from "react";
import { MobileTab, RoomsSubTab, ConnectionsSubTab, AlertsFilter } from "../types";

export function useMobileNavigation() {
  const [activeTab, setActiveTab] = useState<MobileTab>("home");
  const [roomsSubTab, setRoomsSubTab] = useState<RoomsSubTab>("overview");
  const [connectionsSubTab, setConnectionsSubTab] = useState<ConnectionsSubTab>("friends");
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
