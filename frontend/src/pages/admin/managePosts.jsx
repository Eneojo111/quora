
import { useCallback, useEffect, useState } from "react";

import {
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  AlertCircle
} from "lucide-react";

import api, { API_ORIGIN } from "../../services/api";

export default function ManagePosts() {
  const [posts, setPosts] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [deletingPostId, setDeletingPostId] = useState(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ==========================================
  // FETCH POSTS
  // ==========================================

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/posts", {
        params: {
          page,
          limit: 10
        }
      });

      const result = response.data;

      setPosts(result.data || []);

      setPagination(
        result.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1
        }
      );

    } catch (err) {
      console.error("Fetch admin posts error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to retrieve posts. Please try again."
      );

    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ==========================================
  // DELETE POST
  // ==========================================

  const handleDeletePost = async (post) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeletingPostId(post._id);
      setError("");
      setSuccessMessage("");

      const response = await api.delete(
        `/admin/posts/${post._id}`
      );

      setSuccessMessage(
        response.data.message || "Post deleted successfully."
      );

      // Refresh the current page after deletion.
      await fetchPosts();

    } catch (err) {
      console.error("Delete post error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to delete post. Please try again."
      );

    } finally {
      setDeletingPostId(null);
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  // ==========================================
  // GET IMAGE URL
  // ==========================================

  const getImageUrl = (image) => {
    if (!image) return "";

    // Preserve complete URLs, such as Cloudinary URLs.
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    // Convert backend-relative upload paths into full URLs.
    return `${API_ORIGIN}${image.startsWith("/") ? "" : "/"}${image}`;
  };

  // ==========================================
  // STATISTICS
  // ==========================================

  const totalPosts = pagination.total || 0;

  const postsWithImages = posts.filter(
    (post) => post.images?.length > 0
  ).length;

  const postsWithoutImages = posts.length - postsWithImages;

  // ==========================================
  // PAGE UI
  // ==========================================

  return (
    <div className="space-y-7">

      {/* HEADER */}

      <div>
        <h2 className="text-2xl font-bold text-white">
          Manage Posts
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          View and moderate posts shared by users on your platform.
        </p>
      </div>


      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

        <div className="rounded-xl border border-gray-800 bg-[#191a21] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Total Posts
              </p>

              <h3 className="mt-2 text-3xl font-bold text-white">
                {totalPosts.toLocaleString()}
              </h3>
            </div>

            <div className="rounded-xl bg-red-500/10 p-3">
              <FileText size={25} className="text-red-400" />
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            All posts on the platform
          </p>
        </div>


        <div className="rounded-xl border border-gray-800 bg-[#191a21] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Posts With Images
              </p>

              <h3 className="mt-2 text-3xl font-bold text-white">
                {postsWithImages}
              </h3>
            </div>

            <div className="rounded-xl bg-blue-500/10 p-3">
              <ImageIcon size={25} className="text-blue-400" />
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Posts on the current page containing images
          </p>
        </div>


        <div className="rounded-xl border border-gray-800 bg-[#191a21] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Text-Only Posts
              </p>

              <h3 className="mt-2 text-3xl font-bold text-white">
                {postsWithoutImages}
              </h3>
            </div>

            <div className="rounded-xl bg-purple-500/10 p-3">
              <MessageSquare size={25} className="text-purple-400" />
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Text-only posts on the current page
          </p>
        </div>

      </div>


      {/* SUCCESS MESSAGE */}

      {successMessage && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {successMessage}
        </div>
      )}


      {/* ERROR MESSAGE */}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle size={18} />
          {error}
        </div>
      )}


      {/* POSTS CONTAINER */}

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#191a21]">

        {/* TABLE HEADER */}

        <div className="flex flex-col gap-3 border-b border-gray-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h3 className="font-semibold text-white">
              All Posts
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              {totalPosts} posts available
            </p>
          </div>

          <button
            onClick={() => {
              setSuccessMessage("");
              fetchPosts();
            }}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-700 bg-[#202127] px-4 py-2.5 text-sm text-gray-300 transition hover:border-red-500 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

        </div>


        {/* LOADING */}

        {loading ? (

          <div className="py-16 text-center text-gray-400">

            <RefreshCw
              size={28}
              className="mx-auto mb-3 animate-spin text-red-400"
            />

            <p className="text-sm">
              Loading posts...
            </p>

          </div>

        ) : posts.length === 0 ? (

          /* EMPTY STATE */

          <div className="py-16 text-center">

            <FileText
              size={40}
              className="mx-auto mb-3 text-gray-600"
            />

            <h3 className="font-semibold text-white">
              No posts found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              There are currently no posts to display.
            </p>

          </div>

        ) : (

          /* POSTS LIST */

          <div className="divide-y divide-gray-800">

            {posts.map((post) => (

              <div
                key={post._id}
                className="p-5 transition hover:bg-[#202127]"
              >

                {/* POST AUTHOR */}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                  <div className="flex items-center gap-3">

                    {post.author?.profilePicture ? (

                      <img
                        src={getImageUrl(post.author.profilePicture)}
                        alt={post.author.name || "User"}
                        className="h-11 w-11 rounded-full object-cover"
                      />

                    ) : (

                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                        <User size={21} />
                      </div>

                    )}

                    <div>
                      <p className="font-semibold text-white">
                        {post.author?.name || "Unknown User"}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        @{post.author?.username || "unknown"}
                      </p>
                    </div>

                  </div>


                  {/* DATE */}

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={14} />
                    {formatDate(post.createdAt)}
                  </div>

                </div>


                {/* POST CONTENT */}

                <div className="mt-4">

                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-300">
                    {post.content || "No text content"}
                  </p>

                </div>


                {/* POST IMAGES */}

                {post.images?.length > 0 && (

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

                    {post.images.map((image, index) => (

                      <a
                        key={`${post._id}-${index}`}
                        href={getImageUrl(image)}
                        target="_blank"
                        rel="noreferrer"
                        className="overflow-hidden rounded-lg border border-gray-800"
                      >

                        <img
                          src={getImageUrl(image)}
                          alt={`Post image ${index + 1}`}
                          loading="lazy"
                          className="h-36 w-full object-cover transition duration-300 hover:scale-105"
                        />

                      </a>

                    ))}

                  </div>

                )}


                {/* POST FOOTER */}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-800 pt-4">

                  <div className="flex items-center gap-2 text-xs text-gray-500">

                    <FileText size={14} />

                    Post ID:

                    <span className="text-gray-400">
                      {post._id}
                    </span>

                  </div>


                  {/* DELETE BUTTON */}

                  <button
                    onClick={() => handleDeletePost(post)}
                    disabled={deletingPostId === post._id}
                    className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {deletingPostId === post._id ? (

                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Deleting...
                      </>

                    ) : (

                      <>
                        <Trash2 size={14} />
                        Delete Post
                      </>

                    )}

                  </button>

                </div>

              </div>

            ))}

          </div>

        )}


        {/* PAGINATION */}

        <div className="flex flex-col gap-3 border-t border-gray-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-xs text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>

          <div className="flex items-center gap-2">

            <button
              onClick={() => {
                setSuccessMessage("");
                setPage((previous) => Math.max(1, previous - 1));
              }}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 transition hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
              Previous
            </button>

            <button
              onClick={() => {
                setSuccessMessage("");
                setPage((previous) =>
                  Math.min(pagination.totalPages, previous + 1)
                );
              }}
              disabled={
                page >= pagination.totalPages || loading
              }
              className="flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 transition hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={15} />
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
