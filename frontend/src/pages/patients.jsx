import { useState } from "react";
import { apiRequest } from "../utils/api";
import { getUser } from "../utils/auth";
import useApiData from "../utils/useApiData";
import { Alert, Empty, Field, PageHeader } from "../components/ui";

const emptyForm = { name: "", email: "", phone: "", age: "" };

function Patients() {
  const user = getUser();
  const isAdmin = user?.role === "ADMIN";

  const { data, error: loadError, reload } = useApiData("/patients");
  const patients = data || [];

  const [form, setForm] = useState(emptyForm);
  const [editingPatient, setEditingPatient] = useState(null);
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  const error = actionError || loadError;

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  // ADD PATIENT
  const handleSubmit = async (event) => {
    event.preventDefault();
    setActionError("");
    setSaving(true);

    try {
      await apiRequest("/patients", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          age: Number(form.age),
        }),
      });

      setForm(emptyForm);
      reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // UPDATE PATIENT
  const handleUpdate = async (event) => {
    event.preventDefault();
    setActionError("");

    try {
      await apiRequest(`/patients/${editingPatient.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editingPatient.name.trim(),
          email: editingPatient.email.trim(),
          phone: (editingPatient.phone || "").trim(),
          age: Number(editingPatient.age),
        }),
      });

      setEditingPatient(null);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // DELETE PATIENT
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this patient?")) return;

    setActionError("");

    try {
      await apiRequest(`/patients/${id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Patients"
        subtitle={`${patients.length} registered patient${patients.length === 1 ? "" : "s"}`}
      />

      <Alert>{error}</Alert>

      {isAdmin && (
        <section className="card section">
          <div className="card-head">
            <h2>Add patient</h2>
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

              <Field label="Email">
                <input
                  className="input"
                  type="email"
                  name="email"
                  value={form.email}
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

              <Field label="Age">
                <input
                  className="input"
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  min="1"
                  max="120"
                  required
                />
              </Field>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn" disabled={saving}>
                {saving ? "Adding..." : "Add patient"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="card">
        {patients.length === 0 ? (
          <Empty title="No patients found" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Age</th>
                  {isAdmin && <th></th>}
                </tr>
              </thead>

              <tbody>
                {patients.map((patient) => {
                  const editing =
                    isAdmin && editingPatient?.id === patient.id;

                  return editing ? (
                    <tr key={patient.id} className="edit-row">
                      <td colSpan={5}>
                        <form onSubmit={handleUpdate}>
                          <div className="form-grid">
                            <Field label="Name">
                              <input
                                className="input"
                                type="text"
                                value={editingPatient.name}
                                onChange={(e) =>
                                  setEditingPatient({
                                    ...editingPatient,
                                    name: e.target.value,
                                  })
                                }
                                required
                              />
                            </Field>

                            <Field label="Email">
                              <input
                                className="input"
                                type="email"
                                value={editingPatient.email || ""}
                                onChange={(e) =>
                                  setEditingPatient({
                                    ...editingPatient,
                                    email: e.target.value,
                                  })
                                }
                                required
                              />
                            </Field>

                            <Field label="Phone">
                              <input
                                className="input"
                                type="text"
                                value={editingPatient.phone || ""}
                                onChange={(e) =>
                                  setEditingPatient({
                                    ...editingPatient,
                                    phone: e.target.value,
                                  })
                                }
                                required
                              />
                            </Field>

                            <Field label="Age">
                              <input
                                className="input"
                                type="number"
                                value={editingPatient.age}
                                onChange={(e) =>
                                  setEditingPatient({
                                    ...editingPatient,
                                    age: e.target.value,
                                  })
                                }
                                min="1"
                                max="120"
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
                              onClick={() => setEditingPatient(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={patient.id}>
                      <td className="cell-main">{patient.name}</td>
                      <td>{patient.email}</td>
                      <td>{patient.phone}</td>
                      <td className="num">{patient.age}</td>
                      {isAdmin && (
                        <td className="col-actions">
                          <div className="btn-row" style={{ justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => setEditingPatient({ ...patient })}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(patient.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export default Patients;
