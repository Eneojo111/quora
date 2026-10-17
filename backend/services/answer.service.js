import mongoose from "mongoose";
import Answer from "../models/answer.js";
import Question from "../models/question.js";
import Vote from "../models/vote.js";
import {createNotification} from "./notification.service.js";


// ADD VOTE SUMMARIES TO ANSWERS
const attachVoteSummaries = async (
  answers,
  userId = null
) => {
  if (!answers.length) {
    return answers;
  }

  const answerIds = answers.map((answer) => answer._id);

  const voteCounts = await Vote.aggregate([
    {
      $match: {
        targetType: "Answer",
        targetId: { $in: answerIds }
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
      targetType: "Answer",
      targetId: { $in: answerIds },
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

  return answers.map((answer) => {
    const id = answer._id.toString();
    const counts = countsMap.get(id);

    const upvotes = counts?.upvotes || 0;
    const downvotes = counts?.downvotes || 0;

    return {
      ...answer,
      voteSummary: {
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        userVote: userVotesMap.get(id) || 0
      }
    };
  });
};

const validateId = (id, label) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error(`Invalid ${label} ID`);
    error.statusCode = 400;
    throw error;
  }
};

// CREATE ANSWER

export const createAnswer = async ({
  questionId,
  authorId,
  body
}) => {
  validateId(questionId, "question");

  const question = await Question.findById(questionId);

  if (!question) {
    const error = new Error("Question not found");
    error.statusCode = 404;
    throw error;
  }

  const answer = await Answer.create({
    question: questionId,
    author: authorId,
    body
  });

  // Notify the person who asked the question.
  try {
    await createNotification({
      recipientId: question.author,
      actorId: authorId,
      type: "answer",
      targetType: "Answer",
      targetId: answer._id,
      message: "answered your question."
    });
  } catch (notificationError) {
    console.error(
      "Answer notification error:",
      notificationError
    );
  }

  return answer.populate(
    "author",
    "name username profilePicture"
  );
};


// GET ANSWERS FOR A QUESTION
export const getAnswersByQuestion = async ({
  questionId,
  page = 1,
  limit = 10,
  userId = null
}) => {
  validateId(questionId, "question");

  const questionExists = await Question.exists({
    _id: questionId
  });

  if (!questionExists) {
    const error = new Error("Question not found");
    error.statusCode = 404;
    throw error;
  }

  const currentPage = Math.max(1, Number(page) || 1);

  const pageLimit = Math.min(
    50,
    Math.max(1, Number(limit) || 10)
  );

  const filter = { question: questionId };
  const skip = (currentPage - 1) * pageLimit;

  const [answers, totalAnswers] = await Promise.all([
    Answer.find(filter)
      .populate("author", "name username profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .lean(),

    Answer.countDocuments(filter)
  ]);

  const answersWithVotes = await attachVoteSummaries(
    answers,
    userId
  );

  return {
    answers: answersWithVotes,
    pagination: {
      currentPage,
      pageLimit,
      totalAnswers,
      totalPages: Math.ceil(totalAnswers / pageLimit)
    }
  };
};

// GET ONE ANSWER
export const getAnswerById = async (
  answerId,
  userId = null
) => {
  validateId(answerId, "answer");

  const answer = await Answer.findById(answerId)
    .populate("author", "name username profilePicture")
    .populate("question", "title")
    .lean();

  if (!answer) {
    const error = new Error("Answer not found");
    error.statusCode = 404;
    throw error;
  }

  const [answerWithVotes] = await attachVoteSummaries(
    [answer],
    userId
  );

  return answerWithVotes;
};

// UPDATE ANSWER
export const updateAnswer = async ({
  answerId,
  userId,
  body
}) => {
  validateId(answerId, "answer");

  const answer = await Answer.findById(answerId);

  if (!answer) {
    const error = new Error("Answer not found");
    error.statusCode = 404;
    throw error;
  }

  if (answer.author.toString() !== userId.toString()) {
    const error = new Error(
      "You are not allowed to update this answer"
    );
    error.statusCode = 403;
    throw error;
  }

  answer.body = body;
  await answer.save();

  return answer.populate(
    "author",
    "name username profilePicture"
  );
};

// DELETE ANSWER
export const deleteAnswer = async ({
  answerId,
  userId
}) => {
  validateId(answerId, "answer");

  const answer = await Answer.findById(answerId);

  if (!answer) {
    const error = new Error("Answer not found");
    error.statusCode = 404;
    throw error;
  }

  if (answer.author.toString() !== userId.toString()) {
    const error = new Error(
      "You are not allowed to delete this answer"
    );
    error.statusCode = 403;
    throw error;
  }

  await answer.deleteOne();

  return true;
};

