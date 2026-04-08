import { Link } from "react-router-dom";
import AuthShell from "../components/common/AuthShell";

function UnauthorizedPage() {
  return (
    <AuthShell
      title="Access Denied"
      subtitle="Your current role does not have permission for this module."
    >
      <div className="auth-actions">
        <Link to="/app" className="auth-action-btn patient">
          Back To Dashboard
        </Link>
      </div>
    </AuthShell>
  );
}

export default UnauthorizedPage;
