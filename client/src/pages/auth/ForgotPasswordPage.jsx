import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../../components/common/AuthShell";
import { useAuth } from "../../context/AuthContext";

function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [form, setForm] = useState({ email: "", newPassword: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const response = await forgotPassword(form);
      setMessage(response.message || "Password reset successful.");
      setForm({ email: "", newPassword: "" });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Forgot Password"
      subtitle="Reset your account password securely."
      footerText="Remembered your password?"
      footerLink="Back to login"
      footerTo="/auth/login"
    >
      <form onSubmit={onSubmit} className="auth-form">
        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="your@email.com"
          />
        </label>
        <label>
          New Password
          <input
            type="password"
            required
            value={form.newPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, newPassword: event.target.value }))}
            placeholder="Enter new password"
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Reset Password"}
        </button>
      </form>
      <p className="auth-back-link">
        <Link to="/auth/login">Back to role selection</Link>
      </p>
    </AuthShell>
  );
}

export default ForgotPasswordPage;
