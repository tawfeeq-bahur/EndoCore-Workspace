import React from "react";
import { AlertsFilter } from "../types";

interface MobileAlertsScreenProps {
  activeFilter: AlertsFilter;
  onSelectFilter: (filter: AlertsFilter) => void;
  connectionsData?: any;
  aiInsights?: string | null;
  onRespondConnectionRequest?: (requestId: string, action: "accept" | "decline") => void;
}

export const MobileAlertsScreen: React.FC<MobileAlertsScreenProps> = ({
  activeFilter,
  onSelectFilter,
  connectionsData,
  aiInsights,
  onRespondConnectionRequest,
}) => {
  const incoming = connectionsData?.incoming || [];

  const filters: { id: AlertsFilter; label: string; count?: number }[] = [
    { id: "all", label: "All", count: incoming.length + (aiInsights ? 1 : 0) },
    { id: "social", label: "Social", count: incoming.length },
    { id: "ai", label: "AI", count: aiInsights ? 1 : 0 },
    { id: "rooms", label: "Rooms", count: 0 },
  ];

  return (
    <div className="p-4 space-y-4 pb-20 text-white font-sans">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-serif italic text-white">Alerts & Notifications</h1>
        <span className="text-xs font-mono text-indigo-400 font-semibold">
          {incoming.length + (aiInsights ? 1 : 0)} New
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelectFilter(f.id)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeFilter === f.id
                ? "bg-indigo-600 text-white font-semibold shadow-md"
                : "bg-[#141418] text-stone-400 border border-[#22222A] hover:text-stone-200"
            }`}
          >
            <span>{f.label}</span>
            {f.count !== undefined && f.count > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/20 text-white">
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications Feed */}
      <div className="space-y-3">
        {/* Incoming Friend Requests */}
        {(activeFilter === "all" || activeFilter === "social") && incoming.map((req: any) => (
          <div
            key={req.id}
            className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-2 relative"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-stone-200 flex items-center gap-1.5">
                ● Friend Request Received
              </span>
              <span className="text-[10px] font-mono text-stone-500">Just now</span>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              <strong>{req.profile?.name || "User"}</strong> wants to connect with you on EndoCore.
            </p>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => onRespondConnectionRequest?.(req.id, "accept")}
                className="py-1.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold cursor-pointer"
              >
                Accept
              </button>
              <button
                onClick={() => onRespondConnectionRequest?.(req.id, "decline")}
                className="py-1.5 px-4 rounded-xl bg-[#1A1A22] border border-[#2A2A36] text-stone-300 font-mono text-xs cursor-pointer"
              >
                Decline
              </button>
            </div>
          </div>
        ))}

        {/* AI Brief Nudge */}
        {(activeFilter === "all" || activeFilter === "ai") && aiInsights && (
          <div className="bg-gradient-to-r from-indigo-950/40 via-[#121216] to-purple-950/30 border border-indigo-500/30 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-indigo-300 flex items-center gap-1.5 font-serif italic">
                ✨ Gemini AI Co-Working Advisory
              </span>
              <span className="text-[10px] font-mono text-stone-500">Live</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed font-sans">{aiInsights}</p>
          </div>
        )}

        {incoming.length === 0 && !aiInsights && (
          <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-8 text-center text-stone-400 font-mono text-xs">
            No active alerts at the moment.
          </div>
        )}
      </div>
    </div>
  );
};
