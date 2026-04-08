import { NavLink } from "react-router-dom";
import {
  FaCalendarCheck,
  FaChartLine,
  FaComments,
  FaFileMedical,
  FaGaugeHigh,
  FaVideo,
  FaLock,
  FaStethoscope,
  FaUserDoctor,
  FaUsers
} from "react-icons/fa6";
import { adminOnlyNavItems, baseNavItems, doctorOnlyNavItems } from "../../data/navigation";

const iconByKey = {
  dashboard: FaGaugeHigh,
  diagnosis: FaComments,
  appointments: FaCalendarCheck,
  live: FaVideo,
  records: FaFileMedical,
  reports: FaChartLine,
  doctors: FaUserDoctor,
  patients: FaUsers,
  rbac: FaLock
};

function Sidebar({ role, isOpen, isCollapsed, onClose }) {
  const core = [...baseNavItems.slice(0, 3), ...baseNavItems.slice(3)];
  const withDoctorModules =
    role === "doctor" || role === "admin"
      ? [...core.slice(0, 3), ...doctorOnlyNavItems, ...core.slice(3)]
      : core;
  const navItems =
    role === "admin" ? [...withDoctorModules, ...adminOnlyNavItems] : withDoctorModules;

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand">
        <h2>{isCollapsed ? "AI" : "AI Medical"}</h2>
        {!isCollapsed ? <p>Clinical Portal</p> : null}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = iconByKey[item.icon] || FaStethoscope;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app"}
              onClick={onClose}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-link-icon">
                <Icon />
              </span>
              {!isCollapsed ? <span>{item.label}</span> : null}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
