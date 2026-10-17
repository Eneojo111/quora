
import {
  createComment as createCommentService,
  getComments as getCommentsService,
  updateComment as updateCommentService,
  deleteComment as deleteCommentService
} from "../services/comment.service.js";

// CREATE COMMENT
export const createComment = async (req, res) => {
  try {
    const comment = await createCommentService({
      targetType: req.params.targetType,
      targetId: req.params.targetId,
      authorId: req.user._id,
      body: req.body?.body,
      parentCommentId: req.body?.parentCommentId
    });

    return res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: comment
    });
  } catch (error) {
    console.error("Create comment error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create comment"
    });
  }
};

// GET COMMENTS
export const getComments = async (req, res) => {
  try {
    const result = await getCommentsService({
      targetType: req.params.targetType,
      targetId: req.params.targetId,
      page: req.query.page,
      limit: req.query.limit
    });

    return res.status(200).json({
      success: true,
      message: "Comments retrieved successfully",
      data: result.comments,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Get comments error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve comments"
    });
  }
};

// UPDATE COMMENT
export const updateComment = async (req, res) => {
  try {
    const comment = await updateCommentService({
      commentId: req.params.id,
      userId: req.user._id,
      body: req.body?.body
    });

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: comment
    });
  } catch (error) {
    console.error("Update comment error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update comment"
    });
  }
};

// DELETE COMMENT
export const deleteComment = async (req, res) => {
  try {
    await deleteCommentService({
      commentId: req.params.id,
      userId: req.user._id
    });

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully"
    });
  } catch (error) {
    console.error("Delete comment error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to delete comment"
    });
  }
};
