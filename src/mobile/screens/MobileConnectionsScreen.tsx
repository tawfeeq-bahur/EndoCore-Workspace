import React, { useState } from "react";
import { Search } from "lucide-react";
import { ConnectionsSubTab, ConnectionUser } from "../types";

interface MobileConnectionsScreenProps {
  subTab: ConnectionsSubTab;
  onSelectSubTab: (tab: ConnectionsSubTab) => void;
}

export const MobileConnectionsScreen: React.FC<MobileConnectionsScreenProps> = ({
  subTab,
  onSelectSubTab,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const mockFriends: ConnectionUser[] = [
    {
      id: "1",
      name: "Ravi",
      username: "@ravi.dev",
      status: "online",
      focusingForMinutes: 28,
    },
    {
      id: "2",
      name: "Arun",
      username: "@arun.dev",
      status: "away",
      lastSeenAt: "3h ago",
    },
    {
      id: "3",
      name: "Meera",
      username: "@meera.design",
      status: "online",
    },
    {
      id: "4",
      name: "Karthik",
      username: "@karthik.code",
      status: "offline",
      lastSeenAt: "1d ago",
    },
  ];

  const mockRequests = [
    {
      id: "req-1",
      name: "Priya Sharma",
      username: "@priya.sharma",
      mutualCount: 4,
      createdAt: "2h ago",
    },
  ];

  const mockInvitations = [
    {
      id: "inv-1",
      roomName: "Frontend Guild",
      invitedBy: "Meera (@meera.design)",
      createdAt: "1d ago",
    },
    {
      id: "inv-2",
      roomName: "AI Research Group",
      invitedBy: "Ravi (@ravi.dev)",
      createdAt: "3d ago",
    },
  ];

  const filteredFriends = mockFriends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 pb-20 text-white font-sans">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-serif italic text-white">My Connections</h1>
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
          Friends ({mockFriends.length})
        </button>
        <button
          onClick={() => onSelectSubTab("requests")}
          className={`pb-2 px-3 transition-all ${
            subTab === "requests"
              ? "border-b-2 border-indigo-500 text-white font-semibold"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          Requests ({mockRequests.length})
        </button>
        <button
          onClick={() => onSelectSubTab("invitations")}
          className={`pb-2 px-3 transition-all ${
            subTab === "invitations"
              ? "border-b-2 border-indigo-500 text-white font-semibold"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          Invitations ({mockInvitations.length})
        </button>
      </div>

      {/* Friends List */}
      {subTab === "friends" && (
        <div className="space-y-3">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-mono font-bold text-xs">
                      {friend.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-xs text-stone-100">{friend.name}</h3>
                      <span className="text-[10px] font-mono text-stone-400 block">{friend.username}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded-full border ${
                      friend.status === "online"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : friend.status === "away"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-stone-500/10 text-stone-400 border-stone-500/20"
                    }`}
                  >
                    ● {friend.status.toUpperCase()}
                  </span>
                </div>

                {friend.focusingForMinutes && (
                  <p className="text-[10px] font-mono text-indigo-400">
                    Focusing for {friend.focusingForMinutes}m
                  </p>
                )}

                <div className="flex space-x-2 pt-1">
                  <button className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[11px] font-semibold text-center">
                    Focus together
                  </button>
                  <button className="flex-1 py-1.5 rounded-xl bg-[#1A1A22] border border-[#2A2A36] text-stone-300 font-mono text-[11px] text-center">
                    Invite to room
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-8 text-center text-stone-400 font-mono text-xs">
              No connections matching "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Requests List */}
      {subTab === "requests" && (
        <div className="space-y-3">
          {mockRequests.map((req) => (
            <div
              key={req.id}
              className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-pink-600 to-rose-600 flex items-center justify-center font-mono font-bold text-xs">
                    {req.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-stone-100">{req.name}</h3>
                    <span className="text-[10px] font-mono text-stone-400 block">{req.username} • {req.mutualCount} mutual connections</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-stone-500">{req.createdAt}</span>
              </div>

              <div className="flex space-x-2 pt-1">
                <button className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[11px] font-semibold text-center">
                  Accept
                </button>
                <button className="flex-1 py-1.5 rounded-xl bg-[#1A1A22] border border-[#2A2A36] text-stone-400 font-mono text-[11px] text-center hover:text-white">
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invitations List */}
      {subTab === "invitations" && (
        <div className="space-y-3">
          {mockInvitations.map((inv) => (
            <div
              key={inv.id}
              className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-xs text-white">{inv.roomName}</h3>
                  <span className="text-[10px] font-mono text-stone-400 block">Invited by {inv.invitedBy}</span>
                </div>
                <span className="text-[10px] font-mono text-stone-500">{inv.createdAt}</span>
              </div>

              <div className="flex space-x-2 pt-1">
                <button className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[11px] font-semibold text-center">
                  Join Room
                </button>
                <button className="flex-1 py-1.5 rounded-xl bg-[#1A1A22] border border-[#2A2A36] text-stone-400 font-mono text-[11px] text-center hover:text-white">
                  Ignore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
