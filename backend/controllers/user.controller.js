import mongoose from "mongoose";
import User from "../models/user.js";

// GET MY PROFILE
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: user
    });
  } catch (error) {
    console.error("Get my profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve profile"
    });
  }
};

// GET ANOTHER USER'S PUBLIC PROFILE
export const getUserProfile = async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();

    const user = await User.findOne({ username }).select(
      "name username bio profilePicture followers following createdAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: user
    });
  } catch (error) {
    console.error("Get user profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile"
    });
  }
};

// UPDATE MY PROFILE
export const updateMyProfile = async (req, res) => {
  try {
    const allowedFields = ["name", "username", "bio"];
    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body ?? {}, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update: name, username, or bio"
      });
    }

    if (updates.username !== undefined) {
      if (typeof updates.username !== "string") {
        return res.status(400).json({
          success: false,
          message: "Username must be a string"
        });
      }

      updates.username = updates.username.trim().toLowerCase();

      if (
        updates.username.length < 3 ||
        updates.username.length > 30
      ) {
        return res.status(400).json({
          success: false,
          message: "Username must be between 3 and 30 characters"
        });
      }
    }

    if (updates.name !== undefined) {
      if (
        typeof updates.name !== "string" ||
        updates.name.trim().length < 2 ||
        updates.name.trim().length > 50
      ) {
        return res.status(400).json({
          success: false,
          message: "Name must be between 2 and 50 characters"
        });
      }

      updates.name = updates.name.trim();
    }

    if (updates.bio !== undefined) {
      if (typeof updates.bio !== "string") {
        return res.status(400).json({
          success: false,
          message: "Bio must be a string"
        });
      }

      updates.bio = updates.bio.trim();

      if (updates.bio.length > 160) {
        return res.status(400).json({
          success: false,
          message: "Bio cannot exceed 160 characters"
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      {
        new: true,
        runValidators: true
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "That username is already taken"
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
};

// UPLOAD MY AVATAR
export const uploadMyAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image to upload"
      });
    }

    const profilePicture = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profilePicture } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: user
    });
  } catch (error) {
    console.error("Upload avatar error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile picture"
    });
  }
};



const getMyFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate(
        "followers",
        "name username bio profilePicture"
      )
      .select("followers");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Followers retrieved successfully",
      data: user.followers
    });
  } catch (error) {
    console.error("Get followers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve followers"
    });
  }
};

const getMyFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate(
        "following",
        "name username bio profilePicture"
      )
      .select("following");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Following list retrieved successfully",
      data: user.following
    });
  } catch (error) {
    console.error("Get following error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve following list"
    });
  }
};

// FOLLOW ANOTHER USER
const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    if (userId.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself"
      });
    }

    const targetUser = await User.findById(userId).select(
      "_id name username followers following"
    );

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User to follow was not found"
      });
    }

    const currentUser = await User.findById(currentUserId)
      .select("_id following");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Your user account was not found"
      });
    }

    const alreadyFollowing = currentUser.following.some(
      (id) => id.toString() === userId.toString()
    );

    if (!alreadyFollowing) {
      await Promise.all([
        User.updateOne(
          { _id: currentUserId },
          { $addToSet: { following: targetUser._id } }
        ),
        User.updateOne(
          { _id: targetUser._id },
          { $addToSet: { followers: currentUserId } }
        )
      ]);
    }

    const [updatedTarget, updatedCurrent] = await Promise.all([
      User.findById(userId).select("followers following"),
      User.findById(currentUserId).select("followers following")
    ]);

    return res.status(200).json({
      success: true,
      message: alreadyFollowing
        ? "You are already following this user"
        : "User followed successfully",
      data: {
        isFollowing: true,
        followersCount: updatedTarget.followers.length,
        followingCount: updatedCurrent.following.length
      }
    });
  } catch (error) {
    console.error("Follow user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to follow user"
    });
  }
};

// UNFOLLOW A USER
const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    if (userId.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot unfollow yourself"
      });
    }

    const targetUser = await User.findById(userId).select("_id");

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User to unfollow was not found"
      });
    }

    await Promise.all([
      User.updateOne(
        { _id: currentUserId },
        { $pull: { following: targetUser._id } }
      ),
      User.updateOne(
        { _id: targetUser._id },
        { $pull: { followers: currentUserId } }
      )
    ]);

    const [updatedTarget, updatedCurrent] = await Promise.all([
      User.findById(userId).select("followers following"),
      User.findById(currentUserId).select("followers following")
    ]);

    return res.status(200).json({
      success: true,
      message: "User unfollowed successfully",
      data: {
        isFollowing: false,
        followersCount: updatedTarget.followers.length,
        followingCount: updatedCurrent.following.length
      }
    });
  } catch (error) {
    console.error("Unfollow user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to unfollow user"
    });
  }
};

export {
  getMyFollowers,
  getMyFollowing,
  followUser,
  unfollowUser
};



