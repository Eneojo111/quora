
import express from "express";
import mongoose from "mongoose";

import User from "../models/user.js";
import Post from "../models/post.js";
import Question from "../models/question.js";
import Report from "../models/report.js";

import {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  permanentlyDeleteUser
} from "../controllers/admin.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

import {
  sendSuccess,
  sendError
} from "../utils/apiResponse.js";

const router = express.Router();


// ==================================================
// SUBMIT REPORT
// Any authenticated user can submit a report.
// ==================================================

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


// ==================================================
// ADMIN PROTECTION
// All routes below require an authenticated admin.
// ==================================================

router.use(protect, adminOnly);


// ==================================================
// DASHBOARD OVERVIEW
// ==================================================

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


// ==================================================
// MANAGE USERS
// ==================================================

// Get all users and search users.
router.get("/users", getAllUsers);

// Change a user's role.
router.patch("/users/:userId/role", updateUserRole);

// Suspend or reactivate a user's account.
router.patch("/users/:userId/status", updateUserStatus);

// Permanently delete a user's account.
router.delete("/users/:userId", permanentlyDeleteUser);


// ==================================================
// MANAGE POSTS
// ==================================================

// Get all posts.
router.get("/posts", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);

    const limit = Math.min(
      50,
      Math.max(1, Number(req.query.limit) || 10)
    );

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
      data: {
        id: post._id
      }
    });

  } catch (error) {
    console.error("Delete admin post error:", error);

    return sendError(res, {
      message: "Unable to delete post."
    });
  }
});


// ==================================================
// MANAGE REPORTS
// ==================================================

// Get all reports.
router.get("/reports", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);

    const limit = Math.min(
      50,
      Math.max(1, Number(req.query.limit) || 10)
    );

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





