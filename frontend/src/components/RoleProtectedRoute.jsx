
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken, getUser } from "../utils/auth";

function RoleProtectedRoute({ children, allowedRoles }) {
  const user = getUser();
  const location = useLocation();

  if (!user || !getToken()) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  const isChangePasswordPage =
    location.pathname === "/change-password";

  // Force temporary-password users to change their password.
  if (user.mustChangePassword && !isChangePasswordPage) {
    return <Navigate to="/change-password" replace />;
  }

  // Prevent users who already changed their password from returning here.
  if (!user.mustChangePassword && isChangePasswordPage) {
    const dashboard =
      user.role === "ADMIN"
        ? "/admin-dashboard"
        : user.role === "DOCTOR"
          ? "/doctor-dashboard"
          : "/patient-dashboard";

    return <Navigate to={dashboard} replace />;
  }

  return children || <Outlet />;
}

export default RoleProtectedRoute;
