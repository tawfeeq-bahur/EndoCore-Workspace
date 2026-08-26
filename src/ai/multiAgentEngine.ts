import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

export interface PairSuggestion {
  stuckUser: string;
  suggestedPeer: string;
  reason: string;
}

export interface ScrumCoordinatorState {
  status: string; // e.g. "Optimal Alignment", "Attention Needed"
  blockageDetected: boolean;
  pairSuggestions: PairSuggestion[];
  recommendation: string;
}

export interface WelfareCoachState {
  burnoutRiskIndex: number; // 0 - 100
  breakNeeded: boolean;
  targetUsers: string[];
  ergonomicNudge: string;
}

export interface RoomSummary {
  status: string;
  productivityPercentage: number;
  description: string;
  activeCount: number;
  totalCount: number;
}

export interface TopPerformer {
  name: string;
  focusTime: string;
  apps: string[];
  score: number;
  reason: string;
}

export interface NeedsAttention {
  name: string;
  idleTime: string;
  reason: string;
}

export interface Prediction {
  completionPercentage: number;
  description: string;
}

export interface MemberInsight {
  name: string;
  productivityScore: number;
  currentFocus: string;
  moodIndicator: string; // "focused" | "idle" | "distracted" | "deep_work" | "offline"
  focusDuration: string;
  suggestion: string;
}

export interface FocusPatterns {
  deepWorkStreak: number; // minutes of longest uninterrupted session
  contextSwitchCount: number;
  peakProductivityWindow: string;
  averageSessionLength: string;
  flowStateDetected: boolean;
}

export interface AgentBriefingResponse {
  success: boolean;
  timestamp: string;
  summary: string;
  agents: {
    scrumCoordinator: ScrumCoordinatorState;
    welfareCoach: WelfareCoachState;
  };
  roomSummary: RoomSummary;
  topPerformer: TopPerformer;
  needsAttention: NeedsAttention;
  recommendations: string[];
  prediction: Prediction;
  memberInsights: MemberInsight[];
  focusPatterns: FocusPatterns;
  collaborationScore: number; // 0-100
  text: string; // Formatted text block for simple UI rendering
  isFallback: boolean;
}

export interface MemberActivityState {
  id: string;
  name: string;
  app: string;
  project: string;
  durationSeconds: number;
  privacyMode: string;
}

