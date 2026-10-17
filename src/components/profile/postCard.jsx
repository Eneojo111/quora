import { useState } from "react";
import { assetUrl } from "../../services/profile.Services";

const PREVIEW_LENGTH = 100;

// 18h, Mon, Sep 30, Sep 30 2025
function formatPostDate(date) {
  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "";

  const diff = Date.now() - d.getTime();
  const hour = 3600000;
  const day = 24 * hour;

  if (diff < 60000) return "Just now";
  if (diff < hour) return `${Math.floor(diff / 60000)}m`;
  if (diff < day) return `${Math.floor(diff / hour)}h`;

  if (diff < 7 * day) {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }

  const sameYear = d.getFullYear() === new Date().getFullYear();

  return d.toLocaleDateString(
    "en-US",
    sameYear
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" }
  );
}

export default function ProfilePostCard({ post, user }) {
  const [expanded, setExpanded] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);

  // Use the post's author when it came populated, otherwise the profile owner.
  const author = post.author?.name ? post.author : user;
  const avatar = avatarBroken ? "" : assetUrl(author.profilePicture);
  const initial = (author.name || author.username || "?")
    .charAt(0)
    .toUpperCase();

  const content = post.content || "";
  const isLong = content.length > PREVIEW_LENGTH;
  const text =
    isLong && !expanded
      ? `${content.slice(0, PREVIEW_LENGTH).trimEnd()} ...`
      : content;

  const images = Array.isArray(post.images) ? post.images : [];

  return (
    <article className="pf-post">
      <header className="pf-post-header">
        {avatar ? (
          <img
            className="pf-post-avatar"
            src={avatar}
            alt=""
            onError={() => setAvatarBroken(true)}
          />
        ) : (
          <span className="pf-post-avatar pf-avatar-fallback">
            {initial}
          </span>
        )}

        <div className="pf-post-author">
          <strong>{author.name || author.username}</strong>
          <time dateTime={post.createdAt || undefined}>
            {formatPostDate(post.createdAt)}
          </time>
        </div>
      </header>

      {content && (
        <div className="pf-post-text">
          <p>{text}</p>

          {isLong && (
            <button
              type="button"
              className="pf-more"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "(less)" : "(more)"}
            </button>
          )}
        </div>
      )}

      {images.length > 0 && (
        <div
          className={`pf-post-images ${
            images.length > 1 ? "is-grid" : ""
          }`}
        >
          {images.map((image, index) => (
            <img
              key={`${post._id}-${index}`}
              src={assetUrl(image)}
              alt={`Post attachment ${index + 1}`}
              loading="lazy"
            />
          ))}
        </div>
      )}
    </article>
  );
}
