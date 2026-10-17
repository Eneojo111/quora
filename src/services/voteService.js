import api from "./api";
1

// Retrieve vote counts and the current user's vote.
export const getVoteSummary = async (targetType, targetId) => {
  const response = await api.get(
    `/votes/${targetType}/${targetId}`
  );

  return response.data.data;
};

// Submit an upvote or downvote.
export const castVote = async (targetType, targetId, value) => {
  const response = await api.post(
    `/votes/${targetType}/${targetId}`,
    { value }
  );

  return response.data.data;
};
