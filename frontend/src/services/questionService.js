
const API_URL = "http://localhost:5000/api";

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || `Request failed with status ${response.status}`
    );
  }

  return result;
};

// Fetch questions from the database.
export const getQuestions = async (page = 1, limit = 10) => {
  const result = await request(
    `/questions?page=${page}&limit=${limit}`
  );

  return {
    questions: Array.isArray(result.data) ? result.data : [],
    pagination: result.pagination || {},
  };
};

// Fetch the number of answers for a particular question.
export const getQuestionAnswerCount = async (questionId) => {
  const result = await request(
    `/answers/question/${questionId}?page=1&limit=1`
  );

  return Number(result.pagination?.totalAnswers ?? 0);
};

// Submit an answer to a selected question.
export const submitQuestionAnswer = async (questionId, body) => {
  return request(`/answers/question/${questionId}`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
};
