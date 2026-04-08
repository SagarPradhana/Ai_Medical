import PageHeader from "../../components/common/PageHeader";

const notifications = [
  {
    priority: "High",
    title: "Emergency escalation pending",
    message: "Patient PT-0091 flagged for chest pain and low oxygen trend."
  },
  {
    priority: "Medium",
    title: "Doctor shift overlap",
    message: "Evening shift has 2 overlapping general medicine assignments."
  },
  {
    priority: "Low",
    title: "Report ready",
    message: "Weekly outpatient analytics report is available for review."
  }
];

function NotificationsPage() {
  return (
    <section className="page-grid">
      <PageHeader
        title="Notifications"
        subtitle="Unified alert center for risk, operations, and reporting events."
      />
      <div className="content-card fade-in-up">
        <h3>Recent Alerts</h3>
        <div className="alert-stack">
          {notifications.map((item) => (
            <article key={item.title} className="alert-item">
              <span className={`status-pill ${item.priority.toLowerCase()}`}>
                {item.priority}
              </span>
              <div>
                <h4>{item.title}</h4>
                <p>{item.message}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default NotificationsPage;
