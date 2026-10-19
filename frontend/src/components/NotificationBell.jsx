import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../lib/axios.js";
import useAuth from "../hooks/UseAuth.js";

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get("/api/notifications");
      const list = res.data.notifications || [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.read).length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="dropdown dropdown-end relative">
      <button
        tabIndex={0}
        type="button"
        className="btn btn-ghost btn-circle btn-sm relative"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="badge badge-error badge-xs absolute top-0.5 right-0.5 font-bold animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <div
        tabIndex={0}
        className="dropdown-content menu p-3 shadow-lg bg-base-100 rounded-box w-80 sm:w-96 border border-base-300 z-50 mt-2"
      >
        <div className="flex items-center justify-between pb-2 border-b border-base-200 mb-2">
          <span className="font-bold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="badge badge-primary badge-sm font-semibold">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto space-y-1.5 divide-y divide-base-200">
          {notifications.length === 0 ? (
            <p className="text-xs opacity-60 text-center py-4">No notifications yet.</p>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <div
                key={n._id}
                className={`pt-2 text-xs flex items-start justify-between gap-2 p-1.5 rounded hover:bg-base-200 transition-colors ${
                  !n.read ? "bg-primary/5 font-medium" : "opacity-80"
                }`}
              >
                <div className="flex-1">
                  <p>{n.message}</p>
                  <span className="text-[10px] opacity-60">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    onClick={(e) => handleMarkAsRead(n._id, e)}
                    className="btn btn-ghost btn-xs text-primary"
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-base-200 text-center mt-2">
          <Link
            to="/notifications"
            className="link link-primary text-xs font-semibold"
            onClick={() => setOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      </div>
    </div>
  );
}
