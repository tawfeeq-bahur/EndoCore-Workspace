import React, { useState } from "react";
import { Search } from "lucide-react";
import { ConnectionsSubTab } from "../types";
import { Friend } from "../../types";

interface MobileConnectionsScreenProps {
  subTab: ConnectionsSubTab;
  onSelectSubTab: (tab: ConnectionsSubTab) => void;
  connectionsData: {
    friends: any[];
    incoming: any[];
    outgoing: any[];
  };
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
    <div className="p-4 space-y-4 pb-20 text-white font-sans">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-serif italic text-white">My Connections</h1>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          {friendsList.length} Connected
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or username..."
          className="w-full bg-[#121216] border border-[#1E1E26] rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-stone-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-[#1E1E26] text-xs font-mono">
        <button
          onClick={() => onSelectSubTab("friends")}
          className={`pb-2 px-3 transition-all ${
            subTab === "friends"
              ? "border-b-2 border-indigo-500 text-white font-semibold"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          Friends ({friendsList.length})
        </button>
        <button
          onClick={() => onSelectSubTab("requests")}
          className={`pb-2 px-3 transition-all ${
            subTab === "requests"
              ? "border-b-2 border-indigo-500 text-white font-semibold"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          Requests ({incomingList.length})
        </button>
      </div>

      {/* Friends List */}
      {subTab === "friends" && (
        <div className="space-y-3">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend: any) => {
              const name = friend.name || friend.profile?.name || "Co-worker";
              const id = friend.id || friend.profile?.id;
              const status = friend.status || "online";
              const avatar = friend.avatarUrl || friend.profile?.avatarUrl;
              const app = friend.currentActivity?.app || "VS Code";

              return (
                <div
                  key={id}
                  className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <img src={avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} className="h-9 w-9 rounded-full object-cover border border-stone-800" />
                      <div>
                        <h3 className="font-semibold text-xs text-stone-100">{name}</h3>
                        <span className="text-[10px] font-mono text-stone-400 block">{app}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded-full border ${
                        status !== "offline"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-stone-500/10 text-stone-400 border-stone-500/20"
                      }`}
                    >
                      ● {status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={() => onTriggerNudge?.(name, id)}
                      disabled={nudgedFriendIds[id]}
                      className={`flex-1 py-1.5 rounded-xl font-mono text-[11px] font-semibold text-center cursor-pointer transition-all ${
                        nudgedFriendIds[id]
                          ? "bg-stone-300 text-black font-bold"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white"
                      }`}
                    >
                      {nudgedFriendIds[id] ? "Waved!" : "Wave 👋"}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-8 text-center text-stone-400 font-mono text-xs">
              No connections connected yet.
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
                className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <img src={req.profile?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} className="h-9 w-9 rounded-full object-cover border border-stone-800" />
                    <div>
                      <h3 className="font-semibold text-xs text-stone-100">{req.profile?.name || "User"}</h3>
                      <span className="text-[10px] font-mono text-stone-400 block">{req.profile?.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-1">
                  <button
                    onClick={() => onRespondConnectionRequest?.(req.id, "accept")}
                    className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[11px] font-semibold text-center cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onRespondConnectionRequest?.(req.id, "decline")}
                    className="flex-1 py-1.5 rounded-xl bg-[#1A1A22] border border-[#2A2A36] text-stone-400 font-mono text-[11px] text-center hover:text-white cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-8 text-center text-stone-400 font-mono text-xs">
              No pending connection requests.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
