import { useEffect, useState } from "react";
import { getAuthHeaders, getUser } from "../utils/auth";
import "./Dashboard.css";

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

      const headers = getAuthHeaders();


      const [
        patientsResponse,
        doctorsResponse,
        appointmentsResponse,
      ] = await Promise.all([

        fetch(
          "http://localhost:8080/patients",
          { headers }
        ),

        fetch(
          "http://localhost:8080/doctors",
          { headers }
        ),

        fetch(
          "http://localhost:8080/appointments",
          { headers }
        ),

      ]);


      if (
        !patientsResponse.ok ||
        !doctorsResponse.ok ||
        !appointmentsResponse.ok
      ) {

        throw new Error(
          "Failed to load admin dashboard"
        );

      }


      const patientsData =
        await patientsResponse.json();

      const doctorsData =
        await doctorsResponse.json();

      const appointmentsData =
        await appointmentsResponse.json();


      setPatients(patientsData);
      setDoctors(doctorsData);
      setAppointments(appointmentsData);


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


  const cancelled =
    appointments.filter(
      (appointment) =>
        appointment.status === "CANCELLED"
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

        <h1>Admin Dashboard</h1>

        <p>
          Welcome, <strong>{user?.name}</strong>
        </p>

      </div>


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      <div className="stats-grid">

        <div className="stat-card">

          <h3>Total Patients</h3>

          <p>
            {patients.length}
          </p>

        </div>


        <div className="stat-card">

          <h3>Total Doctors</h3>

          <p>
            {doctors.length}
          </p>

        </div>


        <div className="stat-card">

          <h3>Total Appointments</h3>

          <p>
            {appointments.length}
          </p>

        </div>


        <div className="stat-card">

          <h3>Today's Appointments</h3>

          <p>
            {todayAppointments.length}
          </p>

        </div>


        <div className="stat-card">

          <h3>Cancelled</h3>

          <p>
            {cancelled.length}
          </p>

        </div>

      </div>


      <div className="dashboard-section">

        <h2>Recent Appointments</h2>


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
                    Dr. {appointment.doctorName}
                  </h3>

                  <p>
                    Patient:{" "}
                    {appointment.patientName}
                  </p>

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
                    <strong>
                      {appointment.status}
                    </strong>
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