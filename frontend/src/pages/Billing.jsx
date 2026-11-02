import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../utils/api";
import { getUser } from "../utils/auth";
import { formatDate } from "../utils/date";
import { formatDateTime, formatMoney } from "../utils/format";
import useApiData from "../utils/useApiData";
import {
  Alert,
  Empty,
  Field,
  PageHeader,
  StatCard,
  StatusBadge,
} from "../components/ui";
import "./medical.css";

const FILTERS = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
];

export default function Billing() {
  const user = getUser();
  const isAdmin = user?.role === "ADMIN";

  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [manual, setManual] = useState({
    doctorFee: "500",
    roomCharges: "0",
    medicineCharges: "0",
    description: "",
  });
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");

  // Admin: all bills, or one patient's bills. Patient: own bills only.
  const billsEndpoint = isAdmin
    ? selectedPatientId
      ? `/bills/patient/${selectedPatientId}`
      : "/bills"
    : "/bills/my";
  const billsData = useApiData(billsEndpoint);
  const patientsData = useApiData(isAdmin ? "/patients" : null);
  const appointmentsData = useApiData(
    isAdmin && selectedPatientId ? `/appointments/patient/${selectedPatientId}` : null
  );

  const bills = billsData.data || [];
  const patients = patientsData.data || [];
  const appointments = appointmentsData.data || [];

  const error =
    actionError || billsData.error || patientsData.error || appointmentsData.error;

  const visibleBills = bills.filter(
    (b) => filter === "ALL" || b.paymentStatus === filter
  );

  const sum = (list) => list.reduce((t, b) => t + Number(b.totalAmount || 0), 0);
  const pendingTotal = sum(bills.filter((b) => b.paymentStatus !== "PAID"));
  const paidTotal = sum(bills.filter((b) => b.paymentStatus === "PAID"));

  // Completed appointments of the selected patient that have no bill yet
  const billedAppointmentIds = new Set(
    bills.map((b) => b.appointmentId).filter(Boolean)
  );
  const unbilled = appointments.filter(
    (a) => a.status === "COMPLETED" && !billedAppointmentIds.has(a.id)
  );

  const run = async (path, options, successMessage) => {
    setActionError("");
    setMessage("");
    try {
      await apiRequest(path, options);
      setMessage(successMessage);
      billsData.reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleFromAppointment = (appointmentId) =>
    run(
      `/bills/from-appointment/${appointmentId}`,
      { method: "POST" },
      "Bill generated from the appointment."
    );

  const handlePay = (billId) =>
    run(`/bills/${billId}/pay`, { method: "PUT" }, "Bill marked as PAID.");

  const handleManual = async (event) => {
    event.preventDefault();
    if (!selectedPatientId) return;
    await run(
      "/bills",
      {
        method: "POST",
        body: JSON.stringify({
          patient: { id: Number(selectedPatientId) },
          doctorFee: Number(manual.doctorFee) || 0,
          roomCharges: Number(manual.roomCharges) || 0,
          medicineCharges: Number(manual.medicineCharges) || 0,
          description: manual.description.trim() || null,
        }),
      },
      "Invoice generated."
    );
  };

  const setManualField = (key) => (event) =>
    setManual((previous) => ({ ...previous, [key]: event.target.value }));

  return (
    <>
      <PageHeader
        title="Billing & invoices"
        subtitle={
          isAdmin
            ? "Generate bills from completed appointments and discharges, track payments"
            : "Your invoices and payment status"
        }
      />

      <Alert>{error}</Alert>
      <Alert type="success">{message}</Alert>

      <div className="stats">
        <StatCard label="Bills" value={bills.length} />
        <StatCard label="Pending" value={formatMoney(pendingTotal)} tone="warn" />
        <StatCard label="Paid" value={formatMoney(paidTotal)} tone="ok" />
      </div>

      {isAdmin && (
        <section className="card section">
          <div className="card-head">
            <h2>Create a bill</h2>
            <p>Pick a patient to see their completed appointments</p>
          </div>
          <div className="card-body">
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <Field label="Patient">
                <select
                  className="select"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                  <option value="">All patients</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {selectedPatientId && (
              <>
                <h3 style={{ margin: "8px 0" }}>Completed appointments without a bill</h3>
                {unbilled.length === 0 ? (
                  <p className="muted">Nothing to bill. Every completed appointment has a bill.</p>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Doctor</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {unbilled.map((a) => (
                          <tr key={a.id}>
                            <td>{formatDate(a.appointmentDate)}</td>
                            <td>Dr. {a.doctorName}</td>
                            <td className="col-actions">
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => handleFromAppointment(a.id)}
                              >
                                Generate bill
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <details style={{ marginTop: 16 }}>
                  <summary style={{ cursor: "pointer", fontWeight: 500 }}>
                    Enter charges manually
                  </summary>
                  <form className="form-grid" style={{ marginTop: 12 }} onSubmit={handleManual}>
                    <Field label="Consultation fee (₹)">
                      <input
                        className="input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={manual.doctorFee}
                        onChange={setManualField("doctorFee")}
                        required
                      />
                    </Field>
                    <Field label="Room / bed charges (₹)">
                      <input
                        className="input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={manual.roomCharges}
                        onChange={setManualField("roomCharges")}
                      />
                    </Field>
                    <Field label="Pharmacy / medicines (₹)">
                      <input
                        className="input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={manual.medicineCharges}
                        onChange={setManualField("medicineCharges")}
                      />
                    </Field>
                    <Field label="Note">
                      <input
                        className="input"
                        value={manual.description}
                        onChange={setManualField("description")}
                      />
                    </Field>
                    <button type="submit" className="btn">
                      Generate invoice
                    </button>
                  </form>
                </details>
              </>
            )}
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h2>{isAdmin ? "Invoices" : "My invoices"}</h2>
          <div className="btn-row">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`btn btn-sm${filter === f.value ? "" : " btn-secondary"}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {visibleBills.length === 0 ? (
          <Empty title="No invoices found" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Bill</th>
                  {isAdmin && !selectedPatientId && <th>Patient</th>}
                  <th>Date</th>
                  <th>Details</th>
                  <th className="num">Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleBills.map((b) => (
                  <tr key={b.id}>
                    <td>#{b.id}</td>
                    {isAdmin && !selectedPatientId && (
                      <td className="cell-main">{b.patient?.name}</td>
                    )}
                    <td>{formatDateTime(b.generatedDate)}</td>
                    <td>
                      {b.description || "-"}
                      <div className="cell-sub">
                        Consult {formatMoney(b.doctorFee)} · Bed {formatMoney(b.roomCharges)} ·
                        Medicines {formatMoney(b.medicineCharges)}
                      </div>
                    </td>
                    <td className="num" style={{ fontWeight: 600 }}>
                      {formatMoney(b.totalAmount)}
                    </td>
                    <td>
                      <StatusBadge status={b.paymentStatus} />
                    </td>
                    <td className="col-actions">
                      <div className="btn-row" style={{ justifyContent: "flex-end" }}>
                        <Link className="btn btn-sm btn-secondary" to={`/invoice/${b.id}`}>
                          Invoice
                        </Link>
                        {isAdmin && b.paymentStatus !== "PAID" && (
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={() => handlePay(b.id)}
                          >
                            Mark paid
                          </button>
                        )}
                      </div>
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
