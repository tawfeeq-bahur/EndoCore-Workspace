import React, { useState, useEffect } from "react";
import { 
  Shield, Cpu, Users, Target, Clock, CheckCircle2, AlertTriangle, 
  TrendingUp, Sparkles, User, RefreshCw, ChevronRight, Lock, Globe, Info, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NumberTicker } from "./NumberTicker";

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
  let totalTasksCompleted = 0;
  let totalTasksTarget = 0;
  
  const memberRows: MemberContributionRow[] = occupants.map((occ) => {
    const focusHrs = parseFloat(occ.todayFocusTime?.replace("h", "") || "0");
    const targetHrs = occ.productivityGoal || 6;
    const completedTasks = occ.tasksCompleted || (occ.focusScore ? Math.round(occ.focusScore / 20) : 0);
    const taskTarget = occ.taskTarget || 5;
    
    totalActualHours += focusHrs;
    totalTargetHours += targetHrs;
    totalTasksCompleted += completedTasks;
    totalTasksTarget += taskTarget;

    const effortPercent = Math.min(100, Math.round((focusHrs / Math.max(1, targetHrs)) * 100));
    const deliveryPercent = Math.min(100, Math.round((completedTasks / Math.max(1, taskTarget)) * 100));

    let status: "on_track" | "watch" | "at_risk" = "on_track";
    let briefing = "Pacing consistently toward agreed daily target.";
    if (effortPercent < 40) {
      status = "at_risk";
      briefing = "Focus time is behind expected check-in threshold.";
    } else if (effortPercent < 75) {
      status = "watch";
      briefing = "Moderate pace. Sprints required to complete target.";
    }

    return {
      id: occ.id,
      name: occ.name,
      avatarUrl: occ.avatarUrl,
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

  const teamEffortProgress = totalTargetHours > 0 ? Math.min(100, Math.round((totalActualHours / totalTargetHours) * 100)) : 0;
  const teamDeliveryProgress = totalTasksTarget > 0 ? Math.min(100, Math.round((totalTasksCompleted / totalTasksTarget) * 100)) : 0;

  return (
    <div className="space-y-6">
      
      {/* 1. ROOM HEADER & TEAM HEALTH TOP BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#e4e4e7] shadow-lg relative overflow-hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl shadow-sm">
              {roomDetails?.iconEmoji || "🚀"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-serif italic font-bold text-[#09090b]">
                  #{roomName}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                  {roomDetails?.category || "Development"}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 font-mono">
                  Role: {userRole}
                </span>
              </div>
              <p className="text-xs text-[#71717a] mt-1 max-w-xl">
                {roomDetails?.description || "High-performance team collaboration and AI-monitored focus workspace."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">Forecast Status</span>
              <span className={`text-xs font-bold font-mono ${
                teamEffortProgress > 70 ? "text-emerald-600" : teamEffortProgress > 40 ? "text-amber-500" : "text-rose-500"
              }`}>
                {teamEffortProgress > 70 ? "● ON TRACK" : teamEffortProgress > 40 ? "▲ WATCH" : "✖ AT RISK"}
              </span>
            </div>

            {onRefreshAi && (
              <button
                onClick={onRefreshAi}
                className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-indigo-600 border border-zinc-200 hover:border-zinc-300 transition cursor-pointer"
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
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>Team Effort Progress</span>
              <span className="text-indigo-600 font-bold"><NumberTicker value={teamEffortProgress} />%</span>
            </div>
            <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${teamEffortProgress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full" 
              />
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              <NumberTicker value={totalActualHours} decimals={1} />h logged / {totalTargetHours}h target
            </div>
          </div>

          {/* Metric 2: Delivery Completion */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
              <span>Delivery Completion</span>
              <span className="text-emerald-600 font-bold"><NumberTicker value={teamDeliveryProgress} />%</span>
            </div>
            <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${teamDeliveryProgress}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" 
              />
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              <NumberTicker value={totalTasksCompleted} /> tasks completed / {totalTasksTarget} planned
            </div>
          </div>

          {/* Metric 3: Active Focus Ratio */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Focus Ratio</span>
            <div className="text-xl font-bold text-[#09090b] font-mono flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              {activeFocusingCount} / {totalOccupants} Focusing
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              {Math.round((activeFocusingCount / totalOccupants) * 100)}% of members active now
            </div>
          </div>

          {/* Metric 4: AI Policy Status */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">AI Policy Engine</span>
            <div className="text-xs font-bold text-indigo-600 font-mono flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              Nudges & Escalation Active
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              Level 1 Private • Level 2 Advisory
            </div>
          </div>

        </div>

      </div>

      {/* 2. MEMBER CONTRIBUTION MATRIX TABLE */}
      <div className="p-6 rounded-3xl bg-white border border-[#e4e4e7] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#09090b] flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Member Work Contributions & Target Progress
            </h3>
            <p className="text-xs text-[#71717a]">Deterministic metric calculations stored separately per member</p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-lg bg-zinc-50 text-zinc-500 border border-zinc-200">
            {memberRows.length} Members Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 font-mono uppercase text-[10px]">
                <th className="py-3 px-4">Member & Role</th>
                <th className="py-3 px-4">Current App</th>
                <th className="py-3 px-4">Focus Target</th>
                <th className="py-3 px-4">Tasks Target</th>
                <th className="py-3 px-4">Contribution</th>
                <th className="py-3 px-4">AI Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {memberRows.map((row, index) => (
                <motion.tr 
                  key={row.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 300 }}
                  whileHover={{ backgroundColor: "#fafafa" }}
                  className="transition-colors group"
                >
                  {/* Name & Role */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img src={row.avatarUrl} alt={row.name} className="w-8 h-8 rounded-full object-cover border border-zinc-200" />
                      <div>
                        <div className="font-semibold text-[#09090b] text-xs">{row.name}</div>
                        <div className="text-[10px] text-zinc-500">{row.role}</div>
                      </div>
                    </div>
                  </td>

                  {/* Current App */}
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 font-mono text-[11px]">
                      {row.currentApp}
                    </span>
                  </td>

                  {/* Focus Target */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-xs text-[#09090b]">
                      {row.focusActualHours.toFixed(1)}h / {row.focusTargetHours}h
                    </div>
                    <div className="text-[10px] text-indigo-500 font-mono">{row.effortProgressPercent}% effort</div>
                  </td>

                  {/* Tasks Target */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-xs text-[#09090b]">
                      {row.tasksCompleted} / {row.taskTarget} tasks
                    </div>
                    <div className="text-[10px] text-emerald-500 font-mono">{row.deliveryProgressPercent}% delivery</div>
                  </td>

                  {/* Contribution Share */}
                  <td className="py-3.5 px-4 font-mono text-xs text-zinc-600">
                    {row.contributionShare}% share
                  </td>

                  {/* AI Status */}
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border ${
                      row.aiStatus === "on_track" 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : row.aiStatus === "watch"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>
                      {row.aiStatus === "on_track" ? "On Track" : row.aiStatus === "watch" ? "Watch" : "At Risk"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    {onNudgeMember && (
                      <button
                        onClick={() => onNudgeMember(row.name, row.id)}
                        className="px-3 py-1 bg-white hover:bg-zinc-50 text-[#09090b] text-[11px] font-mono rounded-lg border border-zinc-300 transition cursor-pointer shadow-sm"
                      >
                        Wave
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. MERGED DEEP WORK TIMELINE SESSIONS */}
      <div className="p-6 rounded-3xl bg-white border border-[#e4e4e7] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#09090b] flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            Merged Deep Work Sessions Timeline
          </h3>
          <span className="text-xs text-[#71717a] font-mono">Micro-events merged into 2+ minute sessions</span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {occupants.flatMap(o => (o.timeline || []).map(t => ({ ...t, name: o.name })))
            .sort((a, b) => b.time.localeCompare(a.time))
            .slice(0, 10) // Show last 10 events
            .map((sess, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-indigo-600 font-semibold">[{sess.time}]</span>
                <span className="text-zinc-600 font-semibold">{sess.name}</span>
                <span className="text-[#09090b]">{sess.app} — {sess.project}</span>
              </div>
              <span className="text-zinc-500 text-[11px] px-2 py-0.5 rounded bg-white border border-zinc-200 shadow-sm">
                {sess.duration}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
