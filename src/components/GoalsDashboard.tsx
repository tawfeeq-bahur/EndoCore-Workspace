import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Sparkles, 
  Filter, 
  Check, 
  X, 
  ArrowUpRight, 
  Award,
  Search,
  ChevronRight
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
}

export function GoalsDashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
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
        // Reset form
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

  const handleQuickAddHours = async (goalId: string, hoursToAdd: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newHours = Math.min(goal.targetHours, goal.currentHours + hoursToAdd);
    const newStatus = newHours >= goal.targetHours ? 'completed' : goal.status;

    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          currentHours: newHours,
          status: newStatus
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setGoals(prev => prev.map(g => g.id === goalId ? updated : g));
      }
    } catch (err) {
      console.error("Error updating goal hours:", err);
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
    const colors: Record<string, { bg: string, text: string, dot: string, border: string }> = {
      'Development': { bg: 'bg-indigo-50/70', text: 'text-indigo-700', dot: 'bg-indigo-500', border: 'border-indigo-100' },
      'Design': { bg: 'bg-pink-50/70', text: 'text-pink-700', dot: 'bg-pink-500', border: 'border-pink-100' },
      'Documentation': { bg: 'bg-emerald-50/70', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-100' },
      'Research': { bg: 'bg-slate-100/70', text: 'text-slate-700', dot: 'bg-slate-500', border: 'border-slate-200' },
      'Other': { bg: 'bg-violet-50/70', text: 'text-violet-700', dot: 'bg-violet-500', border: 'border-violet-100' }
    };
    return colors[cat] || colors['Other'];
  };

  const getDaysRemaining = (deadlineStr: string) => {
    if (!deadlineStr) return null;
    const today = new Date();
    today.setHours(0,0,0,0);
    const deadline = new Date(deadlineStr);
    deadline.setHours(0,0,0,0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: "Overdue", type: "overdue" };
    if (diffDays === 0) return { text: "Due Today", type: "due-today" };
    if (diffDays === 1) return { text: "Due Tomorrow", type: "due-soon" };
    return { text: `${diffDays} days remaining`, type: "future" };
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-12 font-sans text-[#0f172a] relative">
      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a] flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" /> Focus Goals
          </h1>
          <p className="text-sm text-slate-500 mt-1">Set, track, and complete targeted deep work sessions for your core priorities.</p>
        </div>
        <div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Focus Goal
          </button>
        </div>
      </header>

      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        
        {/* STATISTICS OVERVIEW */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Overall Completion" 
            value={`${overallCompletionRate}%`} 
            subtitle={`${totalTrackedHours.toFixed(1)}h of ${totalTargetHours.toFixed(1)}h tracked`}
            icon={<Award className="w-5 h-5 text-indigo-600" />}
          />
          <StatCard 
            title="Active Priorities" 
            value={activeGoalsCount} 
            subtitle="Focus objectives currently active"
            icon={<Target className="w-5 h-5 text-amber-500" />}
          />
          <StatCard 
            title="Completed Milestones" 
            value={completedGoals} 
            subtitle={`Out of ${totalGoals} total goals`}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          />
          <StatCard 
            title="Hours Tracked Today" 
            value={`${totalTrackedHours > 0 ? (totalTrackedHours / Math.max(1, goals.length)).toFixed(1) : 0}h`} 
            subtitle="Average hours per goal"
            icon={<Clock className="w-5 h-5 text-indigo-600" />}
          />
        </section>

        {/* SEARCH AND FILTERS BAR */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex bg-slate-100 rounded-lg p-1 w-fit">
            {(['all', 'active', 'completed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer capitalize ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Filtering options */}
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 md:justify-end w-full">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
            >
              <option value="all">All Categories</option>
              <option value="Development">Development</option>
              <option value="Design">Design</option>
              <option value="Documentation">Documentation</option>
              <option value="Research">Research</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </section>

        {/* GOALS GRID */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Clock className="h-8 w-8 text-indigo-500 animate-spin" />
            <span className="ml-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">Loading focus targets...</span>
          </div>
        ) : filteredGoals.length > 0 ? (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredGoals.map((goal) => {
                const color = getCategoryColor(goal.category);
                const progressPercentage = Math.min(100, Math.round((goal.currentHours / goal.targetHours) * 100));
                const daysInfo = getDaysRemaining(goal.deadline);

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    key={goal.id}
                    className={`bg-white rounded-xl border ${goal.status === 'completed' ? 'border-emerald-100 bg-emerald-50/5' : 'border-slate-200'} shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col`}
                  >
                    {/* Goal Card Header */}
                    <div className="p-5 pb-3 flex items-start justify-between gap-3 border-b border-slate-50">
                      <div className="space-y-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${color.bg} ${color.text} border ${color.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                          {goal.category}
                        </span>
                        <h3 className={`font-bold text-sm leading-tight text-slate-800 ${goal.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                          {goal.title}
                        </h3>
                      </div>
                      
                      {/* Checkbox for Status Toggle */}
                      <button 
                        onClick={() => handleToggleStatus(goal.id)}
                        className={`text-slate-400 hover:text-indigo-600 transition cursor-pointer p-1`}
                        title={goal.status === 'completed' ? "Mark active" : "Mark completed"}
                      >
                        {goal.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Goal Description */}
                    <div className="px-5 py-3 flex-1">
                      <p className={`text-xs ${goal.status === 'completed' ? 'text-slate-400' : 'text-slate-500'} leading-relaxed font-medium`}>
                        {goal.description || "No description provided."}
                      </p>
                    </div>

                    {/* Goal Progress Section */}
                    <div className="px-5 py-3 space-y-2 bg-slate-50/50 border-t border-b border-slate-50">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Progress</span>
                        <span>{goal.currentHours.toFixed(1)}h / {goal.targetHours}h ({progressPercentage}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className={`h-full rounded-full ${goal.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}
                        />
                      </div>
                    </div>

                    {/* Goal Actions & Footer */}
                    <div className="p-4 flex items-center justify-between gap-3 bg-slate-50/50">
                      {/* Quick progress add */}
                      <div className="flex items-center gap-1.5">
                        {goal.status !== 'completed' && (
                          <>
                            <button
                              onClick={() => handleQuickAddHours(goal.id, 1)}
                              className="px-2 py-1 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition cursor-pointer"
                              title="Add 1 Hour"
                            >
                              +1h
                            </button>
                            <button
                              onClick={() => handleQuickAddHours(goal.id, 3)}
                              className="px-2 py-1 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition cursor-pointer"
                              title="Add 3 Hours"
                            >
                              +3h
                            </button>
                          </>
                        )}
                      </div>

                      {/* Deadline & Trash */}
                      <div className="flex items-center gap-2.5">
                        {daysInfo && (
                          <span className={`text-[10px] font-bold ${
                            daysInfo.type === 'overdue' ? 'text-rose-600' :
                            daysInfo.type === 'due-today' || daysInfo.type === 'due-soon' ? 'text-amber-600' : 'text-slate-500'
                          }`}>
                            {daysInfo.text}
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </section>
        ) : (
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="bg-indigo-50 p-4 rounded-full text-indigo-500">
              <Target className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="font-bold text-base text-slate-800">No focus goals found</h3>
              <p className="text-xs text-slate-500 leading-normal">
                {searchQuery || selectedCategory !== 'all' || activeTab !== 'all' 
                  ? "Try adjusting your filters or search query to find your goal." 
                  : "Add your first focus goal to start tracking target hours on your tasks."}
              </p>
            </div>
            {(searchQuery || selectedCategory !== 'all' || activeTab !== 'all') ? (
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setActiveTab('all'); }}
                className="text-indigo-600 hover:text-indigo-500 font-semibold text-xs cursor-pointer border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 py-2 px-4 rounded-lg transition"
              >
                Clear Filters
              </button>
            ) : (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow cursor-pointer transition"
              >
                Create First Goal
              </button>
            )}
          </section>
        )}
      </div>

      {/* CREATE GOAL MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white w-full max-w-md rounded-xl border border-slate-200 shadow-2xl p-6 relative z-10 mx-4"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" /> Create Focus Goal
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddGoal} className="space-y-4">
                {formError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-xs text-rose-600 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Title */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Goal Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Optimize Redis Database Caching"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white px-3 py-2 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Description (Optional)</label>
                  <textarea
                    placeholder="Describe what you want to achieve with this focus hours..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                    className="w-full border border-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white px-3 py-2 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>

                {/* Category & Hours Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                    >
                      <option value="Development">Development</option>
                      <option value="Design">Design</option>
                      <option value="Documentation">Documentation</option>
                      <option value="Research">Research</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Hours</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="1000"
                      value={newTargetHours}
                      onChange={(e) => setNewTargetHours(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium font-mono"
                    />
                  </div>
                </div>

                {/* Deadline */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Deadline (Optional)</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium font-mono"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow hover:disabled:shadow-sm transition disabled:opacity-50 cursor-pointer"
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

function StatCard({ title, value, subtitle, icon }: { title: string, value: string | number, subtitle: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-indigo-100 transition-all duration-300 flex items-start justify-between">
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{title}</span>
        <div className="text-2xl font-bold text-slate-800 leading-tight">{value}</div>
        <span className="text-[10px] font-medium text-slate-500 block leading-none">{subtitle}</span>
      </div>
      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        {icon}
      </div>
    </div>
  );
}
