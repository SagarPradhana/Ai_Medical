import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../../components/common/AuthShell";
import { useAuth } from "../../context/AuthContext";

function RegisterPage() {
  const [form, setForm] = useState({
    role: "patient",
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        role: form.role,
        name: form.name,
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
      title="Create Account"
      subtitle="Set up a secure healthcare portal account."
      footerText="Already registered?"
      footerLink="Login"
      footerTo="/auth/login"
    >
      <form onSubmit={onSubmit} className="auth-form">
        <label>
          Account Type
          <select
            value={form.role}
            onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
        </label>
        <label>
          Full Name
          <input
            required
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Your full name"
          />
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
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            placeholder="Create password"
          />
        </label>
        <label>
          Confirm Password
          <input
            type="password"
            required
            value={form.confirmPassword}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
            }
            placeholder="Confirm password"
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Account"}
        </button>
      </form>
      <p className="auth-back-link">
        <Link to="/auth/login">Back to role selection</Link>
      </p>
    </AuthShell>
  );
}

export default RegisterPage;
