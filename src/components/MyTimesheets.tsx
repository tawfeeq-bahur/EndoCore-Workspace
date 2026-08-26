import React, { useState, useEffect } from "react";
import { 
  Clock, 
  CalendarRange, 
  DollarSign, 
  FileSpreadsheet, 
  FileDown, 
  Plus, 
  CheckCircle,
  Briefcase,
  TrendingUp,
  Percent
} from "lucide-react";

interface TimesheetItem {
  id: string;
  clientName: string;
  projectName: string;
  billableHours: number;
  nonBillableHours: number;
  hourlyRate: number;
  totalBilled: number;
  period: string;
  status: string;
  createdAt: string;
}

interface TimesheetSummary {
  totalBillableHours: number;
  totalBilledRevenue: number;
  activeProjects: number;
  efficiencyIndex: number;
}

interface MyTimesheetsProps {
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  triggerToast: (msg: string) => void;
}

export default function MyTimesheets({ apiFetch, triggerToast }: MyTimesheetsProps) {
  const [timesheets, setTimesheets] = useState<TimesheetItem[]>([]);
  const [summary, setSummary] = useState<TimesheetSummary>({
    totalBillableHours: 0,
    totalBilledRevenue: 0,
    activeProjects: 0,
    efficiencyIndex: 0
  });
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);

  // Form states
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [billableHours, setBillableHours] = useState("");
  const [hourlyRate, setHourlyRate] = useState("120");

  const loadTimesheets = async () => {
    try {
      const res = await apiFetch("/api/timesheets");
      if (res.ok) {
        const data = await res.json();
        setTimesheets(data.timesheets);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Error loading timesheets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimesheets();
  }, []);

  const handleLogHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !projectName.trim() || !billableHours || !hourlyRate) {
      triggerToast("Please enter all required fields.");
      return;
    }

    setLogging(true);
    try {
      const res = await apiFetch("/api/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          projectName,
          billableHours: parseFloat(billableHours),
          hourlyRate: parseFloat(hourlyRate)
        })
      });

      if (res.ok) {
        triggerToast(`⏱️ Logged ${billableHours} hrs for ${projectName}`);
        setClientName("");
        setProjectName("");
        setBillableHours("");
        loadTimesheets(); // Reload entries and updates summaries
      } else {
        triggerToast("Failed to log hours.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error communicating with server.");
    } finally {
      setLogging(false);
    }
  };

  const handleExport = (format: "csv" | "pdf") => {
    if (timesheets.length === 0) {
      triggerToast("No timesheet entries to export!");
      return;
    }

    // CSV format generation
    if (format === "csv") {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Client,Project,Billable Hours,Non-Billable Hours,Hourly Rate,Total Billed,Period,Status,Logged Date\n";
      
      timesheets.forEach((item) => {
        const dateStr = new Date(item.createdAt).toLocaleDateString();
        csvContent += `"${item.clientName}","${item.projectName}",${item.billableHours},${item.nonBillableHours},${item.hourlyRate},${item.billableHours * item.hourlyRate},"${item.period}","${item.status}","${dateStr}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `EndoCore_Timesheet_Export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast("📥 Timesheet CSV report downloaded!");
    } else {
      // Simple mock PDF export confirmation
      triggerToast("📥 Timesheet PDF report generated and compiled for payroll!");
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#e4e4e7] pb-5 gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight font-display text-[#09090b]">My Timesheets</h2>
          <p className="text-xs text-[#71717a] font-sans">
            Track your billable hours, configure hourly client rates, monitor active projects, and download formatted invoice rollups.
          </p>
        </div>

        <div className="flex space-x-3 self-start md:self-center shrink-0">
          <button 
            onClick={() => handleExport("csv")}
            className="btn-secondary text-xs"
            title="Download CSV export"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => handleExport("pdf")}
            className="btn-secondary text-xs"
            title="Download PDF invoice"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping mr-2"></span>
          <span className="text-xs font-mono text-[#71717a]">Loading billing history...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary metrics widgets (4 column bento style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="studio-card p-5 space-y-2 flex flex-col justify-between hover:border-[#d4d4d8] transition-all">
              <div className="flex justify-between items-center text-[#71717a]">
                <span className="text-[10px] font-mono uppercase font-semibold tracking-wider">Billable Hours</span>
                <Clock className="h-4 w-4 opacity-75" />
              </div>
              <div>
                <h4 className="text-2xl font-bold font-display text-[#09090b]">
                  {summary.totalBillableHours.toFixed(1)} hrs
                </h4>
                <p className="text-[10px] text-[#a1a1aa] font-sans">Synced from activity logs</p>
              </div>
            </div>

            <div className="studio-card p-5 space-y-2 flex flex-col justify-between hover:border-[#d4d4d8] transition-all">
              <div className="flex justify-between items-center text-[#71717a]">
                <span className="text-[10px] font-mono uppercase font-semibold tracking-wider">Total Revenue</span>
                <DollarSign className="h-4 w-4 opacity-75" />
              </div>
              <div>
                <h4 className="text-2xl font-bold font-display text-[#09090b]">
                  ${summary.totalBilledRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h4>
                <p className="text-[10px] text-emerald-600 font-bold font-mono">Billable rate approved</p>
              </div>
            </div>

            <div className="studio-card p-5 space-y-2 flex flex-col justify-between hover:border-[#d4d4d8] transition-all">
              <div className="flex justify-between items-center text-[#71717a]">
                <span className="text-[10px] font-mono uppercase font-semibold tracking-wider">Active Projects</span>
                <Briefcase className="h-4 w-4 opacity-75" />
              </div>
              <div>
                <h4 className="text-2xl font-bold font-display text-[#09090b]">
                  {summary.activeProjects} Clients
                </h4>
                <p className="text-[10px] text-[#a1a1aa] font-sans">Tool bridge connections</p>
              </div>
            </div>

            <div className="studio-card p-5 space-y-2 flex flex-col justify-between hover:border-[#d4d4d8] transition-all">
              <div className="flex justify-between items-center text-[#71717a]">
                <span className="text-[10px] font-mono uppercase font-semibold tracking-wider">Billing Efficiency</span>
                <Percent className="h-4 w-4 opacity-75 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-2xl font-bold font-display text-[#09090b]">
                  {summary.efficiencyIndex}%
                </h4>
                <p className="text-[10px] text-[#71717a] font-sans">Billable vs non-billable ratio</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form to log manual entries */}
            <div className="studio-card p-6 space-y-5 h-fit">
              <h3 className="text-xs font-semibold font-mono tracking-widest uppercase text-[#71717a] border-b border-[#e4e4e7] pb-3">
                Log Working Hours
              </h3>
              
              <form onSubmit={handleLogHours} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-semibold uppercase tracking-wider text-[#71717a] font-mono">Client / Organization</label>
                  <input 
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="input-field"
                    placeholder="e.g. EndoCore Corp"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-semibold uppercase tracking-wider text-[#71717a] font-mono">Project Name</label>
                  <input 
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Website API Middleware"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-semibold uppercase tracking-wider text-[#71717a] font-mono">Hours Logged</label>
                    <input 
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      required
                      value={billableHours}
                      onChange={(e) => setBillableHours(e.target.value)}
                      className="input-field"
                      placeholder="8.5"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-semibold uppercase tracking-wider text-[#71717a] font-mono">Hourly Rate ($)</label>
                    <input 
                      type="number"
                      required
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="input-field"
                      placeholder="120"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={logging}
                  className="btn-primary w-full py-2.5 text-xs font-semibold tracking-wider uppercase mt-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>{logging ? "Submitting..." : "Log Working Hours"}</span>
                </button>
              </form>
            </div>

            {/* List / Table of logged entries */}
            <div className="lg:col-span-2 studio-card p-6 space-y-4">
              <h3 className="text-xs font-semibold font-mono tracking-widest uppercase text-[#71717a] border-b border-[#e4e4e7] pb-3">
                Timesheet Audit Log
              </h3>

              {timesheets.length === 0 ? (
                <div className="text-center py-20 text-xs font-mono text-[#a1a1aa] border border-dashed border-[#e4e4e7] rounded-xl bg-zinc-50/20">
                  No logged timesheet items. Submit hours above to seed history logs.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans border-collapse">
                    <thead>
                      <tr className="border-b border-[#e4e4e7] font-mono text-[9px] text-[#71717a] uppercase tracking-wider">
                        <th className="py-2.5 font-bold">Client / Project</th>
                        <th className="py-2.5 font-bold text-center">Hours</th>
                        <th className="py-2.5 font-bold text-center">Hourly Rate</th>
                        <th className="py-2.5 font-bold text-right">Total Billed</th>
                        <th className="py-2.5 font-bold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e4e4e7]/60">
                      {timesheets.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-50/40 transition-colors">
                          <td className="py-3">
                            <h4 className="font-bold text-[#09090b]">{item.clientName}</h4>
                            <p className="text-[10px] text-[#71717a] truncate max-w-[180px]">{item.projectName}</p>
                          </td>
                          <td className="py-3 text-center font-mono text-[#09090b] font-medium">
                            {item.billableHours.toFixed(1)}h
                          </td>
                          <td className="py-3 text-center font-mono text-[#71717a]">
                            ${item.hourlyRate}/hr
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-[#09090b]">
                            ${(item.billableHours * item.hourlyRate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 text-center">
                            <span className="badge badge-emerald py-0.5 px-2">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
