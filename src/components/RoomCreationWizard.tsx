import React, { useState, useEffect } from "react";
import { 
  X, Check, ChevronRight, ChevronLeft, Shield, Users, Target, Cpu, Lock, 
  Sparkles, Clock, Calendar, AlertCircle, Info, UserPlus, Globe, Upload, Image as ImageIcon,
  Crown, Bookmark, Save, ArrowRight, Layers, FileText, UserCheck, Eye, HelpCircle, Code, Briefcase,
  Search, Plus, Coffee, AlertTriangle, ArrowUpRight, Key, Mail, UserX, Trash2, Bell, Ban,
  EyeOff, Monitor, HardDrive, Camera, MapPin, Edit3, Rocket
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

  // STEP 2: Access & Security State
  const [roomVisibility, setRoomVisibility] = useState<"ORGANIZATION" | "RESTRICTED" | "PRIVATE">("RESTRICTED");
  const [joinPolicy, setJoinPolicy] = useState<"OPEN" | "APPROVAL_REQUIRED" | "INVITE_ONLY">("APPROVAL_REQUIRED");
  const [invitePermissions, setInvitePermissions] = useState({
    owners: true,
    admins: true,
    managers: false,
    members: false
  });
  const [requireVerifiedAccount, setRequireVerifiedAccount] = useState(true);
  const [allowExternalMembers, setAllowExternalMembers] = useState(false);
  const [linkExpiryDays, setLinkExpiryDays] = useState(7);
  const [maxMemberCount, setMaxMemberCount] = useState(50);

  // STEP 3: Members & Roles State
  const [memberSearch, setMemberSearch] = useState("");
  const [assignedMembers, setAssignedMembers] = useState([
    { id: "m1", name: "Ravi Teja", role: "Manager", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
    { id: "m2", name: "Arun Kumar", role: "Member", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100" },
    { id: "m3", name: "Sriram Dev", role: "Observer", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" },
    { id: "m4", name: "Vicky Raj", role: "Member", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100" },
    { id: "m5", name: "Priya Nair", role: "Member", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100" },
    { id: "m6", name: "Karthik S", role: "Manager", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100" },
    { id: "m7", name: "Anitha J", role: "Observer", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100" }
  ]);

  // STEP 4: Work Policy State
  const [workPolicyTab, setWorkPolicyTab] = useState<"individual" | "team">("individual");
  const [memberDailyTargets, setMemberDailyTargets] = useState([
    { id: "m1", name: "Ravi Teja", role: "Manager", focusHrs: 6, tasks: 5, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
    { id: "m2", name: "Arun Kumar", role: "Member", focusHrs: 6, tasks: 5, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100" },
    { id: "m6", name: "Karthik S", role: "Manager", focusHrs: 7, tasks: 6, avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100" },
    { id: "m5", name: "Priya Nair", role: "Member", focusHrs: 6, tasks: 4, avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100" },
    { id: "m3", name: "Sriram Dev", role: "Observer", focusHrs: 5, tasks: 3, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" }
  ]);
  const [maxContinuousFocus, setMaxContinuousFocus] = useState(90);
  const [recommendedBreak, setRecommendedBreak] = useState(10);
  const [weeklyFocusTarget, setWeeklyFocusTarget] = useState(30);
  const [weeklyTaskTarget, setWeeklyTaskTarget] = useState(25);
  const [milestones, setMilestones] = useState([
    { id: "ms1", title: "API Integration Phase", date: "2024-08-30", tasksCount: 20 },
    { id: "ms2", title: "Testing & QA", date: "2024-09-15", tasksCount: 15 },
    { id: "ms3", title: "Production Release", date: "2024-09-30", tasksCount: 10 }
  ]);

  // STEP 5: AI & Automation State
  const [aiAssistanceLevel, setAiAssistanceLevel] = useState<"DISABLED" | "ASSISTIVE" | "COORDINATED" | "MANAGED">("COORDINATED");
  const [memberNudges, setMemberNudges] = useState({
    focusReminders: true,
    breakReminders: true,
    contextSwitchAlerts: true,
    goalReminders: true
  });
  const [managerInsights, setManagerInsights] = useState({
    teamProductivitySummary: true,
    blockerDetection: true,
    workloadBalance: true,
    focusTrendAnalysis: true
  });
  const [escalationThreshold, setEscalationThreshold] = useState("Significant issues only");
  const [escalateToOwners, setEscalateToOwners] = useState(true);
  const [escalateToAdmins, setEscalateToAdmins] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);

  // STEP 6: Privacy & Telemetry State
  const [telemetrySettings, setTelemetrySettings] = useState({
    appName: "COLLECT",
    windowTitle: "MASK",
    websiteUrl: "MASK",
    activeTime: "COLLECT",
    keystrokes: "DONT_COLLECT",
    fileActivity: "MASK",
    screenshots: "DONT_COLLECT"
  });
  const [dataVisibility, setDataVisibility] = useState({
    members: "Only their own data",
    managers: "Aggregated team data",
    admins: "Team data (aggregated)",
    owners: "All room analytics & reports"
  });
  const [dataRetention, setDataRetention] = useState("30 days");
  const [dataLocation, setDataLocation] = useState("India (Recommended)");

  // STEP 7: Consent Checkbox State
  const [consentAccepted, setConsentAccepted] = useState(true);

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

  const handleMemberRoleChange = (id: string, newRole: string) => {
    setAssignedMembers(assignedMembers.map(m => m.id === id ? { ...m, role: newRole } : m));
  };

  const handleRemoveMember = (id: string) => {
    setAssignedMembers(assignedMembers.filter(m => m.id !== id));
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
        accessMode: joinPolicy,
        allowAdminInvites: invitePermissions.admins,
        linkExpiryDays,
        maxMemberCount,
        requireVerifiedAccount,
        defaultMemberRole: "MEMBER",
        invitedMembers: assignedMembers.map(m => ({
          userId: m.id,
          role: m.role.toUpperCase()
        })),
        memberWorkTargets: memberDailyTargets.map(m => ({
          userId: m.id,
          focusMinutes: m.focusHrs * 60,
          taskTarget: m.tasks
        })),
        teamTarget: {
          focusMinutes: weeklyFocusTarget * 60,
          taskPoints: weeklyTaskTarget,
          deadline: deadline || null
        },
        aiPolicy: {
          version: 1,
          memberSelfNudgeEnabled: memberNudges.focusReminders,
          ownerEscalationEnabled: escalateToOwners,
          warningThresholdMins: 45,
          gracePeriodMins: 120
        },
        privacyPolicy: {
          version: 1,
          trackAppName: telemetrySettings.appName === "COLLECT",
          hideWindowTitle: telemetrySettings.windowTitle !== "COLLECT",
          hideWebsiteUrl: telemetrySettings.websiteUrl !== "COLLECT",
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

        {/* ERROR ALERT */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* 3. MAIN WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT STEP CONTENT PANEL */}
          <div className="lg:col-span-8 space-y-6">

            {/* STEP 1: ROOM IDENTITY */}
            {step === 1 && (
              <div className="bg-white border border-[#e4e4e7] rounded-2xl p-6 space-y-6 shadow-xs">
                <div className="space-y-1 pb-4 border-b border-[#e4e4e7]">
                  <div className="text-xs font-mono font-bold text-purple-600 uppercase tracking-wider">Step 1 of 7</div>
                  <h2 className="text-xl font-bold text-[#09090b] tracking-tight">Room Identity</h2>
                  <p className="text-xs text-[#71717a]">Give your room a clear identity and purpose.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column: Image Upload & Live Preview */}
                  <div className="md:col-span-5 space-y-5">
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-[#09090b]">Room Image</label>
                      <p className="text-[11px] text-[#71717a]">Choose how your room will appear across EndoCore.</p>

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

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#09090b]">Preview</label>
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

                  {/* Right Column: Inputs */}
                  <div className="md:col-span-7 space-y-5">
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

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-[#09090b]">Description</label>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#09090b]">Room Type <span className="text-rose-500">*</span></label>
                        <select
                          value={roomType}
                          onChange={e => setRoomType(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-xs font-semibold text-[#09090b] focus:outline-none focus:border-purple-600 transition shadow-2xs cursor-pointer"
                        >
                          <option value="Team">👤 Team</option>
                          <option value="Guild">🛡️ Guild</option>
                          <option value="Project">🎯 Project</option>
                        </select>
                        <p className="text-[11px] text-[#71717a]">This helps organize and filter rooms.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#09090b]">Category <span className="text-rose-500">*</span></label>
                        <select
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-xs font-semibold text-[#09090b] focus:outline-none focus:border-purple-600 transition shadow-2xs cursor-pointer"
                        >
                          <option value="Engineering">{"</>"} Engineering</option>
                          <option value="Design">🎨 Design</option>
                          <option value="Research">🔬 Research</option>
                        </select>
                        <p className="text-[11px] text-[#71717a]">Helps members discover your room.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#09090b]">Time Zone <span className="text-rose-500">*</span></label>
                        <select
                          value={timezone}
                          onChange={e => setTimezone(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-xs font-semibold text-[#09090b] focus:outline-none focus:border-purple-600 transition shadow-2xs cursor-pointer"
                        >
                          <option value="Asia/Kolkata (IST)">🌐 Asia/Kolkata (IST)</option>
                          <option value="UTC">🌐 UTC</option>
                        </select>
                        <p className="text-[11px] text-[#71717a]">Detected from your location.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#09090b]">Room Lifecycle</label>
                        <select
                          value={lifecycle}
                          onChange={e => setLifecycle(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-xs font-semibold text-[#09090b] focus:outline-none focus:border-purple-600 transition shadow-2xs cursor-pointer"
                        >
                          <option value="Ongoing">Ongoing</option>
                          <option value="Fixed Period">Fixed Period</option>
                        </select>
                        <p className="text-[11px] text-[#71717a]">This room will run without an end date.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#09090b]">Project Deadline (Optional)</label>
                        <input
                          type="date"
                          value={deadline}
                          onChange={e => setDeadline(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-[#e4e4e7] rounded-xl text-xs font-semibold text-[#09090b] focus:outline-none focus:border-purple-600 transition shadow-2xs cursor-pointer"
                        />
                        <p className="text-[11px] text-[#71717a]">Set a target completion date if applicable.</p>
                      </div>

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

            {/* STEP 2: ACCESS & SECURITY */}
            {step === 2 && (
              <div className="bg-white border border-[#e4e4e7] rounded-2xl p-6 space-y-6 shadow-xs">
                <div className="space-y-1 pb-4 border-b border-[#e4e4e7]">
                  <div className="text-xs font-mono font-bold text-purple-600 uppercase tracking-wider">Step 2 of 7</div>
                  <h2 className="text-xl font-bold text-[#09090b] tracking-tight">Access & Security</h2>
                  <p className="text-xs text-[#71717a]">Define how people can discover, join and interact with this room.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-[#09090b]">Room Visibility</h3>
                    <p className="text-[11px] text-[#71717a]">Who can discover this room?</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { id: "ORGANIZATION", icon: <Globe className="w-4 h-4 text-purple-600" />, title: "Organization", desc: "Anyone in the organization can find this room." },
                      { id: "RESTRICTED", icon: <Users className="w-4 h-4 text-[#71717a]" />, title: "Restricted", desc: "Only invited members can find this room." },
                      { id: "PRIVATE", icon: <Lock className="w-4 h-4 text-[#71717a]" />, title: "Private", desc: "Hidden from everyone except members." }
                    ].map(v => (
                      <div
                        key={v.id}
                        onClick={() => setRoomVisibility(v.id as any)}
                        className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                          roomVisibility === v.id
                            ? "bg-purple-50/50 border-purple-600 shadow-2xs"
                            : "bg-white border-[#e4e4e7] hover:border-slate-300"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center">
                          {v.icon}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#09090b]">{v.title}</h4>
                          <p className="text-[11px] text-[#71717a] mt-0.5 leading-relaxed">{v.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <h3 className="text-xs font-bold text-[#09090b]">Join Policy</h3>
                    <p className="text-[11px] text-[#71717a]">How people can join this room.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { id: "OPEN", icon: <ArrowRight className="w-4 h-4 text-[#71717a]" />, title: "Open", desc: "Anyone can join immediately." },
                      { id: "APPROVAL_REQUIRED", icon: <Clock className="w-4 h-4 text-purple-600" />, title: "Approval Required", desc: "People must request access and be approved." },
                      { id: "INVITE_ONLY", icon: <Mail className="w-4 h-4 text-[#71717a]" />, title: "Invite Only", desc: "Only people with an invite can join." }
                    ].map(j => (
                      <div
                        key={j.id}
                        onClick={() => setJoinPolicy(j.id as any)}
                        className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                          joinPolicy === j.id
                            ? "bg-purple-50/50 border-purple-600 shadow-2xs"
                            : "bg-white border-[#e4e4e7] hover:border-slate-300"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center">
                          {j.icon}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#09090b]">{j.title}</h4>
                          <p className="text-[11px] text-[#71717a] mt-0.5 leading-relaxed">{j.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-3">
                    <h4 className="text-xs font-bold text-[#09090b]">Who can invite members?</h4>
                    <div className="space-y-2 text-xs">
                      {[
                        { key: "owners", label: "Owners" },
                        { key: "admins", label: "Admins" },
                        { key: "managers", label: "Managers" },
                        { key: "members", label: "Members" }
                      ].map(perm => (
                        <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(invitePermissions as any)[perm.key]}
                            onChange={e => setInvitePermissions({ ...invitePermissions, [perm.key]: e.target.checked })}
                            className="w-4 h-4 accent-purple-600 cursor-pointer rounded"
                          />
                          <span className="text-[#09090b] font-medium">{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-3 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#09090b]">Require verified account</h4>
                      <p className="text-[11px] text-[#71717a] mt-1 leading-relaxed">Only verified accounts can join this room.</p>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Shield className="w-4 h-4 text-[#71717a]" />
                      <button
                        type="button"
                        onClick={() => setRequireVerifiedAccount(!requireVerifiedAccount)}
                        className={`w-11 h-6 rounded-full transition p-1 cursor-pointer ${requireVerifiedAccount ? "bg-purple-600" : "bg-zinc-200"}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition transform ${requireVerifiedAccount ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-3 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#09090b]">Allow external members</h4>
                      <p className="text-[11px] text-[#71717a] mt-1 leading-relaxed">People outside the organization cannot be added.</p>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Users className="w-4 h-4 text-[#71717a]" />
                      <button
                        type="button"
                        onClick={() => setAllowExternalMembers(!allowExternalMembers)}
                        className={`w-11 h-6 rounded-full transition p-1 cursor-pointer ${allowExternalMembers ? "bg-purple-600" : "bg-zinc-200"}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition transform ${allowExternalMembers ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#09090b]">Invitation link expiry</label>
                      <select
                        value={linkExpiryDays}
                        onChange={e => setLinkExpiryDays(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-[#e4e4e7] rounded-xl text-xs font-semibold text-[#09090b] cursor-pointer"
                      >
                        <option value={7}>7 days</option>
                        <option value={30}>30 days</option>
                      </select>
                      <p className="text-[10px] text-[#a1a1aa]">Invitation links will expire after 7 days.</p>
                    </div>

                    <div className="space-y-1 pt-1">
                      <label className="block text-xs font-bold text-[#09090b]">Maximum members</label>
                      <input
                        type="number"
                        value={maxMemberCount}
                        onChange={e => setMaxMemberCount(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-[#e4e4e7] rounded-xl text-xs font-mono font-semibold text-[#09090b]"
                      />
                      <p className="text-[10px] text-[#a1a1aa]">Set the maximum number of members allowed in this room.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs text-purple-900">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Your room will inherit default security settings from your organization.</span>
                  </div>
                  <button type="button" className="text-purple-700 font-bold hover:underline flex items-center gap-1 cursor-pointer shrink-0">
                    <span>View organization security policy</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: MEMBERS & ROLES */}
            {step === 3 && (
              <div className="bg-white border border-[#e4e4e7] rounded-2xl p-6 space-y-6 shadow-xs">
                <div className="space-y-1 pb-4 border-b border-[#e4e4e7]">
                  <div className="text-xs font-mono font-bold text-purple-600 uppercase tracking-wider">Step 3 of 7</div>
                  <h2 className="text-xl font-bold text-[#09090b] tracking-tight">Members & Roles</h2>
                  <p className="text-xs text-[#71717a]">Add members to your room and assign appropriate roles.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-[#71717a] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      placeholder="Search by name, email or username"
                      className="w-full pl-10 pr-4 py-2 bg-white border border-[#e4e4e7] rounded-xl text-xs font-medium text-[#09090b] focus:outline-none focus:border-purple-600 transition"
                    />
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      type="button"
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-[#e4e4e7] bg-white hover:bg-zinc-50 font-bold text-xs text-[#09090b] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <UserPlus className="w-4 h-4 text-[#71717a]" />
                      <span>Import from Connections</span>
                    </button>
                    <button
                      type="button"
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-xs text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Invite Members</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#09090b]">Selected members ({assignedMembers.length})</h3>
                    <button type="button" onClick={() => setAssignedMembers([])} className="text-xs font-bold text-purple-600 hover:underline cursor-pointer">Clear All</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {assignedMembers.map(m => (
                      <div key={m.id} className="p-2.5 rounded-2xl border border-[#e4e4e7] bg-white flex items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center space-x-2 min-w-0">
                          <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200" />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-[#09090b] truncate">{m.name}</h4>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <select
                            value={m.role}
                            onChange={e => handleMemberRoleChange(m.id, e.target.value)}
                            className="px-2 py-1 bg-zinc-100 border border-[#e4e4e7] rounded-lg text-[10px] font-bold text-[#09090b] cursor-pointer"
                          >
                            <option value="Owner">Owner</option>
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Member">Member</option>
                            <option value="Observer">Observer</option>
                          </select>
                          <button type="button" onClick={() => handleRemoveMember(m.id)} className="text-[#71717a] hover:text-rose-600 p-1 cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-[#e4e4e7]">
                  <div>
                    <h3 className="text-xs font-bold text-[#09090b]">Role Overview</h3>
                    <p className="text-[11px] text-[#71717a]">Understand what each role can do in this room.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Crown className="w-4 h-4" /></div>
                        <h4 className="text-xs font-extrabold text-[#09090b]">Owner</h4>
                        <ul className="text-[10px] text-[#71717a] space-y-1 font-medium">
                          <li>• Full control over room</li>
                          <li>• Manage members & roles</li>
                          <li>• Manage settings & policies</li>
                          <li>• View all analytics & reports</li>
                        </ul>
                      </div>
                      <div className="py-1 px-2.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold text-center">1 member</div>
                    </div>

                    <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Shield className="w-4 h-4" /></div>
                        <h4 className="text-xs font-extrabold text-[#09090b]">Admin</h4>
                        <ul className="text-[10px] text-[#71717a] space-y-1 font-medium">
                          <li>• Manage members & roles</li>
                          <li>• Manage settings & policies</li>
                          <li>• View analytics & reports</li>
                          <li>• Access audit logs</li>
                        </ul>
                      </div>
                      <div className="py-1 px-2.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold text-center">2 members</div>
                    </div>

                    <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><UserPlus className="w-4 h-4" /></div>
                        <h4 className="text-xs font-extrabold text-[#09090b]">Manager</h4>
                        <ul className="text-[10px] text-[#71717a] space-y-1 font-medium">
                          <li>• Manage tasks & projects</li>
                          <li>• View team progress</li>
                          <li>• View limited analytics</li>
                          <li>• Cannot change policies</li>
                        </ul>
                      </div>
                      <div className="py-1 px-2.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold text-center">2 members</div>
                    </div>

                    <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Users className="w-4 h-4" /></div>
                        <h4 className="text-xs font-extrabold text-[#09090b]">Member</h4>
                        <ul className="text-[10px] text-[#71717a] space-y-1 font-medium">
                          <li>• Participate in room</li>
                          <li>• View own analytics</li>
                          <li>• Update tasks & goals</li>
                          <li>• Cannot manage settings</li>
                        </ul>
                      </div>
                      <div className="py-1 px-2.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold text-center">2 members</div>
                    </div>

                    <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="w-8 h-8 rounded-xl bg-zinc-100 text-[#71717a] flex items-center justify-center"><Eye className="w-4 h-4" /></div>
                        <h4 className="text-xs font-extrabold text-[#09090b]">Observer</h4>
                        <ul className="text-[10px] text-[#71717a] space-y-1 font-medium">
                          <li>• Read-only access</li>
                          <li>• View reports & progress</li>
                          <li>• No changes allowed</li>
                          <li>• Limited visibility</li>
                        </ul>
                      </div>
                      <div className="py-1 px-2.5 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-bold text-center">2 members</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs text-purple-900">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>You can always add or remove members later from the room settings.</span>
                  </div>
                  <button type="button" className="text-purple-700 font-bold hover:underline flex items-center gap-1 cursor-pointer shrink-0">
                    <span>Manage members after creation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: WORK POLICY */}
            {step === 4 && (
              <div className="bg-white border border-[#e4e4e7] rounded-2xl p-6 space-y-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-[#e4e4e7]">
                  <div className="space-y-1">
                    <div className="text-xs font-mono font-bold text-purple-600 uppercase tracking-wider">Step 4 of 7</div>
                    <h2 className="text-xl font-bold text-[#09090b] tracking-tight">Work Policy</h2>
                    <p className="text-xs text-[#71717a]">Define goals, focus expectations and how work gets done in this room.</p>
                  </div>

                  <div className="flex items-center p-1 bg-zinc-100 border border-[#e4e4e7] rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setWorkPolicyTab("individual")}
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${workPolicyTab === "individual" ? "bg-white text-purple-700 shadow-xs" : "text-[#71717a]"}`}
                    >
                      Individual Targets
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkPolicyTab("team")}
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${workPolicyTab === "team" ? "bg-white text-purple-700 shadow-xs" : "text-[#71717a]"}`}
                    >
                      Team Targets
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-[#09090b]">Daily Targets (Per Member)</h3>
                      <p className="text-[11px] text-[#71717a]">Set expected daily focus and task targets for each member.</p>
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-12 text-[10px] font-mono font-bold text-[#71717a] uppercase px-2 pb-1 border-b border-slate-100">
                        <span className="col-span-5">Member</span>
                        <span className="col-span-3 text-center">Daily Focus Target ⓘ</span>
                        <span className="col-span-4 text-center">Daily Task Target ⓘ</span>
                      </div>

                      {memberDailyTargets.map(m => (
                        <div key={m.id} className="grid grid-cols-12 items-center px-2 py-1.5 bg-white border border-[#e4e4e7] rounded-xl text-xs">
                          <div className="col-span-5 flex items-center space-x-2 min-w-0">
                            <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-bold text-[#09090b] text-xs truncate block">{m.name}</span>
                              <span className="text-[9px] font-semibold text-purple-700 px-1.5 py-0.2 rounded bg-purple-50 border border-purple-100 inline-block">{m.role}</span>
                            </div>
                          </div>

                          <div className="col-span-3 flex items-center justify-center space-x-1">
                            <input
                              type="number"
                              value={m.focusHrs}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setMemberDailyTargets(memberDailyTargets.map(item => item.id === m.id ? { ...item, focusHrs: val } : item));
                              }}
                              className="w-12 px-2 py-1 border border-[#e4e4e7] rounded-lg text-xs font-mono font-bold text-center text-[#09090b]"
                            />
                            <span className="text-[10px] text-[#71717a] font-mono">hrs</span>
                          </div>

                          <div className="col-span-4 flex items-center justify-center space-x-1">
                            <input
                              type="number"
                              value={m.tasks}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setMemberDailyTargets(memberDailyTargets.map(item => item.id === m.id ? { ...item, tasks: val } : item));
                              }}
                              className="w-12 px-2 py-1 border border-[#e4e4e7] rounded-lg text-xs font-mono font-bold text-center text-[#09090b]"
                            />
                            <span className="text-[10px] text-[#71717a] font-mono">tasks</span>
                          </div>
                        </div>
                      ))}

                      <button type="button" className="text-xs font-bold text-purple-600 hover:underline pt-1 inline-block cursor-pointer">
                        + Add Target for More Members
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-[#09090b]">Focus Session Policy</h3>
                      <p className="text-[11px] text-[#71717a]">Define how focus time should be structured.</p>
                    </div>

                    <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#09090b]">Max continuous focus</label>
                        <select
                          value={maxContinuousFocus}
                          onChange={e => setMaxContinuousFocus(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-[#e4e4e7] rounded-xl text-xs font-semibold text-[#09090b] cursor-pointer"
                        >
                          <option value={60}>⏱ 60 minutes</option>
                          <option value={90}>⏱ 90 minutes</option>
                          <option value={120}>⏱ 120 minutes</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#09090b]">Recommended break</label>
                        <select
                          value={recommendedBreak}
                          onChange={e => setRecommendedBreak(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-[#e4e4e7] rounded-xl text-xs font-semibold text-[#09090b] cursor-pointer"
                        >
                          <option value={5}>☕ 5 minutes</option>
                          <option value={10}>☕ 10 minutes</option>
                          <option value={15}>☕ 15 minutes</option>
                        </select>
                      </div>

                      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>EndoCore will suggest breaks to help maintain focus and wellbeing.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 border-t border-[#e4e4e7]">
                  <div className="lg:col-span-5 space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-[#09090b]">Weekly Expectations (Optional)</h3>
                      <p className="text-[11px] text-[#71717a]">Set broader weekly goals for the team or members.</p>
                    </div>

                    <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#71717a] uppercase">Weekly Focus Target</label>
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="number"
                            value={weeklyFocusTarget}
                            onChange={e => setWeeklyFocusTarget(Number(e.target.value))}
                            className="w-full px-3 py-1.5 border border-[#e4e4e7] rounded-xl text-xs font-mono font-bold text-center"
                          />
                          <span className="text-xs font-mono text-[#71717a]">hrs</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#71717a] uppercase">Weekly Task Target</label>
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="number"
                            value={weeklyTaskTarget}
                            onChange={e => setWeeklyTaskTarget(Number(e.target.value))}
                            className="w-full px-3 py-1.5 border border-[#e4e4e7] rounded-xl text-xs font-mono font-bold text-center"
                          />
                          <span className="text-xs font-mono text-[#71717a]">tasks</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-[#09090b]">Milestones (Optional)</h3>
                        <p className="text-[11px] text-[#71717a]">Define key milestones or deadlines for this room.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMilestones([...milestones, { id: `ms-${Date.now()}`, title: "New Milestone", date: "2024-10-15", tasksCount: 10 }]);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-[#e4e4e7] bg-white hover:bg-zinc-50 font-bold text-xs text-[#09090b] flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Milestone</span>
                      </button>
                    </div>

                    <div className="border border-[#e4e4e7] rounded-2xl bg-white overflow-hidden text-xs">
                      <div className="grid grid-cols-12 font-mono font-bold text-[10px] text-[#71717a] uppercase bg-zinc-50 px-3 py-2 border-b border-[#e4e4e7]">
                        <span className="col-span-5">Milestone</span>
                        <span className="col-span-4">Target Date</span>
                        <span className="col-span-3">Related Tasks</span>
                      </div>
                      {milestones.map(ms => (
                        <div key={ms.id} className="grid grid-cols-12 items-center px-3 py-2 border-b border-slate-100 last:border-0 font-medium">
                          <span className="col-span-5 font-bold text-[#09090b]">{ms.title}</span>
                          <span className="col-span-4 text-[#71717a] font-mono">📅 {ms.date}</span>
                          <div className="col-span-3 flex items-center justify-between">
                            <span className="font-mono text-[#71717a]">{ms.tasksCount} tasks</span>
                            <button type="button" onClick={() => setMilestones(milestones.filter(item => item.id !== ms.id))} className="text-[#71717a] hover:text-rose-600 cursor-pointer">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center gap-2 text-xs text-purple-900">
                  <Target className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="font-bold">Why set work policies?</span> Clear expectations help teams stay aligned, focused and productive.
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: AI & AUTOMATION */}
            {step === 5 && (
              <div className="bg-white border border-[#e4e4e7] rounded-2xl p-6 space-y-6 shadow-xs">
                
                {/* Header */}
                <div className="space-y-1 pb-4 border-b border-[#e4e4e7]">
                  <div className="text-xs font-mono font-bold text-purple-600 uppercase tracking-wider">Step 5 of 7</div>
                  <h2 className="text-xl font-bold text-[#09090b] tracking-tight">AI & Automation</h2>
                  <p className="text-xs text-[#71717a]">Configure how EndoCore AI should assist and automate work in this room.</p>
                </div>

                {/* 1. AI Assistance Level (4 Cards Row) */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-[#09090b]">AI Assistance Level</h3>
                    <p className="text-[11px] text-[#71717a]">Choose how actively AI should assist this room.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { id: "DISABLED", icon: <Ban className="w-4 h-4 text-[#71717a]" />, title: "Disabled", desc: "No AI assistance in this room." },
                      { id: "ASSISTIVE", icon: <Bell className="w-4 h-4 text-[#71717a]" />, title: "Assistive", desc: "AI nudges and helps individuals privately." },
                      { id: "COORDINATED", icon: <Sparkles className="w-4 h-4 text-purple-600" />, title: "Coordinated", desc: "AI provides team insights and recommendations." },
                      { id: "MANAGED", icon: <Cpu className="w-4 h-4 text-[#71717a]" />, title: "Managed", desc: "AI can escalate issues and manage workflows." }
                    ].map(lvl => (
                      <div
                        key={lvl.id}
                        onClick={() => setAiAssistanceLevel(lvl.id as any)}
                        className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 flex flex-col justify-between ${
                          aiAssistanceLevel === lvl.id
                            ? "bg-purple-50/50 border-purple-600 shadow-2xs"
                            : "bg-white border-[#e4e4e7] hover:border-slate-300"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center">
                            {lvl.icon}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#09090b]">{lvl.title}</h4>
                            <p className="text-[11px] text-[#71717a] mt-0.5 leading-relaxed">{lvl.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Middle 3-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-2">
                  
                  {/* Column 1: Member Nudges */}
                  <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-[#09090b]">Member Nudges</h4>
                        <p className="text-[11px] text-[#71717a]">Enable nudges to help members stay on track.</p>
                      </div>

                      <div className="space-y-3 text-xs">
                        {[
                          { key: "focusReminders", title: "Focus reminders", desc: "Remind members to stay focused" },
                          { key: "breakReminders", title: "Break reminders", desc: "Suggest breaks to avoid burnout" },
                          { key: "contextSwitchAlerts", title: "Context-switch alerts", desc: "Alert when switching tasks frequently" },
                          { key: "goalReminders", title: "Goal reminders", desc: "Remind about daily goals & targets" }
                        ].map(nudge => (
                          <label key={nudge.key} className="flex items-start gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(memberNudges as any)[nudge.key]}
                              onChange={e => setMemberNudges({ ...memberNudges, [nudge.key]: e.target.checked })}
                              className="w-4 h-4 accent-purple-600 cursor-pointer rounded mt-0.5"
                            />
                            <div>
                              <span className="font-bold text-[#09090b] block text-xs">{nudge.title}</span>
                              <span className="text-[10px] text-[#71717a] block leading-tight">{nudge.desc}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[10px] text-emerald-900 font-medium flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Nudges are private and visible only to the member.</span>
                    </div>
                  </div>

                  {/* Column 2: Manager Insights */}
                  <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-[#09090b]">Manager Insights</h4>
                        <p className="text-[11px] text-[#71717a]">AI will generate insights for room managers.</p>
                      </div>

                      <div className="space-y-3 text-xs">
                        {[
                          { key: "teamProductivitySummary", title: "Team productivity summary", desc: "Daily and weekly team overview" },
                          { key: "blockerDetection", title: "Blocker detection", desc: "Detect and highlight blockers" },
                          { key: "workloadBalance", title: "Workload balance", desc: "Identify uneven workload distribution" },
                          { key: "focusTrendAnalysis", title: "Focus trend analysis", desc: "Analyze focus trends over time" }
                        ].map(ins => (
                          <label key={ins.key} className="flex items-start gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(managerInsights as any)[ins.key]}
                              onChange={e => setManagerInsights({ ...managerInsights, [ins.key]: e.target.checked })}
                              className="w-4 h-4 accent-purple-600 cursor-pointer rounded mt-0.5"
                            />
                            <div>
                              <span className="font-bold text-[#09090b] block text-xs">{ins.title}</span>
                              <span className="text-[10px] text-[#71717a] block leading-tight">{ins.desc}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[10px] text-blue-900 font-medium flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Insights are visible to Managers and above.</span>
                    </div>
                  </div>

                  {/* Column 3: Escalation & Alerts */}
                  <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-[#09090b]">Escalation & Alerts</h4>
                        <p className="text-[11px] text-[#71717a]">Define when AI should escalate issues.</p>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-[#71717a]">Escalation threshold</label>
                          <select
                            value={escalationThreshold}
                            onChange={e => setEscalationThreshold(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-[#e4e4e7] rounded-xl text-xs font-semibold text-[#09090b] cursor-pointer"
                          >
                            <option value="Significant issues only">Significant issues only</option>
                            <option value="All minor issues">All minor issues</option>
                          </select>
                          <p className="text-[10px] text-[#a1a1aa]">AI will escalate only important and repeated issues.</p>
                        </div>

                        <div className="space-y-1 pt-1">
                          <label className="block text-[11px] font-bold text-[#71717a]">Escalate to</label>
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" checked={escalateToOwners} onChange={e => setEscalateToOwners(e.target.checked)} className="accent-purple-600" />
                              <span className="font-bold text-[#09090b]">Room Owners</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" checked={escalateToAdmins} onChange={e => setEscalateToAdmins(e.target.checked)} className="accent-purple-600" />
                              <span className="font-bold text-[#09090b]">Admins</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1 pt-1">
                          <label className="block text-[11px] font-bold text-[#71717a]">Notify via</label>
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" checked={notifyInApp} onChange={e => setNotifyInApp(e.target.checked)} className="accent-purple-600" />
                              <span className="font-bold text-[#09090b]">In-app notification</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" checked={notifyEmail} onChange={e => setNotifyEmail(e.target.checked)} className="accent-purple-600" />
                              <span className="font-bold text-[#09090b]">Email</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 text-[10px] text-amber-900 font-medium flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Escalations are sent only to authorized people.</span>
                    </div>
                  </div>

                </div>

                {/* Bottom Notice Banner */}
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs text-purple-900">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <span className="font-bold">AI works for you, not against you.</span> EndoCore AI is designed to improve focus, productivity and wellbeing — while respecting privacy and your control.
                    </div>
                  </div>
                  <button type="button" className="text-purple-700 font-bold hover:underline flex items-center gap-1 cursor-pointer shrink-0">
                    <span>Learn more about AI in EndoCore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 6: PRIVACY & TELEMETRY */}
            {step === 6 && (
              <div className="bg-white border border-[#e4e4e7] rounded-2xl p-6 space-y-6 shadow-xs">
                
                {/* Header */}
                <div className="space-y-1 pb-4 border-b border-[#e4e4e7]">
                  <div className="text-xs font-mono font-bold text-purple-600 uppercase tracking-wider">Step 6 of 7</div>
                  <h2 className="text-xl font-bold text-[#09090b] tracking-tight">Privacy & Telemetry</h2>
                  <p className="text-xs text-[#71717a]">Configure what data is collected, how it's used and who can see it.</p>
                </div>

                {/* Top 2-Column Grid: Telemetry Collection Table (Left) & Visibility/Retention (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Telemetry Data Collection Table */}
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-[#09090b]">Telemetry Data Collection</h3>
                      <p className="text-[11px] text-[#71717a]">Choose what EndoCore can collect from members' workstations.</p>
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-12 text-[10px] font-mono font-bold text-[#71717a] uppercase px-2 pb-1 border-b border-slate-100">
                        <span className="col-span-6">Data Type</span>
                        <span className="col-span-2 text-center">Collect</span>
                        <span className="col-span-2 text-center">Mask / Anonymize</span>
                        <span className="col-span-2 text-center">Don't Collect ⓘ</span>
                      </div>

                      {[
                        { key: "appName", icon: <Monitor className="w-3.5 h-3.5 text-[#71717a]" />, label: "Application name", desc: "Name of the application in use" },
                        { key: "windowTitle", icon: <FileText className="w-3.5 h-3.5 text-[#71717a]" />, label: "Window / Document titles", desc: "Titles of documents and windows" },
                        { key: "websiteUrl", icon: <Globe className="w-3.5 h-3.5 text-[#71717a]" />, label: "Website URLs", desc: "Websites and pages visited" },
                        { key: "activeTime", icon: <Clock className="w-3.5 h-3.5 text-[#71717a]" />, label: "Active time", desc: "Focus time and idle time" },
                        { key: "keystrokes", icon: <Code className="w-3.5 h-3.5 text-[#71717a]" />, label: "Keystroke activity", desc: "Keys typed and shortcuts" },
                        { key: "fileActivity", icon: <HardDrive className="w-3.5 h-3.5 text-[#71717a]" />, label: "File activity", desc: "Files created, edited, or deleted" },
                        { key: "screenshots", icon: <Camera className="w-3.5 h-3.5 text-[#71717a]" />, label: "Screenshots", desc: "Screen captures" }
                      ].map(t => (
                        <div key={t.key} className="grid grid-cols-12 items-center px-2 py-2 bg-white border border-[#e4e4e7] rounded-xl text-xs">
                          <div className="col-span-6 flex items-center space-x-2 min-w-0">
                            <div className="p-1.5 rounded-lg bg-zinc-100 shrink-0">{t.icon}</div>
                            <div className="min-w-0">
                              <span className="font-bold text-[#09090b] text-xs truncate block">{t.label}</span>
                              <span className="text-[10px] text-[#71717a] truncate block">{t.desc}</span>
                            </div>
                          </div>

                          <div className="col-span-2 flex justify-center">
                            <input
                              type="radio"
                              name={t.key}
                              checked={(telemetrySettings as any)[t.key] === "COLLECT"}
                              onChange={() => setTelemetrySettings({ ...telemetrySettings, [t.key]: "COLLECT" })}
                              className="w-4 h-4 accent-purple-600 cursor-pointer"
                            />
                          </div>

                          <div className="col-span-2 flex justify-center">
                            <input
                              type="radio"
                              name={t.key}
                              checked={(telemetrySettings as any)[t.key] === "MASK"}
                              onChange={() => setTelemetrySettings({ ...telemetrySettings, [t.key]: "MASK" })}
                              className="w-4 h-4 accent-purple-600 cursor-pointer"
                            />
                          </div>

                          <div className="col-span-2 flex justify-center">
                            <input
                              type="radio"
                              name={t.key}
                              checked={(telemetrySettings as any)[t.key] === "DONT_COLLECT"}
                              onChange={() => setTelemetrySettings({ ...telemetrySettings, [t.key]: "DONT_COLLECT" })}
                              className="w-4 h-4 accent-purple-600 cursor-pointer"
                            />
                          </div>
                        </div>
                      ))}

                      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>EndoCore never collects the content of your files, documents or screenshots.</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Visibility & Retention Controls */}
                  <div className="lg:col-span-5 space-y-5">
                    
                    {/* Data Visibility */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xs font-bold text-[#09090b]">Data Visibility</h3>
                        <p className="text-[11px] text-[#71717a]">Control who can view the collected data.</p>
                      </div>

                      <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-[#71717a]">Members can view</label>
                          <select
                            value={dataVisibility.members}
                            onChange={e => setDataVisibility({ ...dataVisibility, members: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-[#e4e4e7] rounded-xl font-semibold text-[#09090b] cursor-pointer"
                          >
                            <option value="Only their own data">Only their own data</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-[#71717a]">Managers can view</label>
                          <select
                            value={dataVisibility.managers}
                            onChange={e => setDataVisibility({ ...dataVisibility, managers: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-[#e4e4e7] rounded-xl font-semibold text-[#09090b] cursor-pointer"
                          >
                            <option value="Aggregated team data">Aggregated team data</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-[#71717a]">Room admins can view</label>
                          <select
                            value={dataVisibility.admins}
                            onChange={e => setDataVisibility({ ...dataVisibility, admins: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-[#e4e4e7] rounded-xl font-semibold text-[#09090b] cursor-pointer"
                          >
                            <option value="Team data (aggregated)">Team data (aggregated)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-[#71717a]">Room owners can view</label>
                          <select
                            value={dataVisibility.owners}
                            onChange={e => setDataVisibility({ ...dataVisibility, owners: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-[#e4e4e7] rounded-xl font-semibold text-[#09090b] cursor-pointer"
                          >
                            <option value="All room analytics & reports">All room analytics & reports</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Data Retention */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xs font-bold text-[#09090b]">Data Retention</h3>
                        <p className="text-[11px] text-[#71717a]">Choose how long activity data is stored.</p>
                      </div>

                      <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-2 text-xs">
                        <select
                          value={dataRetention}
                          onChange={e => setDataRetention(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#e4e4e7] rounded-xl font-semibold text-[#09090b] cursor-pointer"
                        >
                          <option value="30 days">30 days</option>
                          <option value="90 days">90 days</option>
                        </select>
                        <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Data older than 30 days will be automatically deleted.</span>
                        </p>
                      </div>
                    </div>

                    {/* Data Processing Location */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xs font-bold text-[#09090b]">Data Processing Location</h3>
                        <p className="text-[11px] text-[#71717a]">Where your data is processed and stored.</p>
                      </div>

                      <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-1 text-xs">
                        <select
                          value={dataLocation}
                          onChange={e => setDataLocation(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#e4e4e7] rounded-xl font-semibold text-[#09090b] cursor-pointer"
                        >
                          <option value="India (Recommended)">📍 India (Recommended)</option>
                          <option value="United States (US)">📍 United States (US)</option>
                          <option value="European Union (EU)">📍 European Union (EU)</option>
                        </select>
                        <p className="text-[10px] text-[#a1a1aa]">Meets local data protection requirements.</p>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Bottom Section: Privacy Safeguards & Telemetry Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 border-t border-[#e4e4e7]">
                  
                  <div className="lg:col-span-6 space-y-3">
                    <h3 className="text-xs font-bold text-[#09090b]">Privacy Safeguards</h3>
                    <p className="text-[11px] text-[#71717a]">Built-in protections for your team.</p>
                    <ul className="text-xs text-purple-900 space-y-1.5 font-medium">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Data is encrypted in transit and at rest.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>We do not sell or share your data with third parties.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Only authorized people can access room data.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Members can export or delete their personal data anytime.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="lg:col-span-6 space-y-3">
                    <h3 className="text-xs font-bold text-[#09090b]">Telemetry Preview</h3>
                    <p className="text-[11px] text-[#71717a]">Here's what will be collected based on your settings.</p>
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold pt-1">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Application name (VS Code)
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Website domain (endocore.com)
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Window title (Masked)
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200 flex items-center gap-1">
                        ⊘ Keystrokes (Not collected)
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200 flex items-center gap-1">
                        ⊘ Screenshots (Not collected)
                      </span>
                    </div>
                  </div>

                </div>

                {/* Bottom Notice Banner */}
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-xs text-purple-900">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Your privacy and your team's trust are our priority.</span>
                  </div>
                  <button type="button" className="text-purple-700 font-bold hover:underline flex items-center gap-1 cursor-pointer shrink-0">
                    <span>Learn more about Telemetry & Privacy</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 7: REVIEW & LAUNCH */}
            {step === 7 && (
              <div className="bg-white border border-[#e4e4e7] rounded-2xl p-6 space-y-6 shadow-xs">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#e4e4e7]">
                  <div className="space-y-1">
                    <div className="text-xs font-mono font-bold text-purple-600 uppercase tracking-wider">Step 7 of 7</div>
                    <h2 className="text-xl font-bold text-[#09090b] tracking-tight">Review & Launch</h2>
                    <p className="text-xs text-[#71717a]">Please review all configurations before launching your room.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-3.5 py-1.5 rounded-xl border border-[#e4e4e7] bg-white hover:bg-zinc-50 font-bold text-xs text-[#09090b] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#71717a]" />
                    <span>Edit Any Step</span>
                  </button>
                </div>

                {/* 6 Review Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  
                  {/* Card 1: Identity */}
                  <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-purple-600" />
                          <h4 className="text-xs font-extrabold text-[#09090b]">Identity</h4>
                        </div>
                        <button type="button" onClick={() => setStep(1)} className="text-[10px] font-bold text-purple-600 hover:underline">Edit</button>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                          {getInitials(name)}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-[#09090b] truncate">{name}</h5>
                          <p className="text-[10px] text-[#71717a] line-clamp-1">{description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 text-[#71717a]">
                        <div>Type: <strong className="text-[#09090b]">{roomType}</strong></div>
                        <div>Category: <strong className="text-[#09090b]">{category}</strong></div>
                        <div>Timezone: <strong className="text-[#09090b]">{timezone}</strong></div>
                        <div>Lifecycle: <strong className="text-[#09090b]">{lifecycle}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Access & Security */}
                  <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-purple-600" />
                          <h4 className="text-xs font-extrabold text-[#09090b]">Access & Security</h4>
                        </div>
                        <button type="button" onClick={() => setStep(2)} className="text-[10px] font-bold text-purple-600 hover:underline">Edit</button>
                      </div>

                      <div className="space-y-1 text-[11px] text-[#71717a]">
                        <div className="flex justify-between"><span>Visibility</span><strong className="text-[#09090b]">Restricted</strong></div>
                        <div className="flex justify-between"><span>Join Policy</span><strong className="text-[#09090b]">Approval Required</strong></div>
                        <div className="flex justify-between"><span>Who can invite</span><strong className="text-[#09090b]">Owners, Admins</strong></div>
                        <div className="flex justify-between"><span>Require verified account</span><strong className="text-emerald-600">✓ Yes</strong></div>
                        <div className="flex justify-between"><span>External members</span><strong className="text-[#09090b]">No</strong></div>
                        <div className="flex justify-between"><span>Maximum members</span><strong className="text-[#09090b]">50</strong></div>
                        <div className="flex justify-between"><span>Invitation link expiry</span><strong className="text-emerald-600">✓ 7 days</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Members & Roles */}
                  <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-600" />
                          <h4 className="text-xs font-extrabold text-[#09090b]">Members & Roles</h4>
                        </div>
                        <button type="button" onClick={() => setStep(3)} className="text-[10px] font-bold text-purple-600 hover:underline">Edit</button>
                      </div>

                      <div className="space-y-1.5 text-[11px] text-[#71717a]">
                        <div className="flex items-center justify-between">
                          <span>Owner</span>
                          <span className="font-bold text-[#09090b]">You (Tawfeeq Bahur)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Admins</span>
                          <span className="font-bold text-[#09090b]">2</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Managers</span>
                          <span className="font-bold text-[#09090b]">2</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Members</span>
                          <span className="font-bold text-[#09090b]">2</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Observers</span>
                          <span className="font-bold text-[#09090b]">1</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-purple-50 text-purple-800 text-[10px] font-mono font-bold flex justify-between">
                      <span>Total Members</span>
                      <span>7</span>
                    </div>
                  </div>

                  {/* Card 4: Work Policy */}
                  <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-purple-600" />
                          <h4 className="text-xs font-extrabold text-[#09090b]">Work Policy</h4>
                        </div>
                        <button type="button" onClick={() => setStep(4)} className="text-[10px] font-bold text-purple-600 hover:underline">Edit</button>
                      </div>

                      <div className="space-y-1 text-[11px] text-[#71717a]">
                        <div className="flex justify-between"><span>Individual Targets</span><strong className="text-emerald-600">✓ Enabled</strong></div>
                        <div className="flex justify-between"><span>Daily Focus</span><strong className="text-[#09090b]">6 hrs</strong></div>
                        <div className="flex justify-between"><span>Daily Tasks</span><strong className="text-[#09090b]">5 tasks</strong></div>
                        <div className="flex justify-between"><span>Weekly Focus</span><strong className="text-[#09090b]">30 hrs</strong></div>
                        <div className="flex justify-between"><span>Weekly Tasks</span><strong className="text-[#09090b]">25 tasks</strong></div>
                        <div className="flex justify-between"><span>Focus Session</span><strong className="text-[#09090b]">90 min / 10 min break</strong></div>
                        <div className="flex justify-between"><span>Milestones</span><strong className="text-[#09090b]">3 active</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Card 5: AI & Automation */}
                  <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <h4 className="text-xs font-extrabold text-[#09090b]">AI & Automation</h4>
                        </div>
                        <button type="button" onClick={() => setStep(5)} className="text-[10px] font-bold text-purple-600 hover:underline">Edit</button>
                      </div>

                      <div className="space-y-1 text-[11px] text-[#71717a]">
                        <div className="flex justify-between"><span>AI Assistance Level</span><strong className="text-purple-700">Coordinated</strong></div>
                        <div className="flex justify-between"><span>Member Nudges</span><strong className="text-[#09090b]">Enabled</strong></div>
                        <div className="flex justify-between"><span>Manager Insights</span><strong className="text-[#09090b]">Enabled</strong></div>
                        <div className="flex justify-between"><span>Escalation Threshold</span><strong className="text-emerald-600">✓ Significant issues only</strong></div>
                        <div className="flex justify-between"><span>Escalate To</span><strong className="text-[#09090b]">Room Owners, Admins</strong></div>
                        <div className="flex justify-between"><span>Notifications</span><strong className="text-[#09090b]">In-app, Email</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Card 6: Privacy & Telemetry */}
                  <div className="p-4 rounded-2xl border border-[#e4e4e7] bg-white space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-purple-600" />
                          <h4 className="text-xs font-extrabold text-[#09090b]">Privacy & Telemetry</h4>
                        </div>
                        <button type="button" onClick={() => setStep(6)} className="text-[10px] font-bold text-purple-600 hover:underline">Edit</button>
                      </div>

                      <div className="space-y-1 text-[11px] text-[#71717a]">
                        <div className="flex justify-between"><span>Applications</span><strong className="text-[#09090b]">Collect</strong></div>
                        <div className="flex justify-between"><span>Window Titles</span><strong className="text-[#09090b]">Masked</strong></div>
                        <div className="flex justify-between"><span>Website URLs</span><strong className="text-[#09090b]">Domain only</strong></div>
                        <div className="flex justify-between"><span>Keystrokes</span><strong className="text-[#09090b]">Don't collect</strong></div>
                        <div className="flex justify-between"><span>Screenshots</span><strong className="text-[#09090b]">Don't collect</strong></div>
                        <div className="flex justify-between"><span>Data Retention</span><strong className="text-[#09090b]">30 days</strong></div>
                        <div className="flex justify-between"><span>Data Location</span><strong className="text-[#09090b]">India (Recommended)</strong></div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Bottom Consent Confirmation Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                  <div className="lg:col-span-7 p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2 text-xs text-purple-950">
                    <div className="font-bold flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span>Your trust matters</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-purple-900">
                      EndoCore is built with privacy by design. You're in control of your data and how it's used.
                    </p>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-purple-700 pt-1">
                      <a href="#" className="hover:underline">View Privacy Policy</a>
                      <span>•</span>
                      <a href="#" className="hover:underline">View Telemetry Policy</a>
                      <span>•</span>
                      <a href="#" className="hover:underline flex items-center gap-0.5">View AI Policy <ArrowUpRight className="w-3 h-3" /></a>
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-4 rounded-2xl bg-white border border-[#e4e4e7] flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={e => setConsentAccepted(e.target.checked)}
                      className="w-5 h-5 accent-purple-600 cursor-pointer shrink-0 rounded"
                    />
                    <label className="text-xs font-bold text-[#09090b] leading-snug cursor-pointer">
                      I have reviewed all settings and agree to the EndoCore Privacy, Telemetry & AI Policies.
                    </label>
                  </div>
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
                  {step === 7 ? "Here's what you're creating" : "Preview of your room configuration"}
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
                
                {/* Members */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-zinc-100 text-[#71717a] flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-[#09090b] text-xs block">7 Members</span>
                    <span className="text-[10px] text-[#71717a] leading-tight block mt-0.5">
                      1 Owner, 2 Admins, 2 Managers, 2 Members, 1 Observer
                    </span>
                  </div>
                </div>

                {/* Access */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-zinc-100 text-[#71717a] flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-[#71717a] font-semibold uppercase block">Access</span>
                    <span className="font-bold text-blue-600 text-xs">
                      {joinPolicy === "APPROVAL_REQUIRED" ? "Approval Required" : joinPolicy === "OPEN" ? "Open Room" : "Invite Only"}
                    </span>
                  </div>
                </div>

                {/* Work Policy */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-zinc-100 text-[#71717a] flex items-center justify-center shrink-0 mt-0.5">
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-[#71717a] font-semibold uppercase block">Work Policy</span>
                    <span className="font-bold text-[#09090b] text-xs">
                      6h focus • 5 tasks daily
                    </span>
                  </div>
                </div>

                {/* AI Assistance */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-zinc-100 text-[#71717a] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-[#71717a] font-semibold uppercase block">AI Assistance</span>
                    <span className="font-bold text-purple-700 text-xs">
                      Coordinated
                    </span>
                  </div>
                </div>

                {/* Privacy */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-zinc-100 text-[#71717a] flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-[#71717a] font-semibold uppercase block">Privacy</span>
                    <span className="font-bold text-purple-700 text-xs">
                      Some data masked
                    </span>
                  </div>
                </div>

                {/* Data Retention */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-zinc-100 text-[#71717a] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-[#71717a] font-semibold uppercase block">Data Retention</span>
                    <span className="font-bold text-[#09090b] text-xs">
                      30 days
                    </span>
                  </div>
                </div>

                {/* Data Location */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-zinc-100 text-[#71717a] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-[#71717a] font-semibold uppercase block">Data Location</span>
                    <span className="font-bold text-[#09090b] text-xs">
                      India (Recommended)
                    </span>
                  </div>
                </div>

              </div>

              {/* Bottom Notice Box */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-[11px] text-purple-900 leading-relaxed flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Ready to launch?</span>
                  <span>Once launched, you can further customize these settings anytime from Room Settings.</span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* 4. STICKY BOTTOM ACTION FOOTER BAR */}
        <div className="bg-white border border-[#e4e4e7] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs sticky bottom-4">
          
          <div className="flex items-center space-x-3 text-xs text-[#71717a]">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl border border-[#e4e4e7] bg-white hover:bg-zinc-50 font-bold text-xs text-[#09090b] transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-[#e4e4e7] hover:bg-zinc-50 font-bold text-xs text-[#09090b] transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Save className="w-4 h-4 text-[#71717a]" />
              <span>Save & Exit</span>
            </button>

            <span className="hidden sm:inline font-mono">All progress is saved automatically</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
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
              <div className="flex flex-col items-center w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !consentAccepted}
                  className="w-full sm:w-auto px-8 py-3 bg-[#09090b] hover:bg-[#27272a] text-white font-extrabold text-xs rounded-xl shadow-xs disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{loading ? "Creating Room..." : "Launch Room"}</span>
                  <Rocket className="w-4 h-4 text-purple-300" />
                </button>
                <span className="text-[10px] text-[#71717a] font-medium mt-1">Your room will be created and members will be notified.</span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
