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

  const prescriptionsData = useApiData("/prescriptions/my");
  const prescriptions = prescriptionsData.data || [];

  const billsData = useApiData("/bills/my");
  const pendingBills = (billsData.data || []).filter(
    (b) => b.paymentStatus !== "PAID"
  );

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
        <Link to="/my-history" className="btn btn-secondary">
          Medical history
        </Link>
        <Link to="/appointments" className="btn">
          Book appointment
        </Link>
      </PageHeader>

      <Alert>{error || prescriptionsData.error || billsData.error}</Alert>

      <div className="stats">
        <StatCard label="Total appointments" value={appointments.length} />
        <StatCard label="Upcoming" value={upcoming.length} tone="info" />
        <StatCard label="Completed" value={completed.length} tone="ok" />
        <StatCard label="Cancelled" value={cancelled.length} tone="danger" />
        <StatCard
          label="Pending bills"
          value={pendingBills.length}
          tone={pendingBills.length > 0 ? "warn" : "ok"}
        />
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

      <section className="card" style={{ marginTop: 24 }}>
        <div className="card-head">
          <h2>My prescriptions</h2>
          <Link to="/my-history">View all</Link>
        </div>

        {prescriptions.length === 0 ? (
          <Empty title="No prescriptions yet">
            Prescriptions written by your doctor will appear here.
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Doctor</th>
                  <th>Diagnosis</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.slice(0, 5).map((rx) => (
                  <tr key={rx.id}>
                    <td>{formatDate(rx.appointmentDate)}</td>
                    <td>Dr. {rx.doctorName}</td>
                    <td>{rx.diagnosis}</td>
                    <td className="col-actions">
                      <Link
                        className="btn btn-sm btn-secondary"
                        to={`/prescription/${rx.appointmentId}`}
                      >
                        Open
                      </Link>
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
