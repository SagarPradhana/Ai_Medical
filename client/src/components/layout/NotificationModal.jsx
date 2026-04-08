import { useNotifications } from "../../context/NotificationContext";

function NotificationModal() {
  const {
    isModalOpen,
    notifications,
    closeModal,
    markAsRead,
    markAllRead,
    clearRead
  } = useNotifications();

  if (!isModalOpen) {
    return null;
  }

  return (
    <div className="notif-modal-wrap" role="dialog" aria-modal="true">
      <button
        type="button"
        className="notif-backdrop"
        onClick={closeModal}
        aria-label="Close notifications"
      />
      <section className="notif-modal">
        <header className="notif-modal-header">
          <div>
            <h3>Notifications Center</h3>
            <p>Review, track, and manage portal alerts.</p>
          </div>
          <button type="button" className="close-btn" onClick={closeModal}>
            Close
          </button>
        </header>

        <div className="notif-actions">
          <button type="button" onClick={markAllRead}>
            Mark All Read
          </button>
          <button type="button" onClick={clearRead}>
            Clear Read
          </button>
        </div>

        <div className="notif-list">
          {notifications.map((item) => (
            <article key={item.id} className={`notif-item ${item.read ? "read" : "unread"}`}>
              <div>
                <span className={`status-pill ${item.priority}`}>{item.priority}</span>
                <h4>{item.title}</h4>
                <p>{item.message}</p>
                <small>{item.time}</small>
              </div>
              {!item.read ? (
                <button type="button" onClick={() => markAsRead(item.id)}>
                  Mark Read
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default NotificationModal;
