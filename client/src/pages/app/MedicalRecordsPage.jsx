import { useEffect, useMemo, useState } from "react";
import {
  FaClipboardCheck,
  FaFileCircleCheck,
  FaFileImage,
  FaFileLines,
  FaFilter,
  FaFlask,
  FaLock,
  FaMagnifyingGlass,
  FaNotesMedical,
  FaPrescriptionBottleMedical,
  FaShieldHalved,
  FaUserDoctor,
  FaUsers
} from "react-icons/fa6";
import PageHeader from "../../components/common/PageHeader";
import { apiFetch } from "../../utils/api";

const categoryIcons = {
  "Lab Reports": FaFlask,
  Prescriptions: FaPrescriptionBottleMedical,
  Imaging: FaFileImage,
  Notes: FaNotesMedical
};

function SummaryCard({ title, value, icon: Icon, tone }) {
  return (
    <article className={`rounded-[12px] border border-slate-200 border-l-4 ${tone} bg-white p-4 shadow-soft transition-all duration-200 hover:-translate-y-1`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-cyan-50 text-cyan-700">
          <Icon />
        </span>
      </div>
      <h3 className="mt-2 text-2xl font-bold text-slate-800">{value}</h3>
    </article>
  );
}

function RecordTypeIcon({ type }) {
  if (type === "Lab Report") return <FaFlask className="text-cyan-700" />;
  if (type === "Prescription") return <FaPrescriptionBottleMedical className="text-emerald-700" />;
  if (type === "Imaging") return <FaFileImage className="text-sky-700" />;
  return <FaFileLines className="text-amber-700" />;
}

function StatusBadge({ status }) {
  const cls =
    status === "Reviewed"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : "bg-amber-100 text-amber-700 border-amber-200";
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{status}</span>;
}

function MedicalRecordsPage() {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [doctorFilter, setDoctorFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [error, setError] = useState("");

  const loadRecords = async () => {
    try {
      setError("");
      const data = await apiFetch("/medical-records");
      setRecords(data.data || []);
    } catch (fetchError) {
      setError(fetchError.message);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const recordTypes = useMemo(() => ["All", ...new Set(records.map((item) => item.type))], [records]);
  const doctors = useMemo(() => ["All", ...new Set(records.map((item) => item.doctorName))], [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const matchesQuery =
        !query.trim() ||
        String(item.patientName || "").toLowerCase().includes(query.toLowerCase()) ||
        String(item.patientId || "").toLowerCase().includes(query.toLowerCase()) ||
        String(item.id || "").toLowerCase().includes(query.toLowerCase());

      const matchesType = typeFilter === "All" || item.type === typeFilter;
      const matchesDoctor = doctorFilter === "All" || item.doctorName === doctorFilter;
      const matchesDate = !dateFilter || item.date === dateFilter;

      return matchesQuery && matchesType && matchesDoctor && matchesDate;
    });
  }, [records, query, typeFilter, doctorFilter, dateFilter]);

  const summary = useMemo(() => {
    const total = filteredRecords.length;
    const encrypted = filteredRecords.filter((item) => item.encrypted).length;
    const newlyAdded = filteredRecords.filter((item) => item.status === "New").length;
    const pending = filteredRecords.filter((item) => item.status === "Pending").length;
    return { total, encrypted, newlyAdded, pending };
  }, [filteredRecords]);

  const categories = useMemo(
    () => [
      { name: "Lab Reports", count: filteredRecords.filter((item) => item.category === "Lab Reports").length },
      { name: "Prescriptions", count: filteredRecords.filter((item) => item.category === "Prescriptions").length },
      { name: "Imaging", count: filteredRecords.filter((item) => item.category === "Imaging").length },
      { name: "Notes", count: filteredRecords.filter((item) => item.category === "Notes").length }
    ],
    [filteredRecords]
  );

  return (
    <section className="space-y-4">
      <PageHeader
        title="Medical Records"
        subtitle="Modern records dashboard with secure document controls and compliance visibility."
      />

      {error ? <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Records" value={summary.total} icon={FaUsers} tone="border-l-cyan-500" />
        <SummaryCard title="Encrypted Records" value={summary.encrypted} icon={FaLock} tone="border-l-emerald-500" />
        <SummaryCard title="New Records" value={summary.newlyAdded} icon={FaFileCircleCheck} tone="border-l-sky-500" />
        <SummaryCard title="Pending Review" value={summary.pending} icon={FaClipboardCheck} tone="border-l-amber-500" />
      </div>

      <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative block">
            <span className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><FaMagnifyingGlass /> Search Patient</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, Patient ID, Record ID" className="w-full rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-sky-200 focus:ring" />
          </label>

          <label className="block">
            <span className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><FaFilter /> Record Type</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="w-full rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-sky-200 focus:ring">
              {recordTypes.map((item) => (<option key={item} value={item}>{item}</option>))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><FaUserDoctor /> Filter By Doctor</span>
            <select value={doctorFilter} onChange={(event) => setDoctorFilter(event.target.value)} className="w-full rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-sky-200 focus:ring">
              {doctors.map((item) => (<option key={item} value={item}>{item}</option>))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><FaFilter /> Filter By Date</span>
            <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="w-full rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-sky-200 focus:ring" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {categories.map((item) => {
          const Icon = categoryIcons[item.name];
          return (
            <article key={item.name} className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-cyan-50 text-cyan-700"><Icon /></span>
              </div>
              <h3 className="mt-2 text-xl font-bold text-slate-800">{item.count}</h3>
            </article>
          );
        })}
      </div>

      <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="mb-3 text-base font-semibold text-slate-800">Recent Records</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Record</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Status</th>
                <th>Security</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((row) => {
                const initials = String(row.patientName || "PT").split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
                return (
                  <tr key={row.id} className="transition hover:bg-slate-50">
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700">{initials}</div>
                        <div>
                          <p className="font-semibold text-slate-800">{row.patientName}</p>
                          <p className="text-xs text-slate-500">{row.patientId}</p>
                        </div>
                      </div>
                    </td>
                    <td><div className="inline-flex items-center gap-2"><RecordTypeIcon type={row.type} /><span>{row.type}</span></div></td>
                    <td>{row.doctorName}</td>
                    <td>{row.date}</td>
                    <td><StatusBadge status={row.status} /></td>
                    <td><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.encrypted ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{row.encrypted ? "Encrypted" : "Unencrypted"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft"><h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-800"><FaShieldHalved /> Encryption Controls</h3><p className="mt-2 text-sm text-slate-600">AES-encrypted storage policy active with controlled key lifecycle.</p></article>
        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft"><h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-800"><FaLock /> Access Governance</h3><p className="mt-2 text-sm text-slate-600">Role-based record access enforced with API-level permission checks.</p></article>
        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft"><h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-800"><FaFileCircleCheck /> Audit Readiness</h3><p className="mt-2 text-sm text-slate-600">Record activity is traceable across creation, updates, and review events.</p></article>
      </div>
    </section>
  );
}

export default MedicalRecordsPage;
