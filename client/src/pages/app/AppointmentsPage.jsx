import { useEffect, useMemo, useState } from "react";
import {
  FaArrowDownWideShort,
  FaCalendarCheck,
  FaCalendarDays,
  FaCalendarPlus,
  FaClock,
  FaFloppyDisk,
  FaList,
  FaPenToSquare,
  FaTableCellsLarge,
  FaTrash,
  FaVideo
} from "react-icons/fa6";
import PageHeader from "../../components/common/PageHeader";
import FuturisticModal from "../../components/common/FuturisticModal";
import DataPagination from "../../components/common/DataPagination";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";
import { canPerform } from "../../utils/permissions";

const calendarDays = Array.from({ length: 30 }, (_, index) => index + 1);

function StatusBadge({ status }) {
  const cls =
    status === "Confirmed"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : status === "Completed"
        ? "bg-sky-100 text-sky-700 border-sky-200"
        : status === "Cancelled"
          ? "bg-rose-100 text-rose-700 border-rose-200"
          : "bg-amber-100 text-amber-700 border-amber-200";

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

function AppointmentActionButtons({ item, canUpdate, canDelete, onEdit, onDelete, compact = false }) {
  if (!canUpdate && !canDelete) {
    return null;
  }

  const baseClass = compact
    ? "inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 text-[11px] font-semibold"
    : "inline-flex items-center gap-1 rounded-[12px] px-3 py-2 text-xs font-semibold";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canUpdate ? (
        <button
          type="button"
          onClick={() => onEdit(item)}
          className={`${baseClass} border border-sky-200 bg-sky-50 text-sky-700 transition hover:bg-sky-100`}
        >
          <FaPenToSquare /> Edit
        </button>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          onClick={() => onDelete(item)}
          className={`${baseClass} border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100`}
        >
          <FaTrash /> Delete
        </button>
      ) : null}
    </div>
  );
}

