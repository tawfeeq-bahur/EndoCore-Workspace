import React, { useState, useEffect } from "react";
import { 
  X, Check, ChevronRight, ChevronLeft, Shield, Users, Target, Cpu, Lock, 
  Sparkles, Clock, Calendar, AlertCircle, Info, UserPlus, Globe, Upload, Image as ImageIcon,
  Crown, Bookmark, Save, ArrowRight, Layers, FileText, UserCheck, Eye, HelpCircle, Code, Briefcase
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

  // STEP 1: Room Identity State
  const [name, setName] = useState("Engineering Team");
  const [description, setDescription] = useState("Development operations, API integrations, and infrastructure.");
  const [imageMode, setImageMode] = useState<"upload" | "icon">("upload");
  const [roomType, setRoomType] = useState("Team");
  const [category, setCategory] = useState("Engineering");
  const [timezone, setTimezone] = useState("Asia/Kolkata (IST)");
  const [lifecycle, setLifecycle] = useState("Ongoing");
  const [deadline, setDeadline] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // STEP 2: Access & Invites State
  const [accessMode, setAccessMode] = useState<"OPEN" | "APPROVAL_REQUIRED" | "INVITE_ONLY">("APPROVAL_REQUIRED");
  const [allowAdminInvites, setAllowAdminInvites] = useState(true);
  const [linkExpiryDays, setLinkExpiryDays] = useState(7);
  const [maxMemberCount, setMaxMemberCount] = useState(50);
  const [requireVerifiedAccount, setRequireVerifiedAccount] = useState(false);
  const [defaultMemberRole, setDefaultMemberRole] = useState<"MEMBER" | "OBSERVER">("MEMBER");

  // STEP 3: Members & Roles State
  const [selectedMembers, setSelectedMembers] = useState<Array<{ userId: string; name: string; avatarUrl?: string; role: string }>>([]);

  // STEP 4: Work Policy State
  const [expectationTab, setExpectationTab] = useState<"individual" | "team">("individual");
  const [memberTargets, setMemberTargets] = useState<Record<string, { focusMinutes: number; taskTarget: number; workingDays: string }>>({});
  const [ownerFocusMinutes, setOwnerFocusMinutes] = useState(360);
  const [ownerTaskTarget, setOwnerTaskTarget] = useState(5);
  const [teamFocusHours, setTeamFocusHours] = useState(40);
  const [teamTaskPoints, setTeamTaskPoints] = useState(50);

  // STEP 5 & 6: AI & Automation State
  const [memberSelfNudge, setMemberSelfNudge] = useState(true);
  const [ownerEscalation, setOwnerEscalation] = useState(true);
  const [warningThreshold, setWarningThreshold] = useState(45);
  const [gracePeriod, setGracePeriod] = useState(120);

  // STEP 6 & 7: Privacy & Review State
  const [trackAppName, setTrackAppName] = useState(true);
  const [hideWindowTitle, setHideWindowTitle] = useState(true);
  const [hideWebsiteUrl, setHideWebsiteUrl] = useState(true);
  const [consentAccepted, setConsentAccepted] = useState(false);

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
      setMemberTargets(prev => ({
        ...prev,
        [conn.profile.id]: { focusMinutes: 360, taskTarget: 5, workingDays: "Mon,Tue,Wed,Thu,Fri" }
      }));
    }
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
        iconEmoji: "🚀",
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

  // Generate Initials Badge (e.g. "Engineering Team" -> "ET")
  const getInitials = (str: string) => {
    if (!str) return "ET";
    const parts = str.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return str.slice(0, 2).toUpperCase();
  };

  const stepsList = [
    { num: 1, name: "Identity", desc: "Basic details" },
    { num: 2, name: "Access", desc: "Security & join" },
    { num: 3, name: "Members", desc: "Add & assign roles" },
    { num: 4, name: "Work Policy", desc: "Goals & targets" },
    { num: 5, name: "AI & Automation", desc: "Assistant settings" },
    { num: 6, name: "Privacy", desc: "Data & telemetry" },
    { num: 7, name: "Review", desc: "Confirm & launch" }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#fafafa] overflow-y-auto font-sans text-[#09090b]">
      
      {/* Container Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* 1. PAGE HEADER ROW */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#09090b]">
              Create a New Room
            </h1>
            <p className="text-xs text-[#71717a] font-medium">
              Set up your workspace with the right people, policies and goals.
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#e4e4e7] hover:bg-zinc-100 text-xs font-bold text-[#09090b] flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4 text-[#71717a]" />
            <span>Cancel Creation</span>
          </button>
        </div>

        {/* 2. 7-STEP PROGRESS STEPPER BAR */}
        <div className="bg-white border border-[#e4e4e7] rounded-2xl p-4 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {stepsList.map((s, idx) => {
              const isActive = step === s.num;
              const isCompleted = step > s.num;

              return (
                <div key={s.num} className="relative flex flex-col items-center text-center">
                  
                  {/* Step Circle & Connecting Line */}
                  <div className="flex items-center w-full justify-center relative mb-2">
                    {idx > 0 && (
                      <div className={`absolute left-0 right-1/2 top-1/2 -translate-y-1/2 h-0.5 ${
                        isCompleted || isActive ? "bg-purple-600" : "bg-zinc-200"
                      }`} />
                    )}
                    {idx < stepsList.length - 1 && (
                      <div className={`absolute left-1/2 right-0 top-1/2 -translate-y-1/2 h-0.5 ${
                        isCompleted ? "bg-purple-600" : "bg-zinc-200"
                      }`} />
                    )}

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition z-10 ${
                      isActive 
                        ? "bg-purple-600 text-white ring-4 ring-purple-100 shadow-xs" 
                        : isCompleted 
                        ? "bg-purple-600 text-white" 
                        : "bg-zinc-100 text-[#71717a] border border-[#e4e4e7]"
                    }`}>
                      {isCompleted ? "✓" : s.num}
                    </div>
                  </div>

                  {/* Step Title & Subtitle */}
                  <div className="space-y-0.5">
                    <div className={`text-xs font-bold ${isActive ? "text-[#09090b]" : "text-[#71717a]"}`}>
                      {s.name}
                    </div>
                    <div className="text-[10px] text-[#a1a1aa] font-medium hidden lg:block">
                      {s.desc}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* ERROR ALERT IF ANY */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* 3. MAIN WORKSPACE GRID: STEP CONTENT (LEFT/CENTER) + SUMMARY SIDEBAR (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT/CENTER STEP CONTENT PANEL */}
          <div className="lg:col-span-8 space-y-6">

            {/* STEP 1: ROOM IDENTITY */}
            {step === 1 && (
              <div className="bg-white border border-[#e4e4e7] rounded-2xl p-6 space-y-6 shadow-xs">
                
                {/* Step Sub-Header */}
                <div className="space-y-1 pb-4 border-b border-[#e4e4e7]">
                  <div className="text-xs font-mono font-bold text-purple-600 uppercase tracking-wider">
                    Step 1 of 7
                  </div>
                  <h2 className="text-xl font-bold text-[#09090b] tracking-tight">
                    Room Identity
                  </h2>
                  <p className="text-xs text-[#71717a]">
                    Give your room a clear identity and purpose.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column: Image Upload & Live Preview */}
                  <div className="md:col-span-5 space-y-5">
                    
                    {/* Room Image Selector Box */}
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-[#09090b]">
                        Room Image
                      </label>
                      <p className="text-[11px] text-[#71717a]">
                        Choose how your room will appear across EndoCore.
                      </p>

                      {/* Mode Switcher Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setImageMode("upload")}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            imageMode === "upload" 
                              ? "border-purple-600 bg-purple-50 text-purple-700 shadow-xs" 
                              : "border-[#e4e4e7] bg-white text-[#71717a] hover:text-[#09090b]"
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Image</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageMode("icon")}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            imageMode === "icon" 
                              ? "border-purple-600 bg-purple-50 text-purple-700 shadow-xs" 
                              : "border-[#e4e4e7] bg-white text-[#71717a] hover:text-[#09090b]"
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Choose Icon</span>
                        </button>
                      </div>

                      {/* Drag & Drop Zone */}
                      <div className="border-2 border-dashed border-[#e4e4e7] hover:border-purple-300 rounded-2xl p-6 text-center space-y-3 bg-zinc-50/50 transition">
                        <div className="w-12 h-12 rounded-full bg-white border border-[#e4e4e7] flex items-center justify-center mx-auto text-[#09090b] shadow-2xs">
                          <Upload className="w-5 h-5 text-[#09090b]" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-[#09090b]">Drag and drop your image here</p>
                          <p className="text-[11px] text-[#71717a]">or</p>
                        </div>
                        <button
                          type="button"
                          className="px-4 py-2 bg-[#09090b] hover:bg-[#27272a] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                        >
                          Upload Image
                        </button>
                        <p className="text-[10px] text-[#a1a1aa] font-mono pt-1">
                          PNG, JPG or WEBP • Max 5 MB • 1:1 recommended
                        </p>
                      </div>
                    </div>

                    {/* Preview Box */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#09090b]">
                        Preview
                      </label>
                      <div className="p-4 rounded-2xl bg-white border border-[#e4e4e7] flex items-center gap-3.5 shadow-2xs">
                        <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-xs">
                          {getInitials(name)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold text-[#09090b] truncate">{name || "Room Name"}</h4>
                          <p className="text-[11px] text-[#71717a]">This is how your room will look.</p>
                        </div>
                      </div>
                    </div>

                    {/* Tip Box */}
                    <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span>Tip</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-purple-800">
                        A square image works best. We'll automatically crop and resize it.
                      </p>
                    </div>

                  </div>

                  {/* Right Column: Form Inputs */}
                  <div className="md:col-span-7 space-y-5">
                    
                    {/* Room Name */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-[#09090b]">
                          Room Name <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] font-mono text-[#a1a1aa]">{name.length} / 60</span>
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Engineering Team"
                        maxLength={60}
                        className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-xs font-semibold text-[#09090b] focus:outline-none focus:border-purple-600 transition shadow-2xs"
                      />
                      <p className="text-[11px] text-[#71717a]">This name will be visible to all room members.</p>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-[#09090b]">
                          Description
                        </label>
                        <span className="text-[11px] font-mono text-[#a1a1aa]">{description.length} / 250</span>
                      </div>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        maxLength={250}
                        placeholder="Describe the main objectives, goals, and focus expectations of this room..."
                        className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-xs font-medium text-[#09090b] focus:outline-none focus:border-purple-600 transition shadow-2xs resize-none"
                      />
                      <p className="text-[11px] text-[#71717a]">Describe the purpose and focus of this room.</p>
                    </div>

                    {/* Room Type & Category Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#09090b]">
                          Room Type <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={roomType}
                            onChange={e => setRoomType(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-xs font-semibold text-[#09090b] focus:outline-none focus:border-purple-600 transition shadow-2xs appearance-none cursor-pointer pr-8"
                          >
                            <option value="Team">👤 Team</option>
                            <option value="Guild">🛡️ Guild</option>
                            <option value="Project">🎯 Project</option>
                            <option value="Personal">⚡ Personal</option>
                          </select>
                          <ChevronRight className="w-4 h-4 text-[#71717a] absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                        </div>
                        <p className="text-[11px] text-[#71717a]">This helps organize and filter rooms.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#09090b]">
                          Category <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-xs font-semibold text-[#09090b] focus:outline-none focus:border-purple-600 transition shadow-2xs appearance-none cursor-pointer pr-8"
                          >
                            <option value="Engineering">{"</>"} Engineering</option>
                            <option value="Design">🎨 Design</option>
                            <option value="Research">🔬 Research</option>
                            <option value="Product">📦 Product</option>
                            <option value="Marketing">📣 Marketing</option>
                          </select>
                          <ChevronRight className="w-4 h-4 text-[#71717a] absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                        </div>
                        <p className="text-[11px] text-[#71717a]">Helps members discover your room.</p>
                      </div>
                    </div>

                    {/* Time Zone & Room Lifecycle Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#09090b]">
                          Time Zone <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={timezone}
                            onChange={e => setTimezone(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-xs font-semibold text-[#09090b] focus:outline-none focus:border-purple-600 transition shadow-2xs appearance-none cursor-pointer pr-8"
                          >
                            <option value="Asia/Kolkata (IST)">🌐 Asia/Kolkata (IST)</option>
                            <option value="UTC">🌐 UTC (Coordinated Universal Time)</option>
                            <option value="America/New_York (EST)">🌐 America/New_York (EST)</option>
                            <option value="Europe/London (GMT)">🌐 Europe/London (GMT)</option>
                          </select>
                          <ChevronRight className="w-4 h-4 text-[#71717a] absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                        </div>
                        <p className="text-[11px] text-[#71717a]">Detected from your location.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#09090b]">
                          Room Lifecycle
                        </label>
                        <div className="relative">
                          <select
                            value={lifecycle}
                            onChange={e => setLifecycle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-xs font-semibold text-[#09090b] focus:outline-none focus:border-purple-600 transition shadow-2xs appearance-none cursor-pointer pr-8"
                          >
                            <option value="Ongoing">Ongoing</option>
                            <option value="Fixed Period">Fixed Period</option>
                          </select>
                          <ChevronRight className="w-4 h-4 text-[#71717a] absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                        </div>
                        <p className="text-[11px] text-[#71717a]">This room will run without an end date.</p>
                      </div>
                    </div>

                    {/* Project Deadline & Room Owner Box Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#09090b]">
                          Project Deadline (Optional)
                        </label>
                        <input
                          type="date"
                          value={deadline}
                          onChange={e => setDeadline(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-xs font-semibold text-[#09090b] focus:outline-none focus:border-purple-600 transition shadow-2xs cursor-pointer"
                        />
                        <p className="text-[11px] text-[#71717a]">Set a target completion date if applicable.</p>
                      </div>

                      {/* Room Owner Card */}
                      <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                          <Crown className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#09090b]">Room Owner</h4>
                          <p className="text-[11px] text-[#71717a] leading-tight mt-0.5">
                            You will be set as the owner with full control over this room.
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* STEP 2 to 7 PLACEHOLDERS / STEPS */}
            {step === 2 && (
              <div className="bg-white border border-[#e4e4e7] rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="space-y-1 pb-4 border-b border-[#e4e4e7]">
                  <div className="text-xs font-mono font-bold text-purple-600 uppercase tracking-wider">Step 2 of 7</div>
                  <h2 className="text-xl font-bold text-[#09090b]">Access & Security</h2>
                  <p className="text-xs text-[#71717a]">Configure access permissions and join requirements.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { id: "APPROVAL_REQUIRED", name: "Approval Required", desc: "Users request access; Room Owner approves them." },
                    { id: "OPEN", name: "Open Room", desc: "Anyone with the link can join immediately." },
                    { id: "INVITE_ONLY", name: "Invite Only", desc: "Only explicitly invited members can join." }
                  ].map(m => (
                    <div 
                      key={m.id} 
                      onClick={() => setAccessMode(m.id as any)}
                      className={`p-4 rounded-2xl border cursor-pointer ${accessMode === m.id ? "bg-purple-50 border-purple-600" : "bg-white border-[#e4e4e7]"}`}
                    >
                      <h4 className="font-bold text-xs">{m.name}</h4>
                      <p className="text-[11px] text-[#71717a] mt-1">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white border border-[#e4e4e7] rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="space-y-1 pb-4 border-b border-[#e4e4e7]">
                  <div className="text-xs font-mono font-bold text-purple-600 uppercase tracking-wider">Step 3 of 7</div>
                  <h2 className="text-xl font-bold text-[#09090b]">Members & Roles</h2>
                  <p className="text-xs text-[#71717a]">Invite network connections and assign roles.</p>
                </div>
                <div className="text-xs text-[#71717a]">
                  {connections.length > 0 ? `${connections.length} connections available to invite.` : "No connections found."}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-white border border-[#e4e4e7] rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="space-y-1 pb-4 border-b border-[#e4e4e7]">
                  <div className="text-xs font-mono font-bold text-purple-600 uppercase tracking-wider">Step 4 of 7</div>
                  <h2 className="text-xl font-bold text-[#09090b]">Work Expectations</h2>
                  <p className="text-xs text-[#71717a]">Define focus duration targets and task goals.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-4 rounded-xl border border-[#e4e4e7]">
                    <span className="text-[#71717a]">Weekly Team Target:</span>
                    <p className="text-base font-bold text-[#09090b] mt-1">{teamFocusHours} Hours</p>
                  </div>
                  <div className="p-4 rounded-xl border border-[#e4e4e7]">
                    <span className="text-[#71717a]">Planned Story Points:</span>
                    <p className="text-base font-bold text-[#09090b] mt-1">{teamTaskPoints} Points</p>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="bg-white border border-[#e4e4e7] rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="space-y-1 pb-4 border-b border-[#e4e4e7]">
                  <div className="text-xs font-mono font-bold text-purple-600 uppercase tracking-wider">Step 5 of 7</div>
                  <h2 className="text-xl font-bold text-[#09090b]">AI & Automation</h2>
                  <p className="text-xs text-[#71717a]">Configure member self-nudges and owner escalation alerts.</p>
                </div>
                <div className="space-y-3 text-xs">
                  <label className="flex items-center gap-2 font-bold">
                    <input type="checkbox" checked={memberSelfNudge} onChange={e => setMemberSelfNudge(e.target.checked)} className="accent-purple-600" />
                    Enable Level 1 Member Self-Nudge
                  </label>
                  <label className="flex items-center gap-2 font-bold">
                    <input type="checkbox" checked={ownerEscalation} onChange={e => setOwnerEscalation(e.target.checked)} className="accent-purple-600" />
                    Enable Level 2 Owner Escalation
                  </label>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="bg-white border border-[#e4e4e7] rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="space-y-1 pb-4 border-b border-[#e4e4e7]">
                  <div className="text-xs font-mono font-bold text-purple-600 uppercase tracking-wider">Step 6 of 7</div>
                  <h2 className="text-xl font-bold text-[#09090b]">Privacy & Telemetry</h2>
                  <p className="text-xs text-[#71717a]">Set window title masking and website URL privacy rules.</p>
                </div>
                <div className="space-y-3 text-xs">
                  <label className="flex items-center gap-2 font-bold">
                    <input type="checkbox" checked={trackAppName} onChange={e => setTrackAppName(e.target.checked)} className="accent-purple-600" />
                    Track Application Name
                  </label>
                  <label className="flex items-center gap-2 font-bold">
                    <input type="checkbox" checked={hideWindowTitle} onChange={e => setHideWindowTitle(e.target.checked)} className="accent-purple-600" />
                    Hide Document & Window Titles
                  </label>
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="bg-white border border-[#e4e4e7] rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="space-y-1 pb-4 border-b border-[#e4e4e7]">
                  <div className="text-xs font-mono font-bold text-purple-600 uppercase tracking-wider">Step 7 of 7</div>
                  <h2 className="text-xl font-bold text-[#09090b]">Review & Launch</h2>
                  <p className="text-xs text-[#71717a]">Review your room setup and accept the consent policy before launching.</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-3">
                  <div className="font-bold text-emerald-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-700" />
                    <span>Required Member Tracking Consent Policy</span>
                  </div>
                  <label className="flex items-center gap-2 text-emerald-950 font-bold cursor-pointer pt-1">
                    <input 
                      type="checkbox" 
                      checked={consentAccepted}
                      onChange={e => setConsentAccepted(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 cursor-pointer"
                    />
                    <span>I review, accept, and enforce the Room Tracking & Privacy Policy</span>
                  </label>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: ROOM SUMMARY PANEL */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-white border border-[#e4e4e7] rounded-2xl p-6 space-y-6 shadow-xs sticky top-8">
              
              {/* Summary Header */}
              <div className="space-y-1 pb-4 border-b border-[#e4e4e7]">
                <h3 className="text-sm font-bold text-[#09090b] tracking-tight">
                  Room Summary
                </h3>
                <p className="text-[11px] text-[#71717a]">
                  Preview of your room configuration
                </p>
              </div>

              {/* Big Badge & Room Title */}
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-xs">
                  {getInitials(name)}
                </div>
                <div className="min-w-0 space-y-1">
                  <h4 className="text-sm font-extrabold text-[#09090b] truncate">{name || "Engineering Team"}</h4>
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-semibold text-[#71717a]">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 border border-[#e4e4e7]">{roomType}</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 border border-[#e4e4e7]">{category}</span>
                  </div>
                </div>
              </div>

              {/* Configuration Checklist Summary */}
              <div className="space-y-4 pt-2 text-xs">
                
                {/* Item 1: Access */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-zinc-100 text-[#71717a] flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-[#71717a] font-semibold uppercase block">Access</span>
                    <span className="font-bold text-blue-600 text-xs">
                      {accessMode === "APPROVAL_REQUIRED" ? "Approval Required" : accessMode === "OPEN" ? "Open Room" : "Invite Only"}
                    </span>
                  </div>
                </div>

                {/* Item 2: Members */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-zinc-100 text-[#71717a] flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-[#71717a] font-semibold uppercase block">Members</span>
                    <span className="font-bold text-[#09090b] text-xs">
                      {selectedMembers.length} members
                    </span>
                  </div>
                </div>

                {/* Item 3: Work Policy */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-zinc-100 text-[#71717a] flex items-center justify-center shrink-0 mt-0.5">
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-[#71717a] font-semibold uppercase block">Work Policy</span>
                    <span className="font-bold text-[#71717a] text-xs">
                      {step >= 4 ? `${teamFocusHours}h / week` : "Not configured"}
                    </span>
                  </div>
                </div>

                {/* Item 4: AI Assistance */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-zinc-100 text-[#71717a] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-[#71717a] font-semibold uppercase block">AI Assistance</span>
                    <span className="font-bold text-[#71717a] text-xs">
                      {step >= 5 ? (memberSelfNudge ? "Level 1 Active" : "Configured") : "Not configured"}
                    </span>
                  </div>
                </div>

                {/* Item 5: Privacy */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-zinc-100 text-[#71717a] flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-[#71717a] font-semibold uppercase block">Privacy</span>
                    <span className="font-bold text-[#71717a] text-xs">
                      Default settings
                    </span>
                  </div>
                </div>

              </div>

              {/* Bottom Notice Box */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-[#e4e4e7] text-[11px] text-[#71717a] leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-[#71717a] shrink-0 mt-0.5" />
                <span>
                  You can review and modify all settings before launching your room.
                </span>
              </div>

            </div>

          </div>

        </div>

        {/* 4. STICKY BOTTOM ACTION FOOTER BAR */}
        <div className="bg-white border border-[#e4e4e7] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs sticky bottom-4">
          
          <div className="flex items-center space-x-3 text-xs text-[#71717a]">
            <button
              type="button"
              onClick={() => {
                if (step > 1) setStep(step - 1);
                else onClose();
              }}
              className="px-4 py-2 rounded-xl bg-white border border-[#e4e4e7] hover:bg-zinc-50 font-bold text-[#09090b] transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Save className="w-4 h-4 text-[#71717a]" />
              <span>Save & Exit</span>
            </button>
            <span className="hidden sm:inline font-mono">All progress is saved automatically</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 rounded-xl border border-[#e4e4e7] bg-white hover:bg-zinc-50 font-bold text-xs text-[#09090b] transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            {step < 7 ? (
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
                className="w-full sm:w-auto px-6 py-2.5 bg-[#09090b] hover:bg-[#27272a] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !consentAccepted}
                className="w-full sm:w-auto px-8 py-2.5 bg-[#09090b] hover:bg-[#27272a] text-white font-extrabold text-xs rounded-xl shadow-xs disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? "Creating Room..." : "Launch Room System →"}
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
