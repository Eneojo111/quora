import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MessageCircle,
  Send,
  Pencil,
  Trash2,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from "../services/comment.Services.js";

const API_ORIGIN = "http://localhost:5000";
const PREVIEW_LENGTH = 220;

function assetUrl(path) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${API_ORIGIN}${path}`;
}

function formatDate(date) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleString();
}

function formatShortDate(date) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function Avatar({ person, className }) {
  const src = assetUrl(person?.profilePicture);
  const initial = (person?.name || person?.username || "U")
    .charAt(0)
    .toUpperCase();

  if (src) {
    return <img className={className} src={src} alt="" />;
  }

  return (
    <div className={`${className} cmt-avatar-placeholder`}>
      {initial}
    </div>
  );
}

// Long comments are cut short with a blue "(more)" link.
function CommentBody({ body }) {
  const [expanded, setExpanded] = useState(false);
  const text = body || "";
  const isLong = text.length > PREVIEW_LENGTH;

  const shown =
    isLong && !expanded
      ? `${text.slice(0, PREVIEW_LENGTH).trimEnd()}... `
      : text;

  return (
    <p className="cmt-body">
      {shown}
      {isLong && (
        <button
          type="button"
          className="cmt-more"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? " (less)" : "(more)"}
        </button>
      )}
    </p>
  );
}

export default function CommentSection({
  postId,
  user,
  onCountChange,
}) {
  const [comments, setComments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("recommended");

  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const currentUserId = user?.id || user?._id;

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getComments("post", postId, page, 10);

      setComments(result.comments);
      setPagination(result.pagination);

      if (
        onCountChange &&
        typeof result.pagination?.totalComments === "number"
      ) {
        onCountChange(result.pagination.totalComments);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load comments. Please try again."
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, page]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // "Recommended" keeps the server order. Newest and Oldest sort the
  // comments on the current page.
  const visibleComments = useMemo(() => {
    if (sort === "recommended") return comments;

    const sorted = [...comments].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
    );

    return sort === "newest" ? sorted.reverse() : sorted;
  }, [comments, sort]);

  // Add a new comment.
  const handleCreateComment = async (event) => {
    event?.preventDefault();

    const body = newComment.trim();

    if (!body || submitting) return;

    if (body.length > 5000) {
      setError("A comment cannot exceed 5,000 characters.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await createComment("post", postId, body);

      setNewComment("");

      // Return to the first page so the newest comment is visible.
      if (page !== 1) {
        setPage(1);
      } else {
        await loadComments();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to add your comment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Open the inline editor.
  const startEditing = (comment) => {
    setEditingId(comment._id);
    setEditBody(comment.body);
    setError("");
  };

  const cancelEditing = () => {
    if (savingId) return;

    setEditingId(null);
    setEditBody("");
  };

  // Save an edited comment.
  const handleUpdateComment = async (event, commentId) => {
    event.preventDefault();

    const body = editBody.trim();

    if (!body || savingId) return;

    if (body.length > 5000) {
      setError("A comment cannot exceed 5,000 characters.");
      return;
    }

    setSavingId(commentId);
    setError("");

    try {
      const updatedComment = await updateComment(commentId, body);

      setComments((current) =>
        current.map((comment) =>
          comment._id === commentId
            ? { ...comment, ...updatedComment }
            : comment
        )
      );

      setEditingId(null);
      setEditBody("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to update your comment. Please try again."
      );
    } finally {
      setSavingId(null);
    }
  };

  // Delete a comment after confirmation.
  const handleDeleteComment = async (comment) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?"
    );

    if (!confirmed || deletingId) return;

    setDeletingId(comment._id);
    setError("");

    try {
      await deleteComment(comment._id);

      const remainingComments = comments.filter(
        (item) => item._id !== comment._id
      );

      // If the current page becomes empty, go back one page.
      if (remainingComments.length === 0 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadComments();
      }

      if (editingId === comment._id) {
        setEditingId(null);
        setEditBody("");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to delete your comment. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="cmt-section">
      {/* Add a comment: avatar + rounded input */}
      <form
        className="cmt-create"
        onSubmit={handleCreateComment}
      >
        <Avatar person={user} className="cmt-avatar" />

        <div className="cmt-input-wrap">
          <textarea
            className="cmt-input"
            value={newComment}
            onChange={(event) => {
              setNewComment(event.target.value);
              event.target.style.height = "auto";
              event.target.style.height = `${event.target.scrollHeight}px`;
            }}
            onKeyDown={(event) => {
              // Enter posts, Shift+Enter adds a new line.
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleCreateComment();
              }
            }}
            placeholder={
              user
                ? "Add a comment..."
                : "Sign in to join the conversation."
            }
            rows={1}
            maxLength={5000}
            disabled={!user || submitting}
            aria-label="Add a comment"
          />

          {newComment.trim() && (
            <button
              type="submit"
              className="cmt-submit"
              disabled={!user || submitting}
              aria-label="Post comment"
            >
              <Send size={15} />
              {submitting ? "Posting..." : "Comment"}
            </button>
          )}
        </div>
      </form>

      {!user && (
        <p className="cmt-note">
          Sign in to add, edit, or delete comments.
        </p>
      )}

      {error && (
        <div className="cmt-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header: "Comments" and the sort control */}
      <div className="cmt-header">
        <h3>Comments</h3>

        <label className="cmt-sort">
          <span className="sr-only">Sort comments</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="recommended">Recommended</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
          <ChevronDown size={18} aria-hidden="true" />
        </label>
      </div>

      {/* Comment list */}
      {loading ? (
        <p className="cmt-status">Loading comments...</p>
      ) : visibleComments.length === 0 ? (
        <div className="cmt-empty">
          <MessageCircle size={24} />
          <p>No comments yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="cmt-list">
          {visibleComments.map((comment) => {
            const author = comment.author || {};

            const authorId =
              typeof author === "object"
                ? author._id || author.id
                : author;

            const isOwner =
              currentUserId &&
              authorId &&
              String(currentUserId) === String(authorId);

            return (
              <article className="cmt-item" key={comment._id}>
                <Avatar person={author} className="cmt-avatar" />

                <div className="cmt-main">
                  <div className="cmt-author-line">
                    <strong>
                      {author.name ||
                        author.username ||
                        "Unknown user"}
                    </strong>

                    <span className="cmt-dot" aria-hidden="true">
                      ·
                    </span>

                    <time
                      dateTime={comment.createdAt || undefined}
                      title={formatDate(comment.createdAt)}
                    >
                      {formatShortDate(comment.createdAt)}
                    </time>

                    {comment.updatedAt &&
                      comment.updatedAt !== comment.createdAt && (
                        <span className="cmt-edited">Edited</span>
                      )}
                  </div>

                  {editingId === comment._id ? (
                    <form
                      className="cmt-edit-form"
                      onSubmit={(event) =>
                        handleUpdateComment(event, comment._id)
                      }
                    >
                      <textarea
                        value={editBody}
                        onChange={(event) =>
                          setEditBody(event.target.value)
                        }
                        maxLength={5000}
                        rows={3}
                        autoFocus
                        aria-label="Edit comment"
                      />

                      <div className="cmt-edit-footer">
                        <span>{editBody.length}/5000</span>

                        <div>
                          <button
                            type="button"
                            className="cmt-btn"
                            onClick={cancelEditing}
                            disabled={savingId === comment._id}
                          >
                            Cancel
                          </button>

                          <button
                            type="submit"
                            className="cmt-btn cmt-btn-primary"
                            disabled={
                              savingId === comment._id ||
                              !editBody.trim()
                            }
                          >
                            <Save size={14} />
                            {savingId === comment._id
                              ? "Saving..."
                              : "Save"}
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <CommentBody body={comment.body} />
                  )}

                  {isOwner && editingId !== comment._id && (
                    <div className="cmt-owner-actions">
                      <button
                        type="button"
                        onClick={() => startEditing(comment)}
                        aria-label="Edit comment"
                        title="Edit comment"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment)}
                        disabled={deletingId === comment._id}
                        aria-label="Delete comment"
                        title="Delete comment"
                      >
                        <Trash2 size={13} />
                        {deletingId === comment._id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Comment pagination */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <nav className="cmt-pagination" aria-label="Comment pages">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </section>
  );
}
