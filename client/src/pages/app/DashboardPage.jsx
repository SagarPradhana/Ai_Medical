import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowTrendUp,
  FaCalendarCheck,
  FaClock,
  FaHospitalUser,
  FaStethoscope,
  FaTriangleExclamation,
  FaUserDoctor,
  FaUsers
} from "react-icons/fa6";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";

function SaaSStatCard({ title, value, note, icon: Icon, border }) {
  return (
    <article className={`rounded-[12px] border border-slate-200 border-l-4 ${border} bg-white p-4 shadow-soft transition-all duration-200 hover:-translate-y-1`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-800">{value}</h3>
          <p className="mt-1 text-xs text-slate-500">{note}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-sky-50 text-sky-700">
          <Icon />
        </span>
      </div>
    </article>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const [payload, setPayload] = useState({
    stats: { totalPatients: 0, highRisk: 0, visitsToday: 0, newPatients: 0 },
    triageQueue: [],
    appointmentTrend: [],
    riskDistribution: [],
    doctorAvailability: []
  });
  const [error, setError] = useState("");

  const loadOverview = async () => {
    try {
      setError("");
      const data = await apiFetch("/dashboard/overview");
      setPayload(data);
    } catch (fetchError) {
      setError(fetchError.message);
    }
  };

  useEffect(() => {
    loadOverview();
    const timer = setInterval(loadOverview, 12000);
    return () => clearInterval(timer);
  }, []);

  const appointmentBars = useMemo(() => {
    const rows = payload.appointmentTrend || [];
    const max = Math.max(1, ...rows.map((item) => item.count || 0));
    return rows.map((item) => ({
      label: item.date?.slice(5) || "--",
      pct: Math.max(8, Math.round(((item.count || 0) / max) * 100))
    }));
  }, [payload.appointmentTrend]);

  const riskTotal = Math.max(1, ...(payload.riskDistribution || []).map((item) => item.value || 0));
  const doctorTotal = Math.max(1, ...(payload.doctorAvailability || []).map((item) => item.value || 0));
  const roleLabel = user?.role || "patient";

  const quickLinks =
    roleLabel === "admin"
      ? [
          { to: "/app/diagnosis-chat", label: "Diagnosis Chat", note: "AI symptom analyzer", icon: FaStethoscope },
          { to: "/app/appointments", label: "Appointments", note: "Booking and queue control", icon: FaClock },
          { to: "/app/doctors", label: "Doctors", note: "Availability and profiles", icon: FaUserDoctor },
          { to: "/app/patients", label: "Patients", note: "Clinical records and risk", icon: FaUsers }
        ]
      : roleLabel === "doctor"
        ? [
            { to: "/app/appointments", label: "Appointments", note: "Manage consultations", icon: FaClock },
            { to: "/app/patients", label: "Patients", note: "Add and review patient details", icon: FaUsers },
            { to: "/app/doctors", label: "Doctors", note: "Doctor directory", icon: FaUserDoctor },
            { to: "/app/live-sessions", label: "Live Sessions", note: "Consultation room", icon: FaStethoscope }
          ]
        : [
            { to: "/app/appointments", label: "Appointments", note: "Book and track visits", icon: FaClock },
            { to: "/app/live-sessions", label: "Live Sessions", note: "Video consultations", icon: FaStethoscope },
            { to: "/app/medical-records", label: "Medical Records", note: "Your record history", icon: FaHospitalUser },
            { to: "/app/doctors", label: "Doctors", note: "Find available doctors", icon: FaUserDoctor }
          ];

  return (
    <section className="space-y-4">
      <PageHeader
        title={`${roleLabel.charAt(0).toUpperCase()}${roleLabel.slice(1)} Dashboard`}
        subtitle="Modern command center for role-based healthcare operations."
      />

      {error ? <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SaaSStatCard title="Total Patients" value={payload.stats.totalPatients} note="Live from records" icon={FaUsers} border="border-l-cyan-500" />
        <SaaSStatCard title="High Risk" value={payload.stats.highRisk} note="Needs active follow-up" icon={FaTriangleExclamation} border="border-l-rose-500" />
        <SaaSStatCard title="Visits Today" value={payload.stats.visitsToday} note="Today schedule" icon={FaCalendarCheck} border="border-l-emerald-500" />
        <SaaSStatCard title="New Patients" value={payload.stats.newPatients} note="Recent intake" icon={FaHospitalUser} border="border-l-amber-500" />
      </div>

      <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="mb-3 text-base font-semibold text-slate-800">Quick Access</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className="group rounded-[12px] border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-1 hover:border-cyan-300 hover:bg-cyan-50">
                <div className="mb-2 inline-flex rounded-[10px] bg-white p-2 text-cyan-700 shadow-sm"><Icon /></div>
                <p className="font-semibold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-500">{item.note}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
          <h3 className="mb-3 text-base font-semibold text-slate-800">Appointments Trend</h3>
          <div className="flex h-44 items-end gap-2 rounded-[12px] bg-slate-50 p-3">
            {appointmentBars.map((value, index) => (
              <div key={index} className="group flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t-md bg-gradient-to-t from-cyan-600 to-sky-400" style={{ height: `${value.pct}%` }} />
                <span className="text-[10px] text-slate-500">{value.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
          <h3 className="mb-3 text-base font-semibold text-slate-800">Risk Distribution</h3>
          <div className="space-y-3">
            {(payload.riskDistribution || []).map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${Math.round((item.value / riskTotal) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
          <h3 className="mb-3 text-base font-semibold text-slate-800">Doctor Availability</h3>
          <div className="space-y-3">
            {(payload.doctorAvailability || []).map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.round((item.value / doctorTotal) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">Live Triage Queue</h3>
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
            <FaArrowTrendUp /> Live
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Symptom</th>
                <th>Severity</th>
                <th>ETA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(payload.triageQueue || []).map((item) => (
                <tr key={`${item.patient}-${item.eta}`} className="transition hover:bg-slate-50">
                  <td className="font-semibold text-slate-700">{item.patient}</td>
                  <td>{item.symptom}</td>
                  <td>{item.severity}</td>
                  <td>{item.eta}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default DashboardPage;
