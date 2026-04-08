import { Link } from "react-router-dom";

function AuthShell({ title, subtitle, children, footerText, footerLink, footerTo }) {
  return (
    <div className="auth-shell">
      <section className="auth-card">
        <div className="auth-head">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
        {footerText && footerLink ? (
          <p className="auth-footer">
            {footerText} <Link to={footerTo}>{footerLink}</Link>
          </p>
        ) : null}
      </section>
    </div>
  );
}

export default AuthShell;
