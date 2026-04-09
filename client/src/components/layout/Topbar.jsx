import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaBarsStaggered,
  FaBell,
  FaCircleUser,
  FaKey,
  FaRightFromBracket,
  FaShield,
  FaUser
} from "react-icons/fa6";
import { useNotifications } from "../../context/NotificationContext";

function Topbar({ onToggleSidebar, onToggleCollapse, user }) {
  const [openAccountModal, setOpenAccountModal] = useState(false);
  const location = useLocation();
  const { unreadCount, openModal } = useNotifications();

  useEffect(() => {
    setOpenAccountModal(false);
  }, [location.pathname]);

  return (
    <header className="topbar">
      <div className="topbar-left-actions">
        <button type="button" className="menu-btn" onClick={onToggleSidebar} aria-label="Open menu">
          <FaBarsStaggered />
        </button>
        <button
          type="button"
          className="collapse-btn"
          onClick={onToggleCollapse}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <FaBarsStaggered />
        </button>
      </div>

      <div>
        <h1>Healthcare Operations Portal</h1>
        <p>AI-enabled patient and clinical management</p>
      </div>

      <div className="topbar-actions">
        <button type="button" className="notif-icon-btn" onClick={openModal} aria-label="Open notifications">
          <span className="notif-icon">
            <FaBell />
          </span>
          {unreadCount > 0 ? <span className="notif-count">{unreadCount}</span> : null}
        </button>

        <button
          type="button"
          className="notif-icon-btn"
          onClick={() => setOpenAccountModal(true)}
          aria-label="Open account"
        >
          <span className="notif-icon">
            <FaCircleUser />
          </span>
        </button>
      </div>

      {openAccountModal ? (
        <div className="topbar-account-modal-wrap">
          <button
            type="button"
            className="topbar-account-backdrop"
            onClick={() => setOpenAccountModal(false)}
            aria-label="Close account modal"
          />
          <section className="topbar-account-card">
            <div className="topbar-account-head">
              <h3>Account</h3>
              <button type="button" className="close-btn" onClick={() => setOpenAccountModal(false)}>
                Close
              </button>
            </div>

            <div className="topbar-account-meta">
              <p className="account-name">{user?.name || "User"}</p>
              <p className="account-email">{user?.email || "-"}</p>
              <span className="account-role-pill">
                <FaShield /> Role: {user?.position || user?.role || "guest"}
              </span>
            </div>

            <div className="topbar-account-links">
              <NavLink to="/app/profile" onClick={() => setOpenAccountModal(false)}>
                <FaUser /> Profile
              </NavLink>
              <NavLink to="/app/change-password" onClick={() => setOpenAccountModal(false)}>
                <FaKey /> Change Password
              </NavLink>
              <NavLink to="/app/signout" onClick={() => setOpenAccountModal(false)}>
                <FaRightFromBracket /> Sign Out
              </NavLink>
            </div>
          </section>
        </div>
      ) : null}
    </header>
  );
}

export default Topbar;
