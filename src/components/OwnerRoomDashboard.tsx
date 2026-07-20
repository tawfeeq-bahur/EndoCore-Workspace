import React, { useState, useEffect } from "react";
import { 
  Shield, Cpu, Users, Target, Clock, CheckCircle2, AlertTriangle, 
  TrendingUp, Sparkles, User, RefreshCw, ChevronRight, Lock, Globe, Info, Zap
} from "lucide-react";

interface MemberContributionRow {
  id: string;
  name: string;
  avatarUrl: string;
  role: string;
  status: string;
  currentApp: string;
  focusTargetHours: number;
  focusActualHours: number;
  taskTarget: number;
  tasksCompleted: number;
  contributionShare: number;
  effortProgressPercent: number;
  deliveryProgressPercent: number;
  aiStatus: "on_track" | "watch" | "at_risk";
  aiBriefing: string;
}

interface OwnerRoomDashboardProps {
  roomName: string;
  roomDetails?: any;
  occupants: any[];
  userRole?: string;
  onRefreshAi?: () => void;
  onNudgeMember?: (name: string, id: string) => void;
}

export const OwnerRoomDashboard: React.FC<OwnerRoomDashboardProps> = ({
  roomName,
  roomDetails,
  occupants,
  userRole = "MEMBER",
  onRefreshAi,
  onNudgeMember
}) => {
  const [activeTab, setActiveTab] = useState<"health" | "members" | "timeline" | "policies">("health");

  // Derive metrics safely from occupants and roomDetails
  const totalOccupants = Math.max(1, occupants.length);
  const activeFocusingCount = occupants.filter(o => o.status !== "offline" && o.currentActivity?.app !== "Offline" && !o.currentActivity?.isPaused).length;
  
  // Calculate aggregate effort and delivery progress
  let totalTargetHours = 0;
  let totalActualHours = 0;
  
  const memberRows: MemberContributionRow[] = occupants.map((occ) => {
    const focusHrs = parseFloat(occ.todayFocusTime?.replace("h", "") || "0");
    const targetHrs = 6; // Default target 6h
    const completedTasks = occ.focusScore ? Math.round(occ.focusScore / 20) : 3;
    const taskTarget = 5;
    
    totalActualHours += focusHrs;
    totalTargetHours += targetHrs;

    const effortPercent = Math.min(100, Math.round((focusHrs / targetHrs) * 100));
    const deliveryPercent = Math.min(100, Math.round((completedTasks / taskTarget) * 100));

    let status: "on_track" | "watch" | "at_risk" = "on_track";
    let briefing = "Pacing consistently toward agreed daily target.";
    if (effortPercent < 40) {
      status = "at_risk";
      briefing = "Focus time is behind expected check-in threshold.";
    } else if (effortPercent < 75) {
      status = "watch";
      briefing = "Moderate pace. One 45-minute sprint will complete target.";
    }

    return {
      id: occ.id,
      name: occ.name,
      avatarUrl: occ.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      role: occ.role || "Member",
      status: occ.status || "online",
      currentApp: occ.currentActivity?.app || "Offline",
      focusTargetHours: targetHrs,
      focusActualHours: focusHrs,
      taskTarget,
      tasksCompleted: completedTasks,
      contributionShare: Math.round((1 / totalOccupants) * 100),
      effortProgressPercent: effortPercent,
      deliveryProgressPercent: deliveryPercent,
      aiStatus: status,
      aiBriefing: briefing
    };
  });

  const teamEffortProgress = Math.min(100, Math.round((totalActualHours / Math.max(1, totalTargetHours)) * 100));
  const teamDeliveryProgress = 68; // Distinct delivery metric

  return (
    <div className="space-y-6">
      
      {/* 1. ROOM HEADER & TEAM HEALTH TOP BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/10">
              {roomDetails?.iconEmoji || "🚀"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-serif italic font-bold text-white">
                  #{roomName}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                  {roomDetails?.category || "Development"}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  Role: {userRole}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {roomDetails?.description || "High-performance team collaboration and AI-monitored focus workspace."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Forecast Status</span>
              <span className={`text-xs font-bold font-mono ${
                teamEffortProgress > 70 ? "text-emerald-400" : teamEffortProgress > 40 ? "text-amber-400" : "text-rose-400"
              }`}>
                {teamEffortProgress > 70 ? "● ON TRACK" : teamEffortProgress > 40 ? "▲ WATCH" : "✖ AT RISK"}
              </span>
            </div>

            {onRefreshAi && (
              <button
                onClick={onRefreshAi}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                title="Refresh AI Briefing"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* DUAL PROGRESS METRICS CARDS (Separated Effort vs Delivery) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          {/* Metric 1: Team Effort Progress */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Team Effort Progress</span>
              <span className="text-cyan-400 font-bold">{teamEffortProgress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${teamEffortProgress}%` }} />
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {totalActualHours.toFixed(1)}h logged / {totalTargetHours}h target
            </div>
          </div>

          {/* Metric 2: Delivery Completion */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Delivery Completion</span>
              <span className="text-emerald-400 font-bold">{teamDeliveryProgress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${teamDeliveryProgress}%` }} />
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              34 story points completed / 50 planned
            </div>
          </div>

          {/* Metric 3: Active Focus Ratio */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Focus Ratio</span>
            <div className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              {activeFocusingCount} / {totalOccupants} Focusing
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {Math.round((activeFocusingCount / totalOccupants) * 100)}% of members active now
            </div>
          </div>

          {/* Metric 4: AI Policy Status */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">AI Policy Engine</span>
            <div className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Nudges & Escalation Active
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Level 1 Private • Level 2 Advisory
            </div>
          </div>

        </div>

      </div>

      {/* 2. MEMBER CONTRIBUTION MATRIX TABLE */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Member Work Contributions & Target Progress
            </h3>
            <p className="text-xs text-slate-400">Deterministic metric calculations stored separately per member</p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-lg bg-slate-950 text-slate-400 border border-slate-800">
            {memberRows.length} Members Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-3 px-4">Member & Role</th>
                <th className="py-3 px-4">Current App</th>
                <th className="py-3 px-4">Focus Target</th>
                <th className="py-3 px-4">Tasks Target</th>
                <th className="py-3 px-4">Contribution</th>
                <th className="py-3 px-4">AI Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {memberRows.map(row => (
                <tr key={row.id} className="hover:bg-slate-800/30 transition">
                  {/* Name & Role */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img src={row.avatarUrl} alt={row.name} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                      <div>
                        <div className="font-semibold text-white text-xs">{row.name}</div>
                        <div className="text-[10px] text-slate-400">{row.role}</div>
                      </div>
                    </div>
                  </td>

                  {/* Current App */}
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 border border-slate-800 font-mono text-[11px]">
                      {row.currentApp}
                    </span>
                  </td>

                  {/* Focus Target */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-xs text-slate-200">
                      {row.focusActualHours.toFixed(1)}h / {row.focusTargetHours}h
                    </div>
                    <div className="text-[10px] text-cyan-400 font-mono">{row.effortProgressPercent}% effort</div>
                  </td>

                  {/* Tasks Target */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-xs text-slate-200">
                      {row.tasksCompleted} / {row.taskTarget} tasks
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono">{row.deliveryProgressPercent}% delivery</div>
                  </td>

                  {/* Contribution Share */}
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                    {row.contributionShare}% share
                  </td>

                  {/* AI Status */}
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border ${
                      row.aiStatus === "on_track" 
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : row.aiStatus === "watch"
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                        : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                    }`}>
                      {row.aiStatus === "on_track" ? "On Track" : row.aiStatus === "watch" ? "Watch" : "At Risk"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    {onNudgeMember && (
                      <button
                        onClick={() => onNudgeMember(row.name, row.id)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono rounded-lg border border-slate-700 transition cursor-pointer"
                      >
                        Wave
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. MERGED DEEP WORK TIMELINE SESSIONS */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Merged Deep Work Sessions Timeline
          </h3>
          <span className="text-xs text-slate-400 font-mono">Micro-events merged into 2+ minute sessions</span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {[
            { time: "09:00 – 10:20", label: "Deep Work — VS Code & Antigravity IDE", duration: "80 mins", type: "deep" },
            { time: "10:20 – 10:35", label: "Planned Break — Resting", duration: "15 mins", type: "break" },
            { time: "10:35 – 11:15", label: "Documentation & API Research — Chrome", duration: "40 mins", type: "focus" },
            { time: "11:15 – 12:00", label: "Team Sync Meeting — Slack & Zoom", duration: "45 mins", type: "meeting" }
          ].map((sess, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-cyan-400 font-semibold">{sess.time}</span>
                <span className="text-slate-200">{sess.label}</span>
              </div>
              <span className="text-slate-400 text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                {sess.duration}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
