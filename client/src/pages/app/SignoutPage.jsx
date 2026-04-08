import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";

function SignoutPage() {
  const { signout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    signout();
    const timer = setTimeout(() => {
      navigate("/auth/login", { replace: true });
    }, 700);

    return () => clearTimeout(timer);
  }, [navigate, signout]);

  return (
    <section className="page-grid">
      <PageHeader title="Signing Out" subtitle="Your session is being closed securely." />
    </section>
  );
}

export default SignoutPage;
