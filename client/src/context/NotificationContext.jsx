import { createContext, useContext, useMemo, useState } from "react";

const NotificationContext = createContext(null);

const seedNotifications = [
  {
    id: "n-1",
    title: "Critical alert triaged",
    message: "Patient PT-0091 has been escalated to emergency workflow.",
    priority: "high",
    read: false,
    time: "11:24 AM"
  },
  {
    id: "n-2",
    title: "Doctor shift update",
    message: "Neurology evening shift updated by operations.",
    priority: "medium",
    read: false,
    time: "10:58 AM"
  },
  {
    id: "n-3",
    title: "Weekly report prepared",
    message: "Department utilization report is ready to download.",
    priority: "low",
    read: true,
    time: "09:42 AM"
  }
];

function nowTimeLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function NotificationProvider({ children }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState(seedNotifications);
  const [toasts, setToasts] = useState([]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const addNotification = ({ title, message, priority = "low", read = false }) => {
    const item = {
      id: `n-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      title,
      message,
      priority,
      read,
      time: nowTimeLabel()
    };
    setNotifications((prev) => [item, ...prev].slice(0, 50));
    return item;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  const pushToast = ({ type = "info", title, message, priority = "low", ttl = 3600 }) => {
    const id = `t-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const toast = { id, type, title, message };
    setToasts((prev) => [toast, ...prev].slice(0, 5));
    addNotification({ title, message, priority, read: false });
    setTimeout(() => {
      removeToast(id);
    }, ttl);
    return toast;
  };

  const notifySuccess = (message, title = "Success") =>
    pushToast({ type: "success", title, message, priority: "low" });

  const notifyError = (message, title = "Failed") =>
    pushToast({ type: "error", title, message, priority: "high", ttl: 5000 });

  const notifyInfo = (message, title = "Info") =>
    pushToast({ type: "info", title, message, priority: "medium" });

  const value = useMemo(
    () => ({
      notifications,
      toasts,
      unreadCount,
      isModalOpen,
      openModal: () => setIsModalOpen(true),
      closeModal: () => setIsModalOpen(false),
      markAsRead: (id) =>
        setNotifications((prev) =>
          prev.map((item) => (item.id === id ? { ...item, read: true } : item))
        ),
      markAllRead: () =>
        setNotifications((prev) => prev.map((item) => ({ ...item, read: true }))),
      clearRead: () => setNotifications((prev) => prev.filter((item) => !item.read)),
      removeToast,
      addNotification,
      notifySuccess,
      notifyError,
      notifyInfo
    }),
    [isModalOpen, notifications, toasts, unreadCount]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }
  return context;
}