export async function generateMultiAgentBriefing(
  roomMembersActivity: MemberActivityState[]
): Promise<AgentBriefingResponse> {
  dotenv.config({ override: true });
  let apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 0 && apiKey !== "your-gemini-api-key") {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
You are the EndoCore Workspace Multi-Agent Orchestrator — an advanced AI system for real-time developer team intelligence. You consist of multiple specialized AI agents that analyze workspace telemetry data to provide actionable insights.

Your agents:
1. **Scrum Coordinator Agent**: Analyzes active developer window titles, project contexts, task alignment, and identifies developers who are blocked, debugging, or working on similar issues to recommend peer pairing and collaboration.
2. **Welfare & Productivity Coach**: Evaluates continuous work time, identifies high burnout risk (continuous focus >45 minutes without pause), monitors fatigue patterns, and prescribes ergonomic micro-breaks.
3. **Productivity Analyst**: Computes individual and team productivity metrics, identifies top performers, detects focus patterns (deep work streaks vs context switching), and predicts daily completion trajectories.
4. **Collaboration Strategist**: Evaluates team synergy, identifies collaboration opportunities, and scores overall team coordination.

## Current Team Activity State (Live Telemetry):
${JSON.stringify(roomMembersActivity, null, 2)}

## Important Analysis Guidelines:
- Members with "Offline" as their app or 0 durationSeconds are currently offline/inactive
- Members with "privacyMode" containing "Private" should have limited analysis (respect privacy)
- Duration is in seconds — convert to meaningful time representations
- Be specific and mention team members by name in your analysis
- Provide actionable, concrete recommendations — not generic advice
- If everyone is offline, still provide useful meta-analysis about the team state and recommendations for when they return
- Productivity scores should be realistic: offline = 0-15%, minimal activity = 15-40%, moderate = 40-70%, high focus = 70-95%

Respond with a strictly formatted valid JSON object matching this EXACT schema (every field is required):
{
  "summary": "Comprehensive 2-3 sentence overview of team state, alignment, and key observations. Be specific about what the team is doing.",
  "roomSummary": {
    "status": "Active Room" or "Quiet Room" or "Mixed Activity" or "Deep Focus Zone",
    "productivityPercentage": <number 0-100 representing overall room productivity>,
    "description": "Detailed 2 sentence description of room activity state including specific observations about active members and their work.",
    "activeCount": <number of currently active/online members>,
    "totalCount": <total number of members in room>
  },
  "topPerformer": {
    "name": "<Name of the top performing member, or 'None' if all offline>",
    "focusTime": "<e.g. '2h 15m' or '45m'>",
    "apps": ["<List of apps they're using>"],
    "score": <0-100 productivity score>,
    "reason": "Specific reason why they're the top performer with concrete metrics."
  },
  "needsAttention": {
    "name": "<Name of member needing attention, or 'None'>",
    "idleTime": "<e.g. '30m idle' or 'Extended debugging session'>",
    "reason": "Specific actionable reason why they need attention and what could help."
  },
  "scrumCoordinator": {
    "status": "Optimal Alignment" or "Attention Needed" or "Critical Blockage",
    "blockageDetected": <boolean>,
    "pairSuggestions": [{"stuckUser": "Name", "suggestedPeer": "Name", "reason": "Specific reason for pairing based on their current work context"}],
    "recommendation": "Detailed actionable recommendation for the team lead. Be specific about who should do what."
  },
  "welfareCoach": {
    "burnoutRiskIndex": <0-100>,
    "breakNeeded": <boolean>,
    "targetUsers": ["<Names of users who need breaks>"],
    "ergonomicNudge": "Specific ergonomic recommendation mentioning targeted users by name and what type of break they need."
  },
  "recommendations": [
    "First specific, actionable recommendation mentioning team members by name",
    "Second recommendation about workflow optimization",
    "Third recommendation about collaboration or focus improvement",
    "Fourth recommendation about wellbeing or ergonomics",
    "Fifth recommendation about upcoming priorities or planning"
  ],
  "prediction": {
    "completionPercentage": <0-100 estimated daily goal completion based on current pace>,
    "description": "Specific prediction about how the rest of the work day will unfold based on current patterns and pace."
  },
  "memberInsights": [
    {
      "name": "<Member name>",
      "productivityScore": <0-100>,
      "currentFocus": "<What they're working on, e.g. 'Deep in VS Code on EndoCore Pipeline' or 'Offline'>",
      "moodIndicator": "<one of: focused, idle, distracted, deep_work, offline>",
      "focusDuration": "<e.g. '1h 30m' or '0m'>",
      "suggestion": "Personalized suggestion for this specific member."
    }
  ],
  "focusPatterns": {
    "deepWorkStreak": <longest uninterrupted session in minutes across all members>,
    "contextSwitchCount": <estimated context switches based on app diversity>,
    "peakProductivityWindow": "<e.g. '09:00 - 11:30 AM' based on activity patterns>",
    "averageSessionLength": "<e.g. '45m'>",
    "flowStateDetected": <boolean - true if any member has >60 min continuous focus>
  },
  "collaborationScore": <0-100 team collaboration metric based on project overlap, communication signals, and coordination>
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const parsedText = response.text || "{}";
      const parsed = JSON.parse(parsedText);

      const summary = parsed.summary || "Team members are currently maintaining solid focus continuity.";
      
      const roomSummary: RoomSummary = {
        status: parsed.roomSummary?.status || "Active Room",
        productivityPercentage: parsed.roomSummary?.productivityPercentage ?? 50,
        description: parsed.roomSummary?.description || "Room activity data is being compiled.",
        activeCount: parsed.roomSummary?.activeCount ?? 0,
        totalCount: parsed.roomSummary?.totalCount ?? roomMembersActivity.length
      };

      const topPerformer: TopPerformer = {
        name: parsed.topPerformer?.name || "None",
        focusTime: parsed.topPerformer?.focusTime || "0m",
        apps: Array.isArray(parsed.topPerformer?.apps) ? parsed.topPerformer.apps : ["VS Code"],
        score: parsed.topPerformer?.score ?? 0,
        reason: parsed.topPerformer?.reason || ""
      };

      const needsAttention: NeedsAttention = {
        name: parsed.needsAttention?.name || "None",
        idleTime: parsed.needsAttention?.idleTime || "0m",
        reason: parsed.needsAttention?.reason || ""
      };

      const scrum: ScrumCoordinatorState = parsed.scrumCoordinator || {
        status: "Optimal Alignment",
        blockageDetected: false,
        pairSuggestions: [],
        recommendation: "All active team members are proceeding smoothly across assigned tasks."
      };

      const welfare: WelfareCoachState = parsed.welfareCoach || {
        burnoutRiskIndex: 20,
        breakNeeded: false,
        targetUsers: [],
        ergonomicNudge: "Team fatigue levels are within healthy ergonomic limits."
      };

      const recommendations: string[] = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];

      const prediction: Prediction = {
        completionPercentage: parsed.prediction?.completionPercentage ?? 50,
        description: parsed.prediction?.description || ""
      };

      const memberInsights: MemberInsight[] = Array.isArray(parsed.memberInsights)
        ? parsed.memberInsights.map((m: any) => ({
            name: m.name || "Unknown",
            productivityScore: m.productivityScore ?? 0,
            currentFocus: m.currentFocus || "Offline",
            moodIndicator: m.moodIndicator || "offline",
            focusDuration: m.focusDuration || "0m",
            suggestion: m.suggestion || ""
          }))
        : [];

      const focusPatterns: FocusPatterns = {
        deepWorkStreak: parsed.focusPatterns?.deepWorkStreak ?? 0,
        contextSwitchCount: parsed.focusPatterns?.contextSwitchCount ?? 0,
        peakProductivityWindow: parsed.focusPatterns?.peakProductivityWindow || "Not enough data",
        averageSessionLength: parsed.focusPatterns?.averageSessionLength || "0m",
        flowStateDetected: parsed.focusPatterns?.flowStateDetected ?? false
      };

      const collaborationScore: number = parsed.collaborationScore ?? 50;

      const formattedText = buildFormattedText({
        summary, roomSummary, topPerformer, needsAttention, scrum, welfare,
        recommendations, prediction, memberInsights, focusPatterns, collaborationScore
      });

      return {
        success: true,
        timestamp: new Date().toISOString(),
        summary,
        agents: { scrumCoordinator: scrum, welfareCoach: welfare },
        roomSummary,
        topPerformer,
        needsAttention,
        recommendations,
        prediction,
        memberInsights,
        focusPatterns,
        collaborationScore,
        text: formattedText,
        isFallback: false
      };
    } catch (err) {
      console.error("Gemini Multi-Agent execution failed, falling back to rule engine:", err);
    }
  }

  // Rule-Based Heuristic Fallback Synthesizer
  return generateHeuristicBriefing(roomMembersActivity);
}

