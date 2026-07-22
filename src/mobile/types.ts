export type PlatformMode =
  | "desktop-electron"
  | "mobile-companion"
  | "responsive-web"
  | "desktop-web";

export type MobileTab = "home" | "rooms" | "connect" | "alerts" | "profile";

export type RoomsSubTab = "overview" | "members" | "tasks" | "activity" | "ai";

export type ConnectionsSubTab = "friends" | "requests" | "invitations";

export type AlertsFilter = "all" | "social" | "rooms" | "ai" | "system";

export type WorkstationState =
  | "ONLINE"
  | "IDLE"
  | "TRACKING_PAUSED"
  | "SYNC_DELAYED"
  | "OFFLINE";

export interface MobileHomeViewModel {
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  workstation: {
    id: string;
    name: string;
    state: WorkstationState;
    lastSyncAt?: string;
  };
  today: {
    focusMinutes: number;
    targetMinutes: number;
    progressPercentage: number;
    differenceFromYesterdayMinutes?: number;
    status: "ON_TRACK" | "WATCH" | "AT_RISK";
  };
  currentSession?: {
    id: string;
    taskName?: string;
    projectName?: string;
    applicationName?: string;
    privacyLabel: string;
    startedAt: string;
    pausedAt?: string | null;
    accumulatedPauseSeconds: number;
    state: "ACTIVE" | "PAUSED";
  };
  activeRoom?: {
    id: string;
    name: string;
    onlineCount: number;
    focusingCount: number;
    effortProgress: number;
    deliveryProgress: number;
  };
  privacy: {
    applicationNameVisible: boolean;
    windowTitlesAnonymized: boolean;
    urlsHidden: boolean;
    policyVersion?: string;
  };
}

export type NotificationType =
  | "CONNECTION_REQUEST"
  | "CONNECTION_ACCEPTED"
  | "ROOM_INVITATION"
  | "ROOM_JOIN_REQUEST"
  | "FOCUS_CHALLENGE"
  | "AI_PRIVATE_NUDGE"
  | "AI_OWNER_ADVISORY"
  | "AI_DEADLINE_ALERT"
  | "MILESTONE_COMPLETED"
  | "WORKSTATION_OFFLINE"
  | "PRIVACY_POLICY_UPDATED"
  | "SYSTEM_UPDATE";

export interface MobileNotification {
  id: string;
  type: NotificationType;
  category: "social" | "rooms" | "ai" | "system";
  title: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
  action?: {
    label: string;
    route?: string;
    apiAction?: string;
  };
  secondaryAction?: {
    label: string;
    apiAction?: string;
  };
}

export interface ConnectionUser {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  status: "online" | "focusing" | "available" | "away" | "dnd" | "offline";
  currentApp?: string;
  focusingForMinutes?: number;
  lastSeenAt?: string;
  activityHidden?: boolean;
}
