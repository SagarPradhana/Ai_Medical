import PageHeader from "../../components/common/PageHeader";

const security = [
  "Enable Multi-Factor Authentication",
  "Session timeout after 15 minutes inactivity",
  "Restrict access by organization network"
];

const integrations = [
  "Laboratory System Connector",
  "Hospital Information System API",
  "Billing and Insurance Adapter"
];

function SettingsPage() {
  return (
    <section className="page-grid">
      <PageHeader
        title="Settings"
        subtitle="Security, compliance, communication, and integration controls."
      />
      <div className="two-col-grid">
        <div className="content-card fade-in-up">
          <h3>Security Policy</h3>
          <ul className="toggle-list">
            {security.map((item) => (
              <li key={item}>
                <span>{item}</span>
                <button type="button" className="toggle-btn active">
                  Enabled
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="content-card fade-in-up delayed-1">
          <h3>Integrations</h3>
          <ul className="toggle-list">
            {integrations.map((item) => (
              <li key={item}>
                <span>{item}</span>
                <button type="button" className="toggle-btn">
                  Configure
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default SettingsPage;
