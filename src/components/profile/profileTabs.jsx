export default function ProfileTabs({ postCount, followersCount }) {
  const tabs = [
    "Profile",
    "0 Answers",
    "0 Questions",
    `${postCount} ${postCount === 1 ? "Post" : "Posts"}`,
    `${followersCount} Followers`,
    "Following",
    "Edits",
    "Activity",
  ];

  return (
    <nav className="pf-tabs" aria-label="Profile sections">
      {tabs.map((label, index) => (
        <button
          key={label}
          type="button"
          className={`pf-tab ${index === 0 ? "is-active" : ""}`}
          aria-current={index === 0 ? "page" : undefined}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}