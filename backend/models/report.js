
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    targetType: {
      type: String,
      enum: ["post", "question", "answer"],
      required: true
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    details: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000
    },

    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
      index: true
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    resolutionNote: {
      type: String,
      default: "",
      maxlength: 1000
    }
  },
  {
    timestamps: true
  }
);

reportSchema.index({ createdAt: -1 });

const Report =
  mongoose.models.Report ||
  mongoose.model("Report", reportSchema);

export default Report;
