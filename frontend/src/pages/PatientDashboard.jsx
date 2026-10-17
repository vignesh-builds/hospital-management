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

function PatientDashboard() {
  const user = getUser();

  const { data, error } = useApiData("/appointments/my");
  const appointments = data || [];

  const today = todayISO();

  const upcoming = appointments.filter(
    (a) =>
      (a.status === "BOOKED" || a.status === "CONFIRMED") &&
      a.appointmentDate >= today
  );
  const completed = appointments.filter((a) => a.status === "COMPLETED");
  const cancelled = appointments.filter((a) => a.status === "CANCELLED");

  return (
    <>
      <PageHeader
        title="My dashboard"
        subtitle={`Signed in as ${user?.name || "Patient"}`}
      >
        <Link to="/appointments" className="btn">
          Book appointment
        </Link>
      </PageHeader>

      <Alert>{error}</Alert>

      <div className="stats">
        <StatCard label="Total appointments" value={appointments.length} />
        <StatCard label="Upcoming" value={upcoming.length} tone="info" />
        <StatCard label="Completed" value={completed.length} tone="ok" />
        <StatCard label="Cancelled" value={cancelled.length} tone="danger" />
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Recent appointments</h2>
          <Link to="/appointments">View all</Link>
        </div>

        {appointments.length === 0 ? (
          <Empty title="No appointments yet">
            Book your first appointment with a doctor.
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice(0, 5).map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="cell-main">
                        Dr. {a.doctorName || "Unknown"}
                      </div>
                      <div className="cell-sub">
                        {a.specialization || "Not available"}
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

export default PatientDashboard;
