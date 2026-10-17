import express from "express";

import {
  createComment,
  getComments,
  updateComment,
  deleteComment
} from "../controllers/comment.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public: get comments for content
router.get("/:targetType/:targetId", getComments);

// Protected: create a comment
router.post("/:targetType/:targetId", protect, createComment);

// Protected: update your own comment
router.put("/:id", protect, updateComment);

// Protected: delete your own comment
router.delete("/:id", protect, deleteComment);

export default router;
