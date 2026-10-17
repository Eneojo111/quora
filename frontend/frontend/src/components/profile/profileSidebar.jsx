import { Briefcase, Calendar, GraduationCap, MapPin, Pencil } from "lucide-react";

function joinedLabel(date) {
  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function Mailbox() {
  return (
    <svg
      viewBox="0 0 140 130"
      width="140"
      height="130"
      fill="none"
      stroke="#9a9a9a"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M78 74v50" />
      <path d="M62 124h32" />
      <path d="M30 84c0-20 13-36 32-36h40v36H30z" />
      <path d="M30 84h72" />
      <circle cx="52" cy="66" r="9" />
      <path d="M102 48V28h22v20" />
      <path d="M102 28h22" />
    </svg>
  );
}

export default function ProfileSidebar({ user }) {
  const joined = joinedLabel(user.createdAt);

  return (
    <aside className="pf-sidebar" aria-label="Profile details">
      <section>
        <div className="pf-side-heading">
          <h2>Credentials &amp; Highlights</h2>
          <button
            type="button"
            className="pf-circle-btn"
            aria-label="Edit credentials"
            title="Coming soon"
          >
            <Pencil size={16} />
          </button>
        </div>

        <ul className="pf-side-list">
          <li>
            <Briefcase size={24} />
            <button type="button" className="pf-link">
              Add employment credential
            </button>
          </li>
          <li>
            <GraduationCap size={24} />
            <button type="button" className="pf-link">
              Add education credential
            </button>
          </li>
          <li>
            <MapPin size={24} />
            <button type="button" className="pf-link">
              Add location credential
            </button>
          </li>
          {joined && (
            <li>
              <Calendar size={24} />
              <span>Joined {joined}</span>
            </li>
          )}
        </ul>
      </section>

      <section>
        <div className="pf-side-heading">
          <h2>Knows about</h2>
          <button
            type="button"
            className="pf-circle-btn"
            aria-label="Edit topics"
            title="Coming soon"
          >
            <Pencil size={16} />
          </button>
        </div>

        <div className="pf-topics-empty">
          <Mailbox />
          <p>You haven't added any topics yet.</p>
          <button type="button" className="pf-outline-btn">
            Add topics
          </button>
        </div>
      </section>
    </aside>
  );
}