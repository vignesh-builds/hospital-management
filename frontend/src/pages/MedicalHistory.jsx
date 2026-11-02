import { Link, useParams } from "react-router-dom";
import { getUser } from "../utils/auth";
import { formatDate, shortTime } from "../utils/date";
import { formatDateTime, formatMoney } from "../utils/format";
import useApiData from "../utils/useApiData";
import {
  Alert,
  Empty,
  PageHeader,
  StatCard,
  StatusBadge,
} from "../components/ui";
import "./medical.css";

export default function MedicalHistory() {
  const { patientId } = useParams();
  const user = getUser();

  // /my-history -> own record, /history/:patientId -> staff view
  const { data, error } = useApiData(
    patientId ? `/history/patient/${patientId}` : "/history/my"
  );

  const patient = data?.patient;
  const visits = data?.visits || [];
  const prescriptions = data?.prescriptions || [];
  const admissions = data?.admissions || [];
  const bills = data?.bills || [];
  const billingVisible = data?.billingVisible;

  const backPath =
    user?.role === "ADMIN"
      ? "/patients"
      : user?.role === "DOCTOR"
      ? "/doctor-dashboard"
      : "/patient-dashboard";

  const pendingTotal = bills
    .filter((b) => b.paymentStatus !== "PAID")
    .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

  return (
    <>
      <PageHeader
        title="Medical history"
        subtitle={
          patient
            ? `${patient.name} · ${patient.age || "-"} yrs · ${patient.gender || "-"}`
            : undefined
        }
      >
        <Link to={backPath} className="btn btn-secondary">
          Back
        </Link>
        {data && (
          <button type="button" className="btn" onClick={() => window.print()}>
            Print
          </button>
        )}
      </PageHeader>

      <Alert>{error}</Alert>

      {data && (
        <>
          <div className="stats">
            <StatCard label="Visits" value={visits.length} />
            <StatCard label="Prescriptions" value={prescriptions.length} tone="info" />
            <StatCard label="Hospital stays" value={admissions.length} tone="warn" />
            {billingVisible && (
              <StatCard
                label="Amount pending"
                value={formatMoney(pendingTotal)}
                tone={pendingTotal > 0 ? "danger" : "ok"}
              />
            )}
          </div>

          {/* VISITS */}
          <section className="card section">
            <div className="card-head">
              <h2>Visits</h2>
            </div>
            {visits.length === 0 ? (
              <Empty title="No visits yet" />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Doctor</th>
                      <th>Status</th>
                      <th className="no-print"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map((visit) => (
                      <tr key={visit.appointmentId}>
                        <td>{formatDate(visit.date)}</td>
                        <td className="num">{shortTime(visit.time)}</td>
                        <td>
                          <div className="cell-main">Dr. {visit.doctorName || "Unknown"}</div>
                          <div className="cell-sub">{visit.specialization}</div>
                        </td>
                        <td>
                          <StatusBadge status={visit.status} />
                        </td>
                        <td className="col-actions no-print">
                          {visit.hasPrescription && (
                            <Link
                              className="btn btn-sm btn-secondary"
                              to={`/prescription/${visit.appointmentId}`}
                            >
                              Prescription
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* PRESCRIPTIONS */}
          <section className="card section">
            <div className="card-head">
              <h2>Prescriptions</h2>
            </div>
            {prescriptions.length === 0 ? (
              <Empty title="No prescriptions yet" />
            ) : (
              <div className="history-grid">
                {prescriptions.map((rx) => (
                  <div className="rx-card" key={rx.id}>
                    <h4>{rx.diagnosis}</h4>
                    <div className="muted">
                      {formatDate(rx.appointmentDate)} · Dr. {rx.doctorName}
                    </div>
                    <div className="pre-wrap" style={{ margin: "8px 0" }}>
                      {rx.medicines}
                    </div>
                    <Link
                      className="link-inline no-print"
                      to={`/prescription/${rx.appointmentId}`}
                    >
                      Open / print
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* HOSPITAL STAYS */}
          <section className="card section">
            <div className="card-head">
              <h2>Hospital stays</h2>
            </div>
            {admissions.length === 0 ? (
              <Empty title="No hospital stays" />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Bed</th>
                      <th>Reason</th>
                      <th>Admitted</th>
                      <th>Discharged</th>
                      <th>Days</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admissions.map((a) => (
                      <tr key={a.id}>
                        <td className="cell-main">
                          {a.bedNumber}
                          <div className="cell-sub">{a.wardType}</div>
                        </td>
                        <td>{a.reason || "-"}</td>
                        <td>{formatDateTime(a.admittedAt)}</td>
                        <td>{formatDateTime(a.dischargedAt) || "-"}</td>
                        <td className="num">{a.billedDays ?? "-"}</td>
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

          {/* BILLS (not shown to doctors) */}
          {billingVisible && (
            <section className="card">
              <div className="card-head">
                <h2>Bills</h2>
              </div>
              {bills.length === 0 ? (
                <Empty title="No bills yet" />
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Bill</th>
                        <th>Date</th>
                        <th>Details</th>
                        <th className="num">Total</th>
                        <th>Status</th>
                        <th className="no-print"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.map((bill) => (
                        <tr key={bill.id}>
                          <td>#{bill.id}</td>
                          <td>{formatDateTime(bill.generatedDate)}</td>
                          <td>{bill.description || "-"}</td>
                          <td className="num">{formatMoney(bill.totalAmount)}</td>
                          <td>
                            <StatusBadge status={bill.paymentStatus} />
                          </td>
                          <td className="col-actions no-print">
                            <Link className="btn btn-sm btn-secondary" to={`/invoice/${bill.id}`}>
                              Invoice
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </>
  );
}
