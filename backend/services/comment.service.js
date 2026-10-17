
import mongoose from "mongoose";
import Comment from "../models/comment.js";
import Post from "../models/post.js";
import Question from "../models/question.js";
import Answer from "../models/answer.js";

import {
  createNotification
} from "./notification.service.js";

const contentModels = {
  post: { model: Post, name: "Post" },
  question: { model: Question, name: "Question" },
  answer: { model: Answer, name: "Answer" }
};

const getTarget = (targetType) => {
  const target = contentModels[targetType?.toLowerCase()];

  if (!target) {
    const error = new Error(
      "Invalid content type. Use post, question, or answer."
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

const validateBody = (body) => {
  if (typeof body !== "string" || !body.trim()) {
    const error = new Error("Comment content is required");
    error.statusCode = 400;
    throw error;
  }

  if (body.trim().length > 5000) {
    const error = new Error(
      "Comment cannot exceed 5,000 characters"
    );
    error.statusCode = 400;
    throw error;
  }
};

const populateAuthor = (query) =>
  query.populate("author", "name username profilePicture");

const populateComment = (query) =>
  populateAuthor(query).populate({
    path: "parentComment",
    select: "author body",
    populate: {
      path: "author",
      select: "name username profilePicture"
    }
  });

// CREATE A COMMENT OR A REPLY
export const createComment = async ({
  targetType,
  targetId,
  authorId,
  body,
  parentCommentId = null
}) => {
  const target = getTarget(targetType);

  validateId(targetId, "content");
  validateBody(body);

  await ensureTargetExists(target, targetId);

  let parentComment = null;

  if (parentCommentId) {
    validateId(parentCommentId, "parent comment");

    parentComment = await Comment.findById(parentCommentId);

    if (!parentComment) {
      const error = new Error("Parent comment not found");
      error.statusCode = 404;
      throw error;
    }

    // A reply must belong to the same original post,
    // question, or answer as its parent comment.
    if (
      parentComment.targetType !== target.name ||
      parentComment.targetId.toString() !== targetId.toString()
    ) {
      const error = new Error(
        "Parent comment does not belong to this content"
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const comment = await Comment.create({
    targetType: target.name,
    targetId,
    author: authorId,
    body: body.trim(),
    parentComment: parentComment?._id || null
  });

  // Notify the parent commenter for replies.
  // For top-level comments, notify the content author.
  try {
    if (parentComment) {
      await createNotification({
        recipientId: parentComment.author,
        actorId: authorId,
        type: "reply",
        targetType: "Comment",
        targetId: comment._id,
        message: "replied to your comment."
      });
    } else {
      const targetDocument = await target.model
        .findById(targetId)
        .select("author");

      if (targetDocument?.author) {
        await createNotification({
          recipientId: targetDocument.author,
          actorId: authorId,
          type: "comment",
          targetType: target.name,
          targetId,
          message: `commented on your ${target.name.toLowerCase()}.`
        });
      }
    }
  } catch (notificationError) {
    console.error(
      "Comment notification error:",
      notificationError
    );
  }

  return populateComment(Comment.findById(comment._id));
};

// GET COMMENTS FOR A POST, QUESTION, OR ANSWER
export const getComments = async ({
  targetType,
  targetId,
  page = 1,
  limit = 10
}) => {
  const target = getTarget(targetType);

  validateId(targetId, "content");
  await ensureTargetExists(target, targetId);

  const currentPage = Math.max(1, Number(page) || 1);
  const pageLimit = Math.min(
    50,
    Math.max(1, Number(limit) || 10)
  );

  const filter = {
    targetType: target.name,
    targetId
  };

  const [comments, totalComments] = await Promise.all([
    populateComment(
      Comment.find(filter)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * pageLimit)
        .limit(pageLimit)
    ).lean(),

    Comment.countDocuments(filter)
  ]);

  return {
    comments,
    pagination: {
      currentPage,
      pageLimit,
      totalComments,
      totalPages: Math.ceil(totalComments / pageLimit)
    }
  };
};

// UPDATE YOUR COMMENT
export const updateComment = async ({
  commentId,
  userId,
  body
}) => {
  validateId(commentId, "comment");
  validateBody(body);

  const comment = await Comment.findById(commentId);

  if (!comment) {
    const error = new Error("Comment not found");
    error.statusCode = 404;
    throw error;
  }

  if (comment.author.toString() !== userId.toString()) {
    const error = new Error(
      "You are not allowed to update this comment"
    );
    error.statusCode = 403;
    throw error;
  }

  comment.body = body.trim();
  await comment.save();

  return populateComment(Comment.findById(comment._id));
};

// DELETE YOUR COMMENT
export const deleteComment = async ({
  commentId,
  userId
}) => {
  validateId(commentId, "comment");

  const comment = await Comment.findById(commentId);

  if (!comment) {
    const error = new Error("Comment not found");
    error.statusCode = 404;
    throw error;
  }

  if (comment.author.toString() !== userId.toString()) {
    const error = new Error(
      "You are not allowed to delete this comment"
    );
    error.statusCode = 403;
    throw error;
  }

  await comment.deleteOne();

  return true;
};

