export interface AiPolicyConfig {
  version: number;
  memberSelfNudgeEnabled: boolean;
  ownerEscalationEnabled: boolean;
  warningThresholdMins: number;
  gracePeriodMins: number;
  dailyReportTime: string; // "18:00"
  weeklyReportDay: string; // "Friday"
  deadlineRiskAlerts: boolean;
  lowContributionAlerts: boolean;
  excessiveContextSwitchAlerts: boolean;
  burnoutReminders: boolean;
  alertSeverity: "Low" | "Medium" | "High";
  recipientMatrix: {
    selfNudge: boolean;
    ownerAdvisory: boolean;
    adminAdvisory: boolean;
  };
}

export interface PrivacyPolicyConfig {
  version: number;
  trackAppName: boolean;
  hideWindowTitle: boolean;
  hideWebsiteUrl: boolean;
  trackScheduledHoursOnly: boolean;
  allowManualPause: boolean;
  markMeetingsBreaksLeave: boolean;
  allowMembersViewRawData: boolean;
  dataRetentionDays: number;
  allowDeletePersonalHistory: boolean;
  disableLeaderboard: boolean;
}

export const DEFAULT_AI_POLICY: AiPolicyConfig = {
  version: 1,
  memberSelfNudgeEnabled: true,
  ownerEscalationEnabled: true,
  warningThresholdMins: 45,
  gracePeriodMins: 120,
  dailyReportTime: "18:00",
  weeklyReportDay: "Friday",
  deadlineRiskAlerts: true,
  lowContributionAlerts: true,
  excessiveContextSwitchAlerts: true,
  burnoutReminders: true,
  alertSeverity: "Medium",
  recipientMatrix: {
    selfNudge: true,
    ownerAdvisory: true,
    adminAdvisory: false
  }
};

export const DEFAULT_PRIVACY_POLICY: PrivacyPolicyConfig = {
  version: 1,
  trackAppName: true,
  hideWindowTitle: true,
  hideWebsiteUrl: true,
  trackScheduledHoursOnly: true,
  allowManualPause: true,
  markMeetingsBreaksLeave: true,
  allowMembersViewRawData: true,
  dataRetentionDays: 90,
  allowDeletePersonalHistory: true,
  disableLeaderboard: false
};

export function validateAiPolicy(input: any): { valid: boolean; policy: AiPolicyConfig; errors?: string[] } {
  const errors: string[] = [];
  if (!input || typeof input !== "object") {
    return { valid: false, policy: DEFAULT_AI_POLICY, errors: ["AI policy must be a valid object"] };
  }

  const policy: AiPolicyConfig = {
    version: typeof input.version === "number" ? input.version : 1,
    memberSelfNudgeEnabled: input.memberSelfNudgeEnabled ?? true,
    ownerEscalationEnabled: input.ownerEscalationEnabled ?? true,
    warningThresholdMins: typeof input.warningThresholdMins === "number" ? Math.max(15, input.warningThresholdMins) : 45,
    gracePeriodMins: typeof input.gracePeriodMins === "number" ? Math.max(30, input.gracePeriodMins) : 120,
    dailyReportTime: typeof input.dailyReportTime === "string" ? input.dailyReportTime : "18:00",
    weeklyReportDay: typeof input.weeklyReportDay === "string" ? input.weeklyReportDay : "Friday",
    deadlineRiskAlerts: input.deadlineRiskAlerts ?? true,
    lowContributionAlerts: input.lowContributionAlerts ?? true,
    excessiveContextSwitchAlerts: input.excessiveContextSwitchAlerts ?? true,
    burnoutReminders: input.burnoutReminders ?? true,
    alertSeverity: ["Low", "Medium", "High"].includes(input.alertSeverity) ? input.alertSeverity : "Medium",
    recipientMatrix: {
      selfNudge: input.recipientMatrix?.selfNudge ?? true,
      ownerAdvisory: input.recipientMatrix?.ownerAdvisory ?? true,
      adminAdvisory: input.recipientMatrix?.adminAdvisory ?? false
    }
  };

  return { valid: errors.length === 0, policy, errors: errors.length > 0 ? errors : undefined };
}

export function validatePrivacyPolicy(input: any): { valid: boolean; policy: PrivacyPolicyConfig; errors?: string[] } {
  const errors: string[] = [];
  if (!input || typeof input !== "object") {
    return { valid: false, policy: DEFAULT_PRIVACY_POLICY, errors: ["Privacy policy must be a valid object"] };
  }

  const policy: PrivacyPolicyConfig = {
    version: typeof input.version === "number" ? input.version : 1,
    trackAppName: input.trackAppName ?? true,
    hideWindowTitle: input.hideWindowTitle ?? true,
    hideWebsiteUrl: input.hideWebsiteUrl ?? true,
    trackScheduledHoursOnly: input.trackScheduledHoursOnly ?? true,
    allowManualPause: input.allowManualPause ?? true,
    markMeetingsBreaksLeave: input.markMeetingsBreaksLeave ?? true,
    allowMembersViewRawData: input.allowMembersViewRawData ?? true,
    dataRetentionDays: typeof input.dataRetentionDays === "number" ? input.dataRetentionDays : 90,
    allowDeletePersonalHistory: input.allowDeletePersonalHistory ?? true,
    disableLeaderboard: input.disableLeaderboard ?? false
  };

  return { valid: errors.length === 0, policy, errors: errors.length > 0 ? errors : undefined };
}