function buildFormattedText(data: {
  summary: string;
  roomSummary: RoomSummary;
  topPerformer: TopPerformer;
  needsAttention: NeedsAttention;
  scrum: ScrumCoordinatorState;
  welfare: WelfareCoachState;
  recommendations: string[];
  prediction: Prediction;
  memberInsights: MemberInsight[];
  focusPatterns: FocusPatterns;
  collaborationScore: number;
}): string {
  const { summary, roomSummary, topPerformer, needsAttention, scrum, welfare, recommendations, prediction, memberInsights, focusPatterns, collaborationScore } = data;

  let text = `🤖 **EndoCore Multi-Agent Scrum Briefing**
--------------------------------------------------
**Summary:** ${summary}

**🟢 Room Status:** ${roomSummary.status} (${roomSummary.productivityPercentage}% productivity)
${roomSummary.description}
Active: ${roomSummary.activeCount} / ${roomSummary.totalCount} developers

**🕵️ Scrum Coordinator Agent:**
- Status: ${scrum.status}
- Recommendation: ${scrum.recommendation}
${scrum.pairSuggestions.length > 0 ? `- Recommended Pairings:\n${scrum.pairSuggestions.map(p => `  • ${p.stuckUser} ↔ ${p.suggestedPeer}: ${p.reason}`).join('\n')}` : ''}

**🩺 Welfare & Productivity Coach:**
- Burnout Risk Index: ${welfare.burnoutRiskIndex}/100
- Ergonomic Alert: ${welfare.ergonomicNudge}`;

  if (topPerformer.name !== "None") {
    text += `\n\n**🏆 Top Performer:** ${topPerformer.name} (Score: ${topPerformer.score}%)
- Focus Time: ${topPerformer.focusTime}
- Apps: ${topPerformer.apps.join(", ")}
- ${topPerformer.reason}`;
  }

  if (needsAttention.name !== "None") {
    text += `\n\n**⚠️ Needs Attention:** ${needsAttention.name}
- ${needsAttention.idleTime}
- ${needsAttention.reason}`;
  }

  if (recommendations.length > 0) {
    text += `\n\n**🤖 AI Recommendations:**\n${recommendations.map(r => `• ${r}`).join('\n')}`;
  }

  text += `\n\n**🔮 Prediction:** ${prediction.completionPercentage}% daily completion
${prediction.description}`;

  text += `\n\n**📊 Focus Patterns:**
- Deep Work Streak: ${focusPatterns.deepWorkStreak}m
- Context Switches: ${focusPatterns.contextSwitchCount}
- Peak Window: ${focusPatterns.peakProductivityWindow}
- Avg Session: ${focusPatterns.averageSessionLength}
- Flow State: ${focusPatterns.flowStateDetected ? "✅ Detected" : "❌ Not detected"}`;

  text += `\n\n**🤝 Collaboration Score:** ${collaborationScore}/100`;

  return text.trim();
}

