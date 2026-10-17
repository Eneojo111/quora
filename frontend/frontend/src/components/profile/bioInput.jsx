import { useRef, useState } from "react";
import { errorMessage } from "../../services/profile.Services";

export default function BioInput({ bio, onSave }) {
  const [value, setValue] = useState(bio || "");
  const [state, setState] = useState("idle"); // idle | saving | saved | error
  const [message, setMessage] = useState("");
  const lastSaved = useRef(bio || "");

  const handleBlur = async () => {
    const trimmed = value.trim();

    if (trimmed === lastSaved.current) return;

    setState("saving");
    setMessage("Saving...");

    try {
      await onSave(trimmed);
      lastSaved.current = trimmed;
      setValue(trimmed);
      setState("saved");
      setMessage("Saved");
    } catch (err) {
      setState("error");
      setMessage(errorMessage(err, "Couldn't save. Try again."));
    }
  };

  return (
    <div className="pf-bio">
      <label htmlFor="pf-bio-input" className="pf-hidden">
        Short description
      </label>

      <input
        id="pf-bio-input"
        type="text"
        value={value}
        maxLength={160}
        placeholder="Write a short description about yourself"
        onChange={(event) => {
          setValue(event.target.value);
          if (state !== "idle") {
            setState("idle");
            setMessage("");
          }
        }}
        onBlur={handleBlur}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />

      <div className="pf-bio-meta">
        <span
          aria-live="polite"
          className={state === "error" ? "is-error" : ""}
        >
          {message}
        </span>
        {value.length > 0 && <span>{value.length}/160</span>}
      </div>
    </div>
  );
}
