import React, { useState } from "react";
import { Target, Plus, CheckCircle2, Clock, Flame, TrendingUp, Calendar, Award, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export interface GoalItem {
  id: string;
  title: string;
  category: "FOCUS_TIME" | "TASKS_COMPLETED" | "PRODUCTIVITY_SCORE" | "STREAK";
  targetValue: number;
  currentProgress: number;
  unit: string;
  deadline: string;
  status: "ON_TRACK" | "AT_RISK" | "COMPLETED" | "NOT_STARTED";
}

export function GoalsDashboard() {
  const [goals, setGoals] = useState<GoalItem[]>([
    {
      id: "g1",
      title: "Daily Focus Sprint Target",
      category: "FOCUS_TIME",
      targetValue: 6,
      currentProgress: 4.5,
      unit: "hours",
      deadline: "Today",
      status: "ON_TRACK"
    },
    {
      id: "g2",
      title: "Complete Core Feature Sprint Tasks",
      category: "TASKS_COMPLETED",
      targetValue: 10,
      currentProgress: 7,
      unit: "tasks",
      deadline: "This Week",
      status: "ON_TRACK"
    },
    {
      id: "g3",
      title: "Maintain 85%+ High Productivity Rating",
      category: "PRODUCTIVITY_SCORE",
      targetValue: 85,
      currentProgress: 92,
      unit: "%",
      deadline: "Weekly",
      status: "COMPLETED"
    },
    {
      id: "g4",
      title: "5-Day Deep Work Streak",
      category: "STREAK",
      targetValue: 5,
      currentProgress: 3,
      unit: "days",
      deadline: "End of Week",
      status: "ON_TRACK"
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState(5);
  const [newCategory, setNewCategory] = useState<GoalItem["category"]>("FOCUS_TIME");

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const unitMap = {
      FOCUS_TIME: "hours",
      TASKS_COMPLETED: "tasks",
      PRODUCTIVITY_SCORE: "%",
      STREAK: "days"
    };

    const newGoal: GoalItem = {
      id: Date.now().toString(),
      title: newTitle,
      category: newCategory,
      targetValue: Number(newTarget),
      currentProgress: 0,
      unit: unitMap[newCategory],
      deadline: "Next Week",
      status: "NOT_STARTED"
    };

    setGoals([...goals, newGoal]);
    setNewTitle("");
    setShowAddModal(false);
  };

  const getStatusBadge = (status: GoalItem["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Completed</span>;
      case "ON_TRACK":
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">On Track</span>;
      case "AT_RISK":
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">At Risk</span>;
      default:
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">Not Started</span>;
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Target className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Productivity Goals</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track key performance indicators, set focus milestones, and monitor streak metrics.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Set New Goal</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Goals</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{goals.length}</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl">
            <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Goals Achieved</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {goals.filter(g => g.status === "COMPLETED").length}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl">
            <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Focus Time</p>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">4.5 hrs</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Streak Record</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">3 Days</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl">
            <Flame className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map(goal => {
          const percentage = Math.min(100, Math.round((goal.currentProgress / goal.targetValue) * 100));

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{goal.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Target: {goal.deadline}</span>
                  </div>
                </div>
                {getStatusBadge(goal.status)}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-300">
                    {goal.currentProgress} / {goal.targetValue} {goal.unit}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{percentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      percentage >= 100
                        ? "bg-emerald-500"
                        : percentage >= 50
                        ? "bg-indigo-600"
                        : "bg-amber-500"
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-xl space-y-5"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Productivity Goal</h2>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 8 Hours Focus Time"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Goal Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="FOCUS_TIME">Focus Time (hours)</option>
                  <option value="TASKS_COMPLETED">Tasks Completed</option>
                  <option value="PRODUCTIVITY_SCORE">Productivity Score (%)</option>
                  <option value="STREAK">Streak (days)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Target Amount</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newTarget}
                  onChange={e => setNewTarget(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
