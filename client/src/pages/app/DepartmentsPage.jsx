import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FaBuildingUser,
  FaFloppyDisk,
  FaHospital,
  FaPenToSquare,
  FaPlus,
  FaTrash,
  FaUserDoctor,
  FaUsers
} from "react-icons/fa6";
import PageHeader from "../../components/common/PageHeader";
import FuturisticModal from "../../components/common/FuturisticModal";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { apiFetch } from "../../utils/api";
import { canPerform } from "../../utils/permissions";

function DepartmentsPage() {
  const { user } = useAuth();
  const { notifySuccess, notifyError } = useNotifications();
  const [searchParams] = useSearchParams();
  const [records, setRecords] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formName, setFormName] = useState("");

  const focusedDepartment = searchParams.get("name") || "All";

  const canCreate = canPerform(user?.role, "department", "create");
  const canUpdate = canPerform(user?.role, "department", "update");
  const canDelete = canPerform(user?.role, "department", "delete");

  const loadData = async () => {
    try {
      setError("");
      const [departmentRes, doctorRes, patientRes] = await Promise.all([
        apiFetch("/departments"),
        apiFetch("/doctors"),
        apiFetch("/patients")
      ]);
      setRecords(departmentRes.records || []);
      setDoctors(doctorRes.data || []);
      setPatients(patientRes.data || []);
    } catch (fetchError) {
      setError(fetchError.message);
      notifyError(fetchError.message, "Departments load failed");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const rows = useMemo(() => {
    const next = records.map((entry) => {
      const doctorCount = doctors.filter(
        (item) => (item.department || item.specialization || "General Medicine") === entry.name
      ).length;
      const patientCount = patients.filter((item) => (item.department || "General Medicine") === entry.name).length;
      return {
        id: entry.id,
        department: entry.name,
        doctorCount,
        patientCount
      };
    });

    const sorted = next.sort((a, b) => a.department.localeCompare(b.department));
    if (focusedDepartment !== "All") {
      return sorted.filter((item) => item.department === focusedDepartment);
    }
    return sorted;
  }, [records, doctors, patients, focusedDepartment]);

  const totals = useMemo(
    () => ({
      departments: rows.length,
      doctors: rows.reduce((sum, item) => sum + item.doctorCount, 0),
      patients: rows.reduce((sum, item) => sum + item.patientCount, 0)
    }),
    [rows]
  );

  const submitCreate = async (event) => {
    event.preventDefault();
    try {
      setError("");
      await apiFetch("/departments", {
        method: "POST",
        body: JSON.stringify({ name: formName })
      });
      setCreateOpen(false);
      setFormName("");
      await loadData();
      notifySuccess("Department created successfully.", "Departments");
    } catch (submitError) {
      setError(submitError.message);
      notifyError(submitError.message, "Department create failed");
    }
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    if (!editTarget) return;
    try {
      setError("");
      await apiFetch(`/departments/${editTarget.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: formName })
      });
      setEditTarget(null);
      setFormName("");
      await loadData();
      notifySuccess("Department updated successfully.", "Departments");
    } catch (submitError) {
      setError(submitError.message);
      notifyError(submitError.message, "Department update failed");
    }
  };

  const removeDepartment = async () => {
    if (!deleteTarget) return;
    try {
      setError("");
      await apiFetch(`/departments/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await loadData();
      notifySuccess("Department deleted successfully.", "Departments");
    } catch (submitError) {
      setError(submitError.message);
      notifyError(submitError.message, "Department delete failed");
    }
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Departments"
        subtitle="Department-wise distribution and department master management."
      />

      {error ? <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-sm text-slate-500">Departments</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-800">{totals.departments}</h3>
          <p className="mt-1 inline-flex items-center gap-2 text-xs text-slate-500"><FaHospital /> Active units</p>
        </article>
        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-sm text-slate-500">Doctors</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-800">{totals.doctors}</h3>
          <p className="mt-1 inline-flex items-center gap-2 text-xs text-slate-500"><FaUserDoctor /> Assigned doctors</p>
        </article>
        <article className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
          <p className="text-sm text-slate-500">Patients</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-800">{totals.patients}</h3>
          <p className="mt-1 inline-flex items-center gap-2 text-xs text-slate-500"><FaUsers /> Tracked patients</p>
        </article>
      </div>

      <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-800"><FaBuildingUser /> Department Allocation</h3>
          {canCreate ? (
            <button
              type="button"
              onClick={() => {
                setFormName("");
                setCreateOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-cyan-600 to-sky-700 px-3 py-2 text-sm font-semibold text-white"
            >
              <FaPlus /> Add Department
            </button>
          ) : null}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Doctors</th>
                <th>Patients</th>
                {(canUpdate || canDelete) ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="font-semibold text-slate-800">{row.department}</td>
                  <td>{row.doctorCount}</td>
                  <td>{row.patientCount}</td>
                  {(canUpdate || canDelete) ? (
                    <td className="table-actions-cell">
                      {canUpdate ? (
                        <button
                          type="button"
                          className="icon-action"
                          onClick={() => {
                            setEditTarget({ id: row.id, name: row.department });
                            setFormName(row.department);
                          }}
                        >
                          <FaPenToSquare />
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          className="icon-action danger"
                          onClick={() => setDeleteTarget({ id: row.id, name: row.department })}
                        >
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

      <FuturisticModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Department"
        subtitle="Create a new department for doctor/patient assignment."
        icon={FaHospital}
        size="sm"
      >
        <form onSubmit={submitCreate} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">Department Name</span>
            <input
              required
              value={formName}
              onChange={(event) => setFormName(event.target.value)}
              className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
            />
          </label>
          <button type="submit" className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-2.5 text-sm font-semibold text-white">
            <FaFloppyDisk /> Save
          </button>
        </form>
      </FuturisticModal>

      <FuturisticModal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Update Department"
        subtitle="Rename department and update linked doctor/patient department values."
        icon={FaPenToSquare}
        size="sm"
      >
        <form onSubmit={submitEdit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">Department Name</span>
            <input
              required
              value={formName}
              onChange={(event) => setFormName(event.target.value)}
              className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
            />
          </label>
          <button type="submit" className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-2.5 text-sm font-semibold text-white">
            <FaFloppyDisk /> Update
          </button>
        </form>
      </FuturisticModal>

      <FuturisticModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Department"
        subtitle="Department can be removed only if no doctor/patient is assigned to it."
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
              onClick={removeDepartment}
              className="rounded-[12px] bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Delete
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Delete department <strong>{deleteTarget?.name}</strong>?
        </p>
      </FuturisticModal>
    </section>
  );
}

export default DepartmentsPage;
