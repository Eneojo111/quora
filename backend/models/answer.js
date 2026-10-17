
import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      index: true
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    body: {
      type: String,
      required: [true, "Answer content is required"],
      trim: true,
      minlength: [1, "Answer cannot be empty"],
      maxlength: [
        10000,
        "Answer cannot exceed 10,000 characters"
      ]
    }
  },
  {
    timestamps: true
  }
);

answerSchema.index({ question: 1, createdAt: -1 });

const Answer = mongoose.model("Answer", answerSchema);

export default Answer;
