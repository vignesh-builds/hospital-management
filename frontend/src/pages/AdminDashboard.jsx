import { useEffect, useState } from "react";
import { getAuthHeaders, getUser } from "../utils/auth";
import "./Dashboard.css";

const API_URL = "https://hospital-backend-jcnb.onrender.com";

function AdminDashboard() {
  const user = getUser();

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const headers = getAuthHeaders();

      const [
        patientsResponse,
        doctorsResponse,
        appointmentsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/patients`, {
          headers,
        }),

        fetch(`${API_URL}/doctors`, {
          headers,
        }),

        fetch(`${API_URL}/appointments`, {
          headers,
        }),
      ]);

      if (!patientsResponse.ok) {
        throw new Error("Failed to load patients");
      }

      if (!doctorsResponse.ok) {
        throw new Error("Failed to load doctors");
      }

      if (!appointmentsResponse.ok) {
        throw new Error("Failed to load appointments");
      }

      const patientsData =
        await patientsResponse.json();

      const doctorsData =
        await doctorsResponse.json();

      const appointmentsData =
        await appointmentsResponse.json();

      setPatients(
        Array.isArray(patientsData)
          ? patientsData
          : []
      );

      setDoctors(
        Array.isArray(doctorsData)
          ? doctorsData
          : []
      );

      setAppointments(
        Array.isArray(appointmentsData)
          ? appointmentsData
          : []
      );

    } catch (error) {
      console.error(
        "Admin Dashboard Error:",
        error
      );

      setError(
        error.message ||
          "Failed to load admin dashboard"
      );

    } finally {
      setLoading(false);
    }
  };

  // Today's date
  const today = new Date()
    .toISOString()
    .split("T")[0];

  // Today's appointments
  const todayAppointments =
    appointments.filter(
      (appointment) =>
        appointment.appointmentDate === today
    );

  // Cancelled appointments
  const cancelled =
    appointments.filter(
      (appointment) =>
        appointment.status === "CANCELLED"
    );

  // Completed appointments
  const completed =
    appointments.filter(
      (appointment) =>
        appointment.status === "COMPLETED"
    );

  // Upcoming appointments
  const upcoming =
    appointments.filter(
      (appointment) =>
        appointment.appointmentDate >= today &&
        appointment.status !== "CANCELLED" &&
        appointment.status !== "COMPLETED"
    );

  if (loading) {
    return (
      <div className="dashboard-container">
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-container">

      {/* =========================
          HEADER
      ========================= */}

      <div className="dashboard-header">

        <h1>Admin Dashboard</h1>

        <p>
          Welcome,{" "}
          <strong>
            {user?.name || "Admin"}
          </strong>
        </p>

      </div>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* =========================
          REFRESH
      ========================= */}

      <button
        type="button"
        onClick={fetchDashboardData}
      >
        🔄 Refresh Dashboard
      </button>

      {/* =========================
          STATISTICS
      ========================= */}

      <div className="stats-grid">

        {/* Patients */}

        <div className="stat-card">

          <h3>
            Total Patients
          </h3>

          <p>
            {patients.length}
          </p>

        </div>

        {/* Doctors */}

        <div className="stat-card">

          <h3>
            Total Doctors
          </h3>

          <p>
            {doctors.length}
          </p>

        </div>

        {/* Appointments */}

        <div className="stat-card">

          <h3>
            Total Appointments
          </h3>

          <p>
            {appointments.length}
          </p>

        </div>

        {/* Today */}

        <div className="stat-card">

          <h3>
            Today's Appointments
          </h3>

          <p>
            {todayAppointments.length}
          </p>

        </div>

        {/* Upcoming */}

        <div className="stat-card">

          <h3>
            Upcoming
          </h3>

          <p>
            {upcoming.length}
          </p>

        </div>

        {/* Completed */}

        <div className="stat-card">

          <h3>
            Completed
          </h3>

          <p>
            {completed.length}
          </p>

        </div>

        {/* Cancelled */}

        <div className="stat-card">

          <h3>
            Cancelled
          </h3>

          <p>
            {cancelled.length}
          </p>

        </div>

      </div>

      {/* =========================
          RECENT APPOINTMENTS
      ========================= */}

      <div className="dashboard-section">

        <h2>
          Recent Appointments
        </h2>

        {appointments.length === 0 ? (

          <p>
            No appointments found.
          </p>

        ) : (

          <div className="appointment-list">

            {appointments
              .slice(0, 5)
              .map((appointment) => (

                <div
                  className="appointment-card"
                  key={appointment.id}
                >

                  <h3>
                    Dr.{" "}
                    {appointment.doctorName}
                  </h3>

                  <p>
                    <strong>
                      Patient:
                    </strong>{" "}
                    {appointment.patientName}
                  </p>

                  <p>
                    <strong>
                      Date:
                    </strong>{" "}
                    {appointment.appointmentDate}
                  </p>

                  <p>
                    <strong>
                      Time:
                    </strong>{" "}
                    {appointment.appointmentTime}
                  </p>

                  <p>
                    <strong>
                      Specialization:
                    </strong>{" "}
                    {appointment.specialization ||
                      "N/A"}
                  </p>

                  <p>
                    <strong>
                      Status:
                    </strong>{" "}

                    <span
                      className={`status ${
                        appointment.status
                          ?.toLowerCase() || ""
                      }`}
                    >
                      {appointment.status}
                    </span>

                  </p>

                </div>

              ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default AdminDashboard;
