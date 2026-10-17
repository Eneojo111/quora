import { useCallback, useEffect, useState } from "react";
import quoraLogo from "./assets/quoralogo.png";

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

import Login from "./pages/login";
import Register from "./pages/register";
import Profile from "./pages/profile";
import PostFeed from "./components/postFeed";
import UserMenu from "./components/userMenu";
import { logoutUser } from "./services/authService";

import "./index.css";

const NOTIFICATIONS_URL = "/api/notifications";

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [page, setPage] = useState("login");
  const [activePage, setActivePage] = useState("feed");

  // Notification state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] =
    useState(false);
  const [notificationsError, setNotificationsError] =
    useState("");

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

  // Fetch notifications and the unread count.
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

  // Refresh the bell's unread badge.
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

  // Load the unread count when a user is logged in.
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user, fetchUnreadCount]);

  // Open and refresh the notification panel.
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

      // Update the interface immediately.
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

        // Restore the accurate state if the request fails.
        await fetchNotifications();
        setNotificationsError(error.message);
      }
    },
    [notifications, notificationRequest, fetchNotifications]
  );

  // Mark every notification as read.
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

  // Stable callback prevents repeated profile loading.
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

  const handleLogin = useCallback((loggedInUser) => {
    setUser(loggedInUser);
    setPage("login");
    setActivePage("feed");
  }, []);

  const handleRegister = useCallback(() => {
    setPage("login");
  }, []);

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
      setActivePage("feed");

      setNotifications([]);
      setUnreadCount(0);
      setNotificationsOpen(false);
    }
  }, []);

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

  if (!user && page === "register") {
    return (
      <Register
        onRegister={handleRegister}
        onSwitchToLogin={() => setPage("login")}
      />
    );
  }

  if (!user) {
    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setPage("register")}
      />
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div
          className="app-brand"
          onClick={() => setActivePage("feed")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              setActivePage("feed");
            }
          }}
          style={{ cursor: "pointer" }}
        >
          Quora
          {/* return < img src={quoraLogo} alt="Logo" className="h-15 w-15 bg-black" />; */}
        </div>

        <button
          type="button"
          title="Home"
          aria-label="Home"
          className="header-icon-button"
          onClick={() => {
            setActivePage("feed");
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
            alert(
              "Discover people will be implemented in a later step."
            )
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
            setActivePage("feed");
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
            alert(
              "Communities will be implemented in a later step."
            )
          }
        >
          <FaUsers className="text-2xl text-white" />
        </button>

        {/* Notifications bell and dropdown */}
        <div className="relative">
          <button
            type="button"
            title="Notifications"
            aria-label={`Notifications${
              unreadCount ? `, ${unreadCount} unread` : ""
            }`}
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
              {/* Panel header */}
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

              {/* Mark all read */}
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

              {/* Error message */}
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

              {/* Loading state */}
              {notificationsLoading && (
                <div className="p-6 text-center text-sm text-gray-300">
                  Loading notifications...
                </div>
              )}

              {/* Notification list */}
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
                          className={`flex w-full items-start gap-3 border-b border-gray-700/70 px-4 py-4 text-left transition hover:bg-white/5 ${
                            notification.isRead
                              ? "bg-transparent"
                              : "bg-red-950/20"
                          }`}
                          onClick={() =>
                            handleMarkAsRead(notification._id)
                          }
                        >
                          {/* Actor avatar */}
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-700 font-semibold">
                            {notification.actor?.profilePicture ? (
                              <img
                                src={
                                  notification.actor.profilePicture
                                }
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              actorName.charAt(0).toUpperCase()
                            )}
                          </div>

                          {/* Notification content */}
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm text-gray-100">
                              <span className="font-semibold">
                                {actorName}
                              </span>{" "}
                              {notification.message}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {formatNotificationDate(
                                notification.createdAt
                              )}
                            </p>
                          </div>

                          {/* Read/unread indicator */}
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

              {/* Footer */}
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

        <div className="relative w-70">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />

          <input
            className="w-full border border-gray-600 bg-[#16171d] py-1 pl-9 pr-2 text-white outline-none placeholder-gray-400"
            type="search"
            placeholder="Search Quora"
            aria-label="Search Quora"
          />
        </div>

        <div className="app-user">
          <UserMenu
            user={user}
            onProfile={() => {
              setNotificationsOpen(false);
              setActivePage("profile");
            }}
            onLogout={handleLogout}
          />
        </div>

        <button
          type="button"
          className="h-8 cursor-pointer rounded-full bg-red-500 px-4 text-white"
          onClick={() => {
            setNotificationsOpen(false);
            setActivePage("feed");
          }}
        >
          Add Question
        </button>
      </header>

      <main>
        {activePage === "profile" ? (
          <Profile
            onBack={() => setActivePage("feed")}
            onProfileUpdated={handleProfileUpdated}
          />
        ) : (
          <PostFeed user={user} />
        )}
      </main>
    </div>
  );
}












