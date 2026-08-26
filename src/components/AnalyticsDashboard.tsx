import React, { useState, useEffect } from 'react';
// apiFetch removed from here
import { Calendar, Filter, Download, ChevronRight, Activity, Clock, Target, Zap, ChevronLeft, Play, Pause, FastForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock data interfaces
interface KPI {
  totalFocusTime: number;
  activeDays: number;
  goalAchievement: number;
  avgFocusSession: number;
  productivityScore: number;
  previous: {
    totalFocusTime: number;
    activeDays: number;
    goalAchievement: number;
    avgFocusSession: number;
    productivityScore: number;
  }
}

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('30D');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayTimeline, setDayTimeline] = useState<any[]>([]);
  const [loadingDay, setLoadingDay] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, selectedTeam, selectedProject]);

  const fetchDashboardData = async () => {
    setLoading(true);
    console.log("FRONTEND: Fetching dashboard data from API...");
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("endocore_token");
      const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch(`/api/analytics/v2/dashboard?range=${dateRange}&team=${selectedTeam}&project=${selectedProject}&_t=${Date.now()}`, { headers });
      const json = await res.json();
      console.log("FRONTEND: Received dashboard data:", json);
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
      <div className="flex h-64 items-center justify-center">
        <Activity className="h-8 w-8 text-indigo-500 animate-pulse" />
        <span className="ml-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">Loading Intelligence Engine...</span>
      </div>
    );
  }

  // Calculate trends for KPI
  const renderTrend = (current: number, prev: number, format: 'time' | 'percent' | 'number' = 'number', inverted: boolean = false) => {
    if (!prev) return null;
    let diff = current - prev;
    let perc = (diff / prev) * 100;
    let isPositive = diff >= 0;
    if (inverted) isPositive = !isPositive;
    
    return (
      <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
        <span>{isPositive ? '↑' : '↓'}</span>
        <span className="ml-1">{Math.abs(perc).toFixed(1)}% vs previous</span>
      </div>
    );
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-12 font-sans text-[#0f172a]">
      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Understand how you work, where your time goes, and how your productivity changes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days</option>
            <option value="90D">Last 90 Days</option>
            <option value="1Y">Last Year</option>
          </select>
          <select 
            className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="all">All Teams</option>
            {data?.teams?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select 
            className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="all">All Projects</option>
            {data?.projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg p-2 shadow-sm transition">
            <Filter className="w-4 h-4" />
          </button>
          <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg p-2 shadow-sm transition">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        
        {/* KPI OVERVIEW */}
        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard title="Total Focus Time" value={formatDuration(data?.kpi?.totalFocusTime || 0)} trend={renderTrend(data?.kpi?.totalFocusTime, data?.kpi?.previous?.totalFocusTime)} />
          <KpiCard title="Active Days" value={`${data?.kpi?.activeDays || 0}`} trend={renderTrend(data?.kpi?.activeDays, data?.kpi?.previous?.activeDays)} />
          <KpiCard title="Goal Achievement" value={`${data?.kpi?.goalAchievement || 0}%`} trend={renderTrend(data?.kpi?.goalAchievement, data?.kpi?.previous?.goalAchievement)} />
          <KpiCard title="Avg Focus Session" value={formatDuration(data?.kpi?.avgFocusSession || 0)} trend={renderTrend(data?.kpi?.avgFocusSession, data?.kpi?.previous?.avgFocusSession)} />
          <KpiCard title="Productivity Score" value={`${data?.kpi?.productivityScore || 0}`} trend={renderTrend(data?.kpi?.productivityScore, data?.kpi?.previous?.productivityScore)} />
        </section>

        {/* MAIN CHARTS ROW */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* FOCUS TREND */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Focus Trend</h3>
              <div className="flex bg-slate-100 rounded-md p-1">
                {['7D', '30D', '90D', '1Y'].map(r => (
                  <button 
                    key={r}
                    onClick={() => setDateRange(r)}
                    className={`px-3 py-1 text-xs font-medium rounded-sm transition ${dateRange === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Chart placeholder (using a simplified SVG visualization) */}
            <div className="h-64 w-full relative flex items-end">
               {/* Grid lines */}
               <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                 {[4,3,2,1,0].map(i => (
                   <div key={i} className="w-full border-t border-slate-100 flex-1 flex items-start">
                     <span className="text-[10px] text-slate-400 -mt-2 -ml-6">{i * 2}h</span>
                   </div>
                 ))}
               </div>
               
               <div className="relative w-full h-full flex items-end justify-between px-2 pb-6 z-0">
                  {data?.trend?.length > 0 ? data.trend.map((point: any, i: number) => {
                    const height = Math.min(100, (point.focusSeconds / 28800) * 100); // normalized to 8 hours (28800s)
                    const goalHeight = Math.min(100, (point.goalSeconds / 28800) * 100);
                    return (
                      <div key={i} className="relative group w-full flex justify-center items-end h-full">
                        <div 
                          className="w-1/2 max-w-[12px] bg-indigo-500 rounded-t-sm hover:bg-indigo-400 cursor-pointer transition-all duration-300 relative z-10"
                          style={{ height: `${height}%` }}
                          onClick={() => fetchDayTimeline(point.date)}
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none">
                            {point.date}: {formatDuration(point.focusSeconds)}
                          </div>
                        </div>
                        {/* Goal line dash */}
                        <div 
                          className="absolute w-full h-0.5 bg-emerald-400/50 z-0"
                          style={{ bottom: `${goalHeight}%` }}
                        />
                      </div>
                    )
                  }) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No trend data available</div>
                  )}
               </div>
            </div>
          </div>

          {/* ENDOCORE INSIGHTS */}
          <div className="bg-slate-900 rounded-xl shadow-lg p-5 text-white flex flex-col relative overflow-hidden">
            <div className="absolute -right-10 -top-10 text-indigo-500/20">
              <Zap className="w-40 h-40" />
            </div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-300 flex items-center">
                <span className="mr-2">✨</span> EndoCore Insights
              </h3>
            </div>
            
            <div className="space-y-4 flex-1 relative z-10 overflow-y-auto">
              {data?.insights?.length > 0 ? data.insights.map((insight: any, i: number) => (
                <div key={i} className="flex items-start bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className={`mt-0.5 mr-3 rounded-full w-2 h-2 shrink-0 ${insight.type === 'positive' ? 'bg-emerald-400' : insight.type === 'warning' ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {insight.text}
                  </p>
                </div>
              )) : (
                <div className="text-slate-400 text-xs italic text-center mt-10">Not enough activity data yet to generate meaningful insights.</div>
              )}
            </div>
          </div>
        </section>

        {/* HEATMAP & TIME DISTRIBUTION */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ACTIVITY HEATMAP */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6">Activity Consistency</h3>
            
            {data?.heatmap ? (
              <div className="overflow-x-auto pb-2">
                <div className="min-w-max flex">
                  {/* Days of week labels */}
                  <div className="flex flex-col gap-1 pr-2 mt-4 text-[10px] text-slate-400">
                    <span className="h-3">Mon</span>
                    <span className="h-3"></span>
                    <span className="h-3">Wed</span>
                    <span className="h-3"></span>
                    <span className="h-3">Fri</span>
                    <span className="h-3"></span>
                    <span className="h-3">Sun</span>
                  </div>
                  
                  {/* Heatmap grid */}
                  <div className="flex gap-1">
                    {/* Render weeks (columns) */}
                    {Array.from({ length: Math.ceil(data.heatmap.length / 7) }).map((_, colIdx) => (
                      <div key={colIdx} className="flex flex-col gap-1">
                        {data.heatmap.slice(colIdx * 7, (colIdx + 1) * 7).map((day: any, rowIdx: number) => {
                           const intensity = day.focusSeconds > 28800 ? 4 : day.focusSeconds > 14400 ? 3 : day.focusSeconds > 7200 ? 2 : day.focusSeconds > 0 ? 1 : 0;
                           const colors = ['bg-slate-100', 'bg-emerald-200', 'bg-emerald-300', 'bg-emerald-400', 'bg-emerald-500'];
                           return (
                             <div 
                               key={day.date}
                               onClick={() => fetchDayTimeline(day.date)}
                               className={`w-3 h-3 rounded-sm ${colors[intensity]} hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1 cursor-pointer transition-all group relative`}
                             >
                               <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-50 pointer-events-none">
                                 {day.date}: {formatDuration(day.focusSeconds)}
                               </div>
                             </div>
                           );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end items-center gap-1 mt-4 text-[10px] text-slate-500">
                  <span>Less</span>
                  <div className="w-3 h-3 rounded-sm bg-slate-100" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-200" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-300" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-400" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                  <span>More</span>
                </div>
              </div>
            ) : (
               <div className="text-slate-400 text-sm text-center py-8">No activity recorded yet.</div>
            )}
          </div>

          {/* TIME DISTRIBUTION */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6">Where Your Time Went</h3>
            
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative w-40 h-40 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                  {data?.timeDistribution?.length > 0 && (() => {
                    let offset = 0;
                    return data.timeDistribution.map((item: any, i: number) => {
                      const perc = item.percentage;
                      const dashArray = `${perc} ${100 - perc}`;
                      const el = (
                        <circle 
                          key={i}
                          cx="18" cy="18" r="15.915" fill="none" stroke={item.color || '#6366f1'} strokeWidth="6"
                          strokeDasharray={dashArray} strokeDashoffset={-offset}
                          className="transition-all duration-1000"
                        />
                      );
                      offset += perc;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-xl font-bold text-slate-800">{formatDuration(data?.kpi?.totalFocusTime || 0)}</span>
                   <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">Total</span>
                </div>
              </div>
              
              <div className="flex-1 w-full space-y-3">
                {data?.timeDistribution?.length > 0 ? data.timeDistribution.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center group cursor-pointer hover:bg-slate-50 p-1 -mx-1 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || '#6366f1' }} />
                      <span className="text-xs font-semibold text-slate-700">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-500">{formatDuration(item.seconds)}</span>
                      <span className="text-xs font-bold text-slate-800 w-10 text-right">{item.percentage}%</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-slate-400 text-sm text-center">No categorised time found.</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM ROW */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* FOCUS QUALITY */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Focus Quality</h3>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full border-4 border-indigo-100 flex flex-col items-center justify-center relative">
                 <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                   <circle cx="36" cy="36" r="34" fill="none" stroke="#6366f1" strokeWidth="4" strokeDasharray={`${data?.focusQuality?.score || 0} 100`} />
                 </svg>
                 <span className="text-xl font-bold text-slate-800">{data?.focusQuality?.score || 0}</span>
                 <span className="text-[8px] font-semibold uppercase text-slate-500">Quality</span>
              </div>
              <div className="flex-1 space-y-2.5">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                    <span>Deep Work</span>
                    <span>{data?.focusQuality?.deepWorkPercent || 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${data?.focusQuality?.deepWorkPercent || 0}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                    <span>Interruptions</span>
                    <span>{data?.focusQuality?.interruptionsPercent || 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500" style={{ width: `${data?.focusQuality?.interruptionsPercent || 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
               <div>
                 <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Avg Session</span>
                 <span className="text-sm font-bold text-slate-800">{formatDuration(data?.focusQuality?.avgSessionSeconds || 0)}</span>
               </div>
               <div>
                 <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Longest</span>
                 <span className="text-sm font-bold text-slate-800">{formatDuration(data?.focusQuality?.longestSessionSeconds || 0)}</span>
               </div>
            </div>
          </div>

          {/* BEST WORKING HOURS */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6">Best Working Hours</h3>
            <div className="h-32 flex items-end justify-between gap-1 mt-auto">
              {data?.bestWorkingHours?.length > 0 ? data.bestWorkingHours.map((h: any, i: number) => {
                const max = Math.max(...data.bestWorkingHours.map((x: any) => x.focusSeconds));
                const height = Math.min(100, (h.focusSeconds / (max || 1)) * 100);
                return (
                  <div key={i} className="flex flex-col items-center flex-1 group relative">
                    <div 
                      className="w-full bg-indigo-200 hover:bg-indigo-400 rounded-t-sm transition-colors cursor-pointer"
                      style={{ height: `${height}%` }}
                    />
                    {i % 2 === 0 && <span className="text-[9px] text-slate-400 mt-1">{h.hour}</span>}
                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                      {h.hour}:00 - {formatDuration(h.focusSeconds)}
                    </div>
                  </div>
                );
              }) : (
                <div className="w-full flex items-center justify-center text-sm text-slate-400">No time data available</div>
              )}
            </div>
          </div>

          {/* PROJECT ANALYTICS */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 overflow-hidden flex flex-col">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Project Analytics</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
               {data?.projects?.length > 0 ? data.projects.map((p: any) => (
                 <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 transition cursor-pointer group">
                   <div>
                     <h4 className="text-sm font-bold text-slate-800">{p.name}</h4>
                     <p className="text-xs text-slate-500 mt-0.5">{p.sessions} sessions • {p.goalAchieved}% goal</p>
                   </div>
                   <div className="text-right flex items-center gap-4">
                     <div>
                       <span className="block text-sm font-bold text-slate-800">{formatDuration(p.focusSeconds)}</span>
                       {renderTrend(p.focusSeconds, p.previousFocusSeconds, 'time')}
                     </div>
                     <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                   </div>
                 </div>
               )) : (
                 <div className="text-slate-400 text-sm flex items-center justify-center h-full">No active projects in this period.</div>
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
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto flex flex-col border-l border-slate-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-slate-100 p-6 flex justify-between items-center z-10">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center">
                    <button onClick={() => setSelectedDay(null)} className="mr-3 p-1 rounded-md hover:bg-slate-100 text-slate-500 transition"><ChevronLeft className="w-5 h-5"/></button>
                    Day Timeline
                  </h2>
                  <p className="text-sm text-slate-500 mt-1 ml-9">{selectedDay}</p>
                </div>
              </div>
              
              <div className="p-6 space-y-6 flex-1">
                {/* Day Summary */}
                <div className="flex gap-4">
                  <div className="flex-1 bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                    <span className="block text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Total Focus</span>
                    <span className="block text-lg font-bold text-slate-900 mt-1">
                      {formatDuration(dayTimeline.reduce((acc, ev) => acc + ev.durationSeconds, 0))}
                    </span>
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                    <span className="block text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Sessions</span>
                    <span className="block text-lg font-bold text-slate-900 mt-1">
                      {dayTimeline.filter(e => e.type === 'focus').length}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                   <button className="flex items-center text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition">
                     <Play className="w-3 h-3 mr-1.5 fill-indigo-600" />
                     Replay Day
                   </button>
                </div>

                {loadingDay ? (
                  <div className="flex justify-center py-10"><Activity className="w-6 h-6 text-indigo-500 animate-spin" /></div>
                ) : (
                  <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 py-4">
                    {dayTimeline.length > 0 ? dayTimeline.map((event: any, i: number) => (
                      <div key={i} className="relative pl-6">
                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                          event.type === 'focus' ? 'bg-emerald-500' : 
                          event.type === 'break' ? 'bg-amber-400' : 'bg-indigo-400'
                        }`} />
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-mono font-semibold text-slate-500">{event.time}</span>
                            <h4 className="text-sm font-bold text-slate-800 mt-0.5">{event.title}</h4>
                            <p className="text-xs text-slate-500 mt-1">{event.subtitle}</p>
                          </div>
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{formatDuration(event.durationSeconds)}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center text-slate-400 text-sm py-10 pl-6">No detailed timeline available for this day.</div>
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

function KpiCard({ title, value, trend }: { title: string, value: string, trend: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-indigo-200 hover:shadow-md transition-all duration-300">
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">{title}</span>
      <div className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">{value}</div>
      {trend}
    </div>
  );
}
