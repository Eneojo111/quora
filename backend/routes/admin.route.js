
import express from "express";
import mongoose from "mongoose";

import User from "../models/user.js";
import Post from "../models/post.js";
import Question from "../models/question.js";
import Report from "../models/report.js";

import { protect } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

import {
  sendSuccess,
  sendError
} from "../utils/apiResponse.js";

const router = express.Router();

// Submit a report.
// Any authenticated user can report content.
router.post("/reports", protect, async (req, res) => {
  try {
    const { targetType, targetId, reason, details } = req.body;

    if (!["post", "question", "answer"].includes(targetType)) {
      return sendError(res, {
        statusCode: 400,
        message: "Invalid report target type."
      });
    }

    if (!mongoose.isValidObjectId(targetId)) {
      return sendError(res, {
        statusCode: 400,
        message: "Invalid content ID."
      });
    }

    if (!reason || !reason.trim()) {
      return sendError(res, {
        statusCode: 400,
        message: "A report reason is required."
      });
    }

    const report = await Report.create({
      reportedBy: req.user._id,
      targetType,
      targetId,
      reason: reason.trim(),
      details: details || ""
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: "Report submitted successfully.",
      data: report
    });
  } catch (error) {
    console.error("Submit report error:", error);

    return sendError(res, {
      message: "Unable to submit report."
    });
  }
});

// All routes below require administrator privileges.
router.use(protect, adminOnly);

// Dashboard statistics.
router.get("/overview", async (req, res) => {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalPosts,
      totalQuestions,
      totalReports,
      pendingReports
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "admin" }),
      Post.countDocuments(),
      Question.countDocuments(),
      Report.countDocuments(),
      Report.countDocuments({ status: "pending" })
    ]);

    return sendSuccess(res, {
      message: "Admin statistics retrieved successfully.",
      data: {
        totalUsers,
        totalAdmins,
        totalPosts,
        totalQuestions,
        totalReports,
        pendingReports
      }
    });
  } catch (error) {
    console.error("Admin overview error:", error);

    return sendError(res, {
      message: "Unable to retrieve dashboard statistics."
    });
  }
});

// List and search users.
router.get("/users", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const search = String(req.query.search || "").trim();

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
          ]
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      User.countDocuments(filter)
    ]);

    return sendSuccess(res, {
      message: "Users retrieved successfully.",
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get admin users error:", error);

    return sendError(res, {
      message: "Unable to retrieve users."
    });
  }
});

// Change a user's role.
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, {
        statusCode: 400,
        message: "Invalid user ID."
      });
    }

    if (!["user", "admin"].includes(role)) {
      return sendError(res, {
        statusCode: 400,
        message: "Role must be either user or admin."
      });
    }

    if (String(req.user._id) === id) {
      return sendError(res, {
        statusCode: 400,
        message: "You cannot change your own administrator role."
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      {
        returnDocument: "after",
        runValidators: true
      }
    ).select("-password");

    if (!updatedUser) {
      return sendError(res, {
        statusCode: 404,
        message: "User not found."
      });
    }

    return sendSuccess(res, {
      message: "User role updated successfully.",
      data: updatedUser
    });
  } catch (error) {
    console.error("Update user role error:", error);

    return sendError(res, {
      message: "Unable to update user role."
    });
  }
});

// List posts.
router.get("/posts", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const [posts, total] = await Promise.all([
      Post.find()
        .populate("author", "name username email profilePicture")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Post.countDocuments()
    ]);

    return sendSuccess(res, {
      message: "Posts retrieved successfully.",
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get admin posts error:", error);

    return sendError(res, {
      message: "Unable to retrieve posts."
    });
  }
});

// Delete a post.
router.delete("/posts/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return sendError(res, {
        statusCode: 400,
        message: "Invalid post ID."
      });
    }

    const post = await Post.findByIdAndDelete(req.params.id);

    if (!post) {
      return sendError(res, {
        statusCode: 404,
        message: "Post not found."
      });
    }

    return sendSuccess(res, {
      message: "Post deleted successfully.",
      data: { id: post._id }
    });
  } catch (error) {
    console.error("Delete admin post error:", error);

    return sendError(res, {
      message: "Unable to delete post."
    });
  }
});

// List reports.
router.get("/reports", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const filter = {};

    if (
      ["pending", "reviewed", "resolved", "dismissed"].includes(
        req.query.status
      )
    ) {
      filter.status = req.query.status;
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate("reportedBy", "name username email")
        .populate("reviewedBy", "name username")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Report.countDocuments(filter)
    ]);

    return sendSuccess(res, {
      message: "Reports retrieved successfully.",
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get reports error:", error);

    return sendError(res, {
      message: "Unable to retrieve reports."
    });
  }
});

// Update report status.
router.patch("/reports/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNote } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, {
        statusCode: 400,
        message: "Invalid report ID."
      });
    }

    const allowedStatuses = [
      "pending",
      "reviewed",
      "resolved",
      "dismissed"
    ];

    if (!allowedStatuses.includes(status)) {
      return sendError(res, {
        statusCode: 400,
        message: "Invalid report status."
      });
    }

    const report = await Report.findByIdAndUpdate(
      id,
      {
        status,
        reviewedBy: req.user._id,
        resolutionNote: resolutionNote || ""
      },
      {
        returnDocument: "after",
        runValidators: true
      }
    );

    if (!report) {
      return sendError(res, {
        statusCode: 404,
        message: "Report not found."
      });
    }

    return sendSuccess(res, {
      message: "Report updated successfully.",
      data: report
    });
  } catch (error) {
    console.error("Update report error:", error);

    return sendError(res, {
      message: "Unable to update report."
    });
  }
});

export default router;
