
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  API,
  getAuthHeaders,
  getUser,
  updatePasswordChangeStatus,
} from "../utils/auth";
import AuthShell from "../components/AuthShell";
import { Alert, Field } from "../components/ui";

function ChangePassword() {
  const navigate = useNavigate();
  const user = getUser();

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const handleChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (formData.oldPassword === formData.newPassword) {
      setError("New password must be different from old password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/change-password`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const text = await response.text();
      let data = null;

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      if (!response.ok) {
        const message =
          typeof data === "string"
            ? data
            : data?.message ||
              data?.error ||
              "Unable to change password.";

        throw new Error(message);
      }

      updatePasswordChangeStatus(false);
      setSuccess("Password changed successfully!");

      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      const role = String(user?.role || "").toUpperCase();
      const dashboard =
        role === "ADMIN"
          ? "/admin-dashboard"
          : role === "DOCTOR"
            ? "/doctor-dashboard"
            : "/patient-dashboard";

      navigate(dashboard, { replace: true });
    } catch (err) {
      console.error("Change password error:", err);
      setError(err.message || "Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Change Password"
      subtitle="Set a new password to continue to your account."
    >
      <Alert>{error || success}</Alert>

      <form className="auth-form" onSubmit={handleSubmit}>
        <Field label="Old password">
          <input
            className="input"
            type={showPasswords ? "text" : "password"}
            name="oldPassword"
            value={formData.oldPassword}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />
        </Field>

        <Field label="New password">
          <input
            className="input"
            type={showPasswords ? "text" : "password"}
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </Field>

        <Field label="Confirm new password">
          <input
            className="input"
            type={showPasswords ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </Field>

        <label className="password-toggle">
          <input
            type="checkbox"
            checked={showPasswords}
            onChange={(event) =>
              setShowPasswords(event.target.checked)
            }
          />
          Show passwords
        </label>

        <button
          className="btn btn-block"
          type="submit"
          disabled={loading}
        >
          {loading ? "Updating..." : "Change Password"}
        </button>
      </form>
    </AuthShell>
  );
}

export default ChangePassword;
