
import mongoose from "mongoose";
import Vote from "../models/vote.js";
import Post from "../models/post.js";
import Question from "../models/question.js";
import Answer from "../models/answer.js";
import Comment from "../models/comment.js";
import { createNotification } from "./notification.service.js";

const contentModels = {
  post: { model: Post, name: "Post" },
  question: { model: Question, name: "Question" },
  answer: { model: Answer, name: "Answer" },
  comment: { model: Comment, name: "Comment" }
};



const getTarget = (targetType) => {
  const target = contentModels[targetType?.toLowerCase()];

  if (!target) {
    const error = new Error(
      "Invalid content type. Use post, question, answer, or comment."
    );
    error.statusCode = 400;
    throw error;
  }

  return target;
};

const validateId = (id, label) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error(`Invalid ${label} ID`);
    error.statusCode = 400;
    throw error;
  }
};

const ensureTargetExists = async (target, targetId) => {
  const exists = await target.model.exists({ _id: targetId });

  if (!exists) {
    const error = new Error(`${target.name} not found`);
    error.statusCode = 404;
    throw error;
  }
};

export const getVoteSummary = async ({
  targetType,
  targetId,
  userId
}) => {
  const target = getTarget(targetType);

  validateId(targetId, "content");
  await ensureTargetExists(target, targetId);

  const filter = {
    targetType: target.name,
    targetId
  };

  const [upvotes, downvotes, userVote] = await Promise.all([
    Vote.countDocuments({ ...filter, value: 1 }),
    Vote.countDocuments({ ...filter, value: -1 }),
    userId
      ? Vote.findOne({ ...filter, user: userId })
          .select("value")
          .lean()
      : Promise.resolve(null)
  ]);

  return {
    upvotes,
    downvotes,
    score: upvotes - downvotes,
    userVote: userVote ? userVote.value : 0
  };
};

export const castVote = async ({
  targetType,
  targetId,
  userId,
  value
}) => {
  const target = getTarget(targetType);

  validateId(targetId, "content");

  if (value !== 1 && value !== -1) {
    const error = new Error(
      "Vote value must be 1 for upvote or -1 for downvote"
    );
    error.statusCode = 400;
    throw error;
  }

  await ensureTargetExists(target, targetId);

  const filter = {
    user: userId,
    targetType: target.name,
    targetId
  };

  const existingVote = await Vote.findOne(filter);

  let shouldNotify = false;

  if (existingVote && existingVote.value === value) {
    // Clicking the same active button removes the vote.
    await existingVote.deleteOne();
  } else if (existingVote) {
    // Switching from upvote to downvote, or vice versa.
    existingVote.value = value;
    await existingVote.save();
    shouldNotify = true;
  } else {
    await Vote.create({ ...filter, value });
    shouldNotify = true;
  }

  // Do not let a notification failure undo a successful vote.
  if (shouldNotify) {
    try {
      const targetDocument = await target.model
        .findById(targetId)
        .select("author");

      if (targetDocument?.author) {
        const action = value === 1 ? "upvoted" : "downvoted";

        await createNotification({
          recipientId: targetDocument.author,
          actorId: userId,
          type: value === 1 ? "upvote" : "downvote",
          targetType: target.name,
          targetId,
          message: `${action} your ${target.name.toLowerCase()}.`
        });
      }
    } catch (notificationError) {
      console.error(
        "Vote notification error:",
        notificationError
      );
    }
  }

  return getVoteSummary({
    targetType: target.name,
    targetId,
    userId
  });
};

