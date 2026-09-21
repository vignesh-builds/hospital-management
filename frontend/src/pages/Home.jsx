import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");

    try {
      // Doctors API
      const doctorResponse = await fetch(
        "http://localhost:8080/doctors",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!doctorResponse.ok) {
        throw new Error("Failed to fetch doctors");
      }

      const doctorData = await doctorResponse.json();
      setDoctors(doctorData);

      // Appointments API
      const appointmentResponse = await fetch(
        "http://localhost:8080/appointments",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!appointmentResponse.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const appointmentData = await appointmentResponse.json();
      setAppointments(appointmentData);

      // Patients API
      // DOCTOR-ku patients API access illa.
      if (user.role === "PATIENT" || user.role === "ADMIN") {
        const patientResponse = await fetch(
          "http://localhost:8080/patients",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!patientResponse.ok) {
          throw new Error("Failed to fetch patients");
        }

        const patientData = await patientResponse.json();
        setPatients(patientData);
      } else {
        // DOCTOR
        setPatients([]);
      }
    } catch (error) {
      console.log("Dashboard fetch error:", error);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="home">

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">

          <h1>Welcome to Hospital Management System</h1>

          {user && (
            <p>
              Welcome, {user.name} 👋 | Role: {user.role}
            </p>
          )}

          <p>
            Manage doctors, patients and appointments easily from one place.
          </p>

          <div className="hero-buttons">

            <Link
              to="/doctors"
              className="home-btn primary-btn"
            >
              View Doctors
            </Link>

            <Link
              to="/appointments"
              className="home-btn secondary-btn"
            >
              Book Appointment
            </Link>

          </div>

        </div>
      </section>


      {/* Dashboard Statistics */}
      <section className="stats-section">

        <div className="dashboard-header">

          <h2>Dashboard Overview</h2>

          <button onClick={fetchDashboardData}>
            🔄 Refresh
          </button>

        </div>


        {/* Loading */}
        {loading && (
          <p>Loading dashboard...</p>
        )}


        {/* Error */}
        {error && (
          <p className="dashboard-error">
            {error}
          </p>
        )}


        {/* Statistics */}
        {!loading && !error && (

          <div className="stats-container">

            {/* Total Doctors */}
            <div className="stat-card">

              <div className="stat-icon">
                👨‍⚕️
              </div>

              <h3>Total Doctors</h3>

              <p>{doctors.length}</p>

            </div>


            {/* Total Patients */}
            <div className="stat-card">

              <div className="stat-icon">
                🧑‍🤝‍🧑
              </div>

              <h3>Total Patients</h3>

              <p>
                {user.role === "DOCTOR"
                  ? "N/A"
                  : patients.length}
              </p>

            </div>


            {/* Total Appointments */}
            <div className="stat-card">

              <div className="stat-icon">
                📅
              </div>

              <h3>Total Appointments</h3>

              <p>{appointments.length}</p>

            </div>


            {/* Cancelled Appointments */}
            <div className="stat-card">

              <div className="stat-icon">
                ❌
              </div>

              <h3>Cancelled</h3>

              <p>
                {
                  appointments.filter(
                    (appointment) =>
                      appointment.status === "CANCELLED"
                  ).length
                }
              </p>

            </div>

          </div>

        )}

      </section>


      {/* Services Section */}
      <section className="features-section">

        <h2>Our Services</h2>

        <div className="feature-container">


          {/* Doctor Management */}
          <div className="feature-card">

            <div className="feature-icon">
              👨‍⚕️
            </div>

            <h3>Doctor Management</h3>

            <p>
              Add, update, view and manage doctor information easily.
            </p>

            <Link to="/doctors">
              Manage Doctors →
            </Link>

          </div>


          {/* Patient Management */}
          <div className="feature-card">

            <div className="feature-icon">
              🧑‍🤝‍🧑
            </div>

            <h3>Patient Management</h3>

            <p>
              Maintain patient details and manage patient information
              efficiently.
            </p>

            <Link to="/patients">
              Manage Patients →
            </Link>

          </div>


          {/* Appointment Management */}
          <div className="feature-card">

            <div className="feature-icon">
              📅
            </div>

            <h3>Appointment Management</h3>

            <p>
              Book, update, cancel and manage hospital appointments.
            </p>

            <Link to="/appointments">
              Manage Appointments →
            </Link>

          </div>

        </div>

      </section>


      {/* About Section */}
      <section className="about-section">

        <div className="about-content">

          <h2>About Our System</h2>

          <p>
            This Hospital Management System helps hospitals manage doctors,
            patients and appointments through a simple and user-friendly
            application.
          </p>

          <p>
            The application is built using React.js, Spring Boot, Spring Data
            JPA and PostgreSQL.
          </p>

        </div>

      </section>


      {/* Footer */}
      <footer className="home-footer">

        <p>
          © 2026 Hospital Management System
        </p>

      </footer>

    </div>
  );
}

export default Home;