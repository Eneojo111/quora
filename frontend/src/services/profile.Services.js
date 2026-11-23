import api, { API_ORIGIN } from "./api";

const AVATAR_FIELD = "avatar";

// Convert legacy relative image paths to backend URLs.
// Keep Cloudinary and other absolute URLs unchanged.
export const assetUrl = (path) => {
  if (!path || typeof path !== "string") {
    return "";
  }

  // Check whether the image URL is already absolute.
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Normalize relative paths.
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return `${API_ORIGIN}${normalizedPath}`;
};

// Extract a readable error message.
export const errorMessage = (
  err,
  fallback = "Something went wrong."
) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
};

// Get the currently logged-in user's profile.
export async function getMyProfile() {
  const res = await api.get("/users/me");
  return res.data.data;
}

// Get posts belonging to a particular user.
export async function getMyPosts(
  userId,
  page = 1,
  limit = 50
) {
  const res = await api.get("/posts", {
    params: {
      author: userId,
      page,
      limit,
    },
  });

  const result = res.data.data ?? res.data;

  return {
    posts: Array.isArray(result)
      ? result
      : result?.posts || [],

    pagination:
      result?.pagination ||
      res.data.pagination ||
      null,
  };
}

// Update the logged-in user's profile information.
export async function updateMyProfile(fields) {
  const res = await api.patch("/users/me", fields);
  return res.data.data;
}

// Upload or update the logged-in user's avatar.
export async function updateMyAvatar(file) {
  if (!file) {
    throw new Error("Please select a profile picture.");
  }

  const form = new FormData();
  form.append(AVATAR_FIELD, file);

  // Let Axios/browser set the multipart Content-Type
  // and generate the required boundary.
  const res = await api.patch(
    "/users/me/avatar",
    form
  );

  return res.data.data;
}

// Alias for components using the uploadMyAvatar name.
export const uploadMyAvatar = updateMyAvatar;



