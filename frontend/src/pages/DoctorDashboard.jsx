import { useEffect, useState } from "react";
import { getAuthHeaders, getUser } from "../utils/auth";
import "./Dashboard.css";

function DoctorDashboard() {

  const user = getUser();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {

    fetchAppointments();

  }, []);


  const fetchAppointments = async () => {

    try {

      const response = await fetch(
        "http://localhost:8080/appointments/doctor",
        {
          headers: getAuthHeaders(),
        }
      );


      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = [];
      }


      if (!response.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : "Failed to load appointments"
        );
      }


      setAppointments(data);

    } catch (error) {

      setError(error.message);

    } finally {

      setLoading(false);

    }
  };


  const today =
    new Date().toISOString().split("T")[0];


  const todayAppointments =
    appointments.filter(
      (appointment) =>
        appointment.appointmentDate === today
    );


  const upcoming =
    appointments.filter(
      (appointment) =>
        appointment.appointmentDate >= today &&
        appointment.status !== "CANCELLED" &&
        appointment.status !== "COMPLETED"
    );


  const cancelled =
    appointments.filter(
      (appointment) =>
        appointment.status === "CANCELLED"
    );


  const completed =
    appointments.filter(
      (appointment) =>
        appointment.status === "COMPLETED"
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

      <div className="dashboard-header">

        <h1>Doctor Dashboard</h1>

        <p>
          Welcome, Dr.{" "}
          <strong>{user?.name}</strong>
        </p>

      </div>


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      <div className="stats-grid">

        <div className="stat-card">
          <h3>Total Appointments</h3>
          <p>{appointments.length}</p>
        </div>


        <div className="stat-card">
          <h3>Today</h3>
          <p>{todayAppointments.length}</p>
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


      <div className="dashboard-section">

        <h2>Today's Patients</h2>


        {todayAppointments.length === 0 ? (

          <p>
            No appointments today.
          </p>

        ) : (

          <div className="appointment-list">

            {todayAppointments.map(
              (appointment) => (

                <div
                  className="appointment-card"
                  key={appointment.id}
                >

                  <h3>
                    {appointment.patientName}
                  </h3>

                  <p>
                    Time:{" "}
                    {appointment.appointmentTime}
                  </p>

                  <p>
                    Status:{" "}
                    <strong>
                      {appointment.status}
                    </strong>
                  </p>

                </div>

              )
            )}

          </div>

        )}

      </div>


      <div className="dashboard-section">

        <h2>Upcoming Appointments</h2>


        {upcoming.length === 0 ? (

          <p>
            No upcoming appointments.
          </p>

        ) : (

          <div className="appointment-list">

            {upcoming.slice(0, 5).map(
              (appointment) => (

                <div
                  className="appointment-card"
                  key={appointment.id}
                >

                  <h3>
                    {appointment.patientName}
                  </h3>

                  <p>
                    Date:{" "}
                    {appointment.appointmentDate}
                  </p>

                  <p>
                    Time:{" "}
                    {appointment.appointmentTime}
                  </p>

                  <p>
                    Status:{" "}
                    {appointment.status}
                  </p>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>
  );
}

export default DoctorDashboard;