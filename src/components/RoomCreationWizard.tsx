import React, { useState, useEffect } from "react";
import { 
  X, Check, ChevronRight, ChevronLeft, Shield, Users, Target, Cpu, Lock, 
  Sparkles, Clock, Calendar, AlertCircle, Info, UserPlus, Globe, HelpCircle, Eye
} from "lucide-react";

interface ConnectionItem {
  connectionId: string;
  profile: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
    headline?: string;
  };
}

interface RoomCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (room: any) => void;
}

export const RoomCreationWizard: React.FC<RoomCreationWizardProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // My Connections state
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);

  // Step 1: Basics
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconEmoji, setIconEmoji] = useState("🚀");
  const [category, setCategory] = useState("Development");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [deadline, setDeadline] = useState("");

  // Step 2: Access & Invitations
  const [accessMode, setAccessMode] = useState<"OPEN" | "APPROVAL_REQUIRED" | "INVITE_ONLY">("APPROVAL_REQUIRED");
  const [allowAdminInvites, setAllowAdminInvites] = useState(true);
  const [linkExpiryDays, setLinkExpiryDays] = useState(7);
  const [maxMemberCount, setMaxMemberCount] = useState(50);
  const [requireVerifiedAccount, setRequireVerifiedAccount] = useState(false);
  const [defaultMemberRole, setDefaultMemberRole] = useState<"MEMBER" | "OBSERVER">("MEMBER");

  // Step 3: Members & Roles
  const [selectedMembers, setSelectedMembers] = useState<Array<{ userId: string; name: string; avatarUrl?: string; role: string }>>([]);

  // Step 4: Expectations
  const [expectationTab, setExpectationTab] = useState<"individual" | "team">("individual");
  const [memberTargets, setMemberTargets] = useState<Record<string, { focusMinutes: number; taskTarget: number; workingDays: string }>>({});
  const [ownerFocusMinutes, setOwnerFocusMinutes] = useState(360); // 6 hours
  const [ownerTaskTarget, setOwnerTaskTarget] = useState(5);
  const [teamFocusHours, setTeamFocusHours] = useState(40);
  const [teamTaskPoints, setTeamTaskPoints] = useState(50);

  // Step 5: AI Policy & Privacy
  const [memberSelfNudge, setMemberSelfNudge] = useState(true);
  const [ownerEscalation, setOwnerEscalation] = useState(true);
  const [warningThreshold, setWarningThreshold] = useState(45);
  const [gracePeriod, setGracePeriod] = useState(120);
  const [trackAppName, setTrackAppName] = useState(true);
  const [hideWindowTitle, setHideWindowTitle] = useState(true);
  const [hideWebsiteUrl, setHideWebsiteUrl] = useState(true);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const emojiList = ["🚀", "💻", "🎨", "🔬", "📚", "⚡", "🛡️", "💡", "🎯", "🔥", "🔮", "🧠"];
  const categoryList = ["Development", "Design", "Research", "Study", "Custom"];

  useEffect(() => {
    if (isOpen) {
      fetchConnections();
    }
  }, [isOpen]);

  const fetchConnections = async () => {
    setLoadingConnections(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/connections", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        setConnections(data.connections || []);
      }
    } catch (err) {
      console.error("Failed to load connections:", err);
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleToggleMember = (conn: ConnectionItem) => {
    const exists = selectedMembers.some(m => m.userId === conn.profile.id);
    if (exists) {
      setSelectedMembers(selectedMembers.filter(m => m.userId !== conn.profile.id));
    } else {
      setSelectedMembers([...selectedMembers, {
        userId: conn.profile.id,
        name: conn.profile.name,
        avatarUrl: conn.profile.avatarUrl,
        role: defaultMemberRole
      }]);
      // Set default target
      setMemberTargets(prev => ({
        ...prev,
        [conn.profile.id]: { focusMinutes: 360, taskTarget: 5, workingDays: "Mon,Tue,Wed,Thu,Fri" }
      }));
    }
  };

  const handleMemberRoleChange = (userId: string, role: string) => {
    setSelectedMembers(selectedMembers.map(m => m.userId === userId ? { ...m, role } : m));
  };

  const handleSubmit = async () => {
    if (!consentAccepted) {
      setError("Please review and accept the room tracking consent policy to complete creation.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const idempotencyKey = `create-room-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const payload = {
        name,
        description,
        iconEmoji,
        category,
        timezone,
        deadline: deadline || null,
        idempotencyKey,
        accessMode,
        allowAdminInvites,
        linkExpiryDays,
        maxMemberCount,
        requireVerifiedAccount,
        defaultMemberRole,
        invitedMembers: selectedMembers.map(m => ({
          userId: m.userId,
          role: m.role as any
        })),
        memberWorkTargets: selectedMembers.map(m => ({
          userId: m.userId,
          focusMinutes: memberTargets[m.userId]?.focusMinutes || 360,
          taskTarget: memberTargets[m.userId]?.taskTarget || 5
        })),
        teamTarget: {
          focusMinutes: teamFocusHours * 60,
          taskPoints: teamTaskPoints,
          deadline: deadline || null
        },
        aiPolicy: {
          version: 1,
          memberSelfNudgeEnabled: memberSelfNudge,
          ownerEscalationEnabled: ownerEscalation,
          warningThresholdMins: warningThreshold,
          gracePeriodMins: gracePeriod
        },
        privacyPolicy: {
          version: 1,
          trackAppName,
          hideWindowTitle,
          hideWebsiteUrl,
          allowManualPause: true
        }
      };

      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        throw new Error(`Server returned invalid response (${res.status}: ${res.statusText})`);
      }

      if (!res.ok) {
        throw new Error(data.error || `Failed to create room (${res.status})`);
      }

      onSuccess(data.room);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto font-sans">
      <div className="relative w-full max-w-4xl bg-white border border-[#e4e4e7] rounded-2xl shadow-2xl text-[#09090b] overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e4e4e7] bg-[#fafafa]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-[#e4e4e7] flex items-center justify-center text-xl shadow-xs">
              {iconEmoji}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#09090b] flex items-center gap-2 tracking-tight">
                Create Intelligence Room
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-100 text-[#09090b] border border-[#e4e4e7] font-mono font-semibold">
                  Step {step} of 5
                </span>
              </h2>
              <p className="text-xs text-[#71717a]">Configure team targets, privacy policies, and AI nudge settings</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[#71717a] hover:text-[#09090b] rounded-lg hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-5 bg-zinc-50 border-b border-[#e4e4e7]">
          {[
            { num: 1, label: "Basics" },
            { num: 2, label: "Access & Invites" },
            { num: 3, label: "Members & Roles" },
            { num: 4, label: "Work Expectations" },
            { num: 5, label: "AI & Privacy Policy" }
          ].map(s => (
            <div 
              key={s.num} 
              className={`py-2.5 px-3 text-center border-b-2 text-xs font-semibold transition ${
                step === s.num 
                  ? "border-[#09090b] text-[#09090b] bg-white shadow-xs" 
                  : step > s.num 
                  ? "border-emerald-600 text-emerald-700 bg-emerald-50/40" 
                  : "border-transparent text-[#71717a]"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  step > s.num ? "bg-emerald-600 text-white" : step === s.num ? "bg-[#09090b] text-white" : "bg-zinc-200 text-[#71717a]"
                }`}>
                  {step > s.num ? "✓" : s.num}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">

          {/* STEP 1: Room Basics */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#09090b] uppercase tracking-wider mb-2">
                  Icon & Emoji
                </label>
                <div className="flex flex-wrap gap-2">
                  {emojiList.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIconEmoji(emoji)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition cursor-pointer ${
                        iconEmoji === emoji 
                          ? "bg-[#09090b] text-white border-[#09090b] shadow-xs scale-105" 
                          : "bg-white border-[#e4e4e7] hover:bg-zinc-100 text-[#09090b]"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#09090b] uppercase tracking-wider mb-1">
                  Room Name *
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. EndoCore Backend Guild"
                  className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-[#09090b] focus:outline-none focus:border-[#09090b] text-xs font-sans shadow-xs placeholder-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#09090b] uppercase tracking-wider mb-1">
                  Description & Purpose
                </label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe the main objectives, goals, and focus expectations of this room..."
                  className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-[#09090b] focus:outline-none focus:border-[#09090b] text-xs font-sans shadow-xs resize-none placeholder-zinc-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#09090b] uppercase tracking-wider mb-1">
                    Room Category
                  </label>
                  <select 
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-[#09090b] focus:outline-none focus:border-[#09090b] text-xs font-sans shadow-xs cursor-pointer"
                  >
                    {categoryList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#09090b] uppercase tracking-wider mb-1">
                    Time Zone
                  </label>
                  <input 
                    type="text" 
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-[#09090b] focus:outline-none focus:border-[#09090b] text-xs font-mono shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#09090b] uppercase tracking-wider mb-1">
                  Optional Project Deadline
                </label>
                <input 
                  type="date" 
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-[#09090b] focus:outline-none focus:border-[#09090b] text-xs font-sans shadow-xs"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-100 border border-[#e4e4e7] text-xs text-[#09090b] flex items-start gap-2.5">
                <Shield className="w-4 h-4 shrink-0 text-[#09090b] mt-0.5" />
                <div>
                  <span className="font-bold">Automatic Role Assignment:</span> As room creator, you will automatically be assigned the <span className="underline font-bold">Owner</span> role with full administrative control.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Access & Invitations */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#09090b] uppercase tracking-wider mb-3">
                  Select Room Access Mode
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      id: "APPROVAL_REQUIRED",
                      name: "Approval Required",
                      badge: "Recommended Default",
                      desc: "Users request access; Room Owner or Admin approves them. Best balance of security & speed."
                    },
                    {
                      id: "OPEN",
                      name: "Open Room",
                      badge: "Public Access",
                      desc: "Anyone with the link or browsing rooms can join immediately without manual approval."
                    },
                    {
                      id: "INVITE_ONLY",
                      name: "Invite Only",
                      badge: "Strict Private",
                      desc: "Only users explicitly invited from My Connections, email, or private hash links can join."
                    }
                  ].map(mode => (
                    <div 
                      key={mode.id}
                      onClick={() => setAccessMode(mode.id as any)}
                      className={`p-4 rounded-xl border cursor-pointer transition relative ${
                        accessMode === mode.id 
                          ? "bg-zinc-100 border-[#09090b] shadow-xs" 
                          : "bg-white border-[#e4e4e7] hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-[#09090b]">{mode.name}</span>
                        {mode.badge === "Recommended Default" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#71717a] leading-relaxed font-sans">{mode.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#e4e4e7]">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#e4e4e7]">
                  <div>
                    <div className="text-xs font-bold text-[#09090b]">Allow Admins to Invite</div>
                    <div className="text-[11px] text-[#71717a]">Admins can send invite links to new members</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={allowAdminInvites} 
                    onChange={e => setAllowAdminInvites(e.target.checked)}
                    className="w-4 h-4 accent-[#09090b] cursor-pointer" 
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#e4e4e7]">
                  <div>
                    <div className="text-xs font-bold text-[#09090b]">Require Verified Account</div>
                    <div className="text-[11px] text-[#71717a]">Members must have verified email profile</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={requireVerifiedAccount} 
                    onChange={e => setRequireVerifiedAccount(e.target.checked)}
                    className="w-4 h-4 accent-[#09090b] cursor-pointer" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#09090b] uppercase tracking-wider mb-1">
                    Link Expiry Duration
                  </label>
                  <select 
                    value={linkExpiryDays}
                    onChange={e => setLinkExpiryDays(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-[#09090b] text-xs font-sans cursor-pointer shadow-xs"
                  >
                    <option value={1}>1 Day</option>
                    <option value={7}>7 Days (Default)</option>
                    <option value={30}>30 Days</option>
                    <option value={365}>1 Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#09090b] uppercase tracking-wider mb-1">
                    Max Member Capacity
                  </label>
                  <input 
                    type="number" 
                    value={maxMemberCount}
                    onChange={e => setMaxMemberCount(Number(e.target.value))}
                    min={2}
                    max={500}
                    className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-[#09090b] text-xs font-mono shadow-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Members & Roles */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#09090b]">Add Members from My Connections</h3>
                  <p className="text-xs text-[#71717a]">Select network connections to invite directly with predefined roles</p>
                </div>
                <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-zinc-100 text-[#09090b] border border-[#e4e4e7]">
                  {selectedMembers.length} Invited
                </span>
              </div>

              {loadingConnections ? (
                <div className="py-8 text-center text-xs text-[#71717a] font-mono">Loading your connections...</div>
              ) : connections.length === 0 ? (
                <div className="p-6 rounded-xl bg-zinc-50 border border-[#e4e4e7] text-center">
                  <UserPlus className="w-8 h-8 mx-auto text-[#71717a] mb-2" />
                  <p className="text-xs text-[#71717a] font-mono">No active connections found in My Connections.</p>
                  <p className="text-[11px] text-[#71717a] mt-1">You can still create the room and invite members later via room links.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {connections.map(conn => {
                    const isSelected = selectedMembers.some(m => m.userId === conn.profile.id);
                    const currentMemberObj = selectedMembers.find(m => m.userId === conn.profile.id);

                    return (
                      <div 
                        key={conn.connectionId}
                        className={`p-3 rounded-xl border flex items-center justify-between transition ${
                          isSelected ? "bg-zinc-100 border-[#09090b]" : "bg-white border-[#e4e4e7] hover:bg-zinc-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => handleToggleMember(conn)}
                            className="w-4 h-4 accent-[#09090b] cursor-pointer"
                          />
                          <img 
                            src={conn.profile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                            alt={conn.profile.name}
                            className="w-9 h-9 rounded-full object-cover border border-[#e4e4e7]"
                          />
                          <div>
                            <div className="text-xs font-bold text-[#09090b]">{conn.profile.name}</div>
                            <div className="text-[10px] text-[#71717a] font-mono">@{conn.profile.username} • {conn.profile.headline}</div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#71717a] font-mono">Role:</span>
                            <select
                              value={currentMemberObj?.role || "MEMBER"}
                              onChange={e => handleMemberRoleChange(conn.profile.id, e.target.value)}
                              className="px-2.5 py-1 bg-white border border-[#e4e4e7] rounded-lg text-xs text-[#09090b] font-bold cursor-pointer"
                            >
                              <option value="ADMIN">Admin</option>
                              <option value="MANAGER">Manager</option>
                              <option value="MEMBER">Member</option>
                              <option value="OBSERVER">Observer</option>
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Role Permissions Reference Table */}
              <div className="p-3.5 rounded-xl bg-zinc-100 border border-[#e4e4e7] text-xs space-y-2">
                <div className="font-bold text-[#09090b] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#09090b]" />
                  Role Hierarchy & Permissions Reference:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#71717a] font-mono">
                  <div><span className="text-amber-700 font-bold">Owner:</span> Full control & delete</div>
                  <div><span className="text-blue-700 font-bold">Admin:</span> Manage members & goals</div>
                  <div><span className="text-emerald-700 font-bold">Manager:</span> View reports & tasks</div>
                  <div><span className="text-[#09090b] font-bold">Observer:</span> Read-only telemetry</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Work Expectations */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex border-b border-[#e4e4e7]">
                <button
                  type="button"
                  onClick={() => setExpectationTab("individual")}
                  className={`py-2 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
                    expectationTab === "individual" 
                      ? "border-[#09090b] text-[#09090b] bg-zinc-100" 
                      : "border-transparent text-[#71717a] hover:text-[#09090b]"
                  }`}
                >
                  Individual Targets Per Member
                </button>
                <button
                  type="button"
                  onClick={() => setExpectationTab("team")}
                  className={`py-2 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
                    expectationTab === "team" 
                      ? "border-[#09090b] text-[#09090b] bg-zinc-100" 
                      : "border-transparent text-[#71717a] hover:text-[#09090b]"
                  }`}
                >
                  Team Level Targets & Milestones
                </button>
              </div>

              {expectationTab === "individual" ? (
                <div className="space-y-4">
                  <p className="text-xs text-[#71717a]">
                    Set customized targets for each member. Target records are stored separately for every member!
                  </p>

                  {/* Owner Target Card */}
                  <div className="p-4 rounded-xl bg-white border border-[#e4e4e7] space-y-3 studio-card">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-[#09090b]">You (Room Owner)</div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-semibold">Owner Target</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#71717a] mb-1">Required Daily Focus Hours</label>
                        <input 
                          type="number" 
                          value={ownerFocusMinutes / 60} 
                          onChange={e => setOwnerFocusMinutes(Number(e.target.value) * 60)}
                          step={0.5} min={1} max={16}
                          className="w-full px-3 py-1.5 bg-white border border-[#e4e4e7] rounded-lg text-xs text-[#09090b] font-mono shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#71717a] mb-1">Daily Task Target</label>
                        <input 
                          type="number" 
                          value={ownerTaskTarget} 
                          onChange={e => setOwnerTaskTarget(Number(e.target.value))}
                          min={1} max={50}
                          className="w-full px-3 py-1.5 bg-white border border-[#e4e4e7] rounded-lg text-xs text-[#09090b] font-mono shadow-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Invited Members Target Cards */}
                  {selectedMembers.map(m => (
                    <div key={m.userId} className="p-4 rounded-xl bg-white border border-[#e4e4e7] space-y-3 studio-card">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-[#09090b]">{m.name}</div>
                        <span className="text-xs text-[#09090b] font-mono font-semibold">{m.role}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#71717a] mb-1">Daily Focus Target (Hours)</label>
                          <input 
                            type="number" 
                            value={(memberTargets[m.userId]?.focusMinutes || 360) / 60} 
                            onChange={e => {
                              const mins = Number(e.target.value) * 60;
                              setMemberTargets({
                                ...memberTargets,
                                [m.userId]: { ...memberTargets[m.userId], focusMinutes: mins, taskTarget: memberTargets[m.userId]?.taskTarget || 5, workingDays: "Mon,Tue,Wed,Thu,Fri" }
                              });
                            }}
                            step={0.5} min={1} max={16}
                            className="w-full px-3 py-1.5 bg-white border border-[#e4e4e7] rounded-lg text-xs text-[#09090b] font-mono shadow-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#71717a] mb-1">Daily Task Target</label>
                          <input 
                            type="number" 
                            value={memberTargets[m.userId]?.taskTarget || 5} 
                            onChange={e => {
                              const tasks = Number(e.target.value);
                              setMemberTargets({
                                ...memberTargets,
                                [m.userId]: { ...memberTargets[m.userId], focusMinutes: memberTargets[m.userId]?.focusMinutes || 360, taskTarget: tasks, workingDays: "Mon,Tue,Wed,Thu,Fri" }
                              });
                            }}
                            min={1} max={50}
                            className="w-full px-3 py-1.5 bg-white border border-[#e4e4e7] rounded-lg text-xs text-[#09090b] font-mono shadow-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#09090b] uppercase tracking-wider mb-1">
                        Total Team Weekly Focus Target (Hours)
                      </label>
                      <input 
                        type="number" 
                        value={teamFocusHours}
                        onChange={e => setTeamFocusHours(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-[#09090b] text-xs font-mono shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#09090b] uppercase tracking-wider mb-1">
                        Planned Story Points / Task Target
                      </label>
                      <input 
                        type="number" 
                        value={teamTaskPoints}
                        onChange={e => setTeamTaskPoints(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-[#09090b] text-xs font-mono shadow-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: AI Policy & Privacy */}
          {step === 5 && (
            <div className="space-y-5">
              {/* AI Config */}
              <div className="p-4 rounded-xl bg-white border border-[#e4e4e7] space-y-3 studio-card">
                <h3 className="text-xs font-bold text-[#09090b] uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#09090b]" />
                  AI Agent Nudge & Escalation Settings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 text-[#09090b] cursor-pointer font-semibold">
                    <input 
                      type="checkbox" 
                      checked={memberSelfNudge} 
                      onChange={e => setMemberSelfNudge(e.target.checked)}
                      className="accent-[#09090b]" 
                    />
                    Enable Level 1 Member Self-Nudge
                  </label>
                  <label className="flex items-center gap-2 text-[#09090b] cursor-pointer font-semibold">
                    <input 
                      type="checkbox" 
                      checked={ownerEscalation} 
                      onChange={e => setOwnerEscalation(e.target.checked)}
                      className="accent-[#09090b]" 
                    />
                    Enable Level 2 Owner Escalation
                  </label>
                </div>
              </div>

              {/* Privacy Config */}
              <div className="p-4 rounded-xl bg-white border border-[#e4e4e7] space-y-3 studio-card">
                <h3 className="text-xs font-bold text-[#09090b] uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#09090b]" />
                  Privacy & Telemetry Controls
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 text-[#09090b] cursor-pointer font-semibold">
                    <input 
                      type="checkbox" 
                      checked={trackAppName} 
                      onChange={e => setTrackAppName(e.target.checked)}
                      className="accent-[#09090b]" 
                    />
                    Track Application Name
                  </label>
                  <label className="flex items-center gap-2 text-[#09090b] cursor-pointer font-semibold">
                    <input 
                      type="checkbox" 
                      checked={hideWindowTitle} 
                      onChange={e => setHideWindowTitle(e.target.checked)}
                      className="accent-[#09090b]" 
                    />
                    Hide Document & Window Titles
                  </label>
                  <label className="flex items-center gap-2 text-[#09090b] cursor-pointer font-semibold">
                    <input 
                      type="checkbox" 
                      checked={hideWebsiteUrl} 
                      onChange={e => setHideWebsiteUrl(e.target.checked)}
                      className="accent-[#09090b]" 
                    />
                    Hide Website URLs
                  </label>
                </div>
              </div>

              {/* Consent Policy Acceptance Checkbox */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-3">
                <div className="font-bold text-emerald-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  Required Member Tracking Consent Policy
                </div>
                <p className="text-emerald-900 leading-relaxed text-[11px]">
                  By creating this room, you agree that activity telemetry (focus duration, app categories) will be collected according to the configured privacy settings (Version 1.0). Every invited member will review and accept this consent policy before room tracking begins.
                </p>
                <label className="flex items-center gap-2 text-emerald-950 font-bold cursor-pointer pt-1">
                  <input 
                    type="checkbox" 
                    checked={consentAccepted}
                    onChange={e => setConsentAccepted(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                  I review, accept, and enforce the Room Tracking & Privacy Policy
                </label>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#e4e4e7] bg-[#fafafa]">
          <button
            type="button"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1 || loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#09090b] bg-white border border-[#e4e4e7] hover:bg-zinc-100 disabled:opacity-40 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !name.trim()) {
                  setError("Please enter a room name.");
                  return;
                }
                setError(null);
                setStep(step + 1);
              }}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#09090b] hover:bg-[#27272a] text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !consentAccepted}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#09090b] hover:bg-[#27272a] text-white shadow-xs disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <>Creating Room...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Launch Room System
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
