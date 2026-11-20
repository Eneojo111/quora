
import api, { API_ORIGIN } from "./api";

const AVATAR_FIELD = "avatar";

// Convert legacy relative paths to backend URLs.
// Cloudinary URLs are already absolute and are returned unchanged.
export const assetUrl = (path) => {
  if (!path || typeof path !== "string") return "";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_ORIGIN}${normalizedPath}`;
};

export const errorMessage = (
  err,
  fallback = "Something went wrong."
) =>
  err?.response?.data?.message || err?.message || fallback;

export async function getMyProfile() {
  const res = await api.get("/users/me");
  return res.data.data;
}

export async function getMyPosts(userId, page = 1, limit = 50) {
  const res = await api.get("/posts", {
    params: { author: userId, page, limit },
  });

  const result = res.data.data;

  return {
    posts: Array.isArray(result) ? result : result?.posts || [],
    pagination: res.data.pagination || result?.pagination || null,
  };
}

export async function updateMyProfile(fields) {
  const res = await api.patch("/users/me", fields);
  return res.data.data;
}

export async function updateMyAvatar(file) {
  if (!file) {
    throw new Error("Please select a profile picture.");
  }

  const form = new FormData();
  form.append(AVATAR_FIELD, file);

  // Do not manually set Content-Type; Axios/browser supplies
  // the multipart boundary.
  const res = await api.patch("/users/me/avatar", form);

  return res.data.data;
}

// Alias for components that use the uploadMyAvatar name.
export const uploadMyAvatar = updateMyAvatar;


