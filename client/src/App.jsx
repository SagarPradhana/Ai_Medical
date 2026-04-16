import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleProtectedRoute from "./routes/RoleProtectedRoute";
import PortalLayout from "./components/layout/PortalLayout";
import LoginChoicePage from "./pages/auth/LoginChoicePage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AdminLoginPage from "./pages/auth/AdminLoginPage";
import DoctorLoginPage from "./pages/auth/DoctorLoginPage";
import PatientLoginPage from "./pages/auth/PatientLoginPage";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/app/DashboardPage";
import DiagnosisChatPage from "./pages/app/DiagnosisChatPage";
import AppointmentsPage from "./pages/app/AppointmentsPage";
import LiveSessionPage from "./pages/app/LiveSessionPage";
import DoctorsPage from "./pages/app/DoctorsPage";
import PatientsPage from "./pages/app/PatientsPage";
import MedicalRecordsPage from "./pages/app/MedicalRecordsPage";
import DepartmentsPage from "./pages/app/DepartmentsPage";
import ReportsPage from "./pages/app/ReportsPage";
import RolesPermissionsPage from "./pages/app/RolesPermissionsPage";
import ProfilePage from "./pages/app/ProfilePage";
import ChangePasswordPage from "./pages/app/ChangePasswordPage";
import SettingsPage from "./pages/app/SettingsPage";
import SignoutPage from "./pages/app/SignoutPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/login" element={<LoginChoicePage />} />
          <Route path="/auth/login/admin" element={<AdminLoginPage />} />
          <Route path="/auth/login/doctor" element={<DoctorLoginPage />} />
          <Route path="/auth/login/patient" element={<PatientLoginPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <PortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route
              path="diagnosis-chat"
              element={
                <RoleProtectedRoute allow={["admin"]}>
                  <DiagnosisChatPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="appointments"
              element={
                <RoleProtectedRoute allow={["doctor", "admin", "patient"]}>
                  <AppointmentsPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="live-sessions"
              element={
                <RoleProtectedRoute allow={["doctor", "admin", "patient"]}>
                  <LiveSessionPage />
                </RoleProtectedRoute>
              }
            />
            <Route path="live-session" element={<Navigate to="/app/live-sessions" replace />} />
            <Route
              path="doctors"
              element={
                <RoleProtectedRoute allow={["doctor", "admin", "patient"]}>
                  <DoctorsPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="patients"
              element={
                <RoleProtectedRoute allow={["doctor", "admin"]}>
                  <PatientsPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="medical-records"
              element={
                <RoleProtectedRoute allow={["doctor", "admin", "patient"]}>
                  <MedicalRecordsPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="departments"
              element={
                <RoleProtectedRoute allow={["doctor", "admin", "patient"]}>
                  <DepartmentsPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <RoleProtectedRoute allow={["admin"]}>
                  <ReportsPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="roles-permissions"
              element={
                <RoleProtectedRoute allow={["admin"]}>
                  <RolesPermissionsPage />
                </RoleProtectedRoute>
              }
            />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="change-password" element={<ChangePasswordPage />} />
            <Route
              path="settings"
              element={
                <RoleProtectedRoute allow={["admin"]}>
                  <SettingsPage />
                </RoleProtectedRoute>
              }
            />
            <Route path="signout" element={<SignoutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
