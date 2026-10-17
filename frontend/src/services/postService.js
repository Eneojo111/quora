import api from "./api";

// Fetch posts with pagination
export const getPosts = async (page = 1, limit = 10) => {
    const response = await api.get("/posts", {
        params: { page, limit },
    });

    const result = response.data.data ?? response.data;

    // Support either an array or a paginated response.
    const posts = Array.isArray(result)
        ? result
        : result.posts ?? [];

    return {
        posts,
        pagination: result.pagination ?? response.data.pagination ?? null,
    };
};

// Create a post containing text, images, or both
export const createPost = async (content, images = []) => {
    const formData = new FormData();

    if (content.trim()) {
        formData.append("content", content.trim());
    }

    images.forEach((image) => {
        formData.append("images", image);
    });

    const response = await api.post("/posts", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data.data;
};


 // Update an existing post
export const updatePost = async (postId, content) => {
  const response = await api.put(`/posts/${postId}`, {
    content: content.trim(),
  });

  return response.data.data;
};

// Delete an existing post
export const deletePost = async (postId) => {
  const response = await api.delete(`/posts/${postId}`);

  return response.data;
};


