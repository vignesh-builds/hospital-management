import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API } from "../utils/auth";
import AuthShell from "../components/AuthShell";
import PasswordInput from "../components/PasswordInput";
import { Alert, Field } from "../components/ui";

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: request OTP, 2: verify OTP, 3: set password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // STEP 1: REQUEST OTP VIA EMAIL
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/forgot-password/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to send verification code.");
      }

      setSuccess("A 6-digit verification code has been sent to your email address.");
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: VERIFY OTP BEFORE SHOWING PASSWORD FIELDS
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Corrected regex with single backslash
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Please enter the 6-digit code sent to your email.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/forgot-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Invalid verification code.");

      setSuccess("Email verified. You can now create a new password.");
      setStep(3);
    } catch (err) {
      setError(err.message || "Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset password; backend validates OTP again before changing it.
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/forgot-password/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Unable to reset password.");

      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      setError(err.message || "Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot Password"
      subtitle={
        step === 1
          ? "Enter your email to receive a password reset code."
          : step === 2
          ? `Enter the 6-digit code sent to ${email}.`
          : "Your email is verified. Create a new password."
      }
    >
      <Alert>{error}</Alert>
      <Alert type="success">{success}</Alert>

      {step === 1 ? (
        <form className="auth-form" onSubmit={handleRequestOtp}>
          <Field label="Registered email address">
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@hospital.com"
              autoComplete="email"
              required
            />
          </Field>
          <button className="btn btn-block" type="submit" disabled={loading}>
            {loading ? "Sending Code..." : "Send Verification Code"}
          </button>
        </form>
      ) : step === 2 ? (
        <form className="auth-form" onSubmit={handleVerifyOtp}>
          <Field label="6-digit Email Verification Code">
            <input
              className="input"
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="e.g. 123456"
              maxLength={6}
              autoComplete="one-time-code"
              required
            />
          </Field>
          <button className="btn btn-block" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify Code"}
          </button>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setStep(1);
                setOtp("");
                setError("");
                setSuccess("");
              }}
            >
              Change Email / Resend Code
            </button>
          </div>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleResetPassword}>
          <Field label="New password" hint="At least 6 characters">
            <PasswordInput
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              placeholder="Enter new password"
              required
            />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              placeholder="Confirm new password"
              required
            />
          </Field>
          <button className="btn btn-block" type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}
      <p className="auth-alt">
        Remember your password? <Link to="/login">Back to log in</Link>
      </p>
    </AuthShell>
  );
}

export default ForgotPassword;
