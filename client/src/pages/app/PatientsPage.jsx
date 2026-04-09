import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FaArrowDownWideShort,
  FaDownload,
  FaEnvelope,
  FaFilter,
  FaFloppyDisk,
  FaHospital,
  FaList,
  FaPenToSquare,
  FaTableCellsLarge,
  FaTrash,
  FaUser,
  FaUserInjured,
  FaUserPlus,
  FaUsers,
  FaVenusMars
} from "react-icons/fa6";
import PageHeader from "../../components/common/PageHeader";
import FuturisticModal from "../../components/common/FuturisticModal";
import DataPagination from "../../components/common/DataPagination";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { apiFetch } from "../../utils/api";
import { canPerform } from "../../utils/permissions";

const riskOrder = { High: 3, Medium: 2, Low: 1 };

function RiskBadge({ risk }) {
  const cls =
    risk === "High"
      ? "bg-rose-100 text-rose-700 border-rose-200"
      : risk === "Medium"
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : "bg-emerald-100 text-emerald-700 border-emerald-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {risk}
    </span>
  );
}

function StatCard({ title, value, icon }) {
  const Icon = icon;
  return (
    <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-sky-50 text-sky-700">
          <Icon />
        </span>
      </div>
      <h3 className="mt-2 text-2xl font-bold text-slate-800">{value}</h3>
    </article>
  );
}

