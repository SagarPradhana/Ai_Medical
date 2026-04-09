import { FaCircleCheck, FaCircleInfo, FaTriangleExclamation, FaXmark } from "react-icons/fa6";
import { useNotifications } from "../../context/NotificationContext";

const iconByType = {
  success: FaCircleCheck,
  error: FaTriangleExclamation,
  info: FaCircleInfo
};

function ToastViewport() {
  const { toasts, removeToast } = useNotifications();

  if (!toasts.length) {
    return null;
  }

  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => {
        const Icon = iconByType[toast.type] || FaCircleInfo;
        return (
          <article key={toast.id} className={`toast-item ${toast.type}`}>
            <span className="toast-icon"><Icon /></span>
            <div className="toast-body">
              <h4>{toast.title}</h4>
              <p>{toast.message}</p>
            </div>
            <button type="button" onClick={() => removeToast(toast.id)} aria-label="Dismiss toast">
              <FaXmark />
            </button>
          </article>
        );
      })}
    </div>
  );
}

export default ToastViewport;
