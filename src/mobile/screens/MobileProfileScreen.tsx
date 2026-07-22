import React, { useState } from "react";

interface MobileProfileScreenProps {
  userName?: string;
  userEmail?: string;
  onSignOut?: () => void;
}

export const MobileProfileScreen: React.FC<MobileProfileScreenProps> = ({
  userName = "Tawfeeq Bahur",
  userEmail = "tawfeeq@example.com",
  onSignOut,
}) => {
  const [anonymizeTitles, setAnonymizeTitles] = useState(true);
  const [hideUrls, setHideUrls] = useState(true);
  const [scheduledOnly, setScheduledOnly] = useState(true);

  return (
    <div className="p-4 space-y-4 pb-20 text-white font-sans">
      <h1 className="text-xl font-bold font-serif italic text-white">Profile</h1>

      {/* User Card */}
      <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-5 flex items-center space-x-4">
        <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-mono text-lg font-bold text-white shadow-md border border-indigo-400/30 shrink-0">
          TB
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white truncate">{userName}</h2>
          <span className="text-xs text-stone-400 font-mono block">Lead Software Developer</span>
          <span className="text-[10px] text-stone-500 font-mono block truncate">{userEmail}</span>
        </div>
      </div>

      {/* Connected Workstation */}
      <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-3">
        <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">
          Connected Workstation
        </span>
        <div className="flex items-center justify-between text-xs font-mono">
          <div>
            <span className="font-semibold text-stone-200 block">WS-WORKSTATION-11</span>
            <span className="text-[10px] text-emerald-400">Windows 11 • Connected</span>
          </div>
          <div className="flex space-x-2">
            <button className="px-2.5 py-1 rounded-lg bg-[#1A1A22] border border-[#2A2A36] text-stone-300 text-[10px]">
              Rename
            </button>
            <button className="px-2.5 py-1 rounded-lg bg-red-950/30 border border-red-900/40 text-red-400 text-[10px]">
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Controls */}
      <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-3">
        <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block border-b border-[#1E1E2A] pb-2">
          Privacy Controls
        </span>

        {/* Anonymize Titles */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-stone-300">Anonymize window titles</span>
          <button
            onClick={() => setAnonymizeTitles(!anonymizeTitles)}
            className={`w-11 h-6 rounded-full p-1 transition-colors ${
              anonymizeTitles ? "bg-emerald-500" : "bg-[#2A2A36]"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                anonymizeTitles ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Hide URLs */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-stone-300">Hide website URLs</span>
          <button
            onClick={() => setHideUrls(!hideUrls)}
            className={`w-11 h-6 rounded-full p-1 transition-colors ${
              hideUrls ? "bg-emerald-500" : "bg-[#2A2A36]"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                hideUrls ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Scheduled Only */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-stone-300">Track only during scheduled hours</span>
          <button
            onClick={() => setScheduledOnly(!scheduledOnly)}
            className={`w-11 h-6 rounded-full p-1 transition-colors ${
              scheduledOnly ? "bg-emerald-500" : "bg-[#2A2A36]"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                scheduledOnly ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Focus Preferences */}
      <div className="bg-[#121216] border border-[#1E1E26] rounded-2xl p-4 space-y-3 text-xs font-mono">
        <span className="text-[10px] text-stone-400 uppercase tracking-widest block border-b border-[#1E1E2A] pb-2">
          Focus Preferences
        </span>
        <div className="flex justify-between py-1 text-stone-300">
          <span>Daily focus goal</span>
          <span className="text-white font-semibold">6 hours</span>
        </div>
        <div className="flex justify-between py-1 text-stone-300">
          <span>Focus reminder</span>
          <span className="text-white font-semibold">Every 60 min</span>
        </div>
        <div className="flex justify-between py-1 text-stone-300">
          <span>Quiet hours</span>
          <span className="text-white font-semibold">10:00 PM - 6:00 AM</span>
        </div>
      </div>

      {/* Account Actions */}
      <div className="pt-2 space-y-2">
        <button className="w-full py-3 bg-[#141418] border border-[#22222A] hover:bg-[#1A1A22] text-stone-300 text-xs font-mono rounded-xl text-center">
          Export my data
        </button>
        <button
          onClick={onSignOut}
          className="w-full py-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-mono rounded-xl text-center hover:bg-red-950/40"
        >
          Sign out of EndoCore
        </button>
      </div>
    </div>
  );
};
