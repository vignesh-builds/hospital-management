import { useEffect, useState } from "react";
import { getAuthHeaders, getUser } from "../utils/auth";
import "./Dashboard.css";

const API_URL = "https://hospital-backend-jcnb.onrender.com";

function PatientDashboard() {
  const user = getUser();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==============================
  // FETCH APPOINTMENTS
  // ==============================
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/appointments/my`,
        {
          method: "GET",
          headers: {
            ...getAuthHeaders(),
            Accept: "application/json",
          },
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (!response.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : data?.message || "Failed to load appointments"
        );
      }

      setAppointments(
        Array.isArray(data) ? data : []
      );

    } catch (error) {
      console.error(
        "Appointments error:",
        error
      );

      setError(
        error.message ||
          "Failed to connect to server"
      );

    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // APPOINTMENT FILTERS
  // ==============================

  const upcoming = appointments.filter(
    (appointment) =>
      appointment.status === "BOOKED" ||
      appointment.status === "CONFIRMED"
  );

  const completed = appointments.filter(
    (appointment) =>
      appointment.status === "COMPLETED"
  );

  const cancelled = appointments.filter(
    (appointment) =>
      appointment.status === "CANCELLED"
  );

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <div className="dashboard-container">
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  // ==============================
  // DASHBOARD
  // ==============================

  return (
    <div className="dashboard-container">

      {/* HEADER */}
      <div className="dashboard-header">

        <h1>Patient Dashboard</h1>

        <p>
          Welcome,{" "}
          <strong>
            {user?.name || "Patient"}
          </strong>
        </p>

      </div>

      {/* ERROR */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* ==============================
          STATISTICS
          ============================== */}

      <div className="stats-grid">

        <div className="stat-card">
          <h3>Total Appointments</h3>
          <p>{appointments.length}</p>
        </div>

        <div className="stat-card">
          <h3>Upcoming</h3>
          <p>{upcoming.length}</p>
        </div>

        <div className="stat-card">
          <h3>Completed</h3>
          <p>{completed.length}</p>
        </div>

        <div className="stat-card">
          <h3>Cancelled</h3>
          <p>{cancelled.length}</p>
        </div>

      </div>

      {/* ==============================
          MY APPOINTMENTS
          ============================== */}

      <div className="dashboard-section">

        <h2>My Appointments</h2>

        {appointments.length === 0 ? (

          <p>No appointments found.</p>

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
                    {appointment.doctorName ||
                      "Unknown Doctor"}
                  </h3>

                  <p>
                    <strong>
                      Specialization:
                    </strong>{" "}
                    {appointment.specialization ||
                      "Not available"}
                  </p>

                  <p>
                    <strong>Date:</strong>{" "}
                    {appointment.appointmentDate ||
                      "Not available"}
                  </p>

                  <p>
                    <strong>Time:</strong>{" "}
                    {appointment.appointmentTime ||
                      "Not available"}
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    <span>
                      {appointment.status ||
                        "UNKNOWN"}
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

export default PatientDashboard;
