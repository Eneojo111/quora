import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import session from "../models/session.js";

import { generateToken } from "../utils/generateToken.js";


// REGISTER USER
export const registerUser = async ({
  name,
  username,
  email,
  password
}) => {
  // Check email
  const existingEmail = await User.findOne({ email });

  if (existingEmail) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  // Check username
  const existingUsername = await User.findOne({ username });

  if (existingUsername) {
    const error = new Error("Username is already taken");
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);

  const hashedPassword = await bcrypt.hash(
    password,
    salt
  );

  // Create user
  const user = await User.create({
    name,
    username,
    email,
    password: hashedPassword
  });

  return {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    profilePicture: user.profilePicture,
    role: user.role,
    createdAt: user.createdAt
  };
};


// LOGIN USER
export const loginUser = async ({
  email,
  password
}) => {
  // Find user
  const user = await User.findOne({ email });

  if (!user) {
    const error = new Error(
      "Invalid email or password"
    );

    error.statusCode = 401;

    throw error;
  }

  // Compare password
  const isPasswordCorrect =
    await bcrypt.compare(
      password,
      user.password
    );

  if (!isPasswordCorrect) {
    const error = new Error(
      "Invalid email or password"
    );

    error.statusCode = 401;

    throw error;
  }

  // Create unique session ID
  const sessionId = crypto.randomUUID();

  // Calculate session expiration
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  // Save session
  await session.create({
    user: user._id,
    sessionId,
    expiresAt
  });

  // Generate JWT
  const token = generateToken(
    user._id,
    sessionId
  );

  return {
    token,

    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      bio: user.bio,
      profilePicture: user.profilePicture,
      role: user.role
    }
  };
};


// LOGOUT USER
export const logoutUser = async (sessionId) => {
  const session = await session.findOneAndDelete({
    sessionId
  });

  if (!session) {
    const error = new Error(
      "Session not found"
    );

    error.statusCode = 404;

    throw error;
  }

  return true;
};