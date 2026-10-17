import api from "./api";

// Get the IDs of people the logged-in user follows.
export const getMyFollowing = async () => {
  const response = await api.get("/users/me/following");

  const result = response.data?.data ?? response.data;

  // Support either an array of users or an object containing users.
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.following)) {
    return result.following;
  }

  return [];
};

// Get the logged-in user's followers.
export const getMyFollowers = async () => {
  const response = await api.get("/users/me/followers");

  const result = response.data?.data ?? response.data;

  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.followers)) {
    return result.followers;
  }

  return [];
};

// Follow another user.
export const followUser = async (userId) => {
  if (!userId) {
    throw new Error("A user ID is required.");
  }

  const response = await api.post(
    `/users/${encodeURIComponent(userId)}/follow`
  );

  return response.data?.data ?? response.data;
};

// Unfollow another user.
export const unfollowUser = async (userId) => {
  if (!userId) {
    throw new Error("A user ID is required.");
  }

  const response = await api.delete(
    `/users/${encodeURIComponent(userId)}/follow`
  );

  return response.data?.data ?? response.data;
};

