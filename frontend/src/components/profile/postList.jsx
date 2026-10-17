
import { useState } from "react";
import PostCard from "./postCard";

export default function PostList({
  posts,
  loading,
  error,
  hasSearch,
  onRetry
}) {
  const [showRetrying, setShowRetrying] = useState(false);

  const handleRetry = async () => {
    setShowRetrying(true);

    try {
      await onRetry?.();
    } finally {
      setShowRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading posts">
        {[1, 2].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-xl border border-gray-800 bg-[#16171d] p-4"
          >
            <div className="mb-4 h-10 w-40 rounded bg-gray-800" />
            <div className="h-4 w-full rounded bg-gray-800" />
            <div className="mt-2 h-4 w-2/3 rounded bg-gray-800" />
            <div className="mt-4 h-36 rounded bg-gray-800" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-gray-700 bg-[#16171d] p-5">
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>

        <button
          type="button"
          disabled={showRetrying}
          onClick={handleRetry}
          className="mt-4 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
        >
          {showRetrying ? "Retrying..." : "Retry"}
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[#16171d] px-5 py-12 text-center">
        <p className="text-gray-300">
          {hasSearch
            ? "No posts match your search"
            : "You haven't posted yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}
