import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const API_URL = "https://hospital-backend-jcnb.onrender.com";

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

    if (!token) {
      setError("Please login first.");
      setLoading(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      // =========================
      // DOCTORS
      // =========================
      const doctorResponse = await fetch(
        `${API_URL}/doctors`,
        {
          method: "GET",
          headers,
        }
      );

      const doctorText = await doctorResponse.text();

      let doctorData;

      try {
        doctorData = JSON.parse(doctorText);
      } catch {
        doctorData = [];
      }

      if (!doctorResponse.ok) {
        throw new Error(
          typeof doctorData === "string"
            ? doctorData
            : doctorData?.message || "Failed to fetch doctors"
        );
      }

      setDoctors(Array.isArray(doctorData) ? doctorData : []);


      // =========================
      // APPOINTMENTS
      // =========================
      const appointmentResponse = await fetch(
        `${API_URL}/appointments`,
        {
          method: "GET",
          headers,
        }
      );

      const appointmentText = await appointmentResponse.text();

      let appointmentData;

      try {
        appointmentData = JSON.parse(appointmentText);
      } catch {
        appointmentData = [];
      }

      if (!appointmentResponse.ok) {
        throw new Error(
          typeof appointmentData === "string"
            ? appointmentData
            : appointmentData?.message ||
              "Failed to fetch appointments"
        );
      }

      setAppointments(
        Array.isArray(appointmentData)
          ? appointmentData
          : []
      );


      // =========================
      // PATIENTS
      // =========================

      if (
        user?.role === "PATIENT" ||
        user?.role === "ADMIN"
      ) {
        const patientResponse = await fetch(
          `${API_URL}/patients`,
          {
            method: "GET",
            headers,
          }
        );

        const patientText = await patientResponse.text();

        let patientData;

        try {
          patientData = JSON.parse(patientText);
        } catch {
          patientData = [];
        }

        if (!patientResponse.ok) {
          throw new Error(
            typeof patientData === "string"
              ? patientData
              : patientData?.message ||
                "Failed to fetch patients"
          );
        }

        setPatients(
          Array.isArray(patientData)
            ? patientData
            : []
        );
      } else {
        setPatients([]);
      }

    } catch (error) {
      console.error(
        "Dashboard fetch error:",
        error
      );

      setError(
        error.message ||
        "Failed to load dashboard data."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchDashboardData();
  }, []);


  const cancelledAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status === "CANCELLED"
    );


  return (
    <div className="home">

      {/* =========================
          HERO SECTION
      ========================== */}

      <section className="hero-section">

        <div className="hero-content">

          <h1>
            Welcome to Hospital Management System
          </h1>

          {user && (
            <p>
              Welcome, {user.name} 👋 | Role:{" "}
              {user.role}
            </p>
          )}

          <p>
            Manage doctors, patients and appointments
            easily from one place.
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


      {/* =========================
          DASHBOARD STATISTICS
      ========================== */}

      <section className="stats-section">

        <div className="dashboard-header">

          <h2>
            Dashboard Overview
          </h2>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "🔄 Refresh"}
          </button>

        </div>


        {/* Loading */}

        {loading && (
          <p>
            Loading dashboard...
          </p>
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

            {/* Doctors */}

            <div className="stat-card">

              <div className="stat-icon">
                👨‍⚕️
              </div>

              <h3>
                Total Doctors
              </h3>

              <p>
                {doctors.length}
              </p>

            </div>


            {/* Patients */}

            <div className="stat-card">

              <div className="stat-icon">
                🧑‍🤝‍🧑
              </div>

              <h3>
                Total Patients
              </h3>

              <p>
                {user?.role === "DOCTOR"
                  ? "N/A"
                  : patients.length}
              </p>

            </div>


            {/* Appointments */}

            <div className="stat-card">

              <div className="stat-icon">
                📅
              </div>

              <h3>
                Total Appointments
              </h3>

              <p>
                {appointments.length}
              </p>

            </div>


            {/* Cancelled */}

            <div className="stat-card">

              <div className="stat-icon">
                ❌
              </div>

              <h3>
                Cancelled
              </h3>

              <p>
                {cancelledAppointments.length}
              </p>

            </div>

          </div>

        )}

      </section>


      {/* =========================
          SERVICES
      ========================== */}

      <section className="features-section">

        <h2>
          Our Services
        </h2>

        <div className="feature-container">

          {/* Doctor */}

          <div className="feature-card">

            <div className="feature-icon">
              👨‍⚕️
            </div>

            <h3>
              Doctor Management
            </h3>

            <p>
              Add, update, view and manage doctor
              information easily.
            </p>

            <Link to="/doctors">
              Manage Doctors →
            </Link>

          </div>


          {/* Patient */}

          <div className="feature-card">

            <div className="feature-icon">
              🧑‍🤝‍🧑
            </div>

            <h3>
              Patient Management
            </h3>

            <p>
              Maintain patient details and manage
              patient information efficiently.
            </p>

            <Link to="/patients">
              Manage Patients →
            </Link>

          </div>


          {/* Appointment */}

          <div className="feature-card">

            <div className="feature-icon">
              📅
            </div>

            <h3>
              Appointment Management
            </h3>

            <p>
              Book, update, cancel and manage hospital
              appointments.
            </p>

            <Link to="/appointments">
              Manage Appointments →
            </Link>

          </div>

        </div>

      </section>


      {/* =========================
          ABOUT
      ========================== */}

      <section className="about-section">

        <div className="about-content">

          <h2>
            About Our System
          </h2>

          <p>
            This Hospital Management System helps
            hospitals manage doctors, patients and
            appointments through a simple and
            user-friendly application.
          </p>

          <p>
            The application is built using React.js,
            Spring Boot, Spring Data JPA and PostgreSQL.
          </p>

        </div>

      </section>


      {/* =========================
          FOOTER
      ========================== */}

      <footer className="home-footer">

        <p>
          © 2026 Hospital Management System
        </p>

      </footer>

    </div>
  );
}

export default Home;
