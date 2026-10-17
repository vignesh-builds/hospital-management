import { Navigate } from "react-router-dom";
import { getUser, isLoggedIn } from "../utils/auth";

function RoleProtectedRoute({ allowedRoles, children }) {
  const loggedIn = isLoggedIn();
  const user = getUser();

  if (!loggedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === "PATIENT") {
      return <Navigate to="/patient-dashboard" replace />;
    }

    if (user.role === "DOCTOR") {
      return <Navigate to="/doctor-dashboard" replace />;
    }

    if (user.role === "ADMIN") {
      return <Navigate to="/admin-dashboard" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
}

export default RoleProtectedRoute;