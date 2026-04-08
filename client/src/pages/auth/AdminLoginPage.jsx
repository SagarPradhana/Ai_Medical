import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../../components/common/AuthShell";
import { useAuth } from "../../context/AuthContext";

function AdminLoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login({ role: "admin", email: form.email, password: form.password });
      navigate("/app", { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Admin Login"
      subtitle="Manage users, permissions, and full platform operations."
      footerText="Back to role chooser?"
      footerLink="Choose role"
      footerTo="/auth/login"
    >
      <form onSubmit={onSubmit} className="auth-form">
        <label>
          Admin Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="admin@yourdomain.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="Enter password"
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login As Admin"}
        </button>
      </form>
      <p className="auth-back-link">
        <Link to="/auth/forgot-password">Forgot password?</Link>
      </p>
      <p className="auth-back-link">
        <Link to="/auth/login">Back to role selection</Link>
      </p>
    </AuthShell>
  );
}

export default AdminLoginPage;
