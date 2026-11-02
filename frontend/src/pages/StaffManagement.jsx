import { useState } from "react";
import { apiRequest } from "../utils/api";
import { Alert, Field, PageHeader } from "../components/ui";

export default function StaffManagement() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "RECEPTIONIST",
  });

  const [loading, setLoading] = useState(false);
  const [createdStaff, setCreatedStaff] = useState(null);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setCreatedStaff(null);
    setCopied(false);
    setLoading(true);

    try {
      const result = await apiRequest("/auth/staff", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setCreatedStaff({
        name: result.name,
        email: result.email,
        role: result.role,
        temporaryPassword: result.temporaryPassword,
      });

      setMessage(
        `${result.name} created as ${result.role}. An email with the temporary password has been dispatched.`
      );
      setForm({ name: "", email: "", role: "RECEPTIONIST" });
    } catch (err) {
      setError(err.message || "Unable to create staff account.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!createdStaff?.temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(createdStaff.temporaryPassword);
      setCopied(true);
    } catch {
      setError("Could not copy automatically. Please copy the password manually.");
    }
  };

  return (
    <>
      <PageHeader
        title="Staff accounts"
        subtitle="Provision accounts for Receptionists, Nurses, and Ward In-charges. Passwords are automatically generated and emailed."
      />

      <Alert>{error}</Alert>
      <Alert type="success">{message}</Alert>

      {createdStaff && (
        <section className="card section">
          <div className="card-head">
            <h2>Staff Account Created Successfully</h2>
            <span className="badge badge-confirmed">{createdStaff.role}</span>
          </div>
          <div className="card-body">
            <p>
              <strong>Name:</strong> {createdStaff.name}
            </p>
            <p>
              <strong>Email:</strong> {createdStaff.email}
            </p>
            <p style={{ marginTop: 10 }}>
              <strong>Automatic Temporary Password:</strong>
            </p>

            <div className="form-actions" style={{ alignItems: "center", marginTop: 8 }}>
              <code
                style={{
                  padding: "10px 16px",
                  background: "var(--bg)",
                  borderRadius: "6px",
                  border: "1px solid var(--line-strong)",
                  fontSize: "1.1rem",
                  letterSpacing: "1px",
                  userSelect: "all",
                }}
              >
                {createdStaff.temporaryPassword}
              </code>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCopyPassword}
              >
                {copied ? "Copied!" : "Copy password"}
              </button>
            </div>

            <p className="page-sub" style={{ marginTop: 14 }}>
              This temporary password has been sent to <strong>{createdStaff.email}</strong>.
              The staff member will be required to choose a new password upon their first login.
            </p>
          </div>
        </section>
      )}

      <section className="card section">
        <div className="card-head">
          <h2>Create New Staff Account</h2>
        </div>
        <form className="card-body form-grid" onSubmit={handleSubmit}>
          <Field label="Full name">
            <input
              className="input"
              name="name"
              placeholder="e.g. Priya Sharma"
              value={form.name}
              onChange={handleChange}
              required
            />
          </Field>

          <Field label="Email address" hint="Staff login & notification email">
            <input
              className="input"
              type="email"
              name="email"
              placeholder="staff@hospital.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </Field>

          <Field label="Role">
            <select
              className="select"
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="NURSE">Nurse</option>
              <option value="WARD_IN_CHARGE">Ward In-charge</option>
            </select>
          </Field>

          <div className="field">
            <label>Temporary Password</label>
            <input
              className="input"
              type="text"
              value="Generated automatically by system"
              disabled
              readOnly
            />
          </div>

          <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Generating..." : "Generate Staff Account"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
