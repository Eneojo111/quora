import { useCallback, useEffect, useState } from "react";

import {
  getMyFollowers,
  getMyFollowing,
  unfollowUser
} from "../../services/userService.js";

export default function FollowSection() {
  const [activeTab, setActiveTab] = useState("followers");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unfollowingId, setUnfollowingId] = useState(null);

  const loadRelationships = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [followersData, followingData] = await Promise.all([
        getMyFollowers(),
        getMyFollowing()
      ]);

      setFollowers(
        Array.isArray(followersData) ? followersData : []
      );

      setFollowing(
        Array.isArray(followingData) ? followingData : []
      );
    } catch (err) {
      console.error("Load followers/following error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load your followers and following."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRelationships();
  }, [loadRelationships]);

  const handleUnfollow = async (person) => {
    const personId = person?._id;

    if (!personId || unfollowingId) {
      return;
    }

    setUnfollowingId(personId);
    setError("");

    try {
      await unfollowUser(personId);

      setFollowing((current) =>
        current.filter(
          (item) => item._id.toString() !== personId.toString()
        )
      );

      // Remove the current user from this person's followers
      // list if that person is also displayed in this section.
    //   setFollowers((current) =>
    //     current.filter(
    //       (item) => item._id.toString() !== personId.toString()
    //     )
    //   );
    } catch (err) {
      console.error("Unfollow error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to unfollow this user."
      );
    } finally {
      setUnfollowingId(null);
    }
  };

  const people =
    activeTab === "followers" ? followers : following;

  return (
    <section className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
      <div className="border-b border-neutral-800 p-5">
        <h2 className="text-lg font-semibold">
          Followers and Following
        </h2>

        <p className="mt-1 text-sm text-gray-400">
          See who's connected to you on Quora.
        </p>
      </div>

      <div
        className="flex border-b border-neutral-800"
        role="tablist"
        aria-label="Followers and following"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "followers"}
          onClick={() => setActiveTab("followers")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition ${
            activeTab === "followers"
              ? "border-b-2 border-red-500 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Followers ({followers.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "following"}
          onClick={() => setActiveTab("following")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition ${
            activeTab === "following"
              ? "border-b-2 border-red-500 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Following ({following.length})
        </button>
      </div>

      {error && (
        <div className="m-4 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
          <p>{error}</p>

          <button
            type="button"
            onClick={loadRelationships}
            className="mt-2 font-medium underline"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4 p-5">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex animate-pulse items-center gap-3"
            >
              <div className="h-12 w-12 rounded-full bg-neutral-800" />

              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-neutral-800" />
                <div className="h-3 w-24 rounded bg-neutral-800" />
              </div>
            </div>
          ))}
        </div>
      ) : people.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="font-medium text-white">
            {activeTab === "followers"
              ? "No followers yet"
              : "You're not following anyone yet"}
          </p>

          <p className="mt-2 text-sm text-gray-400">
            {activeTab === "followers"
              ? "When people follow you, they'll appear here."
              : "People you follow will appear here."}
          </p>
        </div>
      ) : (
        <div>
          {people.map((person) => {
            const isUnfollowing =
              unfollowingId === person._id;

            return (
              <div
                key={person._id}
                className="flex items-center gap-3 border-b border-neutral-800 p-4 last:border-b-0"
              >
                {person.profilePicture ? (
                  <img
                    src={person.profilePicture}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-full border border-neutral-700 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-lg font-semibold text-white">
                    {(person.name || person.username || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">
                    {person.name || person.username}
                  </p>

                  <p className="truncate text-sm text-gray-400">
                    @{person.username}
                  </p>

                  {person.bio && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-400">
                      {person.bio}
                    </p>
                  )}
                </div>

                {activeTab === "following" && (
                  <button
                    type="button"
                    disabled={Boolean(unfollowingId)}
                    onClick={() => handleUnfollow(person)}
                    className="shrink-0 rounded-full border border-neutral-600 px-3 py-1.5 text-sm text-white transition hover:border-red-500 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUnfollowing ? "Removing..." : "Unfollow"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-neutral-800 px-5 py-3 text-right">
        <button
          type="button"
          onClick={loadRelationships}
          disabled={loading}
          className="text-sm text-gray-400 hover:text-white disabled:opacity-50"
        >
          Refresh list
        </button>
      </div>
    </section>
  );
}
