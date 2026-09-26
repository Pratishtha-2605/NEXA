
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  FlaskConical,
  BarChart3,
} from "lucide-react";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <FlaskConical size={28} />
        <h2>NeuroLab</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <Link to="/dashboard" className="sidebar-link">
          <FlaskConical size={20} />
          <span>Experiments</span>
        </Link>

        <NavLink
          to="/results"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <BarChart3 size={20} />
          <span>Results</span>
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;