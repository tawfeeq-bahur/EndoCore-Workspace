export interface Activity {
  app: string;
  project: string;
  startedAt: number;
  durationText?: string;
  durationSeconds?: number;
  isPaused?: boolean;
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

export interface AnalyticsData {
  appBreakdown: AppBreakdownItem[];
  focusScoreHistory: FocusHistoryItem[];
  comparisonStats: ComparisonItem[];
  weeklyTotalHours: number;
  weeklyProdGoalAchieved: number;
  averageDailyFocus: number;
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

