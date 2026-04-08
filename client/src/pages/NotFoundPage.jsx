import { Link } from "react-router-dom";
import AuthShell from "../components/common/AuthShell";

function NotFoundPage() {
  return (
    <AuthShell
      title="404 - Page Not Found"
      subtitle="The page you requested does not exist in this portal."
    >
      <div className="auth-actions">
        <Link to="/auth/login" className="auth-action-btn doctor">
          Go To Login
        </Link>
      </div>
    </AuthShell>
  );
}

export default NotFoundPage;
