import { useRef, useState } from "react";
import { Check, Forward, Pencil } from "lucide-react";
import { assetUrl, errorMessage } from "../../services/profile.Services";
import BioInput from "./bioInput";

function AvatarEditor({ user, onUpload }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState("");
  const [broken, setBroken] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const src = preview || (broken ? "" : assetUrl(user.profilePicture));
  const initial = (user.name || user.username || "?")
    .charAt(0)
    .toUpperCase();

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5MB or smaller");
      return;
    }

    const local = URL.createObjectURL(file);
    setPreview(local);
    setError("");
    setUploading(true);

    try {
      await onUpload(file);
      setBroken(false);
    } catch (err) {
      setError(errorMessage(err, "Couldn't update your picture"));
    } finally {
      setPreview("");
      URL.revokeObjectURL(local);
      setUploading(false);
    }
  };

  return (
    <div className="pf-avatar-wrap">
      <button
        type="button"
        className="pf-avatar"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="Change profile picture"
      >
        {src ? (
          <img
            src={src}
            alt={`${user.name || "Your"} profile`}
            onError={() => setBroken(true)}
          />
        ) : (
          <span className="pf-avatar-fallback">{initial}</span>
        )}

        <span
          className={`pf-avatar-overlay ${uploading ? "is-visible" : ""}`}
        >
          {uploading ? (
            <span className="pf-avatar-uploading">Uploading...</span>
          ) : (
            <Pencil size={30} />
          )}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="pf-hidden"
        onChange={handleFile}
      />

      {error && (
        <p className="pf-avatar-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function EditableName({ name, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState("");
  const savingRef = useRef(false);

  const cancel = () => {
    setEditing(false);
    setValue(name);
    setError("");
  };

  const save = async () => {
    if (savingRef.current) return;

    const trimmed = value.trim();

    if (trimmed === name) return cancel();

    if (trimmed.length < 2 || trimmed.length > 50) {
      setError("Name must be between 2 and 50 characters");
      return;
    }

    savingRef.current = true;

    try {
      await onSave(trimmed);
      setEditing(false);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Couldn't save your name"));
    } finally {
      savingRef.current = false;
    }
  };

  if (!editing) {
    return (
      <div className="pf-name-row">
        <h1 className="pf-name">{name}</h1>
        <button
          type="button"
          className="pf-name-edit"
          onClick={() => {
            setValue(name);
            setEditing(true);
          }}
          aria-label="Edit name"
        >
          <Pencil size={18} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="pf-name-row">
        <input
          className="pf-name-input"
          value={value}
          maxLength={50}
          autoFocus
          aria-label="Name"
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
            if (event.key === "Escape") cancel();
          }}
          onBlur={() => {
            if (!savingRef.current) cancel();
          }}
        />
        <button
          type="button"
          className="pf-name-edit is-visible"
          aria-label="Save name"
          onMouseDown={(event) => event.preventDefault()}
          onClick={save}
        >
          <Check size={18} />
        </button>
      </div>

      {error && (
        <p className="pf-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ProfileHeader({
  user,
  onSaveName,
  onSaveBio,
  onUploadAvatar,
}) {
  const [copied, setCopied] = useState(false);

  const followers = user.followers?.length ?? 0;
  const following = user.following?.length ?? 0;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be blocked; nothing else to do.
    }
  };

  return (
    <section className="pf-header-block">
      <div className="pf-header">
        <AvatarEditor user={user} onUpload={onUploadAvatar} />

        <div className="pf-header-info ">
          <EditableName name={user.name} onSave={onSaveName} />

          <p className="pf-credential ">Add profile credential</p>

          <p className="pf-follow-line">
            {followers} followers · {following} following
          </p>
        </div>

        <button
          type="button"
          className="pf-share"
          onClick={handleShare}
          aria-label="Copy profile link"
          title={copied ? "Link copied" : "Copy profile link"}
        >
          {copied ? <Check size={20} /> : <Forward size={20} />}
        </button>
      </div>

      <BioInput bio={user.bio} onSave={onSaveBio} />
    </section>
  );
}
