import { Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import NotificationModal from "./NotificationModal";
import ToastViewport from "./ToastViewport";

function PortalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className={`portal-shell ${isSidebarCollapsed ? "collapsed" : ""}`} data-theme={theme}>
      <Sidebar
        role={user?.role}
        isOpen={sidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}
      <div className="portal-content">
        <Topbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isSidebarCollapsed={isSidebarCollapsed}
          user={user}
          onToggleTheme={toggleTheme}
          isDark={isDark}
        />
        <main className="portal-main">
          <Outlet />
        </main>
      </div>
      <NotificationModal />
      <ToastViewport />
    </div>
  );
}

export default PortalLayout;
