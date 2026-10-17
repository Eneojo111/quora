
import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        content: {
            type: String,
            default: "",
            trim: true,
            maxlength: [
                10000,
                "Post content cannot exceed 10,000 characters"
            ]
        },

        images: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

// Show newest posts first when sorting by createdAt.
postSchema.index({ createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

export default Post;