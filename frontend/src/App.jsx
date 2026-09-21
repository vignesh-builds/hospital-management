import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Doctors from "./pages/Doctors";
import Patients from "./pages/Patients";
import Appointments from "./pages/Appointments";

import Login from "./pages/Login";
import Register from "./pages/Register";

import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import RoleProtectedRoute
  from "./components/RoleProtectedRoute";


function App() {

  return (

    <BrowserRouter>

      <Navbar />

      <Routes>

        {/* ================= HOME ================= */}

        <Route
          path="/"
          element={
            <RoleProtectedRoute
              allowedRoles={[
                "PATIENT",
                "DOCTOR",
                "ADMIN",
              ]}
            >
              <Home />
            </RoleProtectedRoute>
          }
        />


        {/* ================= AUTH ================= */}

        <Route
          path="/login"
          element={<Login />}
        />


        <Route
          path="/register"
          element={<Register />}
        />


        {/* ================= PATIENT DASHBOARD ================= */}

        <Route
          path="/patient-dashboard"
          element={
            <RoleProtectedRoute
              allowedRoles={["PATIENT"]}
            >
              <PatientDashboard />
            </RoleProtectedRoute>
          }
        />


        {/* ================= DOCTOR DASHBOARD ================= */}

        <Route
          path="/doctor-dashboard"
          element={
            <RoleProtectedRoute
              allowedRoles={["DOCTOR"]}
            >
              <DoctorDashboard />
            </RoleProtectedRoute>
          }
        />


        {/* ================= ADMIN DASHBOARD ================= */}

        <Route
          path="/admin-dashboard"
          element={
            <RoleProtectedRoute
              allowedRoles={["ADMIN"]}
            >
              <AdminDashboard />
            </RoleProtectedRoute>
          }
        />


        {/* ================= DOCTORS ================= */}

        <Route
          path="/doctors"
          element={
            <RoleProtectedRoute
              allowedRoles={[
                "PATIENT",
                "DOCTOR",
                "ADMIN",
              ]}
            >
              <Doctors />
            </RoleProtectedRoute>
          }
        />


        {/* ================= PATIENTS ================= */}

        <Route
          path="/patients"
          element={
            <RoleProtectedRoute
              allowedRoles={[
                "PATIENT",
                "ADMIN",
              ]}
            >
              <Patients />
            </RoleProtectedRoute>
          }
        />


        {/* ================= APPOINTMENTS ================= */}

        <Route
          path="/appointments"
          element={
            <RoleProtectedRoute
              allowedRoles={[
                "PATIENT",
                "DOCTOR",
                "ADMIN",
              ]}
            >
              <Appointments />
            </RoleProtectedRoute>
          }
        />


        {/* ================= UNKNOWN URL ================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;