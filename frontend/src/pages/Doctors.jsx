import { useState } from "react";
import { apiRequest } from "../utils/api";
import { getUser } from "../utils/auth";
import useApiData from "../utils/useApiData";
import {
  Alert,
  Empty,
  Field,
  PageHeader,
} from "../components/ui";
import { initials } from "../utils/text";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  age: "",
  specialization: "",
  experience: "",
  qualification: "",
  consultationFee: "",
};

const SPECIALIZATIONS = [
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Orthopedic",
  "Pediatrician",
  "Gynecologist",
  "ENT Specialist",
  "Ophthalmologist",
  "Psychiatrist",
  "Dentist",
  "Urologist",
];

function Doctors() {
  const user = getUser();
  const isAdmin = user?.role === "ADMIN";

  const { data, error: loadError, loading, reload } = useApiData("/doctors");
  const doctors = data || [];

  const [form, setForm] = useState(emptyForm);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [createdDoctor, setCreatedDoctor] = useState(null);
  const [copied, setCopied] = useState(false);

  const error = actionError || loadError;

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  // ADD DOCTOR - login account is created with a system generated password
  const handleSubmit = async (event) => {
    event.preventDefault();
    setActionError("");
    setMessage("");
    setCreatedDoctor(null);
    setCopied(false);
    setSaving(true);

    try {
      const result = await apiRequest("/doctors", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          specialization: form.specialization,
          age: form.age === "" ? null : Number(form.age),
          experience:
            form.experience === "" ? null : Number(form.experience),
          qualification: form.qualification.trim(),
          consultationFee:
            form.consultationFee === ""
              ? null
              : Number(form.consultationFee),
          user: { email: form.email.trim() },
        }),
      });

      if (!result || !result.temporaryPassword) {
        throw new Error(
          "Doctor may have been created, but the temporary password was not returned. Check the doctors list before retrying."
        );
      }

      setCreatedDoctor({
        name: result.name || form.name.trim(),
        email: result.email || form.email.trim(),
        temporaryPassword: result.temporaryPassword,
      });

      setForm(emptyForm);
      reload();
    } catch (err) {
      setActionError(err.message || "Unable to add doctor.");
    } finally {
      setSaving(false);
    }
  };

  // COPY TEMPORARY PASSWORD
  const handleCopyPassword = async () => {
    if (!createdDoctor?.temporaryPassword) return;

    try {
      await navigator.clipboard.writeText(createdDoctor.temporaryPassword);
      setCopied(true);
    } catch {
      setActionError(
        "Could not copy the password. Please select and copy it manually."
      );
    }
  };

  // UPDATE DOCTOR
  const handleUpdate = async () => {
    setActionError("");
    setMessage("");

    try {
      await apiRequest(`/doctors/${editingDoctor.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editingDoctor.name.trim(),
          specialization: editingDoctor.specialization.trim(),
          phone: (editingDoctor.phone || "").trim(),
        }),
      });

      setEditingDoctor(null);
      setMessage("Doctor updated.");
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // DELETE DOCTOR
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this doctor?")) return;

    setActionError("");
    setMessage("");

    try {
      await apiRequest(`/doctors/${id}`, { method: "DELETE" });
      setMessage("Doctor deleted.");
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Doctors"
        subtitle={`${doctors.length} doctor${doctors.length === 1 ? "" : "s"} on staff`}
      />

      <Alert>{error}</Alert>
      <Alert type="success">{message}</Alert>

      {/* SHOW TEMPORARY PASSWORD AFTER SUCCESSFUL CREATION */}
      {createdDoctor && (
        <section className="card section">
          <div className="card-head">
            <h2>Doctor added successfully!</h2>
          </div>

          <div className="card-body">
            <p>
              <strong>Name:</strong> {createdDoctor.name}
            </p>
            <p>
              <strong>Email:</strong> {createdDoctor.email}
            </p>
            <p>
              <strong>Temporary password:</strong>
            </p>

            <div className="form-actions">
              <code
                style={{
                  padding: "10px",
                  display: "block",
                  overflowWrap: "anywhere",
                  userSelect: "all",
                }}
              >
                {createdDoctor.temporaryPassword}
              </code>

              <button
                type="button"
                className="btn"
                onClick={handleCopyPassword}
              >
                {copied ? "Copied!" : "Copy password"}
              </button>
            </div>

            <p>
              Share this password with the doctor. They must change it on
              first login. It will disappear when you leave or refresh this
              page.
            </p>
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="card section">
          <div className="card-head">
            <h2>Add New Doctor</h2>
            <span className="badge badge-confirmed">
              Admin Dashboard · Doctor Management
            </span>
          </div>

          <form className="card-body" onSubmit={handleSubmit}>
            <div className="form-grid" style={{ alignItems: "start" }}>
              <Field label="Doctor Name">
                <input
                  className="input"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Dr. Arun Kumar"
                  required
                />
              </Field>

              <Field label="Email" hint="Used as the doctor's login email">
                <input
                  className="input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="doctor@gmail.com"
                  required
                />
              </Field>

              <Field label="Phone Number">
                <input
                  className="input"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  required
                />
              </Field>

              <Field label="Age">
                <input
                  className="input"
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="35"
                  min="18"
                  max="100"
                  required
                />
              </Field>

              <Field label="Specialization">
                <select
                  className="select"
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select</option>
                  {SPECIALIZATIONS.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Experience (years)">
                <input
                  className="input"
                  type="number"
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  placeholder="5 years"
                  min="0"
                  max="80"
                  required
                />
              </Field>
            </div>

            <div className="field" style={{ marginTop: 16 }}>
              <label htmlFor="doctor-qualification">Qualification</label>
              <input
                id="doctor-qualification"
                className="input"
                type="text"
                name="qualification"
                value={form.qualification}
                onChange={handleChange}
                placeholder="MBBS, MD"
                required
              />
            </div>

            <div className="field" style={{ marginTop: 16 }}>
              <label htmlFor="doctor-fee">Consultation Fee (₹)</label>
              <input
                id="doctor-fee"
                className="input"
                type="number"
                name="consultationFee"
                value={form.consultationFee}
                onChange={handleChange}
                placeholder="₹500"
                min="0"
                required
              />
            </div>

            <div className="field" style={{ marginTop: 16 }}>
              <label htmlFor="doctor-temp-password">Temporary Password</label>
              <input
                id="doctor-temp-password"
                className="input"
                type="text"
                value=""
                placeholder="Auto generated by system"
                disabled
                readOnly
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn" disabled={saving}>
                {saving ? "Adding..." : "Add Doctor"}
              </button>
            </div>
          </form>
        </section>
      )}

      {loading && !data && <p className="loading">Loading doctors...</p>}

      {!loading && doctors.length === 0 && !error && (
        <section className="card">
          <Empty title="No doctors found" />
        </section>
      )}

      <div className="doctor-grid">
        {doctors.map((doctor) => {
          const editing = isAdmin && editingDoctor?.id === doctor.id;

          return (
            <article className="card doctor-card" key={doctor.id}>
              {editing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdate();
                  }}
                >
                  <div style={{ display: "grid", gap: 12 }}>
                    <Field label="Name">
                      <input
                        className="input"
                        type="text"
                        value={editingDoctor.name}
                        onChange={(e) =>
                          setEditingDoctor({
                            ...editingDoctor,
                            name: e.target.value,
                          })
                        }
                        required
                      />
                    </Field>

                    <Field label="Specialization">
                      <input
                        className="input"
                        type="text"
                        value={editingDoctor.specialization}
                        onChange={(e) =>
                          setEditingDoctor({
                            ...editingDoctor,
                            specialization: e.target.value,
                          })
                        }
                        required
                      />
                    </Field>

                    <Field label="Phone">
                      <input
                        className="input"
                        type="text"
                        value={editingDoctor.phone || ""}
                        onChange={(e) =>
                          setEditingDoctor({
                            ...editingDoctor,
                            phone: e.target.value,
                          })
                        }
                        required
                      />
                    </Field>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-sm">
                      Save changes
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => setEditingDoctor(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="doctor-top">
                    <div className="avatar">{initials(doctor.name)}</div>
                    <div>
                      <h3>{doctor.name}</h3>
                      <div className="doctor-spec">{doctor.specialization}</div>
                    </div>
                  </div>

                  <p className="doctor-meta">Phone: {doctor.phone || "Not provided"}</p>
                  {doctor.qualification && (
                    <p className="doctor-meta">
                      Qualification: {doctor.qualification}
                    </p>
                  )}
                  {doctor.experience != null && (
                    <p className="doctor-meta">
                      Experience: {doctor.experience} year
                      {doctor.experience === 1 ? "" : "s"}
                    </p>
                  )}
                  {doctor.consultationFee != null && (
                    <p className="doctor-meta">
                      Consultation fee: ₹{doctor.consultationFee}
                    </p>
                  )}

                  {isAdmin && (
                    <div className="btn-row">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => setEditingDoctor({ ...doctor })}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(doctor.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

export default Doctors;
