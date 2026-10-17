
import {
  createPost as createPostService,
  getAllPosts as getAllPostsService,
  getPostById as getPostByIdService,
  updatePost as updatePostService,
  deletePost as deletePostService
} from "../services/post.service.js";

// CREATE POST
export const createPost = async (req, res) => {
  try {
    const content = req.body?.content;

    const uploadedImages = (req.files || []).map(
      (file) => `/uploads/posts/${file.filename}`
    );

    if (
      (typeof content !== "string" || !content.trim()) &&
      uploadedImages.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A post must contain text or at least one image"
      });
    }

    if (content !== undefined && typeof content !== "string") {
      return res.status(400).json({
        success: false,
        message: "Post content must be a string"
      });
    }

    if (content && content.trim().length > 10000) {
      return res.status(400).json({
        success: false,
        message: "Post content cannot exceed 10,000 characters"
      });
    }

    const post = await createPostService({
      authorId: req.user._id,
      content: typeof content === "string" ? content.trim() : "",
      images: uploadedImages
    });

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: post
    });
  } catch (error) {
    console.error("Create post error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create post"
    });
  }
};

// GET POSTS
export const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, author } = req.query;

    const result = await getAllPostsService({
      page,
      limit,
      authorId: author || null
    });

    return res.status(200).json({
      success: true,
      message: "Posts retrieved successfully",
      data: result.posts,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Get posts error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve posts"
    });
  }
};

// GET ONE POST
export const getPostById = async (req, res) => {
  try {
    const post = await getPostByIdService(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Post retrieved successfully",
      data: post
    });
  } catch (error) {
    console.error("Get single post error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve post"
    });
  }
};

// UPDATE POST
export const updatePost = async (req, res) => {
  try {
    const content = req.body?.content;
    const images = req.body?.images;

    if (content !== undefined) {
      if (typeof content !== "string" || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: "Post content cannot be empty"
        });
      }

      if (content.trim().length > 10000) {
        return res.status(400).json({
          success: false,
          message: "Post content cannot exceed 10,000 characters"
        });
      }
    }

    if (images !== undefined && !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        message: "Images must be an array"
      });
    }

    if (content === undefined && images === undefined) {
      return res.status(400).json({
        success: false,
        message: "Provide content or images to update"
      });
    }

    const post = await updatePostService({
      postId: req.params.id,
      userId: req.user._id,
      content: content === undefined ? undefined : content.trim(),
      images
    });

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: post
    });
  } catch (error) {
    console.error("Update post error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update post"
    });
  }
};

// DELETE POST
export const deletePost = async (req, res) => {
  try {
    await deletePostService({
      postId: req.params.id,
      userId: req.user._id
    });

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully"
    });
  } catch (error) {
    console.error("Delete post error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to delete post"
    });
  }
};



