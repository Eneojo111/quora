import api from "./api";

// Field name expected by your backend avatar upload middleware.
const AVATAR_FIELD = "avatar";

// Get the backend origin from the shared Axios configuration.
// This supports both local development and your deployed Render backend.
const API_ORIGIN = (api.defaults.baseURL || "/api").replace(/\/api\/?$/, "");

// Convert relative image paths into complete URLs.
// Example: /uploads/posts/image.jpg
// becomes https://quora-hih3.onrender.com/uploads/posts/image.jpg
export const assetUrl = (path) => {
  if (!path) return "";

  // Return the URL unchanged if it is already absolute.
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Ensure the path starts with a slash.
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${API_ORIGIN}${normalizedPath}`;
};

// Return a useful error message from an API request.
export const errorMessage = (err, fallback = "Something went wrong.") =>
  err?.response?.data?.message || err?.message || fallback;

// Get the currently logged-in user's profile.
export async function getMyProfile() {
  const res = await api.get("/users/me");
  return res.data.data;
}

// Get posts created by a user, newest first.
export async function getMyPosts(userId, page = 1, limit = 50) {
  const res = await api.get("/posts", {
    params: {
      author: userId,
      page,
      limit,
    },
  });

  const result = res.data.data;

  return {
    posts: Array.isArray(result) ? result : result?.posts || [],
    pagination: res.data.pagination || result?.pagination || null,
  };
}

// Update the logged-in user's profile information.
export async function updateMyProfile(fields) {
  const res = await api.patch("/users/me", fields);
  return res.data.data;
}

// Upload a new profile picture.
// The file must be a browser File object.
export async function updateMyAvatar(file) {
  if (!file) {
    throw new Error("Please select a profile picture.");
  }

  const form = new FormData();
  form.append(AVATAR_FIELD, file);

  const res = await api.patch("/users/me/avatar", form);

  return res.data.data;
}


