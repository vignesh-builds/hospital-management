import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../utils/api";
import { getUser } from "../utils/auth";
import { formatDate, shortTime } from "../utils/date";
import { formatDateTime, formatMoney } from "../utils/format";
import useApiData from "../utils/useApiData";
import { Alert, Empty, Field, PageHeader } from "../components/ui";
import "./medical.css";

const EMPTY_FORM = {
  vitals: "",
  symptoms: "",
  diagnosis: "",
  medicines: "",
  advice: "",
  medicineCharges: "0",
};

export default function PrescriptionPage() {
  const { appointmentId } = useParams();
  const user = getUser();
  const isDoctor = user?.role === "DOCTOR";

  const prescriptionData = useApiData(`/prescriptions/appointment/${appointmentId}`);
  const appointmentData = useApiData(
    isDoctor ? `/appointments/${appointmentId}` : null
  );

  const prescription = prescriptionData.data;
  const appointment = appointmentData.data;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");

  const error = actionError || prescriptionData.error || appointmentData.error;
  const showForm = isDoctor && !prescriptionData.loading && (editing || !prescription);

  const startEdit = () => {
    setForm({
      vitals: prescription.vitals || "",
      symptoms: prescription.symptoms || "",
      diagnosis: prescription.diagnosis || "",
      medicines: prescription.medicines || "",
      advice: prescription.advice || "",
      medicineCharges: String(prescription.medicineCharges ?? 0),
    });
    setEditing(true);
  };

  const update = (key) => (event) =>
    setForm((previous) => ({ ...previous, [key]: event.target.value }));

  const handleSave = async (event) => {
    event.preventDefault();
    setActionError("");
    setMessage("");
    setSaving(true);
    try {
      await apiRequest("/prescriptions", {
        method: "POST",
        body: JSON.stringify({
          appointmentId: Number(appointmentId),
          vitals: form.vitals,
          symptoms: form.symptoms,
          diagnosis: form.diagnosis,
          medicines: form.medicines,
          advice: form.advice,
          medicineCharges: Number(form.medicineCharges) || 0,
        }),
      });
      setMessage("Prescription saved.");
      setEditing(false);
      prescriptionData.reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const backPath = isDoctor
    ? "/doctor-dashboard"
    : user?.role === "ADMIN"
    ? "/admin-dashboard"
    : "/patient-dashboard";

  return (
    <>
      <PageHeader
        title="Prescription"
        subtitle={
          appointment
            ? `${appointment.patientName} · ${formatDate(appointment.appointmentDate)}`
            : undefined
        }
      >
        <Link to={backPath} className="btn btn-secondary">
          Back
        </Link>
        {prescription && !showForm && (
          <button type="button" className="btn" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
        )}
        {prescription && isDoctor && !showForm && (
          <button type="button" className="btn btn-secondary" onClick={startEdit}>
            Edit
          </button>
        )}
      </PageHeader>

      <Alert>{error}</Alert>
      <Alert type="success">{message}</Alert>

      {showForm && (
        <section className="card section">
          <div className="card-head">
            <h2>{prescription ? "Edit prescription" : "Write prescription"}</h2>
            {appointment && (
              <p>
                {appointment.patientName} · {formatDate(appointment.appointmentDate)}{" "}
                {shortTime(appointment.appointmentTime)}
              </p>
            )}
          </div>
          <form className="card-body" onSubmit={handleSave}>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <Field label="Vitals" hint="e.g. BP 120/80, Pulse 78, Temp 99°F, SpO2 98%">
                <input className="input" value={form.vitals} onChange={update("vitals")} />
              </Field>
              <Field label="Symptoms">
                <input className="input" value={form.symptoms} onChange={update("symptoms")} />
              </Field>
            </div>

            <div className="form-grid" style={{ marginBottom: 16 }}>
              <Field label="Diagnosis *">
                <textarea
                  className="input"
                  value={form.diagnosis}
                  onChange={update("diagnosis")}
                  required
                />
              </Field>
              <Field
                label="Medicines *"
                hint="One per line: name, dose, timing, days"
              >
                <textarea
                  className="input"
                  placeholder={"Paracetamol 500mg - 1-0-1 - 3 days\nPantoprazole 40mg - 1-0-0 - 5 days"}
                  value={form.medicines}
                  onChange={update("medicines")}
                  required
                />
              </Field>
            </div>

            <div className="form-grid">
              <Field label="Advice">
                <textarea className="input" value={form.advice} onChange={update("advice")} />
              </Field>
              <Field
                label="Medicine charges (₹)"
                hint="Added to the patient's bill automatically"
              >
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.medicineCharges}
                  onChange={update("medicineCharges")}
                />
              </Field>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn" disabled={saving}>
                {saving ? "Saving..." : "Save prescription"}
              </button>
              {editing && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      {!showForm && prescription && (
        <article className="sheet">
          <header className="sheet-head">
            <div>
              <h2>CarePoint Hospital</h2>
              <div className="muted">Prescription</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <strong>Dr. {prescription.doctorName}</strong>
              <div className="muted">
                {[prescription.specialization, prescription.qualification]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
          </header>

          <dl className="sheet-meta">
            <div>
              <dt>Patient</dt>
              <dd>{prescription.patientName}</dd>
            </div>
            <div>
              <dt>Age / Gender</dt>
              <dd>
                {prescription.patientAge || "-"} / {prescription.patientGender || "-"}
              </dd>
            </div>
            <div>
              <dt>Visit</dt>
              <dd>
                {formatDate(prescription.appointmentDate)}{" "}
                {shortTime(prescription.appointmentTime)}
              </dd>
            </div>
            <div>
              <dt>Issued</dt>
              <dd>{formatDateTime(prescription.createdAt)}</dd>
            </div>
          </dl>

          {prescription.vitals && (
            <>
              <h3>Vitals</h3>
              <div className="pre-wrap">{prescription.vitals}</div>
            </>
          )}
          {prescription.symptoms && (
            <>
              <h3>Symptoms</h3>
              <div className="pre-wrap">{prescription.symptoms}</div>
            </>
          )}
          <h3>Diagnosis</h3>
          <div className="pre-wrap">{prescription.diagnosis}</div>

          <div className="rx">℞</div>
          <div className="pre-wrap">{prescription.medicines}</div>

          {prescription.advice && (
            <>
              <h3>Advice</h3>
              <div className="pre-wrap">{prescription.advice}</div>
            </>
          )}

          {user?.role !== "DOCTOR" && prescription.medicineCharges > 0 && (
            <p className="muted" style={{ marginTop: 16 }}>
              Medicine charges: {formatMoney(prescription.medicineCharges)}
            </p>
          )}

          <div className="sheet-sign">
            <div>Dr. {prescription.doctorName}</div>
          </div>
        </article>
      )}

      {!showForm && !prescription && !prescriptionData.loading && (
        <section className="card">
          <Empty title="No prescription yet">
            The doctor has not written a prescription for this appointment.
          </Empty>
        </section>
      )}
    </>
  );
}
