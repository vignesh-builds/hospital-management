import { useState } from "react";
import { apiRequest } from "../utils/api";
import { getUser } from "../utils/auth";
import useApiData from "../utils/useApiData";
import {
  Alert,
  Empty,
  Field,
  PageHeader,
  initials,
} from "../components/ui";

const emptyForm = {
  name: "",
  specialization: "",
  phone: "",
  loginEmail: "",
  loginPassword: "",
};

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

  const error = actionError || loadError;

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  // ADD DOCTOR (optionally with a login account)
  const handleSubmit = async (event) => {
    event.preventDefault();
    setActionError("");
    setMessage("");

    const body = {
      name: form.name.trim(),
      specialization: form.specialization.trim(),
      phone: form.phone.trim(),
    };

    if (form.loginEmail.trim()) {
      body.user = {
        email: form.loginEmail.trim(),
        password: form.loginPassword,
      };
    }

    setSaving(true);

    try {
      await apiRequest("/doctors", {
        method: "POST",
        body: JSON.stringify(body),
      });

      setForm(emptyForm);
      setMessage(
        body.user
          ? "Doctor added. The doctor can now log in with the given email."
          : "Doctor added."
      );
      reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
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

      {isAdmin && (
        <section className="card section">
          <div className="card-head">
            <h2>Add doctor</h2>
          </div>

          <form className="card-body" onSubmit={handleSubmit}>
            <div className="form-grid">
              <Field label="Name">
                <input
                  className="input"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </Field>

              <Field label="Specialization">
                <input
                  className="input"
                  type="text"
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                  required
                />
              </Field>

              <Field label="Phone">
                <input
                  className="input"
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </Field>

              <Field label="Login email" hint="Optional. Lets the doctor sign in.">
                <input
                  className="input"
                  type="email"
                  name="loginEmail"
                  value={form.loginEmail}
                  onChange={handleChange}
                />
              </Field>

              <Field label="Login password" hint="Minimum 6 characters">
                <input
                  className="input"
                  type="password"
                  name="loginPassword"
                  value={form.loginPassword}
                  onChange={handleChange}
                  minLength={6}
                  required={Boolean(form.loginEmail.trim())}
                />
              </Field>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn" disabled={saving}>
                {saving ? "Adding..." : "Add doctor"}
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
