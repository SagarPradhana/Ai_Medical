import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaCalendarCheck,
  FaChartLine,
  FaComments,
  FaFileMedical,
  FaGaugeHigh,
  FaVideo,
  FaLock,
  FaHospital,
  FaStethoscope,
  FaUserDoctor,
  FaUsers
} from "react-icons/fa6";
import { navByRole } from "../../data/navigation";
import { apiFetch } from "../../utils/api";

const iconByKey = {
  dashboard: FaGaugeHigh,
  diagnosis: FaComments,
  appointments: FaCalendarCheck,
  live: FaVideo,
  records: FaFileMedical,
  reports: FaChartLine,
  doctors: FaUserDoctor,
  patients: FaUsers,
  rbac: FaLock,
  departments: FaHospital
};

function Sidebar({ role, isOpen, isCollapsed, onClose }) {
  const [departments, setDepartments] = useState([]);
  const navItems = navByRole[role] || navByRole.patient;

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await apiFetch("/departments");
        setDepartments(data.data || []);
      } catch (_error) {
        setDepartments([]);
      }
    };
    loadDepartments();
  }, []);

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

      {!isCollapsed && departments.length > 0 ? (
        <div className="sidebar-subsection">
          <p className="sidebar-subtitle">Department</p>
          <nav className="sidebar-nav">
            {departments.map((name) => (
              <NavLink
                key={name}
                to={`/app/departments?name=${encodeURIComponent(name)}`}
                onClick={onClose}
                className="sidebar-link"
              >
                <span className="sidebar-link-icon">
                  <FaHospital />
                </span>
                <span>{name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      ) : null}
    </aside>
  );
}

export default Sidebar;
