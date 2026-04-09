import PageHeader from "../../components/common/PageHeader";
import { useNotifications } from "../../context/NotificationContext";

function NotificationsPage() {
  const { notifications } = useNotifications();

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
            <article key={item.id} className="alert-item">
              <span className={`status-pill ${String(item.priority || "low").toLowerCase()}`}>
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
