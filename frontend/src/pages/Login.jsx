import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  API,
  saveAuth,
} from "../utils/auth";
import AuthShell from "../components/AuthShell";
import { Alert, Field } from "../components/ui";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  // =========================================================
  // HANDLE INPUT CHANGE
  // =========================================================

  const handleChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };


  // =========================================================
  // LOGIN
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {

      const response = await fetch(
        `${API}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
          }),
        }
      );


      // =====================================================
      // READ RESPONSE
      // =====================================================

      const text = await response.text();

      let data = null;

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }


      // =====================================================
      // LOGIN FAILED
      // =====================================================

      if (!response.ok) {

        const message =
          typeof data === "string"
            ? data
            : data?.message ||
              data?.error ||
              "Invalid email or password";

        throw new Error(message);
      }


      // =====================================================
      // CHECK TOKEN
      // =====================================================

      if (!data || !data.token) {
        throw new Error(
          "Login successful, but JWT token was not received."
        );
      }


      // =====================================================
      // NORMALIZE ROLE
      // =====================================================

      const role = String(
        data.role || ""
      )
        .replace("ROLE_", "")
        .toUpperCase();


      if (!role) {
        throw new Error(
          "Login successful, but user role was not received."
        );
      }


      // =====================================================
      // SAVE AUTH DATA
      // =====================================================

      saveAuth({
        ...data,
        role,
      });


      // =====================================================
      // ROLE BASED NAVIGATION
      // =====================================================

      if (role === "PATIENT") {

        navigate(
          "/patient-dashboard",
          { replace: true }
        );

      } else if (role === "DOCTOR") {

        navigate(
          "/doctor-dashboard",
          { replace: true }
        );

      } else if (role === "ADMIN") {

        navigate(
          "/admin-dashboard",
          { replace: true }
        );

      } else {

        throw new Error(
          `Unknown user role: ${role}`
        );
      }

    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      setError(
        error.message ||
        "Failed to connect to server"
      );

    } finally {

      setLoading(false);
    }
  };


  // =========================================================
  // UI
  // =========================================================

  return (
    <AuthShell title="Log in" subtitle="Enter your account details to continue.">
      <Alert>{error}</Alert>

      <form className="auth-form" onSubmit={handleSubmit}>
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

        <Field label="Password">
          <input
            className="input"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />
        </Field>

        <button className="btn btn-block" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="auth-alt">
        New patient? <Link to="/register">Create an account</Link>
      </p>
    </AuthShell>
  );
}

export default Login;
