export const rolePermissions = {
  admin: {
    doctor: ["create", "read", "update", "delete"],
    patient: ["create", "read", "update", "delete"],
    appointment: ["create", "read", "update", "delete"],
    rbac: ["create", "read", "update", "delete"],
    session: ["create", "read", "update", "delete"],
    record: ["create", "read", "update", "delete"],
    department: ["create", "read", "update", "delete"]
  },
  doctor: {
    doctor: ["read", "update"],
    patient: ["create", "read", "update"],
    appointment: ["create", "read", "update"],
    session: ["create", "read", "update"],
    record: ["create", "read", "update"],
    department: ["read"]
  },
  patient: {
    doctor: ["read"],
    patient: ["read", "update"],
    appointment: ["create", "read", "update", "delete"],
    session: ["create", "read", "update"],
    record: ["read"],
    department: ["read"]
  }
};

function getStoredPermissionMap() {
  try {
    const raw = localStorage.getItem("aimed_portal_auth");
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed?.permissions || null;
  } catch (_error) {
    return null;
  }
}

export function canPerform(role, resource, action) {
  const runtimePermissions = getStoredPermissionMap();
  if (runtimePermissions) {
    return Boolean(runtimePermissions?.[resource]?.includes(action));
  }
  return Boolean(rolePermissions[role]?.[resource]?.includes(action));
}
