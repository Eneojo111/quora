import api from "./api";

// Field name your avatar upload expects. Check the `.single("...")` call
// inside `uploadAvatar` in your backend upload.middleware.js and change this
// one line if it isn't "avatar".
const AVATAR_FIELD = "avatar";

const API_ORIGIN =
  (api.defaults.baseURL || "").replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

export const assetUrl = (path) => {
  if (!path) return "";
  return /^https?:\/\//.test(path) ? path : `${API_ORIGIN}${path}`;
};

export const errorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

// The logged-in user's full profile (includes followers and following).
export async function getMyProfile() {
  const res = await api.get("/users/me");
  return res.data.data;
}

// Posts written by one user, newest first.
export async function getMyPosts(userId, page = 1, limit = 50) {
  const res = await api.get("/posts", {
    params: { author: userId, page, limit },
  });

  return {
    posts: res.data.data || [],
    pagination: res.data.pagination || null,
  };
}

// Updates name, username and/or bio, e.g. updateMyProfile({ bio: "Hello" }).
export async function updateMyProfile(fields) {
  const res = await api.patch("/users/me", fields);
  return res.data.data;
}

// Uploads a new profile picture (a File object).
export async function updateMyAvatar(file) {
  const form = new FormData();
  form.append(AVATAR_FIELD, file);

  const res = await api.patch("/users/me/avatar", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.data;
}

