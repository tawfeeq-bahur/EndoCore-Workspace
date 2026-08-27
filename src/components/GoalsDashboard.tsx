import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Check, 
  X, 
  Award,
  Search,
  Shield,
  ExternalLink,
  Calendar,
  BarChart2,
  Code,
  FileText,
  CheckCircle,
  Lightbulb,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  targetHours: number;
  currentHours: number;
  status: 'active' | 'completed';
  deadline: string;
  createdAt: string;
  priority?: string;
}

export function GoalsDashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'recent' | 'demo'>('recent');
  
  // Form fields for new goal
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Development');
  const [newTargetHours, setNewTargetHours] = useState('10');
  const [newDeadline, setNewDeadline] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("endocore_token");
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/goals', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      } else {
        console.error("Failed to fetch goals:", res.statusText);
      }
    } catch (err) {
      console.error("Error fetching goals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError("Goal title is required");
      return;
    }
    const target = parseFloat(newTargetHours);
    if (isNaN(target) || target <= 0) {
      setFormError("Target hours must be a positive number");
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          category: newCategory,
          targetHours: target,
          deadline: newDeadline || undefined
        })
      });

      if (res.ok) {
        const newGoal = await res.json();
        setGoals(prev => [newGoal, ...prev]);
        setIsModalOpen(false);
        setNewTitle('');
        setNewDescription('');
        setNewCategory('Development');
        setNewTargetHours('10');
        setNewDeadline('');
      } else {
        const errData = await res.json();
        setFormError(errData.error || "Failed to create goal");
      }
    } catch (err) {
      setFormError("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newStatus = goal.status === 'active' ? 'completed' : 'active';
    const newHours = newStatus === 'completed' ? goal.targetHours : Math.min(goal.currentHours, goal.targetHours - 1);

    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          status: newStatus,
          currentHours: newHours
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setGoals(prev => prev.map(g => g.id === goalId ? updated : g));
      }
    } catch (err) {
      console.error("Error toggling goal status:", err);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this focus goal?")) return;

    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (res.ok) {
        setGoals(prev => prev.filter(g => g.id !== goalId));
      }
    } catch (err) {
      console.error("Error deleting goal:", err);
    }
  };

  // Filter & Search Goals
  const filteredGoals = goals.filter(goal => {
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'active' && goal.status === 'active') || 
      (activeTab === 'completed' && goal.status === 'completed');
      
    const matchesCategory = selectedCategory === 'all' || goal.category === selectedCategory;
    
    const matchesSearch = 
      goal.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      goal.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesCategory && matchesSearch;
  });

  // Calculate Statistics
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const activeGoalsCount = goals.filter(g => g.status === 'active').length;
  const totalTargetHours = goals.reduce((acc, g) => acc + g.targetHours, 0);
  const totalTrackedHours = goals.reduce((acc, g) => acc + g.currentHours, 0);
  const overallCompletionRate = totalTargetHours > 0 ? Math.round((totalTrackedHours / totalTargetHours) * 100) : 0;

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, { bg: string, text: string, bar: string }> = {
      'Development': { bg: 'bg-blue-50 text-blue-600 border-blue-200', text: 'text-blue-600', bar: 'bg-blue-500' },
      'Design': { bg: 'bg-orange-50 text-orange-600 border-orange-200', text: 'text-orange-600', bar: 'bg-orange-500' },
      'Documentation': { bg: 'bg-emerald-50 text-emerald-600 border-emerald-200', text: 'text-emerald-600', bar: 'bg-emerald-500' },
      'Research': { bg: 'bg-purple-50 text-purple-600 border-purple-200', text: 'text-purple-600', bar: 'bg-purple-500' },
      'Other': { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-700', bar: 'bg-slate-700' }
    };
    return colors[cat] || colors['Other'];
  };

  const getDaysRemaining = (deadlineStr: string) => {
    if (!deadlineStr) return { text: "Due in 5 days", type: "normal" };
    const today = new Date();
    today.setHours(0,0,0,0);
    const deadline = new Date(deadlineStr);
    deadline.setHours(0,0,0,0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: "Overdue", type: "overdue" };
    if (diffDays === 0) return { text: "Due Today", type: "due-today" };
    if (diffDays === 1) return { text: "Due Tomorrow", type: "due-soon" };
    return { text: `Due in ${diffDays} days`, type: "normal" };
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-12 font-sans text-[#0f172a]">
      
      {/* PAGE HEADER */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-slate-200/80 bg-white">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-900">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Focus Goals</h1>
              <span className="text-xs text-slate-400 font-medium">| Guild: Engineering Team</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#09090b] hover:bg-black text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Focus Goal
        </button>
      </div>

      <div className="w-full p-6 space-y-6">

        {/* PRIVACY LAYER BANNER */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-white border border-indigo-200 text-indigo-600 shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">EndoCore Privacy Layer</h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Workspace signals are processed through EndoCore's privacy boundary before being shared with the workspace.
              </p>
            </div>
          </div>

          <a href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 shrink-0">
            <span>Learn more</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* MAIN LAYOUT: GOALS CONTENT (LEFT) + SIDEBAR (RIGHT) */}
        <div className="flex flex-col xl:flex-row gap-6 items-start w-full">

          {/* LEFT MAIN AREA (FLEX-1 FULL REMAINING WIDTH) */}
          <div className="flex-1 min-w-0 space-y-6 w-full">

            {/* STATS OVERVIEW CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OVERALL COMPLETION</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{overallCompletionRate}%</div>
                  <span className="text-[11px] text-slate-400 font-mono block mt-1">{totalTrackedHours.toFixed(1)}h of {totalTargetHours.toFixed(1)}h tracked</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACTIVE PRIORITIES</span>
                  <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{activeGoalsCount}</div>
                  <span className="text-[11px] text-slate-400 font-medium block mt-1">Focus objectives currently active</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">COMPLETED MILESTONES</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{completedGoals}</div>
                  <span className="text-[11px] text-slate-400 font-medium block mt-1">Out of {totalGoals} total goals</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HOURS TRACKED THIS WEEK</span>
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">26.5h</div>
                  <span className="text-[11px] text-slate-400 font-medium block mt-1">Average 8.8h per goal</span>
                </div>
              </div>
            </div>

            {/* SEARCH AND FILTERS BAR */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
              <div className="flex bg-slate-100 rounded-xl p-1 w-full sm:w-auto">
                {(['all', 'active', 'completed'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer capitalize ${activeTab === tab ? 'bg-[#09090b] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto flex-1 justify-end">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search goals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition-all"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="Development">Development</option>
                  <option value="Design">Design</option>
                  <option value="Documentation">Documentation</option>
                  <option value="Research">Research</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* GOALS GRID */}
            {loading ? (
              <div className="flex h-64 items-center justify-center bg-white rounded-2xl border border-slate-200">
                <Clock className="h-6 w-6 text-slate-400 animate-spin" />
                <span className="ml-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Loading goals...</span>
              </div>
            ) : filteredGoals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredGoals.map((goal) => {
                  const color = getCategoryColor(goal.category);
                  const progressPercentage = Math.min(100, Math.round((goal.currentHours / goal.targetHours) * 100));
                  const daysInfo = getDaysRemaining(goal.deadline);

                  return (
                    <div
                      key={goal.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${color.bg}`}>
                            {goal.category}
                          </span>

                          <button 
                            onClick={() => handleToggleStatus(goal.id)}
                            className="text-slate-400 hover:text-emerald-500 transition cursor-pointer p-0.5"
                          >
                            {goal.status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300" />
                            )}
                          </button>
                        </div>

                        <div>
                          <h3 className={`font-bold text-sm text-slate-900 ${goal.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                            {goal.title}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2 leading-relaxed">
                            {goal.description || "No description provided."}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <span>PROGRESS</span>
                            <span>{goal.currentHours.toFixed(1)}h / {goal.targetHours}h ({progressPercentage}%)</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${progressPercentage}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 font-medium border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className={daysInfo.type === 'due-today' ? "text-amber-600 font-bold" : "text-slate-500"}>
                              {daysInfo.text}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <BarChart2 className="w-3 h-3" />
                              {goal.priority || "High Priority"}
                            </span>
                            <button
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="p-1 text-slate-300 hover:text-rose-500 transition cursor-pointer"
                              title="Delete Goal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
                <div className="p-3 bg-slate-50 rounded-full w-fit mx-auto text-slate-400 border border-slate-200">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">No focus goals found</h3>
                  <p className="text-xs text-slate-500 mt-1">Create a new focus goal to start tracking your targets.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-[#09090b] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Create Goal
                </button>
              </div>
            )}

          </div>

          {/* RIGHT SIDEBAR (320px FIXED WIDTH) */}
          <div className="w-full xl:w-[320px] 2xl:w-[340px] shrink-0 space-y-6">

            {/* RECENT ACTIVITY & DEMO LOGS CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-4 text-xs font-bold">
                  <button 
                    onClick={() => setSidebarTab('recent')}
                    className={`pb-1 border-b-2 transition-all cursor-pointer ${sidebarTab === 'recent' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  >
                    RECENT ACTIVITY
                  </button>
                  <button 
                    onClick={() => setSidebarTab('demo')}
                    className={`pb-1 border-b-2 transition-all cursor-pointer ${sidebarTab === 'demo' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  >
                    DEMO LOGS
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      <Code className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900">Core API Optimization</h5>
                      <span className="text-[10px] text-slate-400 font-medium block">Tracked 1.5h</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">2m ago</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      <Layers className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900">Design System Migration</h5>
                      <span className="text-[10px] text-slate-400 font-medium block">Tracked 2.0h</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">5m ago</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900">Write Architecture Docs</h5>
                      <span className="text-[10px] text-slate-400 font-medium block">Tracked 1.0h</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">1h ago</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <CheckCircle className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900">Focus session completed</h5>
                      <span className="text-[10px] text-slate-400 font-medium block">2.5h logged</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">2h ago</span>
                </div>
              </div>

              <button className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-900 flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                <span>View all activity</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* NEED A CUSTOM GOAL TYPE? CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  NEED A CUSTOM GOAL TYPE?
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                  Don't see a goal type that fits your workflow? Request a custom goal category for your team.
                </p>
              </div>

              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-900 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="h-4 w-4" />
                <span>Request Goal Type</span>
              </button>
            </div>

            {/* TIPS FOR SUCCESS CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-2xs">
              <div className="flex items-center space-x-2 text-slate-900">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider">TIPS FOR SUCCESS</h4>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Break large goals into smaller focus sessions for better results.
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* CREATE GOAL MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 relative z-10 space-y-5"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" /> Create Focus Goal
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddGoal} className="space-y-4">
                {formError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-600 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Goal Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Core API Optimization"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-slate-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Description (Optional)</label>
                  <textarea
                    placeholder="Describe your goal..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                    className="w-full border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-slate-400 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-slate-400 transition-all font-medium"
                    >
                      <option value="Development">Development</option>
                      <option value="Design">Design</option>
                      <option value="Documentation">Documentation</option>
                      <option value="Research">Research</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Target Hours</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="1000"
                      value={newTargetHours}
                      onChange={(e) => setNewTargetHours(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-slate-400 transition-all font-medium font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Deadline (Optional)</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 focus:bg-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-slate-400 transition-all font-medium font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#09090b] hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Creating..." : "Create Goal"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
