
import {
  createAnswer as createAnswerService,
  getAnswersByQuestion as getAnswersByQuestionService,
  getAnswerById as getAnswerByIdService,
  updateAnswer as updateAnswerService,
  deleteAnswer as deleteAnswerService
} from "../services/answer.service.js";

const validateAnswerBody = (body) => {
  if (typeof body !== "string" || !body.trim()) {
    return "Answer content is required";
  }

  if (body.trim().length > 10000) {
    return "Answer cannot exceed 10,000 characters";
  }

  return null;
};

// CREATE ANSWER
export const createAnswer = async (req, res) => {
  try {
    const { body } = req.body || {};
    const validationError = validateAnswerBody(body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const answer = await createAnswerService({
      questionId: req.params.questionId,
      authorId: req.user._id,
      body: body.trim()
    });

    return res.status(201).json({
      success: true,
      message: "Answer submitted successfully",
      data: answer
    });
  } catch (error) {
    console.error("Create answer error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to submit answer"
    });
  }
};

// GET ANSWERS FOR A QUESTION
export const getAnswersByQuestion = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await getAnswersByQuestionService({
      questionId: req.params.questionId,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      message: "Answers retrieved successfully",
      data: result.answers,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Get answers error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve answers"
    });
  }
};

// GET ONE ANSWER
export const getAnswerById = async (req, res) => {
  try {
    const answer = await getAnswerByIdService(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Answer retrieved successfully",
      data: answer
    });
  } catch (error) {
    console.error("Get answer error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve answer"
    });
  }
};

// UPDATE ANSWER
export const updateAnswer = async (req, res) => {
  try {
    const { body } = req.body || {};
    const validationError = validateAnswerBody(body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const answer = await updateAnswerService({
      answerId: req.params.id,
      userId: req.user._id,
      body: body.trim()
    });

    return res.status(200).json({
      success: true,
      message: "Answer updated successfully",
      data: answer
    });
  } catch (error) {
    console.error("Update answer error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update answer"
    });
  }
};

// DELETE ANSWER
export const deleteAnswer = async (req, res) => {
  try {
    await deleteAnswerService({
      answerId: req.params.id,
      userId: req.user._id
    });

    return res.status(200).json({
      success: true,
      message: "Answer deleted successfully"
    });
  } catch (error) {
    console.error("Delete answer error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to delete answer"
    });
  }
};
