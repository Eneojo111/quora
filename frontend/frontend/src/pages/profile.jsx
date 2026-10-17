
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getMyProfile,
  getMyPosts,
} from "../services/profile.Services.js";
import FollowSection from "../components/profile/followSection";
import ProfileHeader from "../components/profile/profileHeader";
import BioInput from "../components/profile/bioInput";
import PostSearch from "../components/profile/postSearch";
import PostList from "../components/profile/postList";

export default function Profile({ onBack, onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);

  const [error, setError] = useState("");
  const [postsError, setPostsError] = useState("");

  // Keep profile data synchronized with localStorage and App.jsx.
  const syncProfile = useCallback(
    (updatedProfile) => {
      if (
        !updatedProfile ||
        typeof updatedProfile !== "object" ||
        Array.isArray(updatedProfile)
      ) {
        return;
      }

      setProfile((currentProfile) => ({
        ...(currentProfile || {}),
        ...updatedProfile,
      }));

      let updatedUser = updatedProfile;

      try {
        const storedUser = JSON.parse(
          localStorage.getItem("user") || "{}"
        );

        updatedUser = {
          ...storedUser,
          ...updatedProfile,
          id:
            updatedProfile._id ||
            updatedProfile.id ||
            storedUser.id ||
            storedUser._id,
        };

        delete updatedUser.password;

        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );
      } catch (storageError) {
        console.error(
          "Unable to synchronize profile:",
          storageError
        );
      }

      onProfileUpdated?.(updatedUser);
    },
    [onProfileUpdated]
  );

  // Load the current user's profile.
  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getMyProfile();

      const userData =
        result?.data?.data ??
        result?.data ??
        result;

      if (
        !userData ||
        typeof userData !== "object" ||
        Array.isArray(userData)
      ) {
        throw new Error(
          "The server returned invalid profile data."
        );
      }

      syncProfile(userData);
    } catch (err) {
      console.error("Profile loading failed:", err);

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load your profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [syncProfile]);

  // Load posts belonging to the current user.
  const loadPosts = useCallback(async (userId) => {
    if (!userId) {
      setPosts([]);
      setPostsError(
        "Unable to identify your account to load posts."
      );
      setPostsLoading(false);
      return;
    }

    setPostsLoading(true);
    setPostsError("");

    try {
      const result = await getMyPosts(userId);

      const userPosts = Array.isArray(result)
        ? result
        : Array.isArray(result?.data?.data)
          ? result.data.data
          : Array.isArray(result?.data?.posts)
            ? result.data.posts
            : Array.isArray(result?.data)
              ? result.data
              : Array.isArray(result?.posts)
                ? result.posts
                : null;

      if (!userPosts) {
        throw new Error(
          "The server returned an invalid posts list."
        );
      }

      const sortedPosts = [...userPosts].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );

      setPosts(sortedPosts);
    } catch (err) {
      console.error("Posts loading failed:", err);

      setPosts([]);
      setPostsError(
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load your posts."
      );
    } finally {
      setPostsLoading(false);
    }
  }, []);

  // Load the profile on mount.
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const userId = profile?._id || profile?.id;

  // Load posts once the profile provides a user ID.
  useEffect(() => {
    if (userId) {
      loadPosts(userId);
    }
  }, [userId, loadPosts]);

  // Filter posts by their text content.
  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return posts;
    }

    return posts.filter((post) =>
      (post.content || "").toLowerCase().includes(query)
    );
  }, [posts, search]);

  // Update the profile after saving the bio.
  const handleBioSaved = useCallback(
    (bio) => {
      if (!profile) return;

      syncProfile({
        ...profile,
        bio,
      });
    },
    [profile, syncProfile]
  );

  const handleRetryProfile = useCallback(() => {
    loadProfile();
  }, [loadProfile]);

  const handleRetryPosts = useCallback(() => {
    if (userId) {
      loadPosts(userId);
    }
  }, [userId, loadPosts]);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white">
        <div className="mx-auto max-w-3xl animate-pulse space-y-6">
          <div className="h-8 w-40 rounded bg-neutral-800" />

          <div className="rounded-xl border border-neutral-800 p-6">
            <div className="mb-4 h-20 w-20 rounded-full bg-neutral-800" />
            <div className="mb-3 h-5 w-48 rounded bg-neutral-800" />
            <div className="h-4 w-64 max-w-full rounded bg-neutral-800" />
          </div>

          <div className="h-24 rounded-xl bg-neutral-900" />
          <div className="h-32 rounded-xl bg-neutral-900" />
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white">
        <div className="mx-auto max-w-3xl rounded-xl border border-neutral-800 p-6">
          {/* {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-5 text-sm text-gray-300 hover:text-white"
            >
              ← Back to feed
            </button>
          )} */}

          <h1 className="mb-2 text-xl font-semibold">
            Unable to load profile
          </h1>

          <p className="mb-5 text-sm text-red-400">
            {error || "Your profile could not be found."}
          </p>

          <button
            type="button"
            onClick={handleRetryProfile}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-300 transition hover:text-white"
          >
            ← Back to feed
          </button>
        )} */}

        <ProfileHeader
          user={profile}
          onProfileUpdated={syncProfile}
        />

        {/* <FollowSection /> */}

        {/* <BioInput
          bio={profile.bio || ""}
          onSaved={handleBioSaved}
        /> */}

        <PostSearch
          value={search}
          onChange={setSearch}
        />

        <section
          aria-label="Your posts"
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Posts</h2>

            <span className="text-sm text-gray-400">
              {filteredPosts.length}{" "}
              {filteredPosts.length === 1 ? "post" : "posts"}
            </span>
          </div>

          <PostList
            posts={filteredPosts}
            loading={postsLoading}
            error={postsError}
            hasSearch={Boolean(search.trim())}
            onRetry={handleRetryPosts}
          />
        </section>
      </div>
    </main>
  );
}



