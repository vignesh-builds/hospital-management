import { Link } from "react-router-dom";
import { getUser } from "../utils/auth";
import useApiData from "../utils/useApiData";
import { Alert, PageHeader, StatCard } from "../components/ui";

function Home() {
  const user = getUser();
  const role = user?.role;

  // Each role may only read its own appointments / patients
  const appointmentsEndpoint =
    role === "ADMIN"
      ? "/appointments"
      : role === "DOCTOR"
      ? "/appointments/doctor"
      : "/appointments/my";

  const doctorsData = useApiData("/doctors");
  const appointmentsData = useApiData(appointmentsEndpoint);
  const patientsData = useApiData(role === "ADMIN" ? "/patients" : null);

  const doctors = doctorsData.data || [];
  const appointments = appointmentsData.data || [];
  const patients = patientsData.data || [];

  const loading =
    doctorsData.loading || appointmentsData.loading || patientsData.loading;
  const error =
    doctorsData.error || appointmentsData.error || patientsData.error;

  const cancelled = appointments.filter((a) => a.status === "CANCELLED");

  const refresh = () => {
    doctorsData.reload();
    appointmentsData.reload();
    patientsData.reload();
  };

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.name || "there"}`}
        subtitle="Here is an overview of the hospital today."
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>

        <Link to="/appointments" className="btn">
          {role === "PATIENT" ? "Book appointment" : "View appointments"}
        </Link>
      </PageHeader>

      <Alert>{error}</Alert>

      <div className="stats">
        <StatCard label="Doctors" value={loading ? "–" : doctors.length} />

        {role === "ADMIN" && (
          <StatCard
            label="Patients"
            value={loading ? "–" : patients.length}
            tone="info"
          />
        )}

        <StatCard
          label="Appointments"
          value={loading ? "–" : appointments.length}
          tone="ok"
        />

        <StatCard
          label="Cancelled"
          value={loading ? "–" : cancelled.length}
          tone="danger"
        />
      </div>

      <h2 style={{ marginBottom: 12 }}>Go to</h2>

      <div className="link-grid">
        <Link to="/doctors" className="card link-card">
          <h3>Doctors</h3>
          <p>
            {role === "ADMIN"
              ? "Add, edit and remove doctors."
              : "Browse doctors and their specializations."}
          </p>
        </Link>

        {role === "ADMIN" && (
          <Link to="/patients" className="card link-card">
            <h3>Patients</h3>
            <p>Maintain patient records.</p>
          </Link>
        )}

        <Link to="/appointments" className="card link-card">
          <h3>Appointments</h3>
          <p>
            {role === "PATIENT"
              ? "Book, view and cancel your appointments."
              : "Review, confirm and manage appointments."}
          </p>
        </Link>
      </div>
    </>
  );
}

export default Home;
