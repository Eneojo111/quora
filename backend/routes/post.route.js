
import express from "express";

import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost
} from "../controllers/post.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { uploadPostImages } from "../middleware/upload.middleware.js";

const router = express.Router();

// Public: get all posts, optionally filtered by ?author=USER_ID.
router.get("/", getAllPosts);

// Public: get one post.
router.get("/:id", getPostById);

// Protected: create a post with text and/or images.
router.post("/", protect, uploadPostImages, createPost);

// Protected: update a post.
router.put("/:id", protect, updatePost);

// Protected: delete a post.
router.delete("/:id", protect, deletePost);

export default router;

