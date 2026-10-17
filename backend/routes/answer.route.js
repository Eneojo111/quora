
import express from "express";

import {
  createAnswer,
  getAnswersByQuestion,
  getAnswerById,
  updateAnswer,
  deleteAnswer
} from "../controllers/answer.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public: Get answers for a question
router.get(
  "/question/:questionId",
  getAnswersByQuestion
);

// Protected: Submit an answer to a question
router.post(
  "/question/:questionId",
  protect,
  createAnswer
);

// Public: Get one answer
router.get("/:id", getAnswerById);

// Protected: Update your answer
router.put("/:id", protect, updateAnswer);

// Protected: Delete your answer
router.delete("/:id", protect, deleteAnswer);

export default router;
