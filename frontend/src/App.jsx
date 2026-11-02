
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

import Home from "./pages/Home";
import Doctors from "./pages/Doctors";
import Patients from "./pages/patients";
import Appointments from "./pages/Appointments";
import Beds from "./pages/Beds";
import Billing from "./pages/Billing";
import Invoice from "./pages/Invoice";
import PrescriptionPage from "./pages/PrescriptionPage";
import MedicalHistory from "./pages/MedicalHistory";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ChangePassword from "./pages/ChangePassword";

import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import StaffManagement from "./pages/StaffManagement";

const ALL_ROLES = ["PATIENT", "DOCTOR", "ADMIN", "RECEPTIONIST", "NURSE", "WARD_IN_CHARGE"];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Authenticated user password change */}
        <Route
          path="/change-password"
          element={
            <RoleProtectedRoute allowedRoles={ALL_ROLES}>
              <ChangePassword />
            </RoleProtectedRoute>
          }
        />

        {/* Authenticated pages with sidebar */}
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
          <Route path="/beds" element={<Beds />} />
          <Route path="/prescription/:appointmentId" element={<PrescriptionPage />} />
          <Route element={<RoleProtectedRoute allowedRoles={["ADMIN", "PATIENT"]} />}>
            <Route path="/billing" element={<Billing />} />
            <Route path="/invoice/:billId" element={<Invoice />} />
          </Route>
          <Route element={<RoleProtectedRoute allowedRoles={["DOCTOR", "ADMIN"]} />}>
            <Route path="/history/:patientId" element={<MedicalHistory />} />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["PATIENT"]} />}>
            <Route
              path="/patient-dashboard"
              element={<PatientDashboard />}
            />
            <Route path="/my-history" element={<MedicalHistory />} />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["DOCTOR"]} />}>
            <Route
              path="/doctor-dashboard"
              element={<DoctorDashboard />}
            />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route
              path="/admin-dashboard"
              element={<AdminDashboard />}
            />
            <Route path="/patients" element={<Patients />} />
            <Route path="/staff-management" element={<StaffManagement />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
