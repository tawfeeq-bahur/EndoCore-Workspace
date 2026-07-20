export interface Activity {
  app: string;
  project: string;
  startedAt: number;
  durationText?: string;
  durationSeconds?: number;
  isPaused?: boolean;
  openApps?: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  activeGroup: string;
  privacyMode: string;
  deviceConnected: string;
  productivityGoal: number;
  customStatus: string;
  theme: string;
  status: string;
  distractionsCount: number;
  focusStreak: number;
  broadcastGroups?: string;
  notifications: {
    friendUpdates: boolean;
    breakReminders: boolean;
    aiNudges: boolean;
  };
  timeline?: TimelineItem[];

  // Extended Connections Parameters
  username: string;
  headline: string;
  presenceVisibility: string;
  activityVisibility: string;
  showDailyFocusTime: boolean;
  showCurrentRoom: boolean;
  allowFocusInvites: boolean;
  allowRoomInvites: boolean;
  allowJoinRequests: boolean;
}

export interface TimelineItem {
  time: string;
  date?: string;
  app: string;
  project: string;
  duration: string;
}

export interface Friend {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  status: string;
  currentActivity: {
    app: string;
    project: string;
    startedAt: number;
    durationText: string;
  };
  todayFocusTime: string;
  focusScore: number;
  timeline: TimelineItem[];
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
  createdAt: string;
}

export interface AppBreakdownItem {
  name: string;
  value: number;
  color: string;
}

export interface FocusHistoryItem {
  day: string;
  score: number;
  ideal: number;
}

export interface ComparisonItem {
  name: string;
  hours: number;
  score: number;
}

export interface DailySummaryItem {
  id: string;
  userId: string;
  date: string;
  totalFocusSeconds: number;
  productivityScore: number;
}

export interface AnalyticsData {
  appBreakdown: AppBreakdownItem[];
  focusScoreHistory: FocusHistoryItem[];
  comparisonStats: ComparisonItem[];
  weeklyTotalHours: number;
  weeklyProdGoalAchieved: number;
  averageDailyFocus: number;
  dailySummaries?: DailySummaryItem[];
}

export interface ChatMessage {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  avatarUrl: string;
  message: string;
  timestamp: string;
}

export interface PublicUserProfile {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  headline?: string;
}

export interface PresenceSnapshot {
  state: "online" | "focusing" | "break" | "busy" | "offline";
  appCategory?: string;
  appName?: string;
  focusStartedAt?: string;
  lastSeenAt?: string;
}

export interface ConnectionItem {
  connectionId: string;
  profile: PublicUserProfile;
  presence: PresenceSnapshot;
  focusMinutesToday?: number;
  visibleRoom?: {
    id: string;
    name: string;
    accessAction: "open" | "join" | "request" | "ask_for_invite";
  };
}

export interface ConnectionRequestItem {
  requestId: string;
  profile: PublicUserProfile;
  direction: "incoming" | "outgoing";
  createdAt: string;
}

export interface FocusChallengeItem {
  id: string;
  createdById: string;
  invitedUserId: string;
  durationMinutes: number;
  challengeMode: string; // "co_focus" | "sprint" | "accountability"
  creatorObjective: string;
  invitedObjective: string;
  creatorStatus: string;
  invitedStatus: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELED" | "EXPIRED" | "ACTIVE" | "COMPLETED";
  createdAt: string;
  expiresAt: string;
  respondedAt?: string;
  startAt?: string;
  endAt?: string;
  completedAt?: string;
  creator: PublicUserProfile;
  invited: PublicUserProfile;
}

declare global {
  interface Window {
    electronAPI?: {
      saveConfig: (config: { backendUrl: string; token: string; email: string }) => void;
      onConfigSaved: (callback: (config: any) => void) => void;
      startTracking: () => void;
      stopTracking: () => void;
      onTrackingState: (callback: (state: { isTracking: boolean }) => void) => void;
    };
  }
}

