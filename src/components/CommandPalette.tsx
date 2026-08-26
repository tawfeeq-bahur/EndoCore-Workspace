import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Compass, Users, Activity, Settings, User } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onJoinRoom: (roomName: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate, onJoinRoom }) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const defaultActions = [
    { id: "tab-dashboard", title: "Go to Dashboard", icon: <Compass className="w-4 h-4 text-emerald-500" />, action: () => onNavigate("dashboard") },
    { id: "tab-analytics", title: "Go to Analytics", icon: <Activity className="w-4 h-4 text-blue-500" />, action: () => onNavigate("analytics") },
    { id: "tab-rooms", title: "Browse Rooms", icon: <Users className="w-4 h-4 text-indigo-500" />, action: () => onNavigate("rooms") },
    { id: "room-engineering", title: "Join #Engineering Team", icon: <Users className="w-4 h-4 text-amber-500" />, action: () => onJoinRoom("Engineering Team") },
    { id: "room-design", title: "Join #Design Guild", icon: <Users className="w-4 h-4 text-rose-500" />, action: () => onJoinRoom("Design Guild") },
  ];

  const filtered = query 
    ? defaultActions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()))
    : defaultActions;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 font-sans sm:px-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative z-10"
          >
            <div className="flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800">
              <Search className="w-5 h-5 text-zinc-400 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Type a command or search..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full px-4 py-4 bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
              />
              <span className="text-[10px] font-mono text-zinc-400 border border-zinc-300 dark:border-zinc-700 px-1.5 py-0.5 rounded">ESC</span>
            </div>
            
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filtered.length > 0 ? (
                filtered.map((action, idx) => (
                  <button
                    key={action.id}
                    onClick={() => { action.action(); onClose(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-left group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {action.icon}
                    </div>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{action.title}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-zinc-500 font-mono">
                  No commands found matching "{query}"
                </div>
              )}
            </div>
            
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-2">
                Use <span className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">↑</span> <span className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">↓</span> to navigate
              </span>
              <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-2">
                <span className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center gap-1">↵ Enter</span> to select
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
