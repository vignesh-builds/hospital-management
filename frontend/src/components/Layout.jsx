import { useState } from "react";
import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { getUser, logout } from "../utils/auth";
import { initials } from "../utils/text";
import {
  BrandMark,
  IconCalendar,
  IconDashboard,
  IconDoctor,
  IconHome,
  IconMenu,
  IconPatients,
} from "./ui/Icons";

const dashboardPath = {
  PATIENT: "/patient-dashboard",
  DOCTOR: "/doctor-dashboard",
  ADMIN: "/admin-dashboard",
};

function navFor(role) {
  const items = [
    { to: "/", label: "Home", icon: <IconHome />, end: true },
    ...(dashboardPath[role] ? [{ to: dashboardPath[role], label: "Dashboard", icon: <IconDashboard /> }] : []),
    { to: "/doctors", label: "Doctors", icon: <IconDoctor /> },
  ];

  if (role === "ADMIN") {
    items.push({ to: "/patients", label: "Patients", icon: <IconPatients /> });
    items.push({ to: "/staff-management", label: "Staff accounts", icon: <IconPatients /> });
  }

  // Doctor does not manage hospital beds, billing or administrative patients.
  // Doctor sees Home, Doctor Dashboard, Appointments, and Doctors directory.
  items.push({
    to: "/appointments",
    label: "Appointments",
    icon: <IconCalendar />,
  });

  if (["ADMIN", "RECEPTIONIST", "NURSE", "WARD_IN_CHARGE"].includes(role)) {
    items.push({
      to: "/beds",
      label: "Bed Tracking",
      icon: <IconHome />,
    });
  }

  if (role === "PATIENT") {
    items.push({
      to: "/my-history",
      label: "Medical History",
      icon: <IconPatients />,
    });
  }

  if (role === "ADMIN" || role === "PATIENT") {
    items.push({
      to: "/billing",
      label: "Billing",
      icon: <IconDashboard />,
    });
  }

  return items;
}

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  // Menu state is tied to the page it was opened on, so it closes on navigation
  const [openAt, setOpenAt] = useState(null);
  const open = openAt === location.pathname;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="shell">
      <aside className={`sidebar${open ? " open" : ""}`}>
        <Link to="/" className="brand">
          <span className="brand-mark">
            <BrandMark />
          </span>
          CarePoint
        </Link>

        <nav className="side-nav" aria-label="Main">
          {navFor(user?.role).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `side-link${isActive ? " active" : ""}`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="side-foot">
          <div className="side-user">
            <div className="avatar">{initials(user?.name)}</div>
            <div style={{ minWidth: 0 }}>
              <div className="side-user-name">{user?.name}</div>
              <div className="side-user-role">
                {user?.role?.toLowerCase()}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm side-logout"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </aside>

      {open && (
        <div className="scrim" onClick={() => setOpenAt(null)} aria-hidden="true" />
      )}

      <div>
        <div className="mobilebar">
          <button
            type="button"
            className="btn btn-secondary menu-btn"
            aria-label="Open menu"
            onClick={() => setOpenAt(location.pathname)}
          >
            <IconMenu />
          </button>
          <strong>CarePoint</strong>
        </div>

        <main className="main">
          <div className="container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
