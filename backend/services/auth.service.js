import bcrypt from "bcryptjs";
import crypto from "crypto";

import User from "../models/user.js";
import Session from "../models/session.js";

import { generateToken } from "../utils/generateToken.js";

// REGISTER USER
export const registerUser = async ({
  name,
  username,
  email,
  password,
}) => {
  // Check whether the email is already registered.
  const existingEmail = await User.findOne({ email });

  if (existingEmail) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  // Check whether the username is already taken.
  const existingUsername = await User.findOne({ username });

  if (existingUsername) {
    const error = new Error("Username is already taken");
    error.statusCode = 409;
    throw error;
  }

  // Hash the password before saving it.
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create the user.
  const createdUser = await User.create({
    name,
    username,
    email,
    password: hashedPassword,
  });

  // Return public user details only.
  return {
    id: createdUser._id,
    name: createdUser.name,
    username: createdUser.username,
    email: createdUser.email,
    bio: createdUser.bio,
    profilePicture: createdUser.profilePicture,
    role: createdUser.role,
    createdAt: createdUser.createdAt,
  };
};

// LOGIN USER
export const loginUser = async ({ email, password }) => {
  // Find the user by email.
  const foundUser = await User.findOne({ email });

  if (!foundUser) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // Verify the password.
  const isPasswordCorrect = await bcrypt.compare(
    password,
    foundUser.password
  );

  if (!isPasswordCorrect) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // Generate a unique session ID.
  const sessionId = crypto.randomUUID();

  // Set the session expiration to seven days.
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  // Save the session in MongoDB.
  await Session.create({
    user: foundUser._id,
    sessionId,
    expiresAt,
  });

  // Generate the JWT.
  const token = generateToken(foundUser._id, sessionId);

  // Preserve the existing login response structure.
  return {
    token,
    user: {
      id: foundUser._id,
      name: foundUser.name,
      username: foundUser.username,
      email: foundUser.email,
      bio: foundUser.bio,
      profilePicture: foundUser.profilePicture,
      role: foundUser.role,
    },
  };
};

// LOGOUT USER
export const logoutUser = async (sessionId) => {
  const deletedSession = await Session.findOneAndDelete({
    sessionId,
  });

  if (!deletedSession) {
    const error = new Error("Session not found");
    error.statusCode = 404;
    throw error;
  }

  return true;
};