import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import jsPDF from "jspdf";
import {
  FaBrain,
  FaCalendarDays,
  FaChartLine,
  FaClock,
  FaFileCsv,
  FaFilePdf,
  FaFilter,
  FaHospital,
  FaRobot,
  FaStethoscope,
  FaUsers
} from "react-icons/fa6";
import PageHeader from "../../components/common/PageHeader";
import { apiFetch } from "../../utils/api";

const dateOptions = [
  { label: "Last 7 Days", value: "7" },
  { label: "Last 30 Days", value: "30" }
];

function ReportsPage() {
  const [dateRange, setDateRange] = useState("7");
  const [department, setDepartment] = useState("All Departments");
  const [payload, setPayload] = useState({
    kpis: { totalPatients: 0, totalAppointments: 0, aiAccuracy: 0, avgConsultTime: 0 },
    symptomTrend: [],
    departmentPerformance: [],
    appointmentTrend: [],
    riskDistribution: [],
    aiInsights: []
  });
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setError("");
      const data = await apiFetch(`/analytics/overview?days=${dateRange}&department=${encodeURIComponent(department)}`);
      setPayload(data);
    } catch (fetchError) {
      setError(fetchError.message);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, department]);

  const departments = useMemo(() => {
    const names = payload.departmentPerformance.map((item) => item.department);
    return ["All Departments", ...new Set(names)];
  }, [payload.departmentPerformance]);

  const appointmentTrend = useMemo(() => {
    const byDate = {};
    (payload.appointmentTrend || []).forEach((item) => {
      const label = item.date || "Unknown";
      if (!byDate[label]) {
        byDate[label] = { date: label, total: 0, completed: 0 };
      }
      byDate[label].total += 1;
      if (item.status === "Completed") {
        byDate[label].completed += 1;
      }
    });
    return Object.values(byDate).slice(-8);
  }, [payload.appointmentTrend]);

  const exportCsv = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Patients", payload.kpis.totalPatients],
      ["Appointments", payload.kpis.totalAppointments],
      ["AI Accuracy", `${payload.kpis.aiAccuracy}%`],
      ["Avg Consult Time", `${payload.kpis.avgConsultTime}m`]
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "healthcare-reports.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Healthcare Analytics Report", 14, 18);
    doc.setFontSize(11);
    doc.text("Date Range: Last " + dateRange + " Days", 14, 28);
    doc.text("Department: " + department, 14, 35);
    doc.text("Total Patients: " + payload.kpis.totalPatients, 14, 45);
    doc.text("Appointments: " + payload.kpis.totalAppointments, 14, 52);
    doc.text("AI Accuracy: " + payload.kpis.aiAccuracy + "%", 14, 59);
    doc.text("Avg Consult Time: " + payload.kpis.avgConsultTime + "m", 14, 66);
    doc.save("healthcare-reports.pdf");
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Real-time analytics generated from MongoDB Atlas records."
      />

      {error ? <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><FaFilter /> Date Range</span>
            <select value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="w-full rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-sky-200 focus:ring">
              {dateOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><FaHospital /> Department</span>
            <select value={department} onChange={(event) => setDepartment(event.target.value)} className="w-full rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-sky-200 focus:ring">
              {departments.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <button type="button" onClick={exportCsv} className="mt-5 inline-flex items-center justify-center gap-2 rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
            <FaFileCsv /> Export CSV
          </button>

          <button type="button" onClick={exportPdf} className="mt-5 inline-flex items-center justify-center gap-2 rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
            <FaFilePdf /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft"><p className="text-sm text-slate-500">Total Patients</p><h3 className="text-2xl font-bold text-slate-800">{payload.kpis.totalPatients}</h3><p className="text-xs text-slate-500">Live data</p></article>
        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft"><p className="text-sm text-slate-500">Appointments</p><h3 className="text-2xl font-bold text-slate-800">{payload.kpis.totalAppointments}</h3><p className="text-xs text-slate-500">In selected range</p></article>
        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft"><p className="text-sm text-slate-500">AI Accuracy</p><h3 className="text-2xl font-bold text-slate-800">{payload.kpis.aiAccuracy}%</h3><p className="text-xs text-slate-500">Computed from outcomes</p></article>
        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft"><p className="text-sm text-slate-500">Avg Consult Time</p><h3 className="text-2xl font-bold text-slate-800">{payload.kpis.avgConsultTime}m</h3><p className="text-xs text-slate-500">Closed live sessions</p></article>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
          <h3 className="mb-3 inline-flex items-center gap-2 text-base font-semibold text-slate-800"><FaChartLine /> Symptom Trend</h3>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={payload.symptomTrend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#22d3ee" /></BarChart></ResponsiveContainer></div>
        </article>
        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
          <h3 className="mb-3 inline-flex items-center gap-2 text-base font-semibold text-slate-800"><FaStethoscope /> Department Performance</h3>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={payload.departmentPerformance}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="department" /><YAxis /><Tooltip /><Bar dataKey="used" fill="#60a5fa" /></BarChart></ResponsiveContainer></div>
        </article>
        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
          <h3 className="mb-3 inline-flex items-center gap-2 text-base font-semibold text-slate-800"><FaRobot /> AI Accuracy</h3>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={[{ n: "Current", v: payload.kpis.aiAccuracy }]}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="n" /><YAxis domain={[0,100]} /><Tooltip /><Line type="monotone" dataKey="v" stroke="#0ea5e9" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
        </article>
        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
          <h3 className="mb-3 inline-flex items-center gap-2 text-base font-semibold text-slate-800"><FaCalendarDays /> Appointment Trend</h3>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={appointmentTrend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Area type="monotone" dataKey="total" fill="#67e8f9" stroke="#06b6d4" /><Area type="monotone" dataKey="completed" fill="#6ee7b7" stroke="#34d399" /></AreaChart></ResponsiveContainer></div>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
          <h3 className="mb-3 inline-flex items-center gap-2 text-base font-semibold text-slate-800"><FaBrain /> AI Insights</h3>
          <ul className="space-y-2">
            {(payload.aiInsights || []).map((insight) => (
              <li key={insight} className="rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{insight}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
          <h3 className="mb-3 inline-flex items-center gap-2 text-base font-semibold text-slate-800"><FaBrain /> Predictive Analytics</h3>
          <div className="space-y-2 text-sm text-slate-700">
            <p>Next week demand forecast: <strong>{Math.round(payload.kpis.totalAppointments * 1.08)}</strong></p>
            <p>Expected AI accuracy: <strong>{Math.min(99, payload.kpis.aiAccuracy + 1)}%</strong></p>
            <p>Risk spike probability: <strong>{Math.max(5, Math.round((payload.riskDistribution?.[0]?.value || 0) / Math.max(1, payload.kpis.totalPatients) * 100))}%</strong></p>
          </div>
        </article>
      </div>
    </section>
  );
}

export default ReportsPage;
