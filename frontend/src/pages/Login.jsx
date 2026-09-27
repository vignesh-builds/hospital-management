import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  API,
  saveAuth,
} from "../utils/auth";
import "./Login.css";

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
    <div className="auth-container">

      <div className="auth-card">

        <h2>
          Hospital Management System
        </h2>

        <h3>
          Login
        </h3>


        {/* ERROR MESSAGE */}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}


        {/* LOGIN FORM */}

        <form onSubmit={handleSubmit}>

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />


          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />


          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>


        <p>
          Don't have an account?{" "}

          <Link to="/register">
            Register
          </Link>
        </p>

      </div>

    </div>
  );
}

export default Login;
