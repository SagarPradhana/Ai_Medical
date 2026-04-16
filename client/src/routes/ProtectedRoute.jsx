import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PortalLoader from "../components/common/PortalLoader";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return <PortalLoader title="Loading Portal" subtitle="Loading secure session and workspace..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
