import { useState, useEffect } from "react";
import api from "../lib/axios.js";
import NavBar from "../components/NavBar.jsx";
import Loader from "../components/Loader.jsx";

export default function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "unread"
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/notifications");
      setNotifications(res.data.notifications || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadList = notifications.filter((n) => !n.read);
    try {
      await Promise.allSettled(
        unreadList.map((n) => api.patch(`/api/notifications/${n._id}/read`))
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setNotice("All notifications marked as read.");
      setTimeout(() => setNotice(""), 3000);
    } catch {
      // ignore
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    return true;
  });

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <NavBar />

      <div className="max-w-4xl mx-auto w-full p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Notifications</h1>
            <p className="text-sm opacity-70 mt-1">
              Stay updated on job applications, test assignments, and hiring decisions.
            </p>
          </div>

          {notifications.some((n) => !n.read) && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="btn btn-outline btn-sm"
            >
              ✓ Mark All as Read
            </button>
          )}
        </div>

        {notice && (
          <div role="status" className="alert alert-success mb-4 shadow-sm">
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div role="alert" className="alert alert-error mb-4 shadow-sm">
            <span>{error}</span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 border-b border-base-300 pb-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`btn btn-sm ${
              filter === "all" ? "btn-primary" : "btn-ghost"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`btn btn-sm ${
              filter === "unread" ? "btn-primary" : "btn-ghost"
            }`}
          >
            Unread ({notifications.filter((n) => !n.read).length})
          </button>
        </div>

        {loading ? (
          <Loader message="Loading notifications..." />
        ) : filtered.length === 0 ? (
          <div className="card bg-base-100 border border-base-300 p-12 text-center shadow-xs">
            <h2 className="text-lg font-bold">No Notifications</h2>
            <p className="text-xs opacity-70 mt-1">
              {filter === "unread"
                ? "You have read all of your notifications."
                : "You don't have any notifications right now."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => (
              <div
                key={n._id}
                className={`card bg-base-100 border border-base-300 shadow-xs transition-colors p-4 flex flex-row items-center justify-between gap-4 ${
                  !n.read ? "border-l-4 border-l-primary bg-primary/5" : "opacity-85"
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{n.message}</p>
                  <span className="text-xs opacity-60 mt-1 block">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>

                {!n.read && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(n._id)}
                    className="btn btn-ghost btn-xs text-primary font-semibold"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
