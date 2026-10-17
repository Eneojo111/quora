
import mongoose from "mongoose";
import Post from "../models/post.js";
import Vote from "../models/vote.js";

// Add vote counts and the logged-in user's vote to posts.
const attachVoteSummaries = async (posts, userId = null) => {
  if (!posts.length) return posts;

  const postIds = posts.map((post) => post._id);

  const voteCounts = await Vote.aggregate([
    {
      $match: {
        targetType: "Post",
        targetId: { $in: postIds }
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
      targetType: "Post",
      targetId: { $in: postIds },
      user: userId
    })
      .select("targetId value")
      .lean();
  }

  const countsMap = new Map(
    voteCounts.map((item) => [item._id.toString(), item])
  );

  const userVotesMap = new Map(
    userVotes.map((vote) => [
      vote.targetId.toString(),
      vote.value
    ])
  );

  return posts.map((post) => {
    const id = post._id.toString();
    const counts = countsMap.get(id);
    const upvotes = counts?.upvotes || 0;
    const downvotes = counts?.downvotes || 0;

    return {
      ...post,
      voteSummary: {
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        userVote: userVotesMap.get(id) || 0
      }
    };
  });
};

// CREATE POST
export const createPost = async ({
  authorId,
  content,
  images = []
}) => {
  const post = await Post.create({
    author: authorId,
    content,
    images
  });

  return post.populate("author", "name username profilePicture");
};

// GET POSTS, OPTIONALLY FILTERED BY AUTHOR
export const getAllPosts = async ({
  page = 1,
  limit = 10,
  userId = null,
  authorId = null
} = {}) => {
  const currentPage = Math.max(1, Number(page) || 1);
  const pageLimit = Math.min(50, Math.max(1, Number(limit) || 10));
  const skip = (currentPage - 1) * pageLimit;

  const filter = {};

  if (authorId) {
    if (!mongoose.isValidObjectId(authorId)) {
      const error = new Error("Invalid author ID");
      error.statusCode = 400;
      throw error;
    }

    filter.author = authorId;
  }

  const [posts, totalPosts] = await Promise.all([
    Post.find(filter)
      .populate("author", "name username profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .lean(),

    Post.countDocuments(filter)
  ]);

  const postsWithVotes = await attachVoteSummaries(posts, userId);

  return {
    posts: postsWithVotes,
    pagination: {
      currentPage,
      pageLimit,
      totalPosts,
      totalPages: Math.ceil(totalPosts / pageLimit)
    }
  };
};

// GET SINGLE POST
export const getPostById = async (postId, userId = null) => {
  if (!mongoose.isValidObjectId(postId)) {
    const error = new Error("Invalid post ID");
    error.statusCode = 400;
    throw error;
  }

  const post = await Post.findById(postId)
    .populate("author", "name username profilePicture")
    .lean();

  if (!post) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error;
  }

  const [postWithVotes] = await attachVoteSummaries([post], userId);

  return postWithVotes;
};

// UPDATE POST
export const updatePost = async ({
  postId,
  userId,
  content,
  images
}) => {
  if (!mongoose.isValidObjectId(postId)) {
    const error = new Error("Invalid post ID");
    error.statusCode = 400;
    throw error;
  }

  const post = await Post.findById(postId);

  if (!post) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error;
  }

  if (post.author.toString() !== userId.toString()) {
    const error = new Error("You are not allowed to update this post");
    error.statusCode = 403;
    throw error;
  }

  if (content !== undefined) post.content = content;
  if (images !== undefined) post.images = images;

  await post.save();

  return post.populate("author", "name username profilePicture");
};

// DELETE POST
export const deletePost = async ({ postId, userId }) => {
  if (!mongoose.isValidObjectId(postId)) {
    const error = new Error("Invalid post ID");
    error.statusCode = 400;
    throw error;
  }

  const post = await Post.findById(postId);

  if (!post) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error;
  }

  if (post.author.toString() !== userId.toString()) {
    const error = new Error("You are not allowed to delete this post");
    error.statusCode = 403;
    throw error;
  }

  await post.deleteOne();
  return true;
};

