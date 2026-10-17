import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

import Home from "./pages/Home";
import Doctors from "./pages/Doctors";
import Patients from "./pages/patients";
import Appointments from "./pages/Appointments";

import Login from "./pages/Login";
import Register from "./pages/Register";

import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const ALL_ROLES = ["PATIENT", "DOCTOR", "ADMIN"];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Signed-in area: sidebar layout wraps every page below */}
        <Route
          element={
            <RoleProtectedRoute allowedRoles={ALL_ROLES}>
              <Layout />
            </RoleProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/appointments" element={<Appointments />} />

          <Route element={<RoleProtectedRoute allowedRoles={["PATIENT"]} />}>
            <Route path="/patient-dashboard" element={<PatientDashboard />} />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["DOCTOR"]} />}>
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/patients" element={<Patients />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
