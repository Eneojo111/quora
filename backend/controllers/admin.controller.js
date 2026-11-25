
import Session from "../models/session.js";
import mongoose from "mongoose";
import User from "../models/user.js";

// ==========================================
// GET ALL USERS
// ==========================================

export const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const search = String(req.query.search || "").trim();

    const filter = {};

    if (search) {
      // Escape special regex characters in the search text.
      const escapedSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { username: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } }
      ];
    }

    const [
      users,
      filteredUsersCount,
      totalUsers,
      totalAdmins
    ] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),

      User.countDocuments(),

      User.countDocuments({ role: "admin" })
    ]);

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: {
        users,

        statistics: {
          totalUsers,
          totalAdmins,
          totalRegularUsers: totalUsers - totalAdmins
        },

        pagination: {
          currentPage: page,
          totalPages: Math.ceil(filteredUsersCount / limit),
          totalUsers: filteredUsersCount,
          limit
        }
      }
    });

  } catch (error) {
    console.error("Admin get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve users"
    });
  }
};


// ==========================================
// CHANGE A USER'S ROLE
// ==========================================

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either user or admin"
      });
    }

    // Prevent an administrator from changing their own role.
    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own administrator role"
      });
    }

    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Do not remove the last administrator.
    if (targetUser.role === "admin" && role === "user") {
      const adminCount = await User.countDocuments({
        role: "admin"
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "The last administrator cannot be demoted"
        });
      }
    }

    targetUser.role = role;

    await targetUser.save();

    const updatedUser = await User.findById(userId)
      .select("-password")
      .lean();

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: updatedUser
    });

  } catch (error) {
    console.error("Admin update role error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user role"
    });
  }
};


// ==========================================
// SUSPEND OR REACTIVATE A USER
// ==========================================

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isSuspended, suspensionReason } = req.body;

    // Validate user ID.
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    // Validate suspension status.
    if (typeof isSuspended !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isSuspended must be true or false"
      });
    }

    // Prevent an administrator from suspending their own account.
    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot suspend your own account"
      });
    }

    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Protect administrator accounts.
    if (targetUser.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts cannot be suspended"
      });
    }

    // A suspension reason is required.
    if (
      isSuspended &&
      (
        typeof suspensionReason !== "string" ||
        !suspensionReason.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reason for suspending this account"
      });
    }

    // Update suspension information.
    targetUser.isSuspended = isSuspended;

    targetUser.suspensionReason = isSuspended
      ? suspensionReason.trim()
      : "";

    targetUser.suspendedAt = isSuspended
      ? new Date()
      : null;

    await targetUser.save();

    // Invalidate all existing sessions when suspending.
    if (isSuspended) {
      await Session.deleteMany({
        user: targetUser._id
      });
    }

    const updatedUser = await User.findById(userId)
      .select("-password")
      .lean();

    return res.status(200).json({
      success: true,
      message: isSuspended
        ? "User account suspended successfully"
        : "User account reactivated successfully",
      data: updatedUser
    });

  } catch (error) {
    console.error("Admin update user status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user account status"
    });
  }
};


// ==========================================
// PERMANENTLY DELETE A USER ACCOUNT
// ==========================================

export const permanentlyDeleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID.
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    // Prevent an administrator from deleting their own account.
    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own administrator account"
      });
    }

    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Protect administrator accounts.
    if (targetUser.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts cannot be permanently deleted through this endpoint"
      });
    }

    // Remove all sessions belonging to this user.
    await Session.deleteMany({
      user: targetUser._id
    });

    // Permanently delete the user account.
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "User account permanently deleted"
    });

  } catch (error) {
    console.error("Admin permanently delete user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to permanently delete user account"
    });
  }
};