function AppointmentsPage() {
  const { user } = useAuth();
  const [view, setView] = useState("grid");
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("date_asc");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    date: "",
    time: "",
    mode: "In-person",
    status: "Pending"
  });

  const canCreate = canPerform(user?.role, "appointment", "create");
  const canUpdate = canPerform(user?.role, "appointment", "update");
  const canDelete = canPerform(user?.role, "appointment", "delete");

  const loadData = async () => {
    try {
      setError("");
      const [appointmentsRes, doctorsRes, patientsRes] = await Promise.all([
        apiFetch("/appointments"),
        apiFetch("/doctors"),
        canPerform(user?.role, "patient", "read") ? apiFetch("/patients") : Promise.resolve({ data: [] })
      ]);
      setAppointments(appointmentsRes.data || []);
      setDoctors(doctorsRes.data || []);
      setPatients(patientsRes.data || []);
    } catch (fetchError) {
      setError(fetchError.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const startCreate = () => {
    if (!canCreate) return;
    setEditingId(null);
    setForm({
      patientId: "",
      doctorId: "",
      date: "",
      time: "",
      mode: "In-person",
      status: "Pending"
    });
    setModalOpen(true);
  };

  const startEdit = (item) => {
    if (!canUpdate) return;
    setEditingId(item.id);
    setForm({
      patientId: item.patientId || "",
      doctorId: item.doctorId || "",
      date: item.date || "",
      time: item.time || "",
      mode: item.mode || "In-person",
      status: item.status || "Pending"
    });
    setModalOpen(true);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    try {
      setError("");
      if (editingId) {
        await apiFetch(`/appointments/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(form)
        });
      } else {
        await apiFetch("/appointments", {
          method: "POST",
          body: JSON.stringify(form)
        });
      }
      setModalOpen(false);
      await loadData();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const removeAppointment = async () => {
    if (!deleteTarget) return;
    try {
      setError("");
      await apiFetch(`/appointments/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await loadData();
    } catch (removeError) {
      setError(removeError.message);
    }
  };

  const sortedAppointments = useMemo(() => {
    const rows = [...appointments];
    rows.sort((a, b) => {
      const aTime = new Date(`${a.date || "1970-01-01"}T${a.time || "00:00"}`).getTime();
      const bTime = new Date(`${b.date || "1970-01-01"}T${b.time || "00:00"}`).getTime();
      return sortBy === "date_desc" ? bTime - aTime : aTime - bTime;
    });
    return rows;
  }, [appointments, sortBy]);

  const now = new Date();
  const previousAppointments = useMemo(
    () =>
      sortedAppointments.filter((item) => {
        const slot = new Date(`${item.date || "1970-01-01"}T${item.time || "00:00"}`);
        return slot.getTime() < now.getTime() || item.status === "Completed";
      }),
    [sortedAppointments, now]
  );

  const upcomingAppointments = useMemo(
    () =>
      sortedAppointments.filter((item) => {
        const slot = new Date(`${item.date || "1970-01-01"}T${item.time || "00:00"}`);
        return slot.getTime() >= now.getTime() && item.status !== "Completed";
      }),
    [sortedAppointments, now]
  );

  const totalPages = Math.max(1, Math.ceil(sortedAppointments.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [sortBy]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedAppointments = sortedAppointments.slice((page - 1) * pageSize, page * pageSize);

  const appointmentMap = useMemo(
    () =>
      sortedAppointments.reduce((acc, item) => {
        const day = Number(String(item.date).split("-")[2]);
        if (day >= 1 && day <= 30) {
          if (!acc[day]) {
            acc[day] = [];
          }
          acc[day].push(item);
        }
        return acc;
      }, {}),
    [sortedAppointments]
  );

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter((item) => item.status === "Confirmed").length,
    pending: appointments.filter((item) => item.status === "Pending").length,
    previous: previousAppointments.length
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Appointments"
        subtitle="Centralized booking, historical records, and consultation scheduling."
      />

      {error ? <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total" value={stats.total} icon={FaCalendarCheck} />
        <StatCard title="Confirmed" value={stats.confirmed} icon={FaCalendarDays} />
        <StatCard title="Pending" value={stats.pending} icon={FaClock} />
        <StatCard title="Previous" value={stats.previous} icon={FaList} />
      </div>

      <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-[12px] border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-semibold ${view === "grid" ? "bg-white text-sky-700 shadow" : "text-slate-600"}`}
              onClick={() => setView("grid")}
            >
              <FaTableCellsLarge /> Grid
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-semibold ${view === "list" ? "bg-white text-sky-700 shadow" : "text-slate-600"}`}
              onClick={() => setView("list")}
            >
              <FaList /> List
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-semibold ${view === "calendar" ? "bg-white text-sky-700 shadow" : "text-slate-600"}`}
              onClick={() => setView("calendar")}
            >
              <FaCalendarDays /> Calendar
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <FaArrowDownWideShort className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-52 appearance-none rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none ring-sky-200 transition focus:ring"
              >
                <option value="date_asc">Sort: Date Nearest</option>
                <option value="date_desc">Sort: Date Latest</option>
              </select>
            </div>

            {canCreate ? (
              <button
                type="button"
                onClick={startCreate}
                className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:opacity-95"
              >
                <FaCalendarPlus /> Create Appointment
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pagedAppointments.map((row) => (
            <article
              key={row.id}
              className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">{row.id}</h3>
                  <p className="text-xs text-slate-500">{row.date} {row.time}</p>
                </div>
                <StatusBadge status={row.status} />
              </div>

              <div className="space-y-1.5 text-sm text-slate-600">
                <p><span className="font-medium text-slate-700">Patient:</span> {row.patientName}</p>
                <p><span className="font-medium text-slate-700">Doctor:</span> {row.doctorName}</p>
                <p><span className="font-medium text-slate-700">Mode:</span> {row.mode}</p>
              </div>

              {(canUpdate || canDelete) ? (
                <div className="mt-3">
                  <AppointmentActionButtons
                    item={row}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    onEdit={startEdit}
                    onDelete={setDeleteTarget}
                  />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      {view === "list" ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
            <h3 className="mb-3 text-base font-semibold text-slate-800">Upcoming Appointments</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Status</th>
                    {(canUpdate || canDelete) ? <th>Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {upcomingAppointments.slice(0, 8).map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.patientName}</td>
                      <td>{row.doctorName}</td>
                      <td>{row.date} {row.time}</td>
                      <td><StatusBadge status={row.status} /></td>
                      {(canUpdate || canDelete) ? (
                        <td className="table-actions-cell">
                          <AppointmentActionButtons
                            item={row}
                            canUpdate={canUpdate}
                            canDelete={canDelete}
                            onEdit={startEdit}
                            onDelete={setDeleteTarget}
                            compact
                          />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
            <h3 className="mb-3 text-base font-semibold text-slate-800">Previous Appointments</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Status</th>
                    {(canUpdate || canDelete) ? <th>Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {previousAppointments.slice(0, 8).map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.patientName}</td>
                      <td>{row.doctorName}</td>
                      <td>{row.date} {row.time}</td>
                      <td><StatusBadge status={row.status} /></td>
                      {(canUpdate || canDelete) ? (
                        <td className="table-actions-cell">
                          <AppointmentActionButtons
                            item={row}
                            canUpdate={canUpdate}
                            canDelete={canDelete}
                            onEdit={startEdit}
                            onDelete={setDeleteTarget}
                            compact
                          />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {view === "calendar" ? (
        <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
          <h3 className="mb-3 text-base font-semibold text-slate-800">Monthly Schedule (1-30)</h3>
          <div className="calendar-grid">
            {calendarDays.map((day) => {
              const dayAppointments = appointmentMap[day] || [];
              return (
                <article key={day} className={`calendar-cell ${dayAppointments.length ? "booked" : ""}`}>
                  <span>{day}</span>
                  {dayAppointments.length ? (
                    <div className="mt-2 space-y-2">
                      {dayAppointments.slice(0, 2).map((item) => (
                        <div key={item.id} className="rounded-[10px] border border-slate-200 bg-white p-2 text-left shadow-sm">
                          <p className="text-[11px] font-semibold text-slate-800">{item.id}</p>
                          <p className="text-[11px] text-slate-500">{item.time} • {item.doctorName}</p>
                          {(canUpdate || canDelete) ? (
                            <div className="mt-2">
                              <AppointmentActionButtons
                                item={item}
                                canUpdate={canUpdate}
                                canDelete={canDelete}
                                onEdit={startEdit}
                                onDelete={setDeleteTarget}
                                compact
                              />
                            </div>
                          ) : null}
                        </div>
                      ))}
                      {dayAppointments.length > 2 ? (
                        <small className="text-[11px] font-semibold text-slate-500">
                          +{dayAppointments.length - 2} more
                        </small>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      <DataPagination
        page={page}
        totalPages={totalPages}
        totalItems={sortedAppointments.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <FuturisticModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Update Appointment" : "Create Appointment"}
        subtitle="Configure patient slot, doctor allocation, and consultation mode."
        icon={FaCalendarPlus}
      >
        <form onSubmit={submitForm} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {user?.role !== "patient" ? (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-600">Patient</span>
                <select
                  value={form.patientId}
                  onChange={(event) => setForm((prev) => ({ ...prev, patientId: event.target.value }))}
                  required
                  className="w-full appearance-none rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
                >
                  <option value="">Select patient</option>
                  {patients.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Doctor</span>
              <select
                value={form.doctorId}
                onChange={(event) => setForm((prev) => ({ ...prev, doctorId: event.target.value }))}
                required
                className="w-full appearance-none rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              >
                <option value="">Select doctor</option>
                {doctors.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                required
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Time</span>
              <input
                type="time"
                value={form.time}
                onChange={(event) => setForm((prev) => ({ ...prev, time: event.target.value }))}
                required
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Mode</span>
              <select
                value={form.mode}
                onChange={(event) => setForm((prev) => ({ ...prev, mode: event.target.value }))}
                className="w-full appearance-none rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              >
                <option>In-person</option>
                <option>Video</option>
              </select>
            </label>

            {user?.role !== "patient" ? (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-600">Status</span>
                <select
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                  className="w-full appearance-none rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
                >
                  <option>Pending</option>
                  <option>Confirmed</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </label>
            ) : null}
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
        title="Delete Appointment"
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
              onClick={removeAppointment}
              className="rounded-[12px] bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Delete
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete <strong>{deleteTarget?.id}</strong>?
        </p>
      </FuturisticModal>
    </section>
  );
}

export default AppointmentsPage;
