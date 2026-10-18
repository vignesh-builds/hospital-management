
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
    phone: "",
    age: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!/^\d{10}$/.test(formData.phone.trim())) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }

    const age = Number(formData.age);

    if (!Number.isInteger(age) || age < 0 || age > 150) {
      setError("Age must be between 0 and 150.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          age,
          password: formData.password,
        }),
      });

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

      setSuccess("Registration successful. Redirecting to login...");

      setFormData({
        name: "",
        email: "",
        phone: "",
        age: "",
        password: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "Failed to connect to server");
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
            placeholder="Enter your full name"
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
            placeholder="Enter your email"
            required
          />
        </Field>

        <Field label="Phone number">
          <input
            className="input"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            autoComplete="tel"
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            placeholder="10-digit phone number"
            title="Enter a 10-digit phone number"
            required
          />
        </Field>

        <Field label="Age">
          <input
            className="input"
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            min="0"
            max="150"
            step="1"
            placeholder="Enter your age"
            required
          />
        </Field>

        <Field label="Password" hint="At least 6 characters">
          <div style={{ position: "relative" }}>
            <input
              className="input"
              style={{ paddingRight: "48px" }}
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={6}
              placeholder="Create a password"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              title={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: "4px",
                fontSize: "18px",
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </Field>

        <button
          className="btn btn-block"
          type="submit"
          disabled={loading}
        >
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
