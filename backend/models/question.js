import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    title: {
        type: String,
        required: [true, "Question title is required"],
        trim: true,
        minlength: [10, "Question title must be at least 10 characters"],
        maxlength: [200, "question title cannot exceed 200 characters"]
    },

    body: {
        type: String,
        required: [true, "Question details are required"],
        trim: true,
        maxlength: [10000, "Question details cannot exceed 10,000 characters"]
    },

    tags: {
        type: [String],
        default: [],
        validate: {
            validator: (tags) => tags.length <= 5,
            message: "A question cannot have more than 5 tags"
        }
    }
},
    {
        timestamps: true
    }
);

questionSchema.index({ createdAt: -1 });

const Question = mongoose.model("Question", questionSchema);

export default Question;