export function generateHeuristicBriefing(activities: MemberActivityState[]): AgentBriefingResponse {
  const activeMembers = activities.filter(a => a.app !== "Offline" && a.durationSeconds > 0);
  const stuckUsers = activities.filter(
    a => a.durationSeconds > 1800 && (a.project.toLowerCase().includes("error") || a.app.includes("VS Code") || a.project.toLowerCase().includes("debug"))
  );
  const longFocusUsers = activities.filter(a => a.durationSeconds > 2700);

  // Scrum Coordinator
  const scrumStatus = stuckUsers.length > 0 ? "Attention Needed" : "Optimal Alignment";
  const blockageDetected = stuckUsers.length > 0;
  
  const pairSuggestions: PairSuggestion[] = [];
  if (stuckUsers.length >= 2) {
    pairSuggestions.push({
      stuckUser: stuckUsers[0].name,
      suggestedPeer: stuckUsers[1].name,
      reason: `Both developers are in extended focus sessions (${Math.round(stuckUsers[0].durationSeconds / 60)}m & ${Math.round(stuckUsers[1].durationSeconds / 60)}m focus)`
    });
  }

  const scrumRecommendation = stuckUsers.length > 0
    ? `${stuckUsers[0].name} has been engaged in ${stuckUsers[0].project || "debugging"} for over 30 minutes. Consider sending a peer Wave.`
    : activeMembers.length > 0
    ? `${activeMembers.length} team member(s) are active. No blockages detected — team is well-aligned.`
    : "All team members are currently offline. No peer pairing required at present as all team members are offline.";

  // Welfare Coach
  const burnoutRiskIndex = Math.min(85, Math.max(0, longFocusUsers.length * 25 + (activeMembers.length > 0 ? 15 : 0)));
  const breakNeeded = longFocusUsers.length > 0;
  const targetUsers = longFocusUsers.map(u => u.name);

  const ergonomicNudge = longFocusUsers.length > 0
    ? `Continuous focus detected for ${longFocusUsers.map(u => u.name).join(", ")}. 5-minute hydration and eye-rest stretch recommended.`
    : activeMembers.length > 0
    ? "Team fatigue levels are within healthy ergonomic limits. Maintain regular break intervals."
    : "Team members are currently logged off. Ensure proper rest and detachment from work during downtime.";

  // Room Summary
  const activeCount = activeMembers.length;
  const totalCount = activities.length || 1;
  const productivityPercentage = totalCount > 0
    ? Math.round((activeCount / totalCount) * 100 * (activeMembers.length > 0 ? 0.7 + Math.random() * 0.3 : 0.1))
    : 0;

  const roomStatus = activeCount === 0 ? "Quiet Room"
    : activeCount <= totalCount * 0.3 ? "Mixed Activity"
    : activeCount <= totalCount * 0.7 ? "Active Room"
    : "Deep Focus Zone";

  const roomDescription = activeCount === 0
    ? `All ${totalCount} team members are currently offline. No active development work, focus sessions, or workspace blockages detected.`
    : `${activeCount} of ${totalCount} developers are actively working. ${activeMembers.map(m => m.name).slice(0, 3).join(", ")} ${activeMembers.length > 3 ? "and others" : ""} currently in focus sessions.`;

  const roomSummary: RoomSummary = {
    status: roomStatus,
    productivityPercentage: Math.round(productivityPercentage),
    description: roomDescription,
    activeCount,
    totalCount
  };

  // Top Performer
  const sortedByDuration = [...activities].sort((a, b) => b.durationSeconds - a.durationSeconds);
  const topUser = sortedByDuration.find(u => u.app !== "Offline" && u.durationSeconds > 0);
  
  const topPerformer: TopPerformer = topUser ? {
    name: topUser.name,
    focusTime: formatDuration(topUser.durationSeconds),
    apps: [topUser.app],
    score: Math.min(100, Math.round((topUser.durationSeconds / 3600) * 25 + 40)),
    reason: `Leading focus time with ${formatDuration(topUser.durationSeconds)} in ${topUser.app} on ${topUser.project}.`
  } : {
    name: "None",
    focusTime: "0m",
    apps: [],
    score: 0,
    reason: "No active developers to evaluate."
  };

  // Needs Attention
  const idleUsers = activities.filter(a => a.app === "Offline" || a.durationSeconds === 0);
  const attentionUser = stuckUsers[0] || (idleUsers.length > 0 && activeMembers.length > 0 ? idleUsers[0] : null);

  const needsAttention: NeedsAttention = attentionUser ? {
    name: attentionUser.name,
    idleTime: attentionUser.app === "Offline" ? "Currently offline" : `${Math.round(attentionUser.durationSeconds / 60)}m in extended session`,
    reason: attentionUser.app === "Offline"
      ? `${attentionUser.name} has been offline while other team members are active. Consider checking in via Wave signal.`
      : `Extended focus session detected — may indicate a blockage in ${attentionUser.project || "current task"}.`
  } : {
    name: "None",
    idleTime: "0m",
    reason: ""
  };

  // Recommendations
  const recommendations: string[] = [];
  if (activeCount === 0) {
    recommendations.push("All team members are offline. Schedule a sync standup when the team comes back online.");
    recommendations.push("Review yesterday's commits and PRs to prepare for the next work session.");
    recommendations.push("Update project boards and task assignments while the team is offline.");
    recommendations.push("Consider setting up automated daily summary reports for asynchronous teams.");
    recommendations.push("Plan tomorrow's sprint goals and assign priority tasks before the day begins.");
  } else {
    if (topUser) recommendations.push(`Acknowledge ${topUser.name}'s strong focus session to boost team morale.`);
    if (stuckUsers.length > 0) recommendations.push(`Check in with ${stuckUsers.map(u => u.name).join(", ")} who may be blocked on debugging tasks.`);
    if (longFocusUsers.length > 0) recommendations.push(`Remind ${longFocusUsers.map(u => u.name).join(", ")} to take a short break — continuous focus >45min detected.`);
    recommendations.push("Consider a quick 5-minute team sync to align on priorities for the remaining work day.");
    recommendations.push("Review pending code reviews and unblock any PRs waiting for approval.");
  }

  // Prediction
  const prediction: Prediction = {
    completionPercentage: activeCount === 0 ? 10 : Math.min(95, Math.round(25 + (activeCount / totalCount) * 50 + Math.random() * 20)),
    description: activeCount === 0
      ? "With all members offline, daily goal completion is at risk. Progress will resume when team members return to their workstations."
      : `Based on current activity patterns, the team is on track to complete approximately ${Math.round(40 + (activeCount / totalCount) * 40)}% of planned tasks by end of day.`
  };

  // Member Insights
  const memberInsights: MemberInsight[] = activities.map(a => {
    const isActive = a.app !== "Offline" && a.durationSeconds > 0;
    const isPrivate = a.privacyMode?.toLowerCase().includes("private");
    return {
      name: a.name,
      productivityScore: isPrivate ? -1 : (isActive ? Math.min(100, Math.round((a.durationSeconds / 3600) * 30 + 20 + Math.random() * 20)) : Math.round(Math.random() * 10)),
      currentFocus: isPrivate ? "Private Workstation" : (isActive ? `${a.app} — ${a.project}` : "Offline"),
      moodIndicator: isPrivate ? "focused" : (!isActive ? "offline" : (a.durationSeconds > 3600 ? "deep_work" : a.durationSeconds > 1800 ? "focused" : "idle")),
      focusDuration: formatDuration(a.durationSeconds),
      suggestion: isPrivate
        ? "Activity details hidden (Privacy Mode). Respect workspace privacy."
        : (!isActive
          ? `${a.name} is currently offline. Send a Wave when they return.`
          : (a.durationSeconds > 3600
            ? `${a.name} has been in deep work for ${formatDuration(a.durationSeconds)}. A micro-break is recommended.`
            : `${a.name} is maintaining good focus. Keep the momentum going.`))
    };
  });

  // Focus Patterns
  const maxDuration = sortedByDuration.length > 0 ? sortedByDuration[0].durationSeconds : 0;
  const uniqueApps = new Set(activities.map(a => a.app).filter(a => a !== "Offline"));
  
  const focusPatterns: FocusPatterns = {
    deepWorkStreak: Math.round(maxDuration / 60),
    contextSwitchCount: Math.max(0, uniqueApps.size - 1),
    peakProductivityWindow: activeCount > 0 ? "Current active session" : "No active sessions detected",
    averageSessionLength: activeMembers.length > 0
      ? formatDuration(Math.round(activeMembers.reduce((s, a) => s + a.durationSeconds, 0) / activeMembers.length))
      : "0m",
    flowStateDetected: maxDuration > 3600
  };

  // Collaboration Score
  const projectOverlap = new Set(activities.map(a => a.project)).size;
  const collaborationScore = Math.min(100, Math.max(10, Math.round(
    (activeCount > 1 ? 40 : 10) + 
    (projectOverlap <= 2 ? 30 : 10) + 
    (pairSuggestions.length > 0 ? 20 : 0)
  )));

  const summary = activeCount === 0
    ? `All ${totalCount} team members are currently offline. No active development work, focus sessions, or workspace blockages detected.`
    : `Synthesized workspace analysis for ${totalCount} room member(s). ${activeCount} active, ${totalCount - activeCount} offline. ${stuckUsers.length > 0 ? "Potential blockages detected." : "Team alignment is optimal."}`;

  const formattedText = buildFormattedText({
    summary, roomSummary, topPerformer, needsAttention,
    scrum: { status: scrumStatus, blockageDetected, pairSuggestions, recommendation: scrumRecommendation },
    welfare: { burnoutRiskIndex, breakNeeded, targetUsers, ergonomicNudge },
    recommendations, prediction, memberInsights, focusPatterns, collaborationScore
  });

  return {
    success: true,
    timestamp: new Date().toISOString(),
    summary,
    agents: {
      scrumCoordinator: { status: scrumStatus, blockageDetected, pairSuggestions, recommendation: scrumRecommendation },
      welfareCoach: { burnoutRiskIndex, breakNeeded, targetUsers, ergonomicNudge }
    },
    roomSummary,
    topPerformer,
    needsAttention,
    recommendations,
    prediction,
    memberInsights,
    focusPatterns,
    collaborationScore,
    text: formattedText,
    isFallback: true
  };
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0m";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}
