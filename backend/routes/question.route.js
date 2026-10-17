import express from "express";

import {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion
} from "../controllers/question.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public: Get all questions
router.get("/", getAllQuestions);

// Public: Get one question
router.get("/:id", getQuestionById);

// Protected: Create a question
router.post("/", protect, createQuestion);

// Protected: Update a question
router.put("/:id", protect, updateQuestion);

// Protected: Delete a question
router.delete("/:id", protect, deleteQuestion);

export default router;
