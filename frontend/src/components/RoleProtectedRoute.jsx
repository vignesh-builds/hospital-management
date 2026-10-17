import { Navigate, Outlet } from "react-router-dom";
import { getToken, getUser } from "../utils/auth";

// Works as a layout route: <Route element={<RoleProtectedRoute allowedRoles={[...]} />}>
function RoleProtectedRoute({ children, allowedRoles }) {
  const user = getUser();

  if (!user || !getToken()) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children || <Outlet />;
}

export default RoleProtectedRoute;
