import { useEffect, useState } from "react";
import {
    getPosts,
    updatePost,
    deletePost,
} from "../services/postService";
import VoteButtons from "./VoteButtons";
import CreatePost from "./createPost";
import {
    Image,
    RefreshCw,
    Pencil,
    Trash2,
    X,
    Save,
    MessageCircle,
    Repeat2,
    MoreHorizontal,
} from "lucide-react";
import CommentSection from "./commentSection";
import FeedSidebar from "./FeedSidebar";
import {
    getMyFollowing,
    followUser,
    unfollowUser,
} from "../services/userService.js";

const API_ORIGIN =`${import.meta.env.VITE_API_URL}/api`;

function assetUrl(path) {
    if (!path) return "";
    return path.startsWith("http") ? path : `${API_ORIGIN}${path}`;
}

function formatShortDate(date) {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "";

    return parsedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

function formatFullDate(date) {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "";

    return parsedDate.toLocaleString();
}

function getCommentCount(post) {
    const value =
        post.commentCount ??
        post.commentsCount ??
        (Array.isArray(post.comments) ? post.comments.length : undefined);

    return typeof value === "number" ? value : null;
}

export default function PostFeed({ user }) {
    const [posts, setPosts] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);

    // Follow feature state
    const [followingIds, setFollowingIds] = useState(new Set());
    const [followLoadingId, setFollowLoadingId] = useState(null);
    const [followError, setFollowError] = useState("");

    // Post editing and deletion state
    const [editingPost, setEditingPost] = useState(null);
    const [editContent, setEditContent] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingPostId, setDeletingPostId] = useState(null);
    const [actionError, setActionError] = useState("");

    // Comment section and three-dot menu state
    const [openCommentsId, setOpenCommentsId] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);

    // Support either "id" or "_id" from the login response.
    const currentUserId = user?.id || user?._id;

    // Close the three-dot menu on outside click or Escape.
    useEffect(() => {
        if (!openMenuId) return;

        const handleMouseDown = (event) => {
            if (!event.target.closest("[data-post-menu]")) {
                setOpenMenuId(null);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") setOpenMenuId(null);
        };

        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [openMenuId]);

    // Load posts.
    useEffect(() => {
        let active = true;

        async function loadPosts() {
            setLoading(true);
            setError("");

            try {
                const result = await getPosts(page, 10);

                if (active) {
                    setPosts(result.posts);
                    setPagination(result.pagination);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load posts. Please try again."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadPosts();

        return () => {
            active = false;
        };
    }, [page, refreshKey]);

    // Load the users that the current user follows.
    useEffect(() => {
        let active = true;

        async function loadFollowing() {
            if (!currentUserId) {
                setFollowingIds(new Set());
                return;
            }

            try {
                const following = await getMyFollowing();

                if (!active) return;

                const ids = following
                    .map((person) =>
                        typeof person === "object"
                            ? person?._id || person?.id
                            : person
                    )
                    .filter(Boolean)
                    .map(String);

                setFollowingIds(new Set(ids));
            } catch (err) {
                if (active) {
                    setFollowError(
                        err.response?.data?.message ||
                        "Unable to load following status."
                    );
                }
            }
        }

        loadFollowing();

        return () => {
            active = false;
        };
    }, [currentUserId]);

    // Follow or unfollow another user.
    const handleToggleFollow = async (authorId) => {
        if (!currentUserId || !authorId || followLoadingId) return;

        // Prevent following yourself.
        if (String(currentUserId) === String(authorId)) return;

        const targetId = String(authorId);
        const wasFollowing = followingIds.has(targetId);

        setFollowLoadingId(targetId);
        setFollowError("");

        try {
            if (wasFollowing) {
                await unfollowUser(targetId);

                setFollowingIds((current) => {
                    const updated = new Set(current);
                    updated.delete(targetId);
                    return updated;
                });
            } else {
                await followUser(targetId);

                setFollowingIds((current) => {
                    const updated = new Set(current);
                    updated.add(targetId);
                    return updated;
                });
            }
        } catch (err) {
            setFollowError(
                err.response?.data?.message ||
                err.message ||
                "Unable to update follow status. Please try again."
            );
        } finally {
            setFollowLoadingId(null);
        }
    };

    // Handle a newly created post.
    const handlePostCreated = (newPost) => {
        if (!newPost?._id) {
            setRefreshKey((current) => current + 1);
            setPage(1);
            return;
        }

        if (page === 1) {
            setPosts((currentPosts) =>
                [
                    newPost,
                    ...currentPosts.filter(
                        (post) => post._id !== newPost._id
                    ),
                ].slice(0, 10)
            );
        } else {
            setPage(1);
            setRefreshKey((current) => current + 1);
        }
    };

    const retryLoadingPosts = () => {
        setRefreshKey((current) => current + 1);
    };

    // Open the edit dialog.
    const openEditDialog = (post) => {
        setEditingPost(post);
        setEditContent(post.content || "");
        setActionError("");
    };

    const closeEditDialog = () => {
        if (savingEdit) return;

        setEditingPost(null);
        setEditContent("");
        setActionError("");
    };

    // Save edited text to the backend.
    const handleSaveEdit = async (event) => {
        event.preventDefault();

        if (!editingPost || savingEdit) return;

        if (!editContent.trim()) {
            setActionError(
                "Post text cannot be empty. Your current backend requires text when updating a post."
            );
            return;
        }

        if (editContent.trim().length > 10000) {
            setActionError("Post text cannot exceed 10,000 characters.");
            return;
        }

        setSavingEdit(true);
        setActionError("");

        try {
            const updatedPost = await updatePost(
                editingPost._id,
                editContent
            );

            setPosts((currentPosts) =>
                currentPosts.map((post) =>
                    post._id === editingPost._id
                        ? { ...post, ...updatedPost }
                        : post
                )
            );

            setEditingPost(null);
            setEditContent("");
        } catch (err) {
            setActionError(
                err.response?.data?.message ||
                err.message ||
                "Unable to update this post. Please try again."
            );
        } finally {
            setSavingEdit(false);
        }
    };

    // Delete a post after the user confirms.
    const handleDeletePost = async (post) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this post? This action cannot be undone."
        );

        if (!confirmed || deletingPostId) return;

        setDeletingPostId(post._id);
        setActionError("");

        try {
            await deletePost(post._id);

            setPosts((currentPosts) =>
                currentPosts.filter((item) => item._id !== post._id)
            );

            if (editingPost?._id === post._id) {
                setEditingPost(null);
                setEditContent("");
            }

            if (openCommentsId === post._id) setOpenCommentsId(null);

            // Reload counts and pagination after deletion.
            setRefreshKey((current) => current + 1);
        } catch (err) {
            setActionError(
                err.response?.data?.message ||
                "Unable to delete this post. Please try again."
            );
        } finally {
            setDeletingPostId(null);
        }
    };

    return (
        <>
            <div className="qf-layout">
                {/* Left column: display-only spaces sidebar */}
                <FeedSidebar />

                {/* Centre column: composer + feed */}
                <div className="qf-center">
                    <CreatePost onPostCreated={handlePostCreated} />

                    <section className="post-feed" id="posts">
                        <div className="feed-heading"></div>

                        {/* Follow feature errors */}
                        {followError && (
                            <p className="post-action-error" role="alert">
                                {followError}
                                <button
                                    type="button"
                                    onClick={() => setFollowError("")}
                                    aria-label="Dismiss follow error"
                                >
                                    <X size={16} />
                                </button>
                            </p>
                        )}

                        {/* Post editing and deletion errors */}
                        {actionError && !editingPost && (
                            <p className="post-action-error" role="alert">
                                {actionError}
                                <button
                                    type="button"
                                    onClick={() => setActionError("")}
                                    aria-label="Dismiss error"
                                >
                                    <X size={16} />
                                </button>
                            </p>
                        )}

                        {loading ? (
                            <p className="feed-status">Loading posts...</p>
                        ) : error ? (
                            <div className="feed-status">
                                <p className="feed-error">{error}</p>

                                <button
                                    type="button"
                                    className="feed-action"
                                    onClick={retryLoadingPosts}
                                >
                                    <RefreshCw size={16} />
                                    Retry
                                </button>
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="empty-feed">
                                <Image size={32} />
                                <h3>No posts yet</h3>
                                <p>
                                    Be the first to share something with the
                                    community.
                                </p>
                            </div>
                        ) : (
                            posts.map((post) => {
                                const author = post.author || {};

                                const images = Array.isArray(post.images)
                                    ? post.images
                                    : [];

                                const authorId =
                                    typeof author === "object"
                                        ? author._id || author.id
                                        : author;

                                const isOwner =
                                    currentUserId &&
                                    authorId &&
                                    String(currentUserId) ===
                                        String(authorId);

                                const authorName =
                                    author.name ||
                                    author.username ||
                                    "Unknown user";

                                const isFollowing =
                                    authorId &&
                                    followingIds.has(String(authorId));

                                const commentsOpen =
                                    openCommentsId === post._id;
                                const menuOpen = openMenuId === post._id;
                                const commentCount = getCommentCount(post);

                                return (
                                    <article
                                        className="post-card"
                                        key={post._id}
                                    >
                                        <header className="post-author">
                                            {author.profilePicture ? (
                                                <img
                                                    className="author-avatar"
                                                    src={assetUrl(
                                                        author.profilePicture
                                                    )}
                                                    alt=""
                                                />
                                            ) : (
                                                <div className="author-avatar author-placeholder">
                                                    {authorName
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                            )}

                                            <div className="author-details">
                                                <div className="author-name-row">
                                                    <strong>
                                                        {authorName}
                                                    </strong>

                                                    {/* Follow button for other users only */}
                                                    {!isOwner &&
                                                        currentUserId &&
                                                        authorId && (
                                                            <>
                                                                <span
                                                                    className="author-dot"
                                                                    aria-hidden="true"
                                                                >
                                                                    ·
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    className={`follow-button ${
                                                                        isFollowing
                                                                            ? "is-following"
                                                                            : ""
                                                                    }`}
                                                                    onClick={() =>
                                                                        handleToggleFollow(
                                                                            authorId
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        followLoadingId ===
                                                                        String(
                                                                            authorId
                                                                        )
                                                                    }
                                                                    aria-label={
                                                                        isFollowing
                                                                            ? `Unfollow ${authorName}`
                                                                            : `Follow ${authorName}`
                                                                    }
                                                                >
                                                                    {isFollowing
                                                                        ? "Following"
                                                                        : "Follow"}
                                                                </button>
                                                            </>
                                                        )}
                                                </div>

                                                {/* Date directly under the username */}
                                                <time
                                                    className="author-date"
                                                    dateTime={
                                                        post.createdAt ||
                                                        undefined
                                                    }
                                                    title={formatFullDate(
                                                        post.createdAt
                                                    )}
                                                >
                                                    {formatShortDate(
                                                        post.createdAt
                                                    )}
                                                </time>

                                                {author.bio && (
                                                    <p className="author-bio">
                                                        {author.bio}
                                                    </p>
                                                )}
                                            </div>
                                        </header>

                                        {post.content && (
                                            <p className="post-content">
                                                {post.content}
                                            </p>
                                        )}

                                        {images.length > 0 && (
                                            <div className="post-images">
                                                {images.map(
                                                    (image, index) => (
                                                        <img
                                                            key={`${post._id}-image-${index}`}
                                                            src={assetUrl(
                                                                image
                                                            )}
                                                            alt={`Post image ${
                                                                index + 1
                                                            }`}
                                                            loading="lazy"
                                                        />
                                                    )
                                                )}
                                            </div>
                                        )}

                                        {/* Interaction row */}
                                        <div className="post-actions">
                                            <VoteButtons
                                                targetType="post"
                                                targetId={post._id}
                                            />

                                            <button
                                                type="button"
                                                className={`action-pill ${
                                                    commentsOpen
                                                        ? "is-active"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    setOpenCommentsId(
                                                        commentsOpen
                                                            ? null
                                                            : post._id
                                                    )
                                                }
                                                aria-expanded={commentsOpen}
                                                aria-label={
                                                    commentsOpen
                                                        ? "Hide comments"
                                                        : "Show comments"
                                                }
                                            >
                                                <MessageCircle size={20} />
                                                {commentCount !== null && (
                                                    <span>
                                                        {commentCount}
                                                    </span>
                                                )}
                                            </button>

                                            {/* Reshare: visible only, no action yet */}
                                            <button
                                                type="button"
                                                className="action-pill"
                                                aria-label="Reshare"
                                                title="Reshare (coming soon)"
                                                tabIndex={-1}
                                                aria-disabled="true"
                                                onClick={(event) =>
                                                    event.preventDefault()
                                                }
                                            >
                                                <Repeat2 size={20} />
                                            </button>

                                            {/* Three-dot menu: owner only */}
                                            {isOwner && (
                                                <div
                                                    className="post-menu"
                                                    data-post-menu
                                                >
                                                    <button
                                                        type="button"
                                                        className="action-icon-button"
                                                        onClick={() =>
                                                            setOpenMenuId(
                                                                menuOpen
                                                                    ? null
                                                                    : post._id
                                                            )
                                                        }
                                                        aria-label="More options"
                                                        aria-haspopup="menu"
                                                        aria-expanded={
                                                            menuOpen
                                                        }
                                                    >
                                                        <MoreHorizontal
                                                            size={22}
                                                        />
                                                    </button>

                                                    {menuOpen && (
                                                        <div
                                                            className="post-menu-dropdown"
                                                            role="menu"
                                                        >
                                                            <button
                                                                type="button"
                                                                role="menuitem"
                                                                className="post-menu-item"
                                                                onClick={() => {
                                                                    setOpenMenuId(
                                                                        null
                                                                    );
                                                                    openEditDialog(
                                                                        post
                                                                    );
                                                                }}
                                                            >
                                                                <Pencil
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                                Edit Post
                                                            </button>

                                                            <button
                                                                type="button"
                                                                role="menuitem"
                                                                className="post-menu-item is-danger"
                                                                disabled={
                                                                    deletingPostId ===
                                                                    post._id
                                                                }
                                                                onClick={() => {
                                                                    setOpenMenuId(
                                                                        null
                                                                    );
                                                                    handleDeletePost(
                                                                        post
                                                                    );
                                                                }}
                                                            >
                                                                <Trash2
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                                {deletingPostId ===
                                                                post._id
                                                                    ? "Deleting..."
                                                                    : "Delete Post"}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Expands directly below the post */}
                                        {commentsOpen && (
                                            <CommentSection
                                                postId={post._id}
                                                user={user}
                                            />
                                        )}
                                    </article>
                                );
                            })
                        )}

                        {/* Pagination */}
                        {!loading &&
                            !error &&
                            pagination &&
                            pagination.totalPages > 1 && (
                                <nav
                                    className="pagination"
                                    aria-label="Post pages"
                                >
                                    <button
                                        type="button"
                                        disabled={page <= 1}
                                        onClick={() =>
                                            setPage((current) => current - 1)
                                        }
                                    >
                                        Previous
                                    </button>

                                    <span>
                                        Page{" "}
                                        {pagination.currentPage ?? page} of{" "}
                                        {pagination.totalPages}
                                    </span>

                                    <button
                                        type="button"
                                        disabled={
                                            page >= pagination.totalPages
                                        }
                                        onClick={() =>
                                            setPage((current) => current + 1)
                                        }
                                    >
                                        Next
                                    </button>
                                </nav>
                            )}
                    </section>
                </div>

                {/* Right column (empty, as on the reference) */}
                <aside className="qf-right" aria-hidden="true" />
            </div>

            {/* Edit post dialog */}
            {editingPost && (
                <div
                    className="edit-post-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !savingEdit
                        ) {
                            closeEditDialog();
                        }
                    }}
                >
                    <section
                        className="edit-post-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-post-title"
                    >
                        <header className="edit-post-header">
                            <h2 id="edit-post-title">Edit post</h2>

                            <button
                                type="button"
                                onClick={closeEditDialog}
                                disabled={savingEdit}
                                aria-label="Close edit dialog"
                            >
                                <X size={20} />
                            </button>
                        </header>

                        <form onSubmit={handleSaveEdit}>
                            <textarea
                                className="edit-post-textarea"
                                value={editContent}
                                onChange={(event) =>
                                    setEditContent(event.target.value)
                                }
                                placeholder="What would you like to share?"
                                maxLength={10000}
                                rows={7}
                                autoFocus
                            />

                            <div className="edit-post-footer">
                                <span>{editContent.length}/10000</span>

                                <button
                                    type="submit"
                                    className="edit-post-save"
                                    disabled={
                                        savingEdit || !editContent.trim()
                                    }
                                >
                                    <Save size={16} />
                                    {savingEdit
                                        ? "Saving..."
                                        : "Save changes"}
                                </button>
                            </div>

                            {actionError && (
                                <p className="post-action-error" role="alert">
                                    {actionError}
                                </p>
                            )}
                        </form>
                    </section>
                </div>
            )}
        </>
    );
}


