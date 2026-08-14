import React from "react";
import { AlertsFilter } from "../types";
import { Sparkles, Bell, Users } from "lucide-react";

interface MobileAlertsScreenProps {
  activeFilter: AlertsFilter;
  onSelectFilter: (filter: AlertsFilter) => void;
  connectionsData?: any;
  aiInsights?: string | null;
  onRespondConnectionRequest?: (requestId: string, action: "accept" | "decline") => void;
  recentWaves?: Array<{ id: string; senderId: string; senderName: string; timestamp: string }>;
  onTriggerNudge?: (friendName: string, id: string) => void;
  nudgedFriendIds?: Record<string, boolean>;
}

const renderAiContent = (content: string | null | undefined) => {
  if (!content) return "Room channel is running on target delivery pace. Primary focus is centered around EndoCore Workspace.";
  try {
    if (content.trim().startsWith("{")) {
      const parsed = JSON.parse(content);
      if (parsed.summary) return parsed.summary;
      if (parsed.roomSummary) {
        const rs = parsed.roomSummary;
        return `${rs.description || rs.status || "Guild active"}. ${rs.summary || ""}`;
      }
    }
  } catch (e) {
    // raw text string
  }
  return content;
};

export const MobileAlertsScreen: React.FC<MobileAlertsScreenProps> = ({
  activeFilter,
  onSelectFilter,
  connectionsData,
  aiInsights,
  onRespondConnectionRequest,
  recentWaves = [],
  onTriggerNudge,
  nudgedFriendIds = {},
}) => {
  const incoming = connectionsData?.incoming || [];
  const totalCount = incoming.length + (aiInsights ? 1 : 0) + recentWaves.length;

  const filters: { id: AlertsFilter; label: string; count?: number }[] = [
    { id: "all",    label: "All",    count: totalCount },
    { id: "social", label: "Social", count: incoming.length + recentWaves.length },
    { id: "ai",     label: "AI",     count: aiInsights ? 1 : 0 },
    { id: "rooms",  label: "Rooms",  count: 0 },
  ];

  return (
    <div className="p-4 space-y-4 pb-32 bg-[#fafafa] font-sans min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-xl text-[#09090b] tracking-tight">Alerts</h1>
        {totalCount > 0 && (
          <span className="text-[10px] font-mono font-bold bg-[#09090b] text-white px-2.5 py-0.5 rounded-full">
            {totalCount} New
          </span>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelectFilter(f.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl whitespace-nowrap text-xs font-semibold transition-all cursor-pointer border ${
              activeFilter === f.id
                ? "bg-[#09090b] text-white border-[#09090b] shadow-xs"
                : "bg-white text-[#71717a] border-[#e4e4e7] hover:bg-zinc-100 hover:text-[#09090b]"
            }`}
          >
            {f.label}
            {f.count !== undefined && f.count > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                activeFilter === f.id ? "bg-white/20 text-white" : "bg-zinc-100 text-[#09090b]"
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">

        {/* Wave alerts */}
        {(activeFilter === "all" || activeFilter === "social") && recentWaves.map((wave) => (
          <div
            key={wave.id}
            className="studio-card p-4 space-y-3 border-amber-200 bg-amber-50/30"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-amber-900 flex items-center gap-2">
                👋 Wave Received
              </span>
              <span className="text-[10px] font-mono text-[#71717a]">{wave.timestamp}</span>
            </div>
            <p className="text-xs text-[#09090b] leading-relaxed">
              <strong className="text-[#09090b] font-semibold">{wave.senderName}</strong> waved at you! They're checking in on your focus flow.
            </p>
            <button
              onClick={() => onTriggerNudge?.(wave.senderName, wave.senderId)}
              disabled={nudgedFriendIds[wave.senderId]}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                nudgedFriendIds[wave.senderId]
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-[#09090b] text-white border-[#09090b] hover:bg-[#27272a]"
              }`}
            >
              {nudgedFriendIds[wave.senderId] ? "✓ Waved Back!" : "Wave Back 👋"}
            </button>
          </div>
        ))}

        {/* Friend Requests */}
        {(activeFilter === "all" || activeFilter === "social") && incoming.map((req: any) => (
          <div
            key={req.id}
            className="studio-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#e4e4e7] pb-2">
              <span className="font-bold text-sm text-[#09090b] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#09090b]" />
                Connection Request
              </span>
              <span className="text-[10px] font-mono text-[#71717a]">Just now</span>
            </div>
            <p className="text-xs text-[#09090b] leading-relaxed">
              <strong className="text-[#09090b] font-bold">{req.profile?.name || "User"}</strong> wants to connect with you on EndoCore.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onRespondConnectionRequest?.(req.id, "accept")}
                className="flex-1 py-2 rounded-lg bg-[#09090b] text-white font-semibold text-xs cursor-pointer hover:bg-[#27272a] transition-all shadow-xs"
              >
                Accept
              </button>
              <button
                onClick={() => onRespondConnectionRequest?.(req.id, "decline")}
                className="flex-1 py-2 rounded-lg bg-white border border-[#e4e4e7] text-[#09090b] font-semibold text-xs hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Decline
              </button>
            </div>
          </div>
        ))}

        {/* AI Advisory */}
        {(activeFilter === "all" || activeFilter === "ai") && aiInsights && (
          <div className="studio-card p-4 space-y-3 border-indigo-200 bg-indigo-50/40">
            <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
              <span className="font-bold text-sm text-indigo-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-700" />
                Gemini AI Advisory
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold">
                Live
              </span>
            </div>
            <p className="text-xs text-[#27272a] leading-relaxed font-sans">
              {renderAiContent(aiInsights)}
            </p>
          </div>
        )}

        {/* Empty state */}
        {incoming.length === 0 && !aiInsights && recentWaves.length === 0 && (
          <div className="studio-card p-10 flex flex-col items-center text-center space-y-2">
            <Bell className="h-8 w-8 text-[#71717a]" />
            <p className="text-[#71717a] font-mono text-xs">No active alerts at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