function PatientsPage() {
  const { user } = useAuth();
  const { notifySuccess, notifyError, notifyInfo } = useNotifications();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [view, setView] = useState("grid");
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState(searchParams.get("department") || "All");
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [sortBy, setSortBy] = useState("name_asc");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [form, setForm] = useState({
    name: "",
    age: 0,
    gender: "Unknown",
    risk: "Low",
    status: "New",
    nextVisit: "",
    email: "",
    password: "",
    condition: "",
    department: ""
  });

  const canCreate = canPerform(user?.role, "patient", "create");
  const canUpdate = canPerform(user?.role, "patient", "update");
  const canDelete = canPerform(user?.role, "patient", "delete");

  const loadPatients = async () => {
    try {
      setError("");
      const [patientRes, departmentRes] = await Promise.all([apiFetch("/patients"), apiFetch("/departments")]);
      setPatients(patientRes.data || []);
      setDepartmentOptions(departmentRes.data || []);
    } catch (fetchError) {
      setError(fetchError.message);
      notifyError(fetchError.message, "Patients load failed");
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    setDepartmentFilter(searchParams.get("department") || "All");
  }, [searchParams]);

  const downloadReport = (patient) => {
    const content = `Patient Report
ID: ${patient.id}
Name: ${patient.name}
Risk: ${patient.risk}
Condition: ${patient.condition}
Department: ${patient.department || "-"}
Next Visit: ${patient.nextVisit}
Generated At: ${new Date().toISOString()}
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${patient.id}-report.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
    notifyInfo(`Report downloaded for ${patient.name}.`, "Patient report");
  };

  const openCreateModal = () => {
    if (!canCreate) {
      return;
    }
    setEditingId(null);
    setForm({
      name: "",
      age: 0,
      gender: "Unknown",
      risk: "Low",
      status: "New",
      nextVisit: "",
      email: "",
      password: "",
      condition: "",
      department: departmentOptions[0] || ""
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    if (!canUpdate) {
      return;
    }
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      age: item.age || 0,
      gender: item.gender || "Unknown",
      risk: item.risk || "Low",
      status: item.status || "New",
      nextVisit: item.nextVisit || "",
      email: item.email || "",
      password: "",
      condition: item.condition || "",
      department: item.department || ""
    });
    setModalOpen(true);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    try {
      setError("");
      const payload = { ...form };
      if (editingId) {
        delete payload.password;
      }
      if (editingId) {
        await apiFetch(`/patients/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch("/patients", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      setModalOpen(false);
      await loadPatients();
      notifySuccess(editingId ? "Patient updated successfully." : "Patient created successfully.", "Patients");
    } catch (submitError) {
      setError(submitError.message);
      notifyError(submitError.message, "Patient save failed");
    }
  };

  const removePatient = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      setError("");
      await apiFetch(`/patients/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await loadPatients();
      notifySuccess("Patient deleted successfully.", "Patients");
    } catch (removeError) {
      setError(removeError.message);
      notifyError(removeError.message, "Patient delete failed");
    }
  };

  const todayIso = new Date().toISOString().slice(0, 10);
  const stats = useMemo(() => {
    const total = patients.length;
    const highRisk = patients.filter((item) => item.risk === "High").length;
    const visitsToday = patients.filter((item) => item.nextVisit === todayIso).length;
    const newPatients = patients.filter((item) => item.status.toLowerCase().includes("new")).length;
    return { total, highRisk, visitsToday, newPatients };
  }, [patients, todayIso]);

  const departments = useMemo(() => ["All", ...departmentOptions], [departmentOptions]);

  const processed = useMemo(() => {
    let rows = [...patients];

    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.id?.toLowerCase().includes(q) ||
          item.condition?.toLowerCase().includes(q)
      );
    }

    if (riskFilter !== "All") {
      rows = rows.filter((item) => item.risk === riskFilter);
    }

    if (departmentFilter !== "All") {
      rows = rows.filter((item) => item.department === departmentFilter);
    }

    rows.sort((a, b) => {
      if (sortBy === "name_asc") return String(a.name).localeCompare(String(b.name));
      if (sortBy === "name_desc") return String(b.name).localeCompare(String(a.name));
      if (sortBy === "risk_desc") return (riskOrder[b.risk] || 0) - (riskOrder[a.risk] || 0);
      return String(a.nextVisit || "").localeCompare(String(b.nextVisit || ""));
    });

    return rows;
  }, [patients, query, riskFilter, departmentFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [query, riskFilter, departmentFilter, sortBy]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedPatients = processed.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="space-y-4">
      <PageHeader
        title="Patients Management Dashboard"
        subtitle="Modern healthcare patient admin panel with risk monitoring and workflow actions."
      />

      {error ? <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Patients" value={stats.total} icon={FaUsers} />
        <StatCard title="High Risk" value={stats.highRisk} icon={FaUserInjured} />
        <StatCard title="Visits Today" value={stats.visitsToday} icon={FaUserPlus} />
        <StatCard title="New Patients" value={stats.newPatients} icon={FaUser} />
      </div>

      <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-[12px] border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-semibold ${view === "grid" ? "bg-white text-sky-700 shadow" : "text-slate-600"}`}
            >
              <FaTableCellsLarge /> Grid
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-semibold ${view === "list" ? "bg-white text-sky-700 shadow" : "text-slate-600"}`}
            >
              <FaList /> List
            </button>
          </div>

          {canCreate ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:opacity-95"
            >
              <FaUserPlus /> Add Patient
            </button>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="relative">
            <FaUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, ID, condition..."
              className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none ring-sky-200 transition focus:ring"
            />
          </div>

          <div className="relative">
            <FaFilter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value)}
              className="w-full appearance-none rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none ring-sky-200 transition focus:ring"
            >
              <option>All</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>

          <div className="relative">
            <FaArrowDownWideShort className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full appearance-none rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none ring-sky-200 transition focus:ring"
            >
              <option value="name_asc">Sort: Name A-Z</option>
              <option value="name_desc">Sort: Name Z-A</option>
              <option value="risk_desc">Sort: Risk High-Low</option>
              <option value="visit_asc">Sort: Next Visit</option>
            </select>
          </div>

          <div className="relative">
            <FaHospital className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              className="w-full appearance-none rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none ring-sky-200 transition focus:ring"
            >
              {departments.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pagedPatients.map((patient) => {
            const initials = patient.name
              ?.split(" ")
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase();

            return (
              <article
                key={patient.id}
                className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                      {initials || "PT"}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-800">{patient.name}</h3>
                      <p className="text-xs text-slate-500">{patient.id}</p>
                    </div>
                  </div>
                  <RiskBadge risk={patient.risk} />
                </div>

                <div className="space-y-1.5 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-700">Condition:</span> {patient.condition || "-"}</p>
                  <p><span className="font-medium text-slate-700">Status:</span> {patient.status || "-"}</p>
                  <p><span className="font-medium text-slate-700">Department:</span> {patient.department || "-"}</p>
                  <p><span className="font-medium text-slate-700">Next Visit:</span> {patient.nextVisit || "-"}</p>
                  <p><span className="font-medium text-slate-700">Email:</span> {patient.email || "-"}</p>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadReport(patient)}
                    className="inline-flex items-center gap-1 rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <FaDownload /> Report
                  </button>
                  {canUpdate ? (
                    <button
                      type="button"
                      onClick={() => openEditModal(patient)}
                      className="inline-flex items-center gap-1 rounded-[12px] border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                    >
                      <FaPenToSquare /> Edit
                    </button>
                  ) : null}
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(patient)}
                      className="inline-flex items-center gap-1 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <FaTrash /> Delete
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Risk</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th>Department</th>
                  <th>Next Visit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                          {patient.name?.slice(0, 1)?.toUpperCase() || "P"}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{patient.name}</p>
                          <p className="text-xs text-slate-500">{patient.id}</p>
                        </div>
                      </div>
                    </td>
                    <td><RiskBadge risk={patient.risk} /></td>
                    <td>{patient.condition || "-"}</td>
                    <td>{patient.status || "-"}</td>
                    <td>{patient.department || "-"}</td>
                    <td>{patient.nextVisit || "-"}</td>
                    <td className="table-actions-cell">
                      <button type="button" className="icon-action" onClick={() => downloadReport(patient)}>
                        <FaDownload />
                      </button>
                      {canUpdate ? (
                        <button type="button" className="icon-action" onClick={() => openEditModal(patient)}>
                          <FaPenToSquare />
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button type="button" className="icon-action danger" onClick={() => setDeleteTarget(patient)}>
                          <FaTrash />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DataPagination
        page={page}
        totalPages={totalPages}
        totalItems={processed.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <FuturisticModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Update Patient" : "Create Patient"}
        subtitle="Capture essential patient profile and clinical risk context."
        icon={FaUserInjured}
      >
        <form onSubmit={submitForm} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="relative block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Name</span>
              <FaUser className="pointer-events-none absolute left-3 top-[38px] text-slate-400" />
              <input
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none ring-sky-200 transition focus:ring"
              />
            </label>

            <label className="relative block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Email</span>
              <FaEnvelope className="pointer-events-none absolute left-3 top-[38px] text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none ring-sky-200 transition focus:ring"
              />
            </label>

            {!editingId ? (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-600">Login Password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
                />
              </label>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Age</span>
              <input
                type="number"
                min="0"
                value={form.age}
                onChange={(event) => setForm((prev) => ({ ...prev, age: Number(event.target.value) }))}
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              />
            </label>

            <label className="relative block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Gender</span>
              <FaVenusMars className="pointer-events-none absolute left-3 top-[38px] text-slate-400" />
              <select
                value={form.gender}
                onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value }))}
                className="w-full appearance-none rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none ring-sky-200 transition focus:ring"
              >
                <option>Unknown</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Risk</span>
              <select
                value={form.risk}
                onChange={(event) => setForm((prev) => ({ ...prev, risk: event.target.value }))}
                className="w-full appearance-none rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Status</span>
              <input
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Condition</span>
              <input
                value={form.condition}
                onChange={(event) => setForm((prev) => ({ ...prev, condition: event.target.value }))}
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Department</span>
              <select
                value={form.department}
                onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
                required
                className="w-full appearance-none rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              >
                <option value="">Select department</option>
                {departmentOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Next Visit</span>
              <input
                type="date"
                value={form.nextVisit}
                onChange={(event) => setForm((prev) => ({ ...prev, nextVisit: event.target.value }))}
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:opacity-95"
            >
              <FaFloppyDisk /> {editingId ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </FuturisticModal>

      <FuturisticModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Patient"
        subtitle="This action is permanent and cannot be undone."
        icon={FaTrash}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded-[12px] border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={removePatient}
              className="rounded-[12px] bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Delete
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
        </p>
      </FuturisticModal>
    </section>
  );
}

export default PatientsPage;
