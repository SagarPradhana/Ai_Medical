export const baseNavItems = [
  { to: "/app", label: "Dashboard", icon: "dashboard" },
  { to: "/app/diagnosis-chat", label: "Diagnosis Chat", icon: "diagnosis" },
  { to: "/app/appointments", label: "Appointments", icon: "appointments" },
  { to: "/app/live-sessions", label: "Live Session", icon: "live" },
  { to: "/app/medical-records", label: "Medical Records", icon: "records" },
  { to: "/app/reports", label: "Reports", icon: "reports" }
];

export const doctorOnlyNavItems = [
  { to: "/app/doctors", label: "Doctors", icon: "doctors" },
  { to: "/app/patients", label: "Patients", icon: "patients" }
];

export const adminOnlyNavItems = [
  { to: "/app/roles-permissions", label: "Roles & Permissions", icon: "rbac" }
];
