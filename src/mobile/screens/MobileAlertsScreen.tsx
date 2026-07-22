import React from "react";
import { AlertsFilter, MobileNotification } from "../types";

interface MobileAlertsScreenProps {
  activeFilter: AlertsFilter;
  onSelectFilter: (filter: AlertsFilter) => void;
  onMarkAllRead?: () => void;
}

export const MobileAlertsScreen: React.FC<MobileAlertsScreenProps> = ({
  activeFilter,
  onSelectFilter,
  onMarkAllRead,
}) => {
  const filters: { id: AlertsFilter; label: string; count?: number }[] = [
    { id: "all", label: "All", count: 3 },
    { id: "social", label: "Social", count: 1 },
    { id: "rooms", label: "Rooms", count: 1 },
    { id: "ai", label: "AI", count: 1 },
    { id: "system", label: "System", count: 0 },
  ];

  const mockNotifications: MobileNotification[] = [
    {
      id: "1",
      type: "FOCUS_CHALLENGE",
      category: "social",
      title: "Co-focus invitation",
      body: "Ravi invited you to a 45-minute focus session.",
      createdAt: "Now",
      action: { label: "Accept" },
      secondaryAction: { label: "Decline" },
    },
    {
      id: "2",
      type: "AI_PRIVATE_NUDGE",
      category: "ai",
      title: "AI wellness nudge",
      body: "You have worked continuously for 92 minutes. A short break is recommended.",
      createdAt: "18m ago",
    },
    {
      id: "3",
      type: "MILESTONE_COMPLETED",
      category: "rooms",
      title: "Room milestone",
      body: "Engineering Team reached 68% of today's effort target.",
      createdAt: "1h ago",
    },
  ];

  const filteredNotifications =
    activeFilter === "all"
      ? mockNotifications
      : mockNotifications.filter((n) => n.category === activeFilter);

  return (
    <div className="p-4 space-y-4 pb-20 text-white font-sans">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-serif italic text-white">Alerts</h1>
        {onMarkAllRead && (
          <button
            onClick={onMarkAllRead}
            className="text-xs font-mono text-indigo-400 hover:underline"
          >
            Mark all read
          </button>
        )}
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
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-stone-200 flex items-center gap-1.5">
                  ● {item.title}
                </span>
                <span className="text-[10px] font-mono text-stone-500">{item.createdAt}</span>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">{item.body}</p>

              {(item.action || item.secondaryAction) && (
                <div className="flex space-x-2 pt-2">
                  {item.action && (
                    <button className="py-1.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold">
                      {item.action.label}
                    </button>
                  )}
                  {item.secondaryAction && (
                    <button className="py-1.5 px-4 rounded-xl bg-[#1A1A22] border border-[#2A2A36] text-stone-300 font-mono text-xs">
                      {item.secondaryAction.label}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-8 text-center text-stone-400 font-mono text-xs">
            No alerts for filter "{activeFilter}".
          </div>
        )}
      </div>
    </div>
  );
};
