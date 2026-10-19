import { useEffect, useRef, useState } from "react";
import {
  FaUserCircle,
  FaChevronRight,
  FaCommentDots,
  FaBookmark,
  FaRegFileAlt,
  FaChartBar,
  FaDollarSign,
  FaBullhorn,
  FaStar,
  FaCog,
  FaQuestionCircle,
  FaLanguage,
} from "react-icons/fa";
import api from "../services/api";

export default function UserMenu({ user, onLogout, onProfile }) {
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") !== "false"
  );

  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  // Build the correct URL for the user's profile picture.
  const profilePictureUrl = user?.profilePicture
    ? user.profilePicture.startsWith("http")
      ? user.profilePicture
      : `${import.meta.env.VITE_API_URL}/api${user.profilePicture.startsWith("/") ? user.profilePicture : `/\${user.profilePicture}`}`

    : "";

  // Reset the fallback whenever the profile picture changes.
  useEffect(() => {
    setImageFailed(false);
  }, [profilePictureUrl]);

  // Close the menu when clicking outside or pressing Escape.
  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Open the user's profile.
  const handleProfile = () => {
    setOpen(false);

    if (onProfile) {
      onProfile();
    } else {
      window.location.assign("/profile");
    }
  };

  // Log out through the backend and clear local credentials.
  const handleLogout = async () => {
    setOpen(false);

    const token = localStorage.getItem("token");

    try {
      if (token) {
        await api.post(
          "/auth/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error(
        "Logout request failed; clearing local credentials.",
        error.response?.data?.message || error.message
      );
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("fashionUser");

      onLogout?.();
    }
  };

  // Toggle and save the dark-mode preference.
  const toggleDarkMode = () => {
    const nextMode = !darkMode;

    setDarkMode(nextMode);
    localStorage.setItem("darkMode", String(nextMode));

    document.documentElement.classList.toggle("dark", nextMode);
  };

  // Placeholder for destinations not yet connected to pages.
  const handlePlaceholder = (label) => {
    setOpen(false);
    console.info(`${label} has not been connected to a page yet.`);
  };

  // Reusable, consistently aligned menu row.
  const MenuItem = ({ icon: Icon, children, onClick }) => (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex h-[50px] w-full shrink-0 items-center gap-3 px-5 text-left text-[16px] leading-none text-[#f1f1f1] transition-colors hover:bg-[#333333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
    >
      <Icon
        className="h-[21px] w-[21px] shrink-0"
        aria-hidden="true"
      />

      <span className="min-w-0 flex-1 whitespace-nowrap">
        {children}
      </span>
    </button>
  );

  return (
    <div ref={menuRef} className="relative inline-flex">
      {/* Profile picture button in the header */}
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open user menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${open
            ? "bg-[#303030]"
            : "bg-transparent hover:bg-[#292929]"
          }`}
      >
        {profilePictureUrl && !imageFailed ? (
          <img
            src={profilePictureUrl}
            alt=""
            className="h-[30px] w-[30px] rounded-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : user?.name ? (
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#777777] text-sm font-semibold text-white">
            {user.name.trim().charAt(0).toUpperCase()}
          </span>
        ) : (
          <FaUserCircle
            className="h-[30px] w-[30px] text-[#999999]"
            aria-hidden="true"
          />
        )}
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          role="menu"
          aria-label="User menu"
          className="absolute right-0 top-full z-[100] mt-[10px] w-[328px] max-w-[calc(100vw-24px)] overflow-y-auto border border-[#353535] bg-[#262626] text-white shadow-xl"
          style={{ maxHeight: "calc(100vh - 80px)" }}
        >
          {/* Profile image, username and arrow */}
          <button
            type="button"
            role="menuitem"
            onClick={handleProfile}
            className="flex min-h-[143px] w-full flex-col items-start justify-center "
          >
            {/* Large profile picture */}
            <div className="mb-3 flex h-[50px] w-[50px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#777777]">
              {profilePictureUrl && !imageFailed ? (
                <img
                  src={profilePictureUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              ) : user?.name ? (
                <span className="text-xl font-semibold text-white">
                  {user.name.trim().charAt(0).toUpperCase()}
                </span>
              ) : (
                <FaUserCircle
                  className="h-10 w-10 text-white"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Username and arrow on the same line */}
            <div className="flex w-full min-w-0 items-center justify-between gap-3">
              <span className="truncate text-[22px] font-bold leading-7">
                {user?.name || user?.username || "Your profile"}

              </span>

              <FaChevronRight
                className="h-[17px] w-[17px] shrink-0 text-[#dddddd]"
                aria-hidden="true"
              />
            </div>
          </button>

          {/* Messages and Bookmarks */}
          <div className="border-b border-[#383838] py-1">
            <MenuItem
              icon={FaCommentDots}
              onClick={() => handlePlaceholder("Messages")}
            >
              Messages
            </MenuItem>

            <MenuItem
              icon={FaBookmark}
              onClick={() => handlePlaceholder("Bookmarks")}
            >
              Bookmarks
            </MenuItem>
          </div>

          {/* Drafts, content and monetization */}
          <div className="border-b border-[#383838] py-1">
            <MenuItem
              icon={FaRegFileAlt}
              onClick={() => handlePlaceholder("Drafts")}
            >
              Drafts
            </MenuItem>

            <MenuItem
              icon={FaChartBar}
              onClick={() => handlePlaceholder("Your content & stats")}
            >
              Your content &amp; stats
            </MenuItem>

            <MenuItem
              icon={FaDollarSign}
              onClick={() => handlePlaceholder("Monetization")}
            >
              Monetization
            </MenuItem>
          </div>

          {/* Create Ad */}
          <div className="border-b border-[#383838] py-1">
            <MenuItem
              icon={FaBullhorn}
              onClick={() => handlePlaceholder("Create Ad")}
            >
              Create Ad
            </MenuItem>
          </div>

          {/* Quora+ */}
          <div className="border-b border-[#383838] py-1">
            <MenuItem
              icon={FaStar}
              onClick={() => handlePlaceholder("Try Quora+")}
            >
              Try Quora+
            </MenuItem>
          </div>

          {/* Dark mode, settings and logout */}
          <div className="px-4 py-2">
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={darkMode}
              onClick={toggleDarkMode}
              className="flex h-[32px] w-full items-center justify-between text-left text-[14px] leading-none text-[#f1f1f1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <span>Dark mode</span>

              <span
                className={`rounded-full px-2 py-[3px] text-[12px] font-semibold ${darkMode
                    ? "bg-[#20365b] text-[#80aaff]"
                    : "bg-[#444444] text-[#dddddd]"
                  }`}
              >
                {darkMode ? "ON" : "OFF"}
              </span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handlePlaceholder("Settings")}
              className="flex h-[32px] w-full items-center text-left text-[14px] leading-none text-[#f1f1f1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <FaCog className="hidden" aria-hidden="true" />
              Settings
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handlePlaceholder("Languages")}
              className="flex h-[32px] w-full items-center text-left text-[14px] leading-none text-[#f1f1f1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <FaLanguage className="hidden" aria-hidden="true" />
              Languages
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handlePlaceholder("Help")}
              className="flex h-[32px] w-full items-center text-left text-[14px] leading-none text-[#f1f1f1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <FaQuestionCircle className="hidden" aria-hidden="true" />
              Help
            </button>

            {/* Logout is the final, visible menu item */}
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex h-[32px] w-full items-center text-left text-[14px] leading-none text-[#f1f1f1] transition-colors hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
