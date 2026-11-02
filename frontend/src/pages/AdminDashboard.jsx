import { Link } from "react-router-dom";
import { getUser } from "../utils/auth";
import { todayISO, shortTime, formatDate } from "../utils/date";
import useApiData from "../utils/useApiData";
import {
  Alert,
  Empty,
  PageHeader,
  StatCard,
  StatusBadge,
} from "../components/ui";

function AdminDashboard() {
  const user = getUser();

  const patientsData = useApiData("/patients");
  const doctorsData = useApiData("/doctors");
  const appointmentsData = useApiData("/appointments");

  const patients = patientsData.data || [];
  const doctors = doctorsData.data || [];
  const appointments = appointmentsData.data || [];

  const error =
    patientsData.error || doctorsData.error || appointmentsData.error;

  const refresh = () => {
    patientsData.reload();
    doctorsData.reload();
    appointmentsData.reload();
  };

  const today = todayISO();
  const isActive = (a) => a.status === "BOOKED" || a.status === "CONFIRMED";

  const todayAppointments = appointments.filter(
    (a) => a.appointmentDate === today && a.status !== "CANCELLED"
  );
  const upcoming = appointments.filter(
    (a) => isActive(a) && a.appointmentDate >= today
  );
  const completed = appointments.filter((a) => a.status === "COMPLETED");
  const cancelled = appointments.filter((a) => a.status === "CANCELLED");

  return (
    <>
      <PageHeader
        title="Admin dashboard"
        subtitle={`Signed in as ${user?.name || "Admin"}`}
      >
        <button type="button" className="btn btn-secondary" onClick={refresh}>
          Refresh
        </button>
      </PageHeader>

      <Alert>{error}</Alert>

      <div className="stats">
        <StatCard label="Patients" value={patients.length} />
        <StatCard label="Doctors" value={doctors.length} />
        <StatCard label="Total appointments" value={appointments.length} />
        <StatCard label="Today" value={todayAppointments.length} tone="info" />
        <StatCard label="Upcoming" value={upcoming.length} tone="warn" />
        <StatCard label="Completed" value={completed.length} tone="ok" />
        <StatCard label="Cancelled" value={cancelled.length} tone="danger" />
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Recent appointments</h2>
          <Link to="/appointments">View all</Link>
        </div>

        {appointments.length === 0 ? (
          <Empty title="No appointments found" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice(0, 5).map((a) => (
                  <tr key={a.id}>
                    <td className="cell-main">{a.patientName}</td>
                    <td>
                      <div>Dr. {a.doctorName}</div>
                      <div className="cell-sub">
                        {a.specialization || "N/A"}
                      </div>
                    </td>
                    <td>{formatDate(a.appointmentDate)}</td>
                    <td className="num">{shortTime(a.appointmentTime)}</td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export default AdminDashboard;
