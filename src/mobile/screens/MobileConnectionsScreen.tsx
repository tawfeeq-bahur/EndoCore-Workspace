import React, { useState } from "react";
import { Search, UserCheck, Clock } from "lucide-react";
import { ConnectionsSubTab } from "../types";
import { Friend } from "../../types";

interface MobileConnectionsScreenProps {
  subTab: ConnectionsSubTab;
  onSelectSubTab: (tab: ConnectionsSubTab) => void;
  connectionsData: { friends: any[]; incoming: any[]; outgoing: any[] };
  friends: Friend[];
  onTriggerNudge?: (friendName: string, id: string) => void;
  nudgedFriendIds?: Record<string, boolean>;
  onRespondConnectionRequest?: (requestId: string, action: "accept" | "decline") => void;
}

export const MobileConnectionsScreen: React.FC<MobileConnectionsScreenProps> = ({
  subTab,
  onSelectSubTab,
  connectionsData,
  friends,
  onTriggerNudge,
  nudgedFriendIds = {},
  onRespondConnectionRequest,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const friendsList = friends.length > 0 ? friends : (connectionsData?.friends || []);
  const incomingList = connectionsData?.incoming || [];

  const filteredFriends = friendsList.filter(
    (f: any) =>
      (f.name || f.profile?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.username || f.profile?.username || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 pb-32 bg-[#fafafa] font-sans min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-xl text-[#09090b] tracking-tight">My Connections</h1>
        <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          {friendsList.length} Connected
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717a]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or username..."
          className="w-full bg-white border border-[#e4e4e7] rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono text-[#09090b] placeholder-zinc-400 focus:outline-none focus:border-[#09090b] shadow-xs"
        />
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-1.5">
        {([
          { id: "friends", label: `Friends (${friendsList.length})` },
          { id: "requests", label: `Requests (${incomingList.length})` },
        ] as { id: ConnectionsSubTab; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectSubTab(tab.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              subTab === tab.id
                ? "bg-[#09090b] text-white border-[#09090b] shadow-xs"
                : "bg-white text-[#71717a] border-[#e4e4e7] hover:bg-zinc-100 hover:text-[#09090b]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Friends List */}
      {subTab === "friends" && (
        <div className="space-y-3">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend: any) => {
              const name = friend.name || friend.profile?.name || "Unknown User";
              const id = friend.id || friend.profile?.id;
              const status = friend.status || "offline";
              const avatar = friend.avatarUrl || friend.profile?.avatarUrl;
              const app = friend.currentActivity?.app || "Offline";
              const isOnline = status !== "offline";

              return (
                <div
                  key={id}
                  className="studio-card p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`}
                          className="h-10 w-10 rounded-full object-cover border border-[#e4e4e7]"
                          alt={name}
                        />
                        <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#09090b]">{name}</p>
                        <p className="text-[10px] font-mono text-[#71717a]">{app}</p>
                      </div>
                    </div>

                    <span className={`text-[9px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
                      isOnline
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-zinc-100 text-zinc-600 border-zinc-200"
                    }`}>
                      {status.toUpperCase()}
                    </span>
                  </div>

                  <button
                    onClick={() => onTriggerNudge?.(name, id)}
                    disabled={nudgedFriendIds[id]}
                    className={`w-full py-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer border ${
                      nudgedFriendIds[id]
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-[#09090b] text-white border-[#09090b] hover:bg-[#27272a]"
                    }`}
                  >
                    {nudgedFriendIds[id] ? "✓ Waved!" : "Wave 👋"}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="studio-card p-10 text-center flex flex-col items-center">
              <UserCheck className="h-8 w-8 text-[#71717a] mb-2" />
              <p className="text-[#71717a] font-mono text-xs">No connections found.</p>
            </div>
          )}
        </div>
      )}

      {/* Requests List */}
      {subTab === "requests" && (
        <div className="space-y-3">
          {incomingList.length > 0 ? (
            incomingList.map((req: any) => (
              <div
                key={req.id}
                className="studio-card p-4 space-y-3"
              >
                <div className="flex items-center gap-3 border-b border-[#e4e4e7] pb-3">
                  <img
                    src={req.profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${req.profile?.name}`}
                    className="h-10 w-10 rounded-full object-cover border border-[#e4e4e7]"
                    alt={req.profile?.name}
                  />
                  <div>
                    <p className="font-bold text-sm text-[#09090b]">{req.profile?.name || "User"}</p>
                    <p className="text-[10px] font-mono text-[#71717a]">{req.profile?.email}</p>
                  </div>
                </div>

                <div className="flex gap-2">
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
            ))
          ) : (
            <div className="studio-card p-10 text-center flex flex-col items-center">
              <Clock className="h-8 w-8 text-[#71717a] mb-2" />
              <p className="text-[#71717a] font-mono text-xs">No pending requests.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

