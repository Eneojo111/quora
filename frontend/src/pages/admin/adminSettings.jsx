
import { useState } from "react";
import {
  User,
  Mail,
  Shield,
  Lock,
  Save,
  Eye,
  EyeOff,
  LogOut,
  Settings as SettingsIcon,
  Info,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import api from "../../services/api";

export default function Settings({ user }) {
  const [profile, setProfile] = useState({
    name: user?.name || "",
    username: user?.username || "",
    email: user?.email || "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // HANDLE PROFILE INPUTS
  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // HANDLE PASSWORD INPUTS
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswords((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // UPDATE ADMIN PROFILE
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    setProfileError("");
    setProfileMessage("");

    if (!profile.name.trim() || !profile.username.trim() || !profile.email.trim()) {
      setProfileError("Please complete all profile fields.");
      return;
    }

    try {
      setSavingProfile(true);

      // This endpoint must exist in your backend.
      await api.put("/users/profile", {
        name: profile.name.trim(),
        username: profile.username.trim(),
        email: profile.email.trim(),
      });

      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update error:", error);

      setProfileError(
        error.response?.data?.message ||
          "Unable to update profile. Check that your backend profile endpoint supports these fields."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // CHANGE ADMIN PASSWORD
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    setPasswordError("");
    setPasswordMessage("");

    if (
      !passwords.currentPassword ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      setPasswordError("Please complete all password fields.");
      return;
    }

    if (passwords.newPassword.length < 8) {
      setPasswordError("Your new password must contain at least 8 characters.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      // This endpoint must exist in your backend.
      await api.put("/auth/change-password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordMessage("Password changed successfully.");
    } catch (error) {
      console.error("Password change error:", error);

      setPasswordError(
        error.response?.data?.message ||
          "Unable to change password. Check that your backend password endpoint exists."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // SIGN OUT
  const handleLogout = () => {
    const confirmed = window.confirm(
      "Are you sure you want to sign out?"
    );

    if (!confirmed) return;

    // Your App.jsx should detect the cleared authentication
    // state and redirect the user to the login page.
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  return (
    <div className="space-y-7 text-white">

      {/* PAGE HEADER */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon size={25} />
          Admin Settings
        </h2>

        <p className="text-gray-400 text-sm mt-1">
          Manage your administrator account and security preferences.
        </p>
      </div>

      {/* ADMIN ACCOUNT INFORMATION */}
      <section className="bg-[#1b1c23] border border-gray-800 rounded-xl p-5 sm:p-6">

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-500/10 rounded-lg">
            <User className="text-red-400" size={22} />
          </div>

          <div>
            <h3 className="font-semibold text-lg">
              Administrator Profile
            </h3>

            <p className="text-gray-400 text-sm">
              Update your account information.
            </p>
          </div>
        </div>

        {profileError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-2">
            <AlertCircle size={17} />
            {profileError}
          </div>
        )}

        {profileMessage && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex gap-2">
            <CheckCircle size={17} />
            {profileMessage}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-5">

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Full Name
            </label>

            <div className="relative">
              <User
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                placeholder="Enter your name"
                className="w-full bg-[#25262e] border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-sm outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Username
            </label>

            <div className="relative">
              <User
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="text"
                name="username"
                value={profile.username}
                onChange={handleProfileChange}
                placeholder="Enter username"
                className="w-full bg-[#25262e] border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-sm outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Email Address
            </label>

            <div className="relative">
              <Mail
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                placeholder="Enter email address"
                className="w-full bg-[#25262e] border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-sm outline-none focus:border-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 px-5 py-3 rounded-lg text-sm font-semibold transition"
          >
            <Save size={17} />
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>

        </form>
      </section>

      {/* PASSWORD SETTINGS */}
      <section className="bg-[#1b1c23] border border-gray-800 rounded-xl p-5 sm:p-6">

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <Lock className="text-blue-400" size={22} />
          </div>

          <div>
            <h3 className="font-semibold text-lg">
              Change Password
            </h3>

            <p className="text-gray-400 text-sm">
              Keep your administrator account secure.
            </p>
          </div>
        </div>

        {passwordError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-2">
            <AlertCircle size={17} />
            {passwordError}
          </div>
        )}

        {passwordMessage && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex gap-2">
            <CheckCircle size={17} />
            {passwordMessage}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-5">

          {[
            {
              name: "currentPassword",
              label: "Current Password",
              placeholder: "Enter current password",
            },
            {
              name: "newPassword",
              label: "New Password",
              placeholder: "Enter new password",
            },
            {
              name: "confirmPassword",
              label: "Confirm New Password",
              placeholder: "Confirm new password",
            },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm text-gray-300 mb-2">
                {field.label}
              </label>

              <div className="relative">
                <input
                  type={showPasswords ? "text" : "password"}
                  name={field.name}
                  value={passwords[field.name]}
                  onChange={handlePasswordChange}
                  placeholder={field.placeholder}
                  className="w-full bg-[#25262e] border border-gray-700 rounded-lg py-3 px-4 pr-12 text-sm outline-none focus:border-red-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPasswords((previous) => !previous)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                >
                  {showPasswords ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={changingPassword}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-3 rounded-lg text-sm font-semibold transition"
          >
            <Shield size={17} />
            {changingPassword ? "Updating..." : "Update Password"}
          </button>

        </form>
      </section>

      {/* PLATFORM INFORMATION */}
      <section className="bg-[#1b1c23] border border-gray-800 rounded-xl p-5 sm:p-6">

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-purple-500/10 rounded-lg">
            <Info className="text-purple-400" size={22} />
          </div>

          <div>
            <h3 className="font-semibold text-lg">
              Platform Information
            </h3>

            <p className="text-gray-400 text-sm">
              Information about your application.
            </p>
          </div>
        </div>

        <div className="space-y-4">

          <div className="flex items-center justify-between gap-3 border-b border-gray-800 pb-3">
            <span className="text-gray-400 text-sm">
              Application
            </span>

            <span className="text-white text-sm font-medium">
              Quora Clone
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-gray-800 pb-3">
            <span className="text-gray-400 text-sm">
              Account Role
            </span>

            <span className="text-red-400 text-sm font-semibold">
              Administrator
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-400 text-sm">
              Platform Version
            </span>

            <span className="text-white text-sm font-medium">
              1.0.0
            </span>
          </div>

        </div>
      </section>

      {/* SIGN OUT */}
      <section className="bg-[#1b1c23] border border-red-500/20 rounded-xl p-5 sm:p-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>
            <h3 className="font-semibold text-lg">
              Sign Out
            </h3>

            <p className="text-gray-400 text-sm mt-1">
              Sign out of your administrator account.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-5 py-3 rounded-lg text-sm font-semibold transition"
          >
            <LogOut size={17} />
            Sign Out
          </button>

        </div>
      </section>

    </div>
  );
}
