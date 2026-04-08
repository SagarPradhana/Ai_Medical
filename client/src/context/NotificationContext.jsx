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

export function NotificationProvider({ children }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState(seedNotifications);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const value = useMemo(
    () => ({
      notifications,
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
      clearRead: () => setNotifications((prev) => prev.filter((item) => !item.read))
    }),
    [isModalOpen, notifications, unreadCount]
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
