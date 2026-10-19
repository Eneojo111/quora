import {
  registerUser,
  loginUser,
  logoutUser,
  // getAll
} from "../services/auth.service.js";
import User from "../models/user.js";
// REGISTER
export const register = async (
  req,
  res
) => {
  try {
    const {
      name,
      username,
      email,
      password
    } = req.body;

    if (
      !name ||
      !username ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, username, email and password are required"
      });
    }

    const user =
      await registerUser({
        name,
        username,
        email,
        password
      });

    return res.status(201).json({
      success: true,
      message:
        "User registered successfully",
      data: user
    });

  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Registration failed"
    });
  }
};


// LOGIN
export const login = async (
  req,
  res
) => {
  try {
    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required"
      });
    }

    const result =
      await loginUser({
        email,
        password
      });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });

  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Login failed"
    });
  }
};


// GET CURRENT USER
export const getMe = async (
  req,
  res
) => {
  return res.status(200).json({
    success: true,
    message:
      "Authenticated user retrieved successfully",
    data: req.user
  });
};

// export const getAll = async (req, res) => {
//   try {
//     const users = await User.find().sort({ createdAt: -1 });
//     return res.status(200).json({
//       success: true,
//       message: "All registered users retrieved successfully",
//       count: users.length,
//       data: users
//     })

//   } catch (error) {
//     console.error("Get all users error:", error.message);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error"
//     });
//   }
// };


// LOGOUT
export const logout = async (
  req,
  res
) => {
  try {
    await logoutUser(
      req.session.sessionId
    );

    return res.status(200).json({
      success: true,
      message: "Logout successful"
    });

  } catch (error) {
    console.error(
      "Logout error:",
      error
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Logout failed"
    });
  }
};




// PATCH /api/auth/me  (username and/or bio)
export const updateMe = async (req, res) => {
  try {
    const updates = {};

    if (req.body.username !== undefined) {
      const username = String(req.body.username).trim();
      if (username.length < 3 || username.length > 30) {
        return res.status(400).json({
          success: false,
          message: "Username must be 3 to 30 characters",
        });
      }
      updates.username = username;
    }

    if (req.body.bio !== undefined) {
      const bio = String(req.body.bio).trim();
      if (bio.length > 160) {
        return res.status(400).json({
          success: false,
          message: "Description must be 160 characters or fewer",
        });
      }
      updates.bio = bio;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "Nothing to update" });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    return res.status(200).json({ success: true, message: "Profile updated", data: user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Username already taken" });
    }
    console.error("Update profile error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /api/auth/me/avatar
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please choose an image" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: `/uploads/avatars/${req.file.filename}` },
      { new: true }
    ).select("-password");

    return res.status(200).json({ success: true, message: "Profile picture updated", data: user });
  } catch (error) {
    console.error("Update avatar error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};