import { useEffect, useMemo, useState } from "react";
import {
  FaArrowDownWideShort,
  FaFilter,
  FaFloppyDisk,
  FaList,
  FaPenToSquare,
  FaTableCellsLarge,
  FaTrash,
  FaUserDoctor,
  FaUserPlus,
  FaUserTag
} from "react-icons/fa6";
import PageHeader from "../../components/common/PageHeader";
import FuturisticModal from "../../components/common/FuturisticModal";
import DataPagination from "../../components/common/DataPagination";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";
import { canPerform } from "../../utils/permissions";

function StatusBadge({ status }) {
  const cls =
    status === "On Leave"
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-emerald-100 text-emerald-700 border-emerald-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function StatCard({ title, value, icon: Icon }) {
  return (
    <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5">
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

function DoctorsPage() {
  const { user } = useAuth();
  const [view, setView] = useState("grid");
  const [doctors, setDoctors] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("name_asc");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [form, setForm] = useState({
    name: "",
    specialization: "",
    experience: 0,
    status: "On Duty",
    email: "",
    phone: ""
  });

  const canCreate = canPerform(user?.role, "doctor", "create");
  const canUpdate = canPerform(user?.role, "doctor", "update");
  const canDelete = canPerform(user?.role, "doctor", "delete");

  const loadDoctors = async () => {
    try {
      setError("");
      const data = await apiFetch("/doctors");
      setDoctors(data.data || []);
    } catch (fetchError) {
      setError(fetchError.message);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const openCreateModal = () => {
    if (!canCreate) return;
    setEditingId(null);
    setForm({
      name: "",
      specialization: "",
      experience: 0,
      status: "On Duty",
      email: "",
      phone: ""
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    if (!canUpdate) return;
    if (user?.role === "doctor" && user?.doctorRef !== item.id) return;

    setEditingId(item.id);
    setForm({
      name: item.name || "",
      specialization: item.specialization || "",
      experience: item.experience || 0,
      status: item.status || "On Duty",
      email: item.email || "",
      phone: item.phone || ""
    });
    setModalOpen(true);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    try {
      setError("");
      if (editingId) {
        await apiFetch(`/doctors/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(form)
        });
      } else {
        await apiFetch("/doctors", {
          method: "POST",
          body: JSON.stringify(form)
        });
      }
      setModalOpen(false);
      await loadDoctors();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const removeDoctor = async () => {
    if (!deleteTarget) return;
    try {
      setError("");
      await apiFetch(`/doctors/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await loadDoctors();
    } catch (removeError) {
      setError(removeError.message);
    }
  };

  const stats = useMemo(() => {
    const total = doctors.length;
    const available = doctors.filter((d) => d.status === "On Duty").length;
    const onLeave = doctors.filter((d) => d.status === "On Leave").length;
    const specialists = new Set(doctors.map((d) => d.specialization).filter(Boolean)).size;
    return { total, available, onLeave, specialists };
  }, [doctors]);

  const processed = useMemo(() => {
    let rows = [...doctors];

    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.id?.toLowerCase().includes(q) ||
          item.specialization?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "All") {
      rows = rows.filter((item) => item.status === statusFilter);
    }

    rows.sort((a, b) => {
      if (sortBy === "name_asc") return String(a.name).localeCompare(String(b.name));
      if (sortBy === "name_desc") return String(b.name).localeCompare(String(a.name));
      return Number(b.experience || 0) - Number(a.experience || 0);
    });

    return rows;
  }, [doctors, query, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, sortBy]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedDoctors = processed.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="space-y-4">
      <PageHeader
        title="Doctors Management"
        subtitle="Specialist capacity, availability, and profile administration."
      />

      {error ? <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Doctors" value={stats.total} icon={FaUserDoctor} />
        <StatCard title="Available" value={stats.available} icon={FaUserTag} />
        <StatCard title="On Leave" value={stats.onLeave} icon={FaList} />
        <StatCard title="Specializations" value={stats.specialists} icon={FaTableCellsLarge} />
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
              <FaUserPlus /> Add Doctor
            </button>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="relative">
            <FaUserDoctor className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, ID, specialization..."
              className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none ring-sky-200 transition focus:ring"
            />
          </div>

          <div className="relative">
            <FaFilter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full appearance-none rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none ring-sky-200 transition focus:ring"
            >
              <option>All</option>
              <option>On Duty</option>
              <option>On Leave</option>
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
              <option value="exp_desc">Sort: Experience High-Low</option>
            </select>
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pagedDoctors.map((doctor) => (
            <article
              key={doctor.id}
              className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">{doctor.name}</h3>
                  <p className="text-xs text-slate-500">{doctor.id}</p>
                </div>
                <StatusBadge status={doctor.status} />
              </div>

              <div className="space-y-1.5 text-sm text-slate-600">
                <p><span className="font-medium text-slate-700">Specialization:</span> {doctor.specialization || "-"}</p>
                <p><span className="font-medium text-slate-700">Experience:</span> {doctor.experience || 0} years</p>
                <p><span className="font-medium text-slate-700">Email:</span> {doctor.email || "-"}</p>
                <p><span className="font-medium text-slate-700">Phone:</span> {doctor.phone || "-"}</p>
              </div>

              {(canUpdate || canDelete) ? (
                <div className="mt-3 flex items-center gap-2">
                  {canUpdate && (user?.role !== "doctor" || user?.doctorRef === doctor.id) ? (
                    <button
                      type="button"
                      onClick={() => openEditModal(doctor)}
                      className="inline-flex items-center gap-1 rounded-[12px] border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                    >
                      <FaPenToSquare /> Edit
                    </button>
                  ) : null}
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(doctor)}
                      className="inline-flex items-center gap-1 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <FaTrash /> Delete
                    </button>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th>Email</th>
                  {(canUpdate || canDelete) ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {pagedDoctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td>
                      <p className="font-semibold text-slate-800">{doctor.name}</p>
                      <p className="text-xs text-slate-500">{doctor.id}</p>
                    </td>
                    <td>{doctor.specialization || "-"}</td>
                    <td>{doctor.experience || 0} yrs</td>
                    <td><StatusBadge status={doctor.status} /></td>
                    <td>{doctor.email || "-"}</td>
                    {(canUpdate || canDelete) ? (
                      <td className="table-actions-cell">
                        {canUpdate && (user?.role !== "doctor" || user?.doctorRef === doctor.id) ? (
                          <button type="button" className="icon-action" onClick={() => openEditModal(doctor)}>
                            <FaPenToSquare />
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button type="button" className="icon-action danger" onClick={() => setDeleteTarget(doctor)}>
                            <FaTrash />
                          </button>
                        ) : null}
                      </td>
                    ) : null}
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
        title={editingId ? "Update Doctor" : "Create Doctor"}
        subtitle="Manage specialist profile, availability, and contact details."
        icon={FaUserDoctor}
      >
        <form onSubmit={submitForm} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Name</span>
              <input
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Specialization</span>
              <input
                value={form.specialization}
                onChange={(event) => setForm((prev) => ({ ...prev, specialization: event.target.value }))}
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Experience (Years)</span>
              <input
                type="number"
                min="0"
                value={form.experience}
                onChange={(event) => setForm((prev) => ({ ...prev, experience: Number(event.target.value) }))}
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Status</span>
              <select
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                className="w-full appearance-none rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              >
                <option>On Duty</option>
                <option>On Leave</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Phone</span>
              <input
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              />
            </label>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:opacity-95"
          >
            <FaFloppyDisk /> {editingId ? "Update" : "Create"}
          </button>
        </form>
      </FuturisticModal>

      <FuturisticModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Doctor"
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
              onClick={removeDoctor}
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

export default DoctorsPage;
