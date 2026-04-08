import { useEffect, useMemo, useState } from "react";
import {
  FaUserGear,
  FaFloppyDisk,
  FaLock,
  FaPenToSquare,
  FaPlus,
  FaShieldHalved,
  FaTrash
} from "react-icons/fa6";
import PageHeader from "../../components/common/PageHeader";
import FuturisticModal from "../../components/common/FuturisticModal";
import DataPagination from "../../components/common/DataPagination";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";

const actionOptions = ["create", "read", "update", "delete"];

function RolesPermissionsPage() {
  const { refreshSession } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: "", description: "" });
  const [deleteRole, setDeleteRole] = useState(null);

  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [permissionForm, setPermissionForm] = useState({
    role: "",
    resource: "",
    actions: ["read"]
  });
  const [deletePermission, setDeletePermission] = useState(null);
  const [userRoleModalOpen, setUserRoleModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userRoleForm, setUserRoleForm] = useState({ role: "" });

  const [rolePage, setRolePage] = useState(1);
  const [permissionPage, setPermissionPage] = useState(1);
  const pageSize = 6;

  const roleNames = useMemo(() => roles.map((item) => item.name), [roles]);

  const loadData = async () => {
    try {
      setError("");
      const [rolesRes, permsRes] = await Promise.all([
        apiFetch("/rbac/roles"),
        apiFetch("/rbac/permissions")
      ]);
      setRoles(rolesRes.data || []);
      setPermissions(permsRes.data || []);
      const usersRes = await apiFetch("/rbac/users");
      setUsers(usersRes.data || []);
      await refreshSession();
    } catch (fetchError) {
      setError(fetchError.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateRole = () => {
    setEditingRole(null);
    setRoleForm({ name: "", description: "" });
    setRoleModalOpen(true);
  };

  const openEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({ name: role.name, description: role.description || "" });
    setRoleModalOpen(true);
  };

  const submitRole = async (event) => {
    event.preventDefault();
    try {
      setError("");
      if (editingRole) {
        await apiFetch(`/rbac/roles/${editingRole.id}`, {
          method: "PUT",
          body: JSON.stringify({ description: roleForm.description })
        });
      } else {
        await apiFetch("/rbac/roles", {
          method: "POST",
          body: JSON.stringify(roleForm)
        });
      }
      setRoleModalOpen(false);
      await loadData();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const confirmDeleteRole = async () => {
    if (!deleteRole) return;

    try {
      setError("");
      await apiFetch(`/rbac/roles/${deleteRole.id}`, { method: "DELETE" });
      setDeleteRole(null);
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const openCreatePermission = () => {
    setEditingPermission(null);
    setPermissionForm({
      role: roleNames[0] || "",
      resource: "",
      actions: ["read"]
    });
    setPermissionModalOpen(true);
  };

  const openEditPermission = (entry) => {
    setEditingPermission(entry);
    setPermissionForm({
      role: entry.role,
      resource: entry.resource,
      actions: [...entry.actions]
    });
    setPermissionModalOpen(true);
  };

  const toggleAction = (action) => {
    setPermissionForm((prev) => {
      const hasAction = prev.actions.includes(action);
      const nextActions = hasAction
        ? prev.actions.filter((item) => item !== action)
        : [...prev.actions, action];
      return { ...prev, actions: nextActions };
    });
  };

  const submitPermission = async (event) => {
    event.preventDefault();
    try {
      setError("");
      const payload = {
        role: permissionForm.role,
        resource: permissionForm.resource,
        actions: permissionForm.actions
      };

      if (editingPermission) {
        await apiFetch(`/rbac/permissions/${editingPermission.id}`, {
          method: "PUT",
          body: JSON.stringify({ resource: payload.resource, actions: payload.actions })
        });
      } else {
        await apiFetch("/rbac/permissions", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      setPermissionModalOpen(false);
      await loadData();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const confirmDeletePermission = async () => {
    if (!deletePermission) return;

    try {
      setError("");
      await apiFetch(`/rbac/permissions/${deletePermission.id}`, {
        method: "DELETE"
      });
      setDeletePermission(null);
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const openUserRoleModal = (user) => {
    setEditingUser(user);
    setUserRoleForm({ role: user.role || roleNames[0] || "" });
    setUserRoleModalOpen(true);
  };

  const submitUserRole = async (event) => {
    event.preventDefault();
    if (!editingUser) return;
    try {
      setError("");
      await apiFetch(`/rbac/users/${editingUser.id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: userRoleForm.role })
      });
      setUserRoleModalOpen(false);
      await loadData();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const totalRolePages = Math.max(1, Math.ceil(roles.length / pageSize));
  const totalPermissionPages = Math.max(1, Math.ceil(permissions.length / pageSize));

  useEffect(() => {
    if (rolePage > totalRolePages) setRolePage(totalRolePages);
  }, [rolePage, totalRolePages]);

  useEffect(() => {
    if (permissionPage > totalPermissionPages) setPermissionPage(totalPermissionPages);
  }, [permissionPage, totalPermissionPages]);

  const roleRows = roles.slice((rolePage - 1) * pageSize, rolePage * pageSize);
  const permissionRows = permissions.slice((permissionPage - 1) * pageSize, permissionPage * pageSize);

  return (
    <section className="space-y-4">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Create roles and manage granular permission policies with full CRUD."
      />

      {error ? <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-800">
              <FaShieldHalved /> Roles
            </h3>
            <button type="button" className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-cyan-600 to-sky-700 px-3 py-2 text-sm font-semibold text-white" onClick={openCreateRole}>
              <FaPlus /> Create Role
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roleRows.map((role) => (
                  <tr key={role.id}>
                    <td>{role.name}</td>
                    <td>{role.description || "-"}</td>
                    <td>{role.isSystem ? "System" : "Custom"}</td>
                    <td className="table-actions-cell">
                      <button type="button" className="icon-action" onClick={() => openEditRole(role)}>
                        <FaPenToSquare />
                      </button>
                      <button
                        type="button"
                        className="icon-action danger"
                        onClick={() => setDeleteRole(role)}
                        disabled={role.isSystem}
                        title={role.isSystem ? "System roles cannot be deleted" : "Delete role"}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <DataPagination
              page={rolePage}
              totalPages={totalRolePages}
              totalItems={roles.length}
              pageSize={pageSize}
              onPageChange={setRolePage}
            />
          </div>
        </div>

        <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-800">
              <FaLock /> Permissions
            </h3>
            <button type="button" className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-cyan-600 to-sky-700 px-3 py-2 text-sm font-semibold text-white" onClick={openCreatePermission}>
              <FaPlus /> Add Permission
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Resource</th>
                  <th>Actions</th>
                  <th>Manage</th>
                </tr>
              </thead>
              <tbody>
                {permissionRows.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.role}</td>
                    <td>{entry.resource}</td>
                    <td>{entry.actions.join(", ")}</td>
                    <td className="table-actions-cell">
                      <button type="button" className="icon-action" onClick={() => openEditPermission(entry)}>
                        <FaPenToSquare />
                      </button>
                      <button type="button" className="icon-action danger" onClick={() => setDeletePermission(entry)}>
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <DataPagination
              page={permissionPage}
              totalPages={totalPermissionPages}
              totalItems={permissions.length}
              pageSize={pageSize}
              onPageChange={setPermissionPage}
            />
          </div>
        </div>
      </div>

      <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-800">
            <FaUserGear /> User Role Assignment
          </h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Current Role</th>
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.role}</td>
                  <td className="table-actions-cell">
                    <button type="button" className="icon-action" onClick={() => openUserRoleModal(item)}>
                      <FaPenToSquare />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FuturisticModal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={editingRole ? "Edit Role" : "Create Role"}
        subtitle="Configure role identity and high-level access scope."
        icon={FaShieldHalved}
      >
        <form className="space-y-3" onSubmit={submitRole}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Role Name</span>
              <input
                value={roleForm.name}
                onChange={(event) => setRoleForm((prev) => ({ ...prev, name: event.target.value.toLowerCase() }))}
                disabled={Boolean(editingRole)}
                required
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Description</span>
              <input
                value={roleForm.description}
                onChange={(event) => setRoleForm((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              />
            </label>
          </div>
          <button type="submit" className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-2.5 text-sm font-semibold text-white">
            <FaFloppyDisk /> Save
          </button>
        </form>
      </FuturisticModal>

      <FuturisticModal
        open={permissionModalOpen}
        onClose={() => setPermissionModalOpen(false)}
        title={editingPermission ? "Edit Permission" : "Create Permission"}
        subtitle="Define access actions for role-resource combinations."
        icon={FaLock}
      >
        <form className="space-y-3" onSubmit={submitPermission}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Role</span>
              <select
                value={permissionForm.role}
                onChange={(event) => setPermissionForm((prev) => ({ ...prev, role: event.target.value }))}
                disabled={Boolean(editingPermission)}
                required
                className="w-full appearance-none rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              >
                {roleNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-600">Resource</span>
              <input
                value={permissionForm.resource}
                onChange={(event) => setPermissionForm((prev) => ({ ...prev, resource: event.target.value }))}
                required
                className="w-full rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
              />
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-600">Actions</p>
            <div className="flex flex-wrap gap-2">
              {actionOptions.map((action) => (
                <button
                  key={action}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${permissionForm.actions.includes(action) ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}
                  onClick={() => toggleAction(action)}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={permissionForm.actions.length === 0}
            className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <FaFloppyDisk /> Save
          </button>
        </form>
      </FuturisticModal>

      <FuturisticModal
        open={Boolean(deleteRole)}
        onClose={() => setDeleteRole(null)}
        title="Delete Role"
        subtitle="This action is permanent and cannot be undone."
        icon={FaTrash}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteRole(null)} className="rounded-[12px] border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
            <button type="button" onClick={confirmDeleteRole} className="rounded-[12px] bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Delete</button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">Delete role <strong>{deleteRole?.name}</strong>?</p>
      </FuturisticModal>

      <FuturisticModal
        open={Boolean(deletePermission)}
        onClose={() => setDeletePermission(null)}
        title="Delete Permission"
        subtitle="This action is permanent and cannot be undone."
        icon={FaTrash}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeletePermission(null)} className="rounded-[12px] border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
            <button type="button" onClick={confirmDeletePermission} className="rounded-[12px] bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Delete</button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Delete permission <strong>{deletePermission?.role}:{deletePermission?.resource}</strong>?
        </p>
      </FuturisticModal>

      <FuturisticModal
        open={userRoleModalOpen}
        onClose={() => setUserRoleModalOpen(false)}
        title="Assign User Role"
        subtitle="Update the user role and apply its permission policy."
        icon={FaUserGear}
        size="sm"
      >
        <form className="space-y-3" onSubmit={submitUserRole}>
          <p className="text-sm text-slate-600">
            User: <strong>{editingUser?.name}</strong> ({editingUser?.email})
          </p>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">Role</span>
            <select
              value={userRoleForm.role}
              onChange={(event) => setUserRoleForm({ role: event.target.value })}
              className="w-full appearance-none rounded-[12px] border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm outline-none ring-sky-200 transition focus:ring"
            >
              {roleNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-r from-cyan-600 to-sky-700 px-4 py-2.5 text-sm font-semibold text-white">
            <FaFloppyDisk /> Save Role
          </button>
        </form>
      </FuturisticModal>
    </section>
  );
}

export default RolesPermissionsPage;
