
import { useEffect, useRef, useState } from "react";
import { FiEdit2, FiCheck, FiX } from "react-icons/fi";
import { updateMyProfile } from "../../services/profile.Services.js";

export default function EditableUsername({ username, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(username || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(username || "");
  }, [username]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const cancel = () => {
    setValue(username || "");
    setError("");
    setEditing(false);
  };

  const save = async () => {
    const nextUsername = value.trim().toLowerCase();

    if (nextUsername.length < 3 || nextUsername.length > 30) {
      setError("Username must be 3–30 characters.");
      return;
    }

    if (nextUsername === username) {
      setEditing(false);
      setError("");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updatedUser = await updateMyProfile({
        username: nextUsername
      });

      onSaved?.(updatedUser);
      setEditing(false);
    } catch (err) {
      setError(
        err.response?.status === 409
          ? "That username is already taken."
          : err.response?.data?.message || "Unable to update username."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="group flex min-w-0 items-center gap-2">
        <h1 className="break-words text-2xl font-bold text-white sm:text-3xl">
          {username || "User"}
        </h1>

        <button
          type="button"
          aria-label="Edit username"
          onClick={() => setEditing(true)}
          className="rounded-full p-2 text-gray-400 opacity-100 hover:bg-gray-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <FiEdit2 />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <input
          ref={inputRef}
          aria-label="Username"
          value={value}
          minLength={3}
          maxLength={30}
          disabled={saving}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              cancel();
            }
          }}
          className="min-w-0 flex-1 rounded-lg border border-gray-600 bg-[#16171d] px-3 py-2 text-white outline-none focus:border-red-600 focus-visible:ring-2 focus-visible:ring-red-500"
        />

        <button
          type="submit"
          aria-label="Save username"
          disabled={saving}
          className="rounded-full p-2 text-green-400 hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <FiCheck />
        </button>

        <button
          type="button"
          aria-label="Cancel username edit"
          onClick={cancel}
          className="rounded-full p-2 text-gray-300 hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
        >
          <FiX />
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
