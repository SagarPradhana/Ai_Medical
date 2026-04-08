import { Link } from "react-router-dom";
import AuthShell from "../../components/common/AuthShell";

function LoginChoicePage() {
  return (
    <AuthShell
      title="Welcome To AI Medical Portal"
      subtitle="Select a login path to continue."
      footerText="New to platform?"
      footerLink="Create account"
      footerTo="/auth/register"
    >
      <div className="auth-actions">
        <Link to="/auth/login/admin" className="auth-action-btn doctor">
          Admin Login
        </Link>
        <Link to="/auth/login/doctor" className="auth-action-btn doctor">
          Doctor Login
        </Link>
        <Link to="/auth/login/patient" className="auth-action-btn patient">
          Patient Login
        </Link>
      </div>
    </AuthShell>
  );
}

export default LoginChoicePage;
