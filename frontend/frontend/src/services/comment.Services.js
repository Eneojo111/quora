import api from "./api";

// Fetch comments for a post, question, or answer.
export const getComments = async (
  targetType,
  targetId,
  page = 1,
  limit = 10
) => {
  const response = await api.get(
    `/comments/${targetType}/${targetId}`,
    { params: { page, limit } }
  );

  return {
    comments: response.data.data ?? [],
    pagination: response.data.pagination ?? null,
  };
};

// Create a comment.
export const createComment = async (
  targetType,
  targetId,
  body
) => {
  const response = await api.post(
    `/comments/${targetType}/${targetId}`,
    { body }
  );

  return response.data.data;
};

// Update your comment.
export const updateComment = async (commentId, body) => {
  const response = await api.put(`/comments/${commentId}`, {
    body,
  });

  return response.data.data;
};

// Delete your comment.
export const deleteComment = async (commentId) => {
  const response = await api.delete(`/comments/${commentId}`);

  return response.data;
};
