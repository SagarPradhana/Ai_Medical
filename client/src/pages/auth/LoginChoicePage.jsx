import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../../components/common/AuthShell";
import { useAuth } from "../../context/AuthContext";

function LoginChoicePage() {
  const [form, setForm] = useState({ position: "patient", email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login({
        position: form.position,
        email: form.email,
        password: form.password
      });
      navigate("/app", { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Portal Login"
      subtitle="Sign in with your account and position."
      footerText="Forgot password?"
      footerLink="Reset now"
      footerTo="/auth/forgot-password"
    >
      <form onSubmit={onSubmit} className="auth-form">
        <label>
          Position
          <select
            value={form.position}
            onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))}
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="name@domain.com"
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
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="auth-back-link">
        <Link to="/">Back to home</Link>
      </p>
    </AuthShell>
  );
}

export default LoginChoicePage;
