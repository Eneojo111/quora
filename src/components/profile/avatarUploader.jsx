
import { useEffect, useRef, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import { uploadMyAvatar } from "../../services/profile.Services.js";

const API_ORIGIN = "http://localhost:5000";

export default function AvatarUploader({ user, onUploaded }) {
  const inputRef = useRef(null);
  const previewUrlRef = useRef(null);

  const [preview, setPreview] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const storedImage = user?.profilePicture
    ? `${API_ORIGIN}${user.profilePicture}`
    : "";

  useEffect(() => {
    setPreview("");
    setImageFailed(false);
  }, [storedImage]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    // Allow the same file to be selected again.
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("The image must be 5 MB or smaller.");
      return;
    }

    setError("");

    const previousPreview = previewUrlRef.current;
    const localUrl = URL.createObjectURL(file);

    previewUrlRef.current = localUrl;
    setPreview(localUrl);
    setImageFailed(false);
    setUploading(true);

    try {
      const updatedUser = await uploadMyAvatar(file);

      setPreview("");

      if (previewUrlRef.current === localUrl) {
        URL.revokeObjectURL(localUrl);
        previewUrlRef.current = null;
      }

      onUploaded?.(updatedUser);
    } catch (err) {
      setPreview("");

      if (previewUrlRef.current === localUrl) {
        URL.revokeObjectURL(localUrl);
        previewUrlRef.current = previousPreview;
      }

      setImageFailed(false);
      setError(
        err.response?.data?.message ||
          "Unable to upload your profile picture."
      );
    } finally {
      setUploading(false);
    }
  };

  const imageSource = preview || (!imageFailed ? storedImage : "");

  return (
    <div className="shrink-0">
      <div className="group relative h-28 w-28">
        <div className="h-28 w-28 overflow-hidden rounded-full border border-gray-600 bg-gray-800">
          {imageSource ? (
            <img
              src={imageSource}
              alt={`${user?.name || "User"} profile`}
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              {user?.name ? (
                <span className="text-4xl font-semibold">
                  {user.name.trim().charAt(0).toUpperCase()}
                </span>
              ) : (
                <FaUserCircle className="h-20 w-20" />
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label="Change profile picture"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition group-hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:opacity-0"
        >
          {uploading ? (
            <span className="text-xs">Uploading...</span>
          ) : (
            <FiEdit2 className="h-6 w-6" />
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          aria-label="Select a profile picture"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {error && (
        <p role="alert" className="mt-2 max-w-40 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
