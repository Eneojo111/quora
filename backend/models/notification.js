
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: [
        "answer",
        "comment",
        "reply",
        "upvote",
        "downvote"
      ],
      required: true
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
    message: {
      type: String,
      required: true,
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1
});

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

export default Notification;
