import { useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";

const securityItems = [
  "Enable Multi-Factor Authentication",
  "Session timeout after 15 minutes inactivity",
  "Restrict access by organization network"
];

const integrationItems = [
  "Laboratory System Connector",
  "Hospital Information System API",
  "Billing and Insurance Adapter"
];

function SettingsPage() {
  const initialSecurityState = useMemo(
    () => Object.fromEntries(securityItems.map((item) => [item, true])),
    []
  );
  const initialIntegrationState = useMemo(
    () => Object.fromEntries(integrationItems.map((item) => [item, false])),
    []
  );

  const [securityEnabled, setSecurityEnabled] = useState(initialSecurityState);
  const [integrationConfigured, setIntegrationConfigured] = useState(initialIntegrationState);

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
            {securityItems.map((item) => {
              const enabled = Boolean(securityEnabled[item]);
              return (
              <li key={item}>
                <span>{item}</span>
              <button
                type="button"
                className={`toggle-btn ${enabled ? "active" : ""}`}
                onClick={() => setSecurityEnabled((prev) => ({ ...prev, [item]: !enabled }))}
              >
                {enabled ? "Enabled" : "Disabled"}
              </button>
              </li>
              );
            })}
          </ul>
        </div>
        <div className="content-card fade-in-up delayed-1">
          <h3>Integrations</h3>
          <ul className="toggle-list">
            {integrationItems.map((item) => {
              const configured = Boolean(integrationConfigured[item]);
              return (
                <li key={item}>
                  <span>{item}</span>
                  <button
                    type="button"
                    className={`toggle-btn ${configured ? "active" : ""}`}
                    onClick={() =>
                      setIntegrationConfigured((prev) => ({
                        ...prev,
                        [item]: !configured
                      }))
                    }
                  >
                    {configured ? "Configured" : "Configure"}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default SettingsPage;
