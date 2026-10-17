import api from "./api";

export const loginUser = async (email, password) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  const { token, user } = response.data.data;

  if (!token) {
    throw new Error("The server did not return an authentication token.");
  }

  localStorage.setItem("token", token);

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }

  return { token, user };
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};



export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data.data;
};
