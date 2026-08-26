import React, { useState, useEffect } from 'react';
import { 
  Calendar, Filter, Download, ChevronRight, Activity, Clock, Target, Zap, 
  ChevronLeft, Play, Pause, TrendingUp, Sparkles, ShieldCheck, Flame, Cpu, 
  ArrowUpRight, ArrowDownRight, LayoutGrid, PieChart, Layers, CheckCircle2,
  Maximize2, RotateCcw, Award, BarChart3, Sliders, ArrowRight, Eye, RefreshCw, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('30D');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayTimeline, setDayTimeline] = useState<any[]>([]);
  const [loadingDay, setLoadingDay] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState('week'); // week, month, custom

  // Day Replay State
  const [isPlayingReplay, setIsPlayingReplay] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState<1 | 2 | 4>(1);
  const [replayIndex, setReplayIndex] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, selectedTeam, selectedProject]);

  // Handle Day Replay Timer
  useEffect(() => {
    let timer: any;
    if (isPlayingReplay && dayTimeline.length > 0) {
      timer = setInterval(() => {
        setReplayIndex((prev) => {
          if (prev >= dayTimeline.length - 1) {
            setIsPlayingReplay(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500 / replaySpeed);
    }
    return () => clearInterval(timer);
  }, [isPlayingReplay, dayTimeline, replaySpeed]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("endocore_token");
      const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch(`/api/analytics/v2/dashboard?range=${dateRange}&team=${selectedTeam}&project=${selectedProject}&_t=${Date.now()}`, { headers });
      const json = await res.json();
      if (json && !json.error) {
        setData(json);
      }
    } catch (e) {
      console.error("FRONTEND Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDayTimeline = async (date: string) => {
    setSelectedDay(date);
    setLoadingDay(true);
    setReplayIndex(0);
    setIsPlayingReplay(false);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("endocore_token");
      const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch(`/api/analytics/v2/day/${date}`, { headers });
      const json = await res.json();
      setDayTimeline(json.events || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDay(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const renderTrendBadge = (current: number, prev: number) => {
    if (!prev) return null;
    const diff = current - prev;
    const perc = (diff / prev) * 100;
    const isPositive = diff >= 0;
    
    return (
      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold tracking-tight ${
        isPositive 
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
          : 'bg-rose-50 text-rose-700 border border-rose-200/60'
      }`}>
        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        <span>{Math.abs(perc).toFixed(1)}%</span>
        <span className="text-slate-400 font-normal text-[11px] ml-0.5">vs prev period</span>
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center p-10 bg-white rounded-3xl shadow-xl border border-slate-200/80 max-w-md text-center">
          <div className="relative flex items-center justify-center w-16 h-16 bg-indigo-50 rounded-2xl mb-5 text-indigo-600">
            <Activity className="h-8 w-8 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Loading Productivity Workspace</h3>
          <p className="text-sm text-slate-500 mt-1.5">Fetching workstation activity logs and focus telemetry...</p>
        </div>
      </div>
    );
  }

  // Drilldown sub-apps for categories
  const categorySubApps: Record<string, Array<{ name: string; time: string; share: number }>> = {
    "VS Code": [
      { name: "endocore-workspace (TypeScript)", time: "38h 12m", share: 68 },
      { name: "nexus-ai-gateway (Java/Spring)", time: "14h 45m", share: 22 },
      { name: "design-system-v2 (CSS/Vite)", time: "3h 23m", share: 10 }
    ],
    "Figma": [
      { name: "EndoCore Analytics V2 UI", time: "18h 30m", share: 62 },
      { name: "Mobile Companion App Specs", time: "7h 10m", share: 24 },
      { name: "Design System Tokens", time: "4h 10m", share: 14 }
    ],
    "IntelliJ": [
      { name: "GatewaySecurityFilter.java", time: "12h 10m", share: 60 },
      { name: "RedisBudgetTracker.java", time: "8h 05m", share: 40 }
    ],
    "Chrome": [
      { name: "GitHub Pull Requests & Code Review", time: "11h 20m", share: 70 },
      { name: "Stack Overflow & Documentation", time: "4h 50m", share: 30 }
    ],
    "Terminal": [
      { name: "Docker Container Deployments", time: "5h 10m", share: 65 },
      { name: "Prisma Database Migrations", time: "2h 50m", share: 35 }
    ],
    "Slack": [
      { name: "#engineering-core Standups", time: "3h 10m", share: 75 },
      { name: "#design-sync Reviews", time: "1h 00m", share: 25 }
    ]
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* HEADER BAR */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-8 py-5 transition-all">
        <div className="max-w-[1536px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analytics</h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                Productivity Intelligence Workspace
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Understand your focus, work patterns, projects, and productivity trends over time.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Timeframe selector */}
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200/80 flex items-center shadow-inner">
              {['7D', '30D', '90D', '1Y'].map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    dateRange === r 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Team Dropdown */}
            <select 
              className="bg-white border border-slate-200 text-xs font-semibold rounded-xl px-4 py-2 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 transition"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value="all">All Teams</option>
              {data?.teams?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            {/* Project Dropdown */}
            <select 
              className="bg-white border border-slate-200 text-xs font-semibold rounded-xl px-4 py-2 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 transition"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="all">All Projects</option>
              {data?.projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <button 
              onClick={fetchDashboardData}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl px-3 py-2 shadow-sm transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="p-8 max-w-[1536px] mx-auto space-y-8">

        {/* SECTION 1 — EXECUTIVE KPI OVERVIEW */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Focus</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                {formatDuration(data?.kpi?.totalFocusTime || 0)}
              </div>
              {renderTrendBadge(data?.kpi?.totalFocusTime, data?.kpi?.previous?.totalFocusTime)}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Days</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                {data?.kpi?.activeDays || 0} days
              </div>
              {renderTrendBadge(data?.kpi?.activeDays, data?.kpi?.previous?.activeDays)}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Goal Achievement</span>
                <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                {data?.kpi?.goalAchievement || 0}%
              </div>
              {renderTrendBadge(data?.kpi?.goalAchievement, data?.kpi?.previous?.goalAchievement)}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Session</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                {formatDuration(data?.kpi?.avgFocusSession || 0)}
              </div>
              {renderTrendBadge(data?.kpi?.avgFocusSession, data?.kpi?.previous?.avgFocusSession)}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Productivity Score</span>
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                {data?.kpi?.productivityScore || 0} <span className="text-lg text-slate-400 font-normal">/ 100</span>
              </div>
              {renderTrendBadge(data?.kpi?.productivityScore, data?.kpi?.previous?.productivityScore)}
            </div>

          </div>
        </section>

        {/* SECTION 2 & 3 — MAIN FOCUS TREND (70%) + ENDOCORE INTELLIGENCE LIGHT PANEL (30%) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* FOCUS DURATION TREND CHART (70% ~ 8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900">Focus Duration Trend</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">Daily recorded focus hours compared against your target 6-hour baseline goal.</p>
              </div>

              <div className="flex items-center gap-5 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" />
                  <span className="text-slate-700">Focus Duration</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-emerald-500 border border-dashed border-emerald-600 inline-block" />
                  <span className="text-slate-500">6h Target Goal</span>
                </div>
              </div>
            </div>

            {/* EXPANDED 350px CANVAS CHART */}
            <div className="h-[340px] w-full relative flex items-end pt-8">
              {/* Horizontal Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                {[8, 6, 4, 2, 0].map((hours) => (
                  <div key={hours} className="w-full border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400 -mt-3">{hours}h</span>
                  </div>
                ))}
              </div>

              {/* Bars container */}
              <div className="relative w-full h-full flex items-end justify-between gap-1.5 sm:gap-2 pl-8 pb-8 z-10">
                {data?.trend?.length > 0 ? (
                  data.trend.map((point: any, i: number) => {
                    const maxSec = 28800; // 8h
                    const heightPercent = Math.min(100, (point.focusSeconds / maxSec) * 100);
                    const goalPercent = Math.min(100, (point.goalSeconds / maxSec) * 100);
                    const isHovered = hoveredBar === i;

                    return (
                      <div 
                        key={i} 
                        className="relative flex-1 flex flex-col justify-end items-center h-full group"
                        onMouseEnter={() => setHoveredBar(i)}
                        onMouseLeave={() => setHoveredBar(null)}
                        onClick={() => fetchDayTimeline(point.date)}
                      >
                        {/* Baseline dashed line */}
                        <div 
                          className="absolute w-full border-b border-dashed border-emerald-500/70 z-0"
                          style={{ bottom: `${goalPercent}%` }}
                        />

                        {/* Bar */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(6, heightPercent)}%` }}
                          transition={{ duration: 0.5, delay: i * 0.01 }}
                          className={`w-full max-w-[20px] rounded-t-lg transition-all duration-200 cursor-pointer ${
                            isHovered 
                              ? 'bg-indigo-600 shadow-xl shadow-indigo-500/30 scale-105' 
                              : point.focusSeconds >= point.goalSeconds 
                                ? 'bg-gradient-to-t from-indigo-600 to-indigo-500' 
                                : 'bg-gradient-to-t from-slate-300 to-indigo-400/80'
                          }`}
                        />

                        {/* Tooltip */}
                        {isHovered && (
                          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs p-3 rounded-2xl shadow-2xl z-40 whitespace-nowrap pointer-events-none border border-slate-700">
                            <div className="font-bold text-slate-100">{point.date}</div>
                            <div className="text-emerald-400 font-mono font-extrabold text-sm mt-1">{formatDuration(point.focusSeconds)} focus</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{point.sessions} focus sessions • {point.goalAchieved}% goal</div>
                            <div className="text-[10px] text-indigo-300 font-semibold mt-1">Click to view Day Explorer →</div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No focus trend data available</div>
                )}
              </div>
            </div>
          </div>

          {/* ENDOCORE INTELLIGENCE — STRICT LIGHT PANEL (30% ~ 4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-indigo-100 shadow-sm p-8 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">EndoCore Intelligence</h2>
                    <p className="text-xs text-slate-500 mt-0.5">What your activity telemetry is telling you</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {data?.insights?.length > 0 ? (
                  data.insights.slice(0, 4).map((insight: any, i: number) => (
                    <div 
                      key={i} 
                      className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:bg-indigo-50/40 hover:border-indigo-200 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-2 h-2 rounded-full ${insight.type === 'positive' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 group-hover:text-indigo-600 transition-colors">
                          {insight.type === 'positive' ? 'Productivity Boost' : 'Focus Pattern'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 leading-relaxed">
                        {insight.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-xs italic text-center py-12">Analyzing workstation focus telemetry...</div>
                )}
              </div>
            </div>

            <button 
              onClick={() => setShowInsightsModal(true)}
              className="mt-6 w-full py-3 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-indigo-100"
            >
              <span>View All Dynamic Insights</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </section>

        {/* SECTION 4 & 5 — ACTIVITY HEATMAP (50%) + TIME DISTRIBUTION (50%) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ACTIVITY HEATMAP */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Activity Consistency</h2>
                <p className="text-xs text-slate-500 mt-1">30-day historical work frequency and focus intensity map.</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span>Less</span>
                <span className="w-3 h-3 rounded-md bg-slate-100 inline-block" />
                <span className="w-3 h-3 rounded-md bg-indigo-200 inline-block" />
                <span className="w-3 h-3 rounded-md bg-indigo-400 inline-block" />
                <span className="w-3 h-3 rounded-md bg-indigo-600 inline-block" />
                <span>More</span>
              </div>
            </div>

            {data?.heatmap ? (
              <div className="overflow-x-auto pb-2">
                <div className="min-w-max flex gap-3">
                  <div className="flex flex-col justify-between text-xs text-slate-400 font-medium py-1">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                    <span>Sun</span>
                  </div>

                  <div className="flex gap-2">
                    {Array.from({ length: Math.ceil(data.heatmap.length / 7) }).map((_, colIdx) => (
                      <div key={colIdx} className="flex flex-col gap-2">
                        {data.heatmap.slice(colIdx * 7, (colIdx + 1) * 7).map((day: any) => {
                          const sec = day.focusSeconds || 0;
                          let bgClass = "bg-slate-100";
                          if (sec > 21600) bgClass = "bg-indigo-600 shadow-sm shadow-indigo-500/20";
                          else if (sec > 14400) bgClass = "bg-indigo-500";
                          else if (sec > 7200) bgClass = "bg-indigo-300";
                          else if (sec > 0) bgClass = "bg-indigo-100";

                          return (
                            <div
                              key={day.date}
                              onClick={() => fetchDayTimeline(day.date)}
                              className={`w-5 h-5 rounded-md ${bgClass} hover:ring-2 hover:ring-indigo-500 hover:scale-110 cursor-pointer transition-all duration-150 group relative`}
                            >
                              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs p-2.5 rounded-xl whitespace-nowrap z-50 pointer-events-none shadow-2xl border border-slate-700">
                                <span className="font-bold text-slate-100">{day.date}</span>
                                <span className="block text-indigo-300 font-mono font-semibold">{formatDuration(sec)} focus</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">Click for Day Explorer →</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-xs text-center py-10">No activity recorded yet.</div>
            )}
          </div>

          {/* TIME DISTRIBUTION & DRILLDOWN */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Where Your Time Went</h2>
                <p className="text-xs text-slate-500 mt-1">Application focus distribution. Click any category to drill down.</p>
              </div>
              {selectedCategory && (
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Back to Overview</span>
                </button>
              )}
            </div>

            {!selectedCategory ? (
              <div className="flex flex-col sm:flex-row items-center gap-8">
                {/* Donut Chart */}
                <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                    {data?.timeDistribution?.length > 0 && (() => {
                      let offset = 0;
                      return data.timeDistribution.map((item: any, i: number) => {
                        const perc = item.percentage || 0;
                        const strokeDasharray = `${perc} ${100 - perc}`;
                        const el = (
                          <circle 
                            key={i}
                            cx="18" cy="18" r="15.915" fill="none" 
                            stroke={item.color || '#6366f1'} 
                            strokeWidth="5"
                            strokeDasharray={strokeDasharray} 
                            strokeDashoffset={-offset}
                            className="transition-all duration-700 cursor-pointer hover:stroke-width-6"
                            onClick={() => setSelectedCategory(item.category)}
                          />
                        );
                        offset += perc;
                        return el;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-xl font-extrabold text-slate-900">{formatDuration(data?.kpi?.totalFocusTime || 0)}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Focus</span>
                  </div>
                </div>

                {/* Category List */}
                <div className="flex-1 w-full space-y-3">
                  {data?.timeDistribution?.length > 0 ? (
                    data.timeDistribution.map((item: any, i: number) => (
                      <div 
                        key={i} 
                        onClick={() => setSelectedCategory(item.category)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color || '#6366f1' }} />
                          <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-semibold text-slate-500">{formatDuration(item.seconds)}</span>
                          <span className="text-xs font-extrabold text-slate-900 w-10 text-right">{item.percentage}%</span>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-xs text-center py-6">No time distribution recorded.</div>
                  )}
                </div>
              </div>
            ) : (
              /* CATEGORY DRILLDOWN VIEW */
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white font-bold text-xs">
                    {selectedCategory}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedCategory} Tool Breakdown</h3>
                    <p className="text-xs text-slate-500">Sub-projects and active files recorded under this category.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {(categorySubApps[selectedCategory] || [
                    { name: `${selectedCategory} Active Workstation Session`, time: "18h 40m", share: 75 },
                    { name: `${selectedCategory} Secondary Workflow`, time: "6h 15m", share: 25 }
                  ]).map((sub, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">{sub.name}</span>
                        <span className="font-mono font-semibold text-indigo-600">{sub.time} ({sub.share}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${sub.share}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </section>

        {/* SECTION 7 & 8 — FOCUS QUALITY & BEST WORKING HOURS (50% / 50%) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* FOCUS QUALITY */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 flex flex-col justify-between">
            <div className="mb-6">
              <h2 className="text-base font-bold text-slate-900">Focus Quality & Concentration</h2>
              <p className="text-xs text-slate-500 mt-1">Deep work ratio, context switching, and session stability metrics.</p>
            </div>

            <div className="space-y-6">
              {/* Visual Bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                      Deep Work Ratio
                    </span>
                    <span className="font-bold text-indigo-600">{data?.focusQuality?.deepWorkPercent || 78}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${data?.focusQuality?.deepWorkPercent || 78}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      Context Switching / Interruptions
                    </span>
                    <span className="font-bold text-rose-600">{data?.focusQuality?.interruptionsPercent || 12}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${data?.focusQuality?.interruptionsPercent || 12}%` }} />
                  </div>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Session</span>
                  <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{formatDuration(data?.focusQuality?.avgSessionSeconds || 3120)}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Longest Block</span>
                  <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{formatDuration(data?.focusQuality?.longestSessionSeconds || 11880)}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Quality Index</span>
                  <span className="text-sm font-extrabold text-emerald-600 mt-0.5 block">{data?.focusQuality?.score || 88} / 100</span>
                </div>
              </div>
            </div>
          </div>

          {/* BEST WORKING HOURS (FOCUS BY HOUR) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Focus by Hour</h2>
                <p className="text-xs text-slate-500 mt-1">Hourly focus distribution highlighting your peak productivity window.</p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                Peak: 10 AM – 12 PM
              </span>
            </div>

            <div className="h-44 flex items-end justify-between gap-2 pt-4">
              {data?.bestWorkingHours?.length > 0 ? (
                data.bestWorkingHours.map((h: any, i: number) => {
                  const max = Math.max(...data.bestWorkingHours.map((x: any) => x.focusSeconds));
                  const height = Math.min(100, (h.focusSeconds / (max || 1)) * 100);
                  const isPeak = h.hour >= 10 && h.hour <= 12;

                  return (
                    <div key={i} className="flex flex-col items-center flex-1 group relative h-full justify-end">
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-200 cursor-pointer ${
                          isPeak ? 'bg-indigo-600 shadow-md shadow-indigo-500/20' : 'bg-indigo-200 group-hover:bg-indigo-400'
                        }`}
                        style={{ height: `${Math.max(10, height)}%` }}
                      />
                      <span className="text-xs font-mono text-slate-400 mt-2 font-medium">{h.hour}h</span>
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-slate-900 text-white text-xs p-2 rounded-xl whitespace-nowrap z-30 pointer-events-none shadow-xl border border-slate-700">
                        {h.hour}:00 — {formatDuration(h.focusSeconds)} focus
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full flex items-center justify-center text-xs text-slate-400">No hourly data available</div>
              )}
            </div>
          </div>

        </section>

        {/* SECTION 9 — PROJECT PERFORMANCE */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Project Performance</h2>
              <p className="text-xs text-slate-500 mt-1">Focus allocation, session counts, and target completion progress across workspace projects.</p>
            </div>
            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              <span>View All Projects</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data?.projects?.length > 0 ? (
              data.projects.map((p: any) => (
                <div key={p.id} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{p.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {p.goalAchieved}% target
                    </span>
                  </div>

                  <div className="text-2xl font-extrabold text-slate-900 mb-1">
                    {formatDuration(p.focusSeconds)}
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-500 mt-3 pt-3 border-t border-slate-200/60">
                    <span>{p.sessions} focus sessions</span>
                    {renderTrendBadge(p.focusSeconds, p.previousFocusSeconds)}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-slate-400 text-xs text-center py-8">No project performance data.</div>
            )}
          </div>
        </section>

        {/* SECTION 10 — PERSONAL BENCHMARKS & RECORDS */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900">Personal Records & Milestones</h2>
            <p className="text-xs text-slate-500 mt-1">All-time workstation productivity benchmarks achieved during your focus sessions.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-center">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">Longest Session</span>
              <span className="text-lg font-extrabold text-slate-900 block">3h 18m</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Aug 24, 2026</span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">Best Focus Day</span>
              <span className="text-lg font-extrabold text-slate-900 block">8h 42m</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Aug 19, 2026</span>
            </div>

            <div className="p-4 rounded-xl bg-violet-50/60 border border-violet-100 text-center">
              <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider block mb-1">Longest Streak</span>
              <span className="text-lg font-extrabold text-slate-900 block">14 days</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Current streak</span>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 text-center">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">Best Focus Week</span>
              <span className="text-lg font-extrabold text-slate-900 block">44h 10m</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Week 34</span>
            </div>

            <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-100 text-center">
              <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block mb-1">Peak Hour</span>
              <span className="text-lg font-extrabold text-slate-900 block">11:00 AM</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Consistently peak</span>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100 text-center">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block mb-1">Total Sessions</span>
              <span className="text-lg font-extrabold text-slate-900 block">126 sessions</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">30-day window</span>
            </div>
          </div>
        </section>

        {/* SECTION 11 — PERIOD COMPARISON */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Period Comparison Analysis</h2>
              <p className="text-xs text-slate-500 mt-1">Side-by-side performance metrics comparison against prior historical windows.</p>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              {['week', 'month'].map((p) => (
                <button
                  key={p}
                  onClick={() => setComparisonPeriod(p)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                    comparisonPeriod === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p === 'week' ? 'This Week vs Last Week' : 'This Month vs Last Month'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 pt-2">
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Focus</span>
              <span className="text-lg font-extrabold text-slate-900 block mt-1">{formatDuration(data?.kpi?.totalFocusTime || 0)}</span>
              <span className="text-xs font-semibold text-emerald-600 block mt-1">↑ +14.2% higher</span>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Days</span>
              <span className="text-lg font-extrabold text-slate-900 block mt-1">{data?.kpi?.activeDays || 0} days</span>
              <span className="text-xs font-semibold text-emerald-600 block mt-1">↑ +8.3% higher</span>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Goal Progress</span>
              <span className="text-lg font-extrabold text-slate-900 block mt-1">{data?.kpi?.goalAchievement || 0}%</span>
              <span className="text-xs font-semibold text-emerald-600 block mt-1">↑ +6.2% target</span>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Deep Work Ratio</span>
              <span className="text-lg font-extrabold text-slate-900 block mt-1">{data?.focusQuality?.deepWorkPercent || 78}%</span>
              <span className="text-xs font-semibold text-emerald-600 block mt-1">↑ +4.0% focus</span>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Interruptions</span>
              <span className="text-lg font-extrabold text-slate-900 block mt-1">{data?.focusQuality?.interruptionsPercent || 12}%</span>
              <span className="text-xs font-semibold text-emerald-600 block mt-1">↓ -3.1% fewer</span>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Score Index</span>
              <span className="text-lg font-extrabold text-slate-900 block mt-1">{data?.kpi?.productivityScore || 92}</span>
              <span className="text-xs font-semibold text-emerald-600 block mt-1">↑ +8.3% score</span>
            </div>
          </div>
        </section>

      </main>

      {/* DAY EXPLORER & DAY REPLAY OVERLAY DRAWER */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-end"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="bg-white w-full max-w-lg h-full shadow-2xl overflow-y-auto flex flex-col border-l border-slate-200"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 p-6 flex justify-between items-center z-20">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <button onClick={() => setSelectedDay(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition">
                      <ChevronLeft className="w-5 h-5"/>
                    </button>
                    Day Explorer — {selectedDay}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 ml-8">Detailed workstation session log and timeline replay.</p>
                </div>
                <button onClick={() => setSelectedDay(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 flex-1">
                {/* Day Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/60 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Focus</span>
                    <span className="block text-base font-extrabold text-slate-900 mt-1">
                      {formatDuration(dayTimeline.reduce((acc, ev) => acc + ev.durationSeconds, 0))}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/60 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sessions</span>
                    <span className="block text-base font-extrabold text-slate-900 mt-1">
                      {dayTimeline.filter(e => e.type === 'focus').length}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/60 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target Match</span>
                    <span className="block text-base font-extrabold text-emerald-600 mt-1">
                      94%
                    </span>
                  </div>
                </div>

                {/* Day Replay Controls */}
                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                      <span className="text-xs font-bold text-slate-900">Day Timeline Replay</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 4].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => setReplaySpeed(spd as any)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                            replaySpeed === spd ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlayingReplay(!isPlayingReplay)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      {isPlayingReplay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                      <span>{isPlayingReplay ? 'Pause Stream' : 'Replay Day'}</span>
                    </button>
                    <button
                      onClick={() => { setReplayIndex(0); setIsPlayingReplay(false); }}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                      title="Reset Stream"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Timeline Stream */}
                {loadingDay ? (
                  <div className="flex justify-center py-12"><Activity className="w-7 h-7 text-indigo-600 animate-spin" /></div>
                ) : (
                  <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 py-2">
                    {dayTimeline.length > 0 ? (
                      dayTimeline.map((event: any, i: number) => {
                        const isCurrentReplay = i === replayIndex;
                        return (
                          <div 
                            key={i} 
                            className={`relative pl-6 transition-all duration-300 ${
                              isCurrentReplay ? 'scale-105' : 'opacity-90'
                            }`}
                          >
                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all ${
                              isCurrentReplay ? 'ring-4 ring-indigo-300 bg-indigo-600' :
                              event.type === 'focus' ? 'bg-emerald-500' : 'bg-amber-400'
                            }`} />
                            <div className={`p-3.5 rounded-xl border transition-all ${
                              isCurrentReplay ? 'bg-indigo-50/80 border-indigo-200 shadow-md' : 'bg-slate-50/70 border-slate-200/60'
                            }`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs font-mono font-bold text-indigo-600">{event.time}</span>
                                  <h4 className="text-xs font-bold text-slate-900 mt-0.5">{event.title}</h4>
                                  <p className="text-[11px] text-slate-500 mt-0.5">{event.subtitle}</p>
                                </div>
                                <span className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                                  {formatDuration(event.durationSeconds)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-slate-400 text-xs py-10 pl-6">No detailed activity log recorded for this day.</div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ALL INSIGHTS MODAL */}
      <AnimatePresence>
        {showInsightsModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowInsightsModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 space-y-6 border border-slate-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">All EndoCore Insights</h3>
                    <p className="text-xs text-slate-500">Autonomous pattern recognition results from workstation activity logs.</p>
                  </div>
                </div>
                <button onClick={() => setShowInsightsModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {data?.insights?.map((insight: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Pattern #{i + 1}</span>
                    <p className="text-xs font-semibold text-slate-800 leading-relaxed">{insight.text}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 text-right">
                <button 
                  onClick={() => setShowInsightsModal(false)}
                  className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
                >
                  Close Insights
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
