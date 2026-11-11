import { useCallback, useEffect, useState } from "react";
import AdminOverview from "./pages/admin/adminOverview";

import {
  FaHome,
  FaUserPlus,
  FaUsers,
  FaBell,
  FaSearch,
  FaCheck,
  FaCheckDouble,
  FaSyncAlt,
  FaTimes
} from "react-icons/fa";

import { FaRegPenToSquare } from "react-icons/fa6";

import {
  Routes,
  Route,
  Navigate,
  useNavigate
} from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/register";
import Profile from "./pages/profile";
import AdminDashboard from "./pages/admin/adminDashboard";

import PostFeed from "./components/postFeed";
import UserMenu from "./components/userMenu";
import AdminProtectedRoute from "./components/adminProtectedRoute";

import { logoutUser } from "./services/authService";

const NOTIFICATIONS_URL = "/api/notifications";

export default function App() {
  const navigate = useNavigate();

  // Get the saved user when the application starts.
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  // Login and registration page state.
  const [page, setPage] = useState("login");

  // Notification state.
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  // Shared authenticated request helper.
  const notificationRequest = useCallback(
    async (endpoint, options = {}) => {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Your login session has expired. Please log in again."
        );
      }

      const response = await fetch(
        `${NOTIFICATIONS_URL}${endpoint}`,
        {
          ...options,
          headers: {
            Authorization: `Bearer ${token}`,
            ...(options.body
              ? { "Content-Type": "application/json" }
              : {}),
            ...options.headers
          }
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Unable to load notifications."
        );
      }

      return result;
    },
    []
  );

  // Fetch notifications and unread count.
  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError("");

    try {
      const result = await notificationRequest("");

      setNotifications(
        Array.isArray(result.data) ? result.data : []
      );

      setUnreadCount(
        Number.isFinite(result.unreadCount)
          ? result.unreadCount
          : 0
      );
    } catch (error) {
      console.error("Fetch notifications error:", error);
      setNotificationsError(error.message);
    } finally {
      setNotificationsLoading(false);
    }
  }, [notificationRequest]);

  // Refresh the unread notification count.
  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await notificationRequest("/unread-count");

      setUnreadCount(
        Number(result.data?.unreadCount) || 0
      );
    } catch (error) {
      console.error("Fetch unread count error:", error);
    }
  }, [notificationRequest]);

  // Load unread count when a user is logged in.
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user, fetchUnreadCount]);

  // Open or close notifications.
  const handleNotificationsClick = useCallback(() => {
    const nextOpen = !notificationsOpen;

    setNotificationsOpen(nextOpen);

    if (nextOpen) {
      fetchNotifications();
    }
  }, [notificationsOpen, fetchNotifications]);

  // Mark one notification as read.
  const handleMarkAsRead = useCallback(
    async (notificationId) => {
      const notification = notifications.find(
        (item) => item._id === notificationId
      );

      if (!notification || notification.isRead) {
        return;
      }

      setNotifications((current) =>
        current.map((item) =>
          item._id === notificationId
            ? { ...item, isRead: true }
            : item
        )
      );

      setUnreadCount((count) => Math.max(0, count - 1));

      try {
        await notificationRequest(`/${notificationId}/read`, {
          method: "PATCH"
        });
      } catch (error) {
        console.error("Mark notification as read error:", error);

        await fetchNotifications();
        setNotificationsError(error.message);
      }
    },
    [notifications, notificationRequest, fetchNotifications]
  );

  // Mark all notifications as read.
  const handleMarkAllAsRead = useCallback(async () => {
    setNotificationsError("");

    try {
      await notificationRequest("/read-all", {
        method: "PATCH"
      });

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Mark all as read error:", error);
      setNotificationsError(error.message);
    }
  }, [notificationRequest]);

  // Update user information after profile changes.
  const handleProfileUpdated = useCallback((updatedUser) => {
    if (!updatedUser) return;

    setUser(updatedUser);

    try {
      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );
    } catch (error) {
      console.error("Unable to save updated user:", error);
    }
  }, []);

  // Handle successful login.
  const handleLogin = useCallback(
    (loggedInUser) => {
      if (!loggedInUser) return;

      setUser(loggedInUser);
      setPage("login");

      setNotifications([]);
      setUnreadCount(0);
      setNotificationsOpen(false);

      if (loggedInUser.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/feed", { replace: true });
      }
    },
    [navigate]
  );

  // Handle successful registration.
  const handleRegister = useCallback(() => {
    setPage("login");
    navigate("/", { replace: true });
  }, [navigate]);

  // Handle logout.
  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      setUser(null);
      setPage("login");

      setNotifications([]);
      setUnreadCount(0);
      setNotificationsOpen(false);
      setNotificationsError("");

      navigate("/", { replace: true });
    }
  }, [navigate]);

  // Format notification dates.
  const formatNotificationDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  // Navigation header for authenticated users.
  const renderHeader = () => (
    <header className="app-header">
      <div
        className="app-brand"
        onClick={() => navigate(user.role === "admin" ? "/admin" : "/feed")}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            navigate(user.role === "admin" ? "/admin" : "/feed");
          }
        }}
        style={{ cursor: "pointer" }}
      >
        Quora
      </div>

      <button
        type="button"
        title="Home"
        aria-label="Home"
        className="header-icon-button"
        onClick={() => {
          navigate(user.role === "admin" ? "/admin" : "/feed");
          setNotificationsOpen(false);
        }}
      >
        <FaHome className="text-2xl text-red-600" />
      </button>

      <button
        type="button"
        title="Discover people"
        aria-label="Discover people"
        className="header-icon-button"
        onClick={() =>
          alert("Discover people will be implemented in a later step.")
        }
      >
        <FaUserPlus className="text-2xl text-white" />
      </button>

      <button
        type="button"
        title="Write"
        aria-label="Write"
        className="header-icon-button"
        onClick={() => {
          navigate("/feed");
          setNotificationsOpen(false);
        }}
      >
        <FaRegPenToSquare className="text-2xl text-white" />
      </button>

      <button
        type="button"
        title="Communities"
        aria-label="Communities"
        className="header-icon-button"
        onClick={() =>
          alert("Communities will be implemented in a later step.")
        }
      >
        <FaUsers className="text-2xl text-white" />
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          type="button"
          title="Notifications"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          aria-expanded={notificationsOpen}
          className="header-icon-button relative"
          onClick={handleNotificationsClick}
        >
          <FaBell className="text-2xl text-white" />

          {unreadCount > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white"
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {notificationsOpen && (
          <div
            className="absolute right-0 top-full z-50 mt-3 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-xl border border-gray-700 bg-[#202127] text-white shadow-2xl"
            role="region"
            aria-label="Notifications panel"
          >
            <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
              <div>
                <h2 className="text-lg font-semibold">
                  Notifications
                </h2>

                <p className="text-xs text-gray-400">
                  {unreadCount} unread
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  title="Refresh notifications"
                  aria-label="Refresh notifications"
                  className="text-gray-300 hover:text-white"
                  onClick={fetchNotifications}
                >
                  <FaSyncAlt />
                </button>

                <button
                  type="button"
                  title="Close notifications"
                  aria-label="Close notifications"
                  className="text-gray-300 hover:text-white"
                  onClick={() => setNotificationsOpen(false)}
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {notifications.some((item) => !item.isRead) && (
              <div className="border-b border-gray-700 px-4 py-2 text-right">
                <button
                  type="button"
                  className="text-sm text-red-400 hover:text-red-300"
                  onClick={handleMarkAllAsRead}
                >
                  <FaCheckDouble className="mr-1 inline" />
                  Mark all as read
                </button>
              </div>
            )}

            {notificationsError && (
              <div className="m-3 rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-300">
                <p>{notificationsError}</p>

                <button
                  type="button"
                  className="mt-2 underline"
                  onClick={fetchNotifications}
                >
                  Try again
                </button>
              </div>
            )}

            {notificationsLoading && (
              <div className="p-6 text-center text-sm text-gray-300">
                Loading notifications...
              </div>
            )}

            {!notificationsLoading &&
              !notificationsError &&
              notifications.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <FaBell className="mx-auto mb-3 text-3xl text-gray-500" />

                  <p className="font-medium">
                    You're all caught up
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    New notifications will appear here.
                  </p>
                </div>
              )}

            {!notificationsLoading &&
              notifications.length > 0 && (
                <div className="max-h-[420px] overflow-y-auto">
                  {notifications.map((notification) => {
                    const actorName =
                      notification.actor?.name ||
                      notification.actor?.username ||
                      "Someone";

                    return (
                      <button
                        type="button"
                        key={notification._id}
                        className={`flex w-full items-start gap-3 border-b border-gray-700/70 px-4 py-4 text-left transition hover:bg-white/5 ${notification.isRead
                            ? "bg-transparent"
                            : "bg-red-950/20"
                          }`}
                        onClick={() =>
                          handleMarkAsRead(notification._id)
                        }
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-700 font-semibold">
                          {notification.actor?.profilePicture ? (
                            <img
                              src={notification.actor.profilePicture}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            actorName.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm text-gray-100">
                            <span className="font-semibold">
                              {actorName}
                            </span>{" "}
                            {notification.message}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {formatNotificationDate(notification.createdAt)}
                          </p>
                        </div>

                        <div className="mt-1 shrink-0">
                          {notification.isRead ? (
                            <FaCheck
                              className="text-sm text-gray-500"
                              title="Read"
                            />
                          ) : (
                            <span
                              className="block h-2.5 w-2.5 rounded-full bg-red-500"
                              title="Unread"
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

            {!notificationsLoading &&
              notifications.length > 0 && (
                <div className="border-t border-gray-700 px-4 py-3 text-center">
                  <button
                    type="button"
                    className="text-sm text-gray-300 hover:text-white"
                    onClick={fetchNotifications}
                  >
                    Refresh notifications
                  </button>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative w-70">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />

        <input
          className="w-full border border-gray-600 bg-[#16171d] py-1 pl-9 pr-2 text-white outline-none placeholder-gray-400"
          type="search"
          placeholder="Search Quora"
          aria-label="Search Quora"
        />
      </div>

      {/* User menu */}
      <div className="app-user">
        <UserMenu
          user={user}
          onProfile={() => {
            setNotificationsOpen(false);
            navigate("/profile");
          }}
          onLogout={handleLogout}
        />
      </div>

      <button
        type="button"
        className="h-8 cursor-pointer rounded-full bg-red-500 px-4 text-white"
        onClick={() => {
          setNotificationsOpen(false);
          navigate("/feed");
        }}
      >
        Add Question
      </button>
    </header>
  );

  return (
    <div className="app-container">

      {/* Show header only after login */}
      {user && renderHeader()}

      <main>
        <Routes>

          {/* Login page */}
          <Route
            path="/"
            element={
              user ? (
                <Navigate
                  to={user.role === "admin" ? "/admin" : "/feed"}
                  replace
                />
              ) : page === "register" ? (
                <Register
                  onRegister={handleRegister}
                  onSwitchToLogin={() => setPage("login")}
                />
              ) : (
                <Login
                  onLogin={handleLogin}
                  onSwitchToRegister={() => setPage("register")}
                />
              )
            }
          />

          {/* Registration page */}
          <Route
            path="/register"
            element={
              user ? (
                <Navigate
                  to={user.role === "admin" ? "/admin" : "/feed"}
                  replace
                />
              ) : (
                <Register
                  onRegister={handleRegister}
                  onSwitchToLogin={() => {
                    setPage("login");
                    navigate("/");
                  }}
                />
              )
            }
          />

          {/* Regular user feed */}
          <Route
            path="/feed"
            element={
              user ? (
                <PostFeed user={user} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* User profile */}
          <Route
            path="/profile"
            element={
              user ? (
                <Profile
                  onBack={() => navigate("/feed")}
                  onProfileUpdated={handleProfileUpdated}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Admin-only routes */}
          <Route element={<AdminProtectedRoute user={user} />}>
            <Route
              path="/admin"
              element={<AdminDashboard user={user} />}
            >
              <Route index element={<AdminOverview />} />
            </Route>
          </Route>

          {/* Unknown routes */}
          <Route
            path="*"
            element={
              <Navigate
                to={
                  user
                    ? user.role === "admin"
                      ? "/admin"
                      : "/feed"
                    : "/"
                }
                replace
              />
            }
          />

        </Routes>
      </main>
    </div>
  );
}













