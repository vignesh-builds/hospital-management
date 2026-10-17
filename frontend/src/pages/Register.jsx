import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { Alert, Field } from "../components/ui";
import { API as API_URL } from "../utils/auth";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // ==============================
  // HANDLE INPUT CHANGE
  // ==============================
  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  // ==============================
  // REGISTER
  // ==============================
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
          }),
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (!response.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : data.message || "Registration failed"
        );
      }

      setSuccess(
        "Registration successful. Redirecting to login..."
      );

      setFormData({
        name: "",
        email: "",
        password: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      console.error("Registration error:", error);

      setError(
        error.message || "Failed to connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create patient account"
      subtitle="Register to book and manage your appointments."
    >
      <Alert>{error}</Alert>
      <Alert type="success">{success}</Alert>

      <form className="auth-form" onSubmit={handleSubmit}>
        <Field label="Full name">
          <input
            className="input"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            autoComplete="name"
            required
          />
        </Field>

        <Field label="Email">
          <input
            className="input"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
        </Field>

        <Field label="Password" hint="At least 6 characters">
          <input
            className="input"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </Field>

        <button className="btn btn-block" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="auth-alt">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </AuthShell>
  );
}

export default Register;
