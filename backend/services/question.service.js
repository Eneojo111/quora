
import mongoose from "mongoose";
import Question from "../models/question.js";
import Vote from "../models/vote.js";

// ADD VOTE SUMMARIES TO QUESTIONS
const attachVoteSummaries = async (
  questions,
  userId = null
) => {
  if (!questions.length) {
    return questions;
  }

  const questionIds = questions.map(
    (question) => question._id
  );

  const voteCounts = await Vote.aggregate([
    {
      $match: {
        targetType: "Question",
        targetId: { $in: questionIds }
      }
    },
    {
      $group: {
        _id: "$targetId",
        upvotes: {
          $sum: {
            $cond: [{ $eq: ["$value", 1] }, 1, 0]
          }
        },
        downvotes: {
          $sum: {
            $cond: [{ $eq: ["$value", -1] }, 1, 0]
          }
        }
      }
    }
  ]);

  let userVotes = [];

  if (userId) {
    userVotes = await Vote.find({
      targetType: "Question",
      targetId: { $in: questionIds },
      user: userId
    })
      .select("targetId value")
      .lean();
  }

  const countsMap = new Map(
    voteCounts.map((item) => [
      item._id.toString(),
      item
    ])
  );

  const userVotesMap = new Map(
    userVotes.map((vote) => [
      vote.targetId.toString(),
      vote.value
    ])
  );

  return questions.map((question) => {
    const id = question._id.toString();
    const counts = countsMap.get(id);

    const upvotes = counts?.upvotes || 0;
    const downvotes = counts?.downvotes || 0;

    return {
      ...question,
      voteSummary: {
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        userVote: userVotesMap.get(id) || 0
      }
    };
  });
};

// CREATE QUESTION
export const createQuestion = async ({
  authorId,
  title,
  body,
  tags = []
}) => {
  const question = await Question.create({
    author: authorId,
    title,
    body,
    tags
  });

  return question.populate(
    "author",
    "name username profilePicture"
  );
};

// GET ALL QUESTIONS
export const getAllQuestions = async ({
  page = 1,
  limit = 10,
  tag,
  userId = null
} = {}) => {
  const currentPage = Math.max(1, Number(page) || 1);

  const pageLimit = Math.min(
    50,
    Math.max(1, Number(limit) || 10)
  );

  const filter = {};

  if (tag) {
    filter.tags = String(tag).trim().toLowerCase();
  }

  const skip = (currentPage - 1) * pageLimit;

  const [questions, totalQuestions] = await Promise.all([
    Question.find(filter)
      .populate("author", "name username profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .lean(),

    Question.countDocuments(filter)
  ]);

  const questionsWithVotes = await attachVoteSummaries(
    questions,
    userId
  );

  return {
    questions: questionsWithVotes,
    pagination: {
      currentPage,
      pageLimit,
      totalQuestions,
      totalPages: Math.ceil(totalQuestions / pageLimit)
    }
  };
};

// GET SINGLE QUESTION
export const getQuestionById = async (
  questionId,
  userId = null
) => {
  if (!mongoose.isValidObjectId(questionId)) {
    const error = new Error("Invalid question ID");
    error.statusCode = 400;
    throw error;
  }

  const question = await Question.findById(questionId)
    .populate("author", "name username profilePicture")
    .lean();

  if (!question) {
    const error = new Error("Question not found");
    error.statusCode = 404;
    throw error;
  }

  const [questionWithVotes] = await attachVoteSummaries(
    [question],
    userId
  );

  return questionWithVotes;
};

// UPDATE QUESTION
export const updateQuestion = async ({
  questionId,
  userId,
  title,
  body,
  tags
}) => {
  if (!mongoose.isValidObjectId(questionId)) {
    const error = new Error("Invalid question ID");
    error.statusCode = 400;
    throw error;
  }

  const question = await Question.findById(questionId);

  if (!question) {
    const error = new Error("Question not found");
    error.statusCode = 404;
    throw error;
  }

  if (question.author.toString() !== userId.toString()) {
    const error = new Error(
      "You are not allowed to update this question"
    );
    error.statusCode = 403;
    throw error;
  }

  if (title !== undefined) question.title = title;
  if (body !== undefined) question.body = body;
  if (tags !== undefined) question.tags = tags;

  await question.save();

  return question.populate(
    "author",
    "name username profilePicture"
  );
};

// DELETE QUESTION
export const deleteQuestion = async ({
  questionId,
  userId
}) => {
  if (!mongoose.isValidObjectId(questionId)) {
    const error = new Error("Invalid question ID");
    error.statusCode = 400;
    throw error;
  }

  const question = await Question.findById(questionId);

  if (!question) {
    const error = new Error("Question not found");
    error.statusCode = 404;
    throw error;
  }

  if (question.author.toString() !== userId.toString()) {
    const error = new Error(
      "You are not allowed to delete this question"
    );
    error.statusCode = 403;
    throw error;
  }

  await question.deleteOne();

  return true;
};


