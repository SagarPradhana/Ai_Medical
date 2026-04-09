export const navByRole = {
  admin: [
    { to: "/app", label: "Dashboard", icon: "dashboard" },
    { to: "/app/diagnosis-chat", label: "Diagnosis Chat", icon: "diagnosis" },
    { to: "/app/appointments", label: "Appointments", icon: "appointments" },
    { to: "/app/live-sessions", label: "Live Session", icon: "live" },
    { to: "/app/doctors", label: "Doctors", icon: "doctors" },
    { to: "/app/patients", label: "Patients", icon: "patients" },
    { to: "/app/medical-records", label: "Medical Records", icon: "records" },
    { to: "/app/departments", label: "Departments", icon: "departments" },
    { to: "/app/reports", label: "Reports", icon: "reports" },
    { to: "/app/roles-permissions", label: "Roles & Permissions", icon: "rbac" }
  ],
  doctor: [
    { to: "/app", label: "Dashboard", icon: "dashboard" },
    { to: "/app/appointments", label: "Appointments", icon: "appointments" },
    { to: "/app/live-sessions", label: "Live Session", icon: "live" },
    { to: "/app/doctors", label: "Doctors", icon: "doctors" },
    { to: "/app/patients", label: "Patients", icon: "patients" },
    { to: "/app/departments", label: "Departments", icon: "departments" }
  ],
  patient: [
    { to: "/app", label: "Dashboard", icon: "dashboard" },
    { to: "/app/appointments", label: "Appointments", icon: "appointments" },
    { to: "/app/live-sessions", label: "Live Session", icon: "live" },
    { to: "/app/medical-records", label: "Medical Records", icon: "records" },
    { to: "/app/doctors", label: "Doctors", icon: "doctors" },
    { to: "/app/departments", label: "Departments", icon: "departments" }
  ]
};
