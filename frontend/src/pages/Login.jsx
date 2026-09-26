import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { saveAuth } from "../utils/auth";
import "./Login.css";

const API_URL = "https://hospital-backend-jcnb.onrender.com";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
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
  // LOGIN
  // ==============================
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/login`,
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
            : data?.message ||
              "Invalid email or password"
        );
      }

      // ==============================
      // SAVE LOGIN DATA
      // ==============================
      saveAuth(data);

      // ==============================
      // ROLE BASED NAVIGATION
      // ==============================

      if (data.role === "PATIENT") {
        navigate("/patient-dashboard");

      } else if (data.role === "DOCTOR") {
        navigate("/doctor-dashboard");

      } else if (data.role === "ADMIN") {
        navigate("/admin-dashboard");

      } else {
        navigate("/");
      }

    } catch (error) {
      console.error("Login error:", error);

      setError(
        error.message ||
          "Failed to connect to server"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">

      <div className="auth-card">

        <h2>Hospital Management System</h2>

        <h3>Login</h3>

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
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
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
