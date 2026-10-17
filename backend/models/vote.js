
import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    targetType: {
      type: String,
      enum: ["Post", "Question", "Answer", "Comment"],
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    value: {
      type: Number,
      enum: [1, -1],
      required: true
    }
  },
  { timestamps: true }
);

// One vote per user per content item.
voteSchema.index(
  { user: 1, targetType: 1, targetId: 1 },
  { unique: true }
);

voteSchema.index({ targetType: 1, targetId: 1 });

const Vote = mongoose.model("Vote", voteSchema);

export default Vote;

