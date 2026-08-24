import { GoogleGenAI } from "@google/genai";

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

export interface AgentBriefingResponse {
  success: boolean;
  timestamp: string;
  summary: string;
  agents: {
    scrumCoordinator: ScrumCoordinatorState;
    welfareCoach: WelfareCoachState;
  };
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
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 0 && apiKey !== "your-gemini-api-key") {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
You are the EndoCore Workspace Multi-Agent Orchestrator consisting of two distinct specialized AI agents:
1. Scrum Coordinator Agent: Analyzes active developer window titles, project contexts, and identifies developers who are blocked or debugging similar issues to recommend peer pairing.
2. Welfare & Productivity Coach: Evaluates continuous work time, identifies high burnout risk (focus > 45m without pause), and prescribes ergonomic micro-breaks.

Team Activity State:
${JSON.stringify(roomMembersActivity, null, 2)}

Respond with a strictly formatted valid JSON object matching this exact schema:
{
  "summary": "High-level overview of team focus and alignment",
  "scrumCoordinator": {
    "status": "Optimal Alignment" or "Attention Needed",
    "blockageDetected": boolean,
    "pairSuggestions": [{ "stuckUser": "Name", "suggestedPeer": "Name", "reason": "Why they should pair" }],
    "recommendation": "Actionable suggestion"
  },
  "welfareCoach": {
    "burnoutRiskIndex": number,
    "breakNeeded": boolean,
    "targetUsers": ["User Names"],
    "ergonomicNudge": "Micro-break suggestion"
  }
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const parsedText = response.text || "{}";
      const parsed = JSON.parse(parsedText);

      const summary = parsed.summary || "Team members are currently maintaining solid focus continuity.";
      const scrum = parsed.scrumCoordinator || {
        status: "Optimal Alignment",
        blockageDetected: false,
        pairSuggestions: [],
        recommendation: "All active team members are proceeding smoothly across assigned tasks."
      };
      const welfare = parsed.welfareCoach || {
        burnoutRiskIndex: 20,
        breakNeeded: false,
        targetUsers: [],
        ergonomicNudge: "Team fatigue levels are within healthy ergonomic limits."
      };

      const formattedText = `
🤖 **EndoCore Multi-Agent Scrum Briefing**
--------------------------------------------------
**Summary:** ${summary}

**🕵️ Scrum Coordinator Agent:**
- Status: ${scrum.status}
- Recommendation: ${scrum.recommendation}
${scrum.pairSuggestions.length > 0 ? `- Recommended Pairings:\n${scrum.pairSuggestions.map(p => `  • ${p.stuckUser} ↔ ${p.suggestedPeer}: ${p.reason}`).join('\n')}` : ''}

**🩺 Welfare & Productivity Coach:**
- Burnout Risk Index: ${welfare.burnoutRiskIndex}/100
- Ergonomic Alert: ${welfare.ergonomicNudge}
`.trim();

      return {
        success: true,
        timestamp: new Date().toISOString(),
        summary,
        agents: {
          scrumCoordinator: scrum,
          welfareCoach: welfare
        },
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

export function generateHeuristicBriefing(activities: MemberActivityState[]): AgentBriefingResponse {
  const stuckUsers = activities.filter(
    a => a.durationSeconds > 1800 && (a.project.toLowerCase().includes("error") || a.app.includes("VS Code") || a.project.toLowerCase().includes("debug"))
  );
  const longFocusUsers = activities.filter(a => a.durationSeconds > 2700);

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
    : "All active team members are proceeding smoothly across assigned tasks.";

  const burnoutRiskIndex = Math.min(85, Math.max(15, longFocusUsers.length * 25 + 15));
  const breakNeeded = longFocusUsers.length > 0;
  const targetUsers = longFocusUsers.map(u => u.name);

  const ergonomicNudge = longFocusUsers.length > 0
    ? `Continuous focus detected for ${longFocusUsers.map(u => u.name).join(", ")}. 5-minute hydration and eye-rest stretch recommended.`
    : "Team fatigue levels are within healthy ergonomic limits.";

  const summary = `Synthesized workspace analysis for ${activities.length > 0 ? activities.length : 1} active room member(s).`;

  const formattedText = `
🤖 **EndoCore Multi-Agent Scrum Briefing** *(Heuristic Engine)*
--------------------------------------------------
**Summary:** ${summary}

**🕵️ Scrum Coordinator Agent:**
- Status: ${scrumStatus}
- Recommendation: ${scrumRecommendation}
${pairSuggestions.length > 0 ? `- Recommended Pairings:\n${pairSuggestions.map(p => `  • ${p.stuckUser} ↔ ${p.suggestedPeer}: ${p.reason}`).join('\n')}` : ''}

**🩺 Welfare & Productivity Coach:**
- Burnout Risk Index: ${burnoutRiskIndex}/100
- Ergonomic Alert: ${ergonomicNudge}
`.trim();

  return {
    success: true,
    timestamp: new Date().toISOString(),
    summary,
    agents: {
      scrumCoordinator: {
        status: scrumStatus,
        blockageDetected,
        pairSuggestions,
        recommendation: scrumRecommendation
      },
      welfareCoach: {
        burnoutRiskIndex,
        breakNeeded,
        targetUsers,
        ergonomicNudge
      }
    },
    text: formattedText,
    isFallback: true
  };
}
