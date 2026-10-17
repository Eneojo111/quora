
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    targetType: {
      type: String,
      enum: ["Post", "Question", "Answer"],
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true
    },
    body: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [
        5000,
        "Comment cannot exceed 5,000 characters"
      ]
    }
  },
  { timestamps: true }
);

commentSchema.index({
  targetType: 1,
  targetId: 1,
  createdAt: -1
});

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;

