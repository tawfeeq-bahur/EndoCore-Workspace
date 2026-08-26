import React, { useState, useEffect } from 'react';
import { 
  Calendar, Filter, Download, ChevronRight, Activity, Clock, Target, Zap, 
  ChevronLeft, Play, TrendingUp, Sparkles, ShieldCheck, Flame, Cpu, 
  ArrowUpRight, ArrowDownRight, LayoutGrid, PieChart, Layers, CheckCircle2
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

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, selectedTeam, selectedProject]);

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

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm text-center">
          <div className="relative flex items-center justify-center w-14 h-14 bg-indigo-50 rounded-2xl mb-4 text-indigo-600">
            <Activity className="h-7 w-7 animate-spin" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Synchronizing Telemetry</h3>
          <p className="text-xs text-slate-500 mt-1">Aggregating workstation activity metrics...</p>
        </div>
      </div>
    );
  }

  const renderTrend = (current: number, prev: number, format: 'time' | 'percent' | 'number' = 'number', inverted: boolean = false) => {
    if (!prev) return null;
    const diff = current - prev;
    const perc = (diff / prev) * 100;
    let isPositive = diff >= 0;
    if (inverted) isPositive = !isPositive;
    
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-tight ${
        isPositive 
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' 
          : 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20'
      }`}>
        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        <span>{Math.abs(perc).toFixed(1)}%</span>
        <span className="text-slate-400 font-normal text-[10px]">vs prev</span>
      </div>
    );
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-16 font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      
      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-6 py-4 transition-all">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Workstation Analytics</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                Live V2 Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Deep telemetry insights across development sessions, focus windows, and project allocation.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Range Toggle */}
            <div className="bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 flex items-center shadow-inner">
              {['7D', '30D', '90D', '1Y'].map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    dateRange === r 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Team Filter */}
            <div className="relative">
              <select 
                className="appearance-none bg-white border border-slate-200 text-xs font-medium rounded-xl px-3.5 py-2 pr-8 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 transition"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="all">All Teams</option>
                {data?.teams?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            {/* Project Filter */}
            <div className="relative">
              <select 
                className="appearance-none bg-white border border-slate-200 text-xs font-medium rounded-xl px-3.5 py-2 pr-8 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 transition"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="all">All Projects</option>
                {data?.projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <button 
              onClick={fetchDashboardData}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl p-2 shadow-sm transition-all hover:shadow"
              title="Refresh Data"
            >
              <Filter className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD CONTENT */}
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        
        {/* KPI OVERVIEW CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard 
            icon={<Clock className="w-4 h-4 text-indigo-600" />}
            title="Total Focus Time" 
            value={formatDuration(data?.kpi?.totalFocusTime || 0)} 
            subtitle="Recorded deep work"
            trend={renderTrend(data?.kpi?.totalFocusTime, data?.kpi?.previous?.totalFocusTime)} 
            accentColor="border-l-indigo-500"
          />
          <KpiCard 
            icon={<Calendar className="w-4 h-4 text-emerald-600" />}
            title="Active Days" 
            value={`${data?.kpi?.activeDays || 0} days`} 
            subtitle="Consistent sessions"
            trend={renderTrend(data?.kpi?.activeDays, data?.kpi?.previous?.activeDays)} 
            accentColor="border-l-emerald-500"
          />
          <KpiCard 
            icon={<Target className="w-4 h-4 text-violet-600" />}
            title="Goal Achievement" 
            value={`${data?.kpi?.goalAchievement || 0}%`} 
            subtitle="Target alignment"
            trend={renderTrend(data?.kpi?.goalAchievement, data?.kpi?.previous?.goalAchievement)} 
            accentColor="border-l-violet-500"
          />
          <KpiCard 
            icon={<Flame className="w-4 h-4 text-amber-600" />}
            title="Avg Focus Session" 
            value={formatDuration(data?.kpi?.avgFocusSession || 0)} 
            subtitle="Continuous concentration"
            trend={renderTrend(data?.kpi?.avgFocusSession, data?.kpi?.previous?.avgFocusSession)} 
            accentColor="border-l-amber-500"
          />
          <KpiCard 
            icon={<Cpu className="w-4 h-4 text-cyan-600" />}
            title="Productivity Score" 
            value={`${data?.kpi?.productivityScore || 0} / 100`} 
            subtitle="Workstation score"
            trend={renderTrend(data?.kpi?.productivityScore, data?.kpi?.previous?.productivityScore)} 
            accentColor="border-l-cyan-500"
          />
        </section>

        {/* ROW 2: MAIN CHARTS & AI INSIGHTS */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* FOCUS TREND CHART */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Focus Duration Trend</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Daily focus allocation compared against your 6-hour baseline goal.</p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block" />
                  <span className="text-slate-600 font-medium">Focus Hours</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-emerald-500 inline-block" />
                  <span className="text-slate-500 font-medium">Goal Target</span>
                </div>
              </div>
            </div>

            {/* Interactive Bar Visualization */}
            <div className="h-64 w-full relative flex items-end pt-6">
              {/* Horizontal grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                {[8, 6, 4, 2, 0].map((hours) => (
                  <div key={hours} className="w-full border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 -mt-2.5">{hours}h</span>
                  </div>
                ))}
              </div>

              {/* Bar Container */}
              <div className="relative w-full h-full flex items-end justify-between gap-1 sm:gap-1.5 pl-6 pb-6 z-10">
                {data?.trend?.length > 0 ? (
                  data.trend.map((point: any, i: number) => {
                    const maxSec = 28800; // 8 hours baseline
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
                        {/* Target Line */}
                        <div 
                          className="absolute w-full border-b border-dashed border-emerald-500/60 z-0"
                          style={{ bottom: `${goalPercent}%` }}
                        />

                        {/* Bar */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(4, heightPercent)}%` }}
                          transition={{ duration: 0.5, delay: i * 0.01 }}
                          className={`w-full max-w-[16px] rounded-t-md transition-all duration-200 cursor-pointer ${
                            isHovered 
                              ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30 scale-105' 
                              : point.focusSeconds >= point.goalSeconds 
                                ? 'bg-gradient-to-t from-indigo-600 to-indigo-500' 
                                : 'bg-gradient-to-t from-slate-400 to-indigo-400/80'
                          }`}
                        />

                        {/* Hover Tooltip */}
                        {isHovered && (
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-xl shadow-xl z-30 whitespace-nowrap pointer-events-none border border-slate-700">
                            <div className="font-semibold text-slate-200">{point.date}</div>
                            <div className="text-emerald-400 font-mono font-bold mt-0.5">{formatDuration(point.focusSeconds)} focus</div>
                            <div className="text-[10px] text-slate-400">{point.sessions} focus sessions</div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No trend data available</div>
                )}
              </div>
            </div>
          </div>

          {/* ENDOCORE INSIGHTS CARD */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl shadow-xl p-6 text-white flex flex-col justify-between relative overflow-hidden border border-indigo-500/20">
            {/* Glowing Accent background */}
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-5 border-b border-indigo-500/20 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/30">
                    <Sparkles className="w-4 h-4 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-wider uppercase text-white">EndoCore Intelligence</h3>
                    <p className="text-[10px] text-indigo-300/70 font-mono">AUTONOMOUS PATTERN LOGIC</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ACTIVE
                </span>
              </div>

              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {data?.insights?.length > 0 ? (
                  data.insights.map((insight: any, i: number) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="group flex items-start gap-3 bg-white/5 hover:bg-white/10 rounded-xl p-3 border border-white/10 transition-colors"
                    >
                      <div className={`mt-1 p-1 rounded-md shrink-0 ${
                        insight.type === 'positive' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {insight.text}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-slate-400 text-xs italic text-center py-8">Analyzing activity telemetry...</div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-indigo-500/20 flex items-center justify-between text-[11px] text-slate-400">
              <span>Updated in real-time</span>
              <span className="font-mono text-indigo-300">v2.4 Telemetry</span>
            </div>
          </div>
        </section>

        {/* ROW 3: HEATMAP & TIME DISTRIBUTION */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ACTIVITY HEATMAP */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Consistency Calendar</h3>
                <p className="text-xs text-slate-500 mt-0.5">30-day work frequency and concentration intensity.</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-100" />
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-200" />
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400" />
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
                <span>More</span>
              </div>
            </div>

            {data?.heatmap ? (
              <div className="overflow-x-auto pb-2">
                <div className="min-w-max flex gap-2">
                  <div className="flex flex-col justify-between text-[10px] text-slate-400 font-medium py-1">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                    <span>Sun</span>
                  </div>

                  <div className="flex gap-1.5">
                    {Array.from({ length: Math.ceil(data.heatmap.length / 7) }).map((_, colIdx) => (
                      <div key={colIdx} className="flex flex-col gap-1.5">
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
                              className={`w-3.5 h-3.5 rounded-md ${bgClass} hover:ring-2 hover:ring-indigo-400 hover:scale-110 cursor-pointer transition-all duration-150 group relative`}
                            >
                              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-lg whitespace-nowrap z-50 pointer-events-none shadow-xl border border-slate-700">
                                <span className="font-semibold text-slate-200">{day.date}</span>
                                <span className="block text-indigo-300 font-mono">{formatDuration(sec)}</span>
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
              <div className="text-slate-400 text-xs text-center py-8">No activity recorded yet.</div>
            )}
          </div>

          {/* TIME DISTRIBUTION */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Application Allocation</h3>
              <p className="text-xs text-slate-500 mt-0.5">Time distribution across primary development tools and apps.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Donut Chart SVG */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="5.5" />
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
                          strokeWidth="5.5"
                          strokeDasharray={strokeDasharray} 
                          strokeDashoffset={-offset}
                          className="transition-all duration-700 hover:stroke-width-7 cursor-pointer"
                        />
                      );
                      offset += perc;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-lg font-extrabold text-slate-900">{formatDuration(data?.kpi?.totalFocusTime || 0)}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="flex-1 w-full space-y-2.5">
                {data?.timeDistribution?.length > 0 ? (
                  data.timeDistribution.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || '#6366f1' }} />
                        <span className="text-xs font-semibold text-slate-700">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-500">{formatDuration(item.seconds)}</span>
                        <span className="text-xs font-bold text-slate-900 w-8 text-right">{item.percentage}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-xs text-center">No category data found.</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ROW 4: BOTTOM THREE PANELS */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* FOCUS QUALITY */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Concentration Index</h3>
            
            <div className="flex items-center gap-5 my-auto">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-100 flex flex-col items-center justify-center relative shrink-0">
                <span className="text-xl font-extrabold text-slate-900">{data?.focusQuality?.score || 88}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Index</span>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>Deep Work</span>
                    <span className="text-indigo-600">{data?.focusQuality?.deepWorkPercent || 78}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${data?.focusQuality?.deepWorkPercent || 78}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>Interruptions</span>
                    <span className="text-rose-500">{data?.focusQuality?.interruptionsPercent || 12}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${data?.focusQuality?.interruptionsPercent || 12}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 mt-4 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Avg Session</span>
                <span className="text-xs font-bold text-slate-800">{formatDuration(data?.focusQuality?.avgSessionSeconds || 3120)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Longest</span>
                <span className="text-xs font-bold text-slate-800">{formatDuration(data?.focusQuality?.longestSessionSeconds || 11880)}</span>
              </div>
            </div>
          </div>

          {/* BEST WORKING HOURS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Peak Activity Hours</h3>
            <div className="h-32 flex items-end justify-between gap-1 my-auto">
              {data?.bestWorkingHours?.length > 0 ? (
                data.bestWorkingHours.map((h: any, i: number) => {
                  const max = Math.max(...data.bestWorkingHours.map((x: any) => x.focusSeconds));
                  const height = Math.min(100, (h.focusSeconds / (max || 1)) * 100);
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 group relative h-full justify-end">
                      <div 
                        className="w-full bg-indigo-200 group-hover:bg-indigo-600 rounded-t-sm transition-colors duration-150 cursor-pointer"
                        style={{ height: `${Math.max(8, height)}%` }}
                      />
                      {i % 2 === 0 && <span className="text-[9px] font-mono text-slate-400 mt-1">{h.hour}</span>}
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap z-20 pointer-events-none shadow-lg">
                        {h.hour}:00 — {formatDuration(h.focusSeconds)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full flex items-center justify-center text-xs text-slate-400">No hourly data available</div>
              )}
            </div>
          </div>

          {/* PROJECT BREAKDOWN */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Active Workspace Projects</h3>
              <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer">View All</span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[160px] pr-1">
              {data?.projects?.length > 0 ? (
                data.projects.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all cursor-pointer group">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{p.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{p.sessions} sessions • {p.goalAchieved}% target match</p>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="block text-xs font-bold text-slate-900">{formatDuration(p.focusSeconds)}</span>
                        {renderTrend(p.focusSeconds, p.previousFocusSeconds, 'time')}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-xs text-center py-6">No active project telemetry available.</div>
              )}
            </div>
          </div>

        </section>

      </div>

      {/* DAY TIMELINE OVERLAY */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-end"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto flex flex-col border-l border-slate-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-slate-100 p-6 flex justify-between items-center z-10">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <button onClick={() => setSelectedDay(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition">
                      <ChevronLeft className="w-5 h-5"/>
                    </button>
                    Workstation Session Log
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 ml-8">{selectedDay}</p>
                </div>
              </div>
              
              <div className="p-6 space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Focus</span>
                    <span className="block text-base font-extrabold text-slate-900 mt-0.5">
                      {formatDuration(dayTimeline.reduce((acc, ev) => acc + ev.durationSeconds, 0))}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Focus Blocks</span>
                    <span className="block text-base font-extrabold text-slate-900 mt-0.5">
                      {dayTimeline.filter(e => e.type === 'focus').length}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3.5 py-1.5 rounded-full hover:bg-indigo-100 transition">
                    <Play className="w-3 h-3 fill-indigo-600" />
                    Replay Activity Stream
                  </button>
                </div>

                {loadingDay ? (
                  <div className="flex justify-center py-12"><Activity className="w-6 h-6 text-indigo-600 animate-spin" /></div>
                ) : (
                  <div className="relative border-l-2 border-slate-100 ml-4 space-y-6 py-2">
                    {dayTimeline.length > 0 ? (
                      dayTimeline.map((event: any, i: number) => (
                        <div key={i} className="relative pl-6">
                          <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                            event.type === 'focus' ? 'bg-emerald-500' : 'bg-amber-400'
                          }`} />
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-mono font-bold text-slate-400">{event.time}</span>
                              <h4 className="text-xs font-bold text-slate-900 mt-0.5">{event.title}</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">{event.subtitle}</p>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              {formatDuration(event.durationSeconds)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-slate-400 text-xs py-10 pl-6">No detailed activity log recorded.</div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KpiCard({ title, value, subtitle, trend, icon, accentColor }: { 
  title: string, value: string, subtitle?: string, trend: React.ReactNode, icon: React.ReactNode, accentColor?: string 
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 hover:shadow-md transition-all duration-200 flex flex-col justify-between border-l-4 ${accentColor || 'border-l-indigo-500'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">{icon}</div>
      </div>
      <div>
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">{value}</div>
        {subtitle && <p className="text-[10px] text-slate-400 mb-2 font-medium">{subtitle}</p>}
        {trend}
      </div>
    </div>
  );
}
