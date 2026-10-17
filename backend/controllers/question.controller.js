import {
    createQuestion as createQuestionService,
    getAllQuestions as getAllQuestionsService,
    getQuestionById as getQuestionByIdService,
    updateQuestion as updateQuestionService,
    deleteQuestion as deleteQuestionService
} from "../services/question.service.js";

// CREATE QUESTION
export const createQuestion = async (req, res) => {
    try {
        const { title, body, tags } = req.body || {};

        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Question title is required"
            });
        }

        if (title.trim().length < 10 || title.trim().length > 200) {
            return res.status(400).json({
                success: false,
                message: "Question title must be between 10 and 200 characters"
            });
        }

        if (typeof body !== "string" || !body.trim()) {
            return res.status(400).json({
                success: false,
                message: "Question details are required"
            });
        }

        if (body.trim().length > 10000) {
            return res.status(400).json({
                success: false,
                message: "Question details cannot exceed 10,000 characters"
            });
        }

        if (tags !== undefined && !Array.isArray(tags)) {
            return res.status(400).json({
                success: false,
                message: "Tags must be an array of strings"
            });
        }

        const normalizedTags = (tags || []).map((tag) =>
            typeof tag === "string" ? tag.trim().toLowerCase() : ""
        );

        if (
            normalizedTags.some((tag) => !tag) ||
            normalizedTags.length > 5
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide between 0 and 5 valid, non-empty tags"
            });
        }

        const uniqueTags = [...new Set(normalizedTags)];

        const question = await createQuestionService({
            authorId: req.user._id,
            title: title.trim(),
            body: body.trim(),
            tags: uniqueTags
        });

        return res.status(201).json({
            success: true,
            message: "Question created successfully",
            data: question
        });
    } catch (error) {
        console.error("Create question error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to create question"
        });
    }
};

// GET ALL QUESTIONS
export const getAllQuestions = async (req, res) => {
    try {
        const { page = 1, limit = 10, tag } = req.query;

        const result = await getAllQuestionsService({
            page,
            limit,
            tag
        });

        return res.status(200).json({
            success: true,
            message: "Questions retrieved successfully",
            data: result.questions,
            pagination: result.pagination
        });
    } catch (error) {
        console.error("Get questions error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve questions"
        });
    }
};

// GET SINGLE QUESTION
export const getQuestionById = async (req, res) => {
    try {
        const question = await getQuestionByIdService(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Question retrieved successfully",
            data: question
        });
    } catch (error) {
        console.error("Get question error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to retrieve question"
        });
    }
};

// UPDATE QUESTION
export const updateQuestion = async (req, res) => {
    try {
        const { title, body, tags } = req.body || {};

        if (
            title === undefined &&
            body === undefined &&
            tags === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide a title, body, or tags to update"
            });
        }

        if (title !== undefined) {
            if (
                typeof title !== "string" ||
                title.trim().length < 10 ||
                title.trim().length > 200
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Question title must be between 10 and 200 characters"
                });
            }
        }

        if (body !== undefined) {
            if (
                typeof body !== "string" ||
                !body.trim() ||
                body.trim().length > 10000
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Question details must be non-empty and no longer than 10,000 characters"
                });
            }
        }

        let uniqueTags;

        if (tags !== undefined) {
            if (!Array.isArray(tags)) {
                return res.status(400).json({
                    success: false,
                    message: "Tags must be an array of strings"
                });
            }

            const normalizedTags = tags.map((tag) =>
                typeof tag === "string" ? tag.trim().toLowerCase() : ""
            );

            if (
                normalizedTags.some((tag) => !tag) ||
                normalizedTags.length > 5
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Provide between 0 and 5 valid, non-empty tags"
                });
            }

            uniqueTags = [...new Set(normalizedTags)];
        }

        const question = await updateQuestionService({
            questionId: req.params.id,
            userId: req.user._id,
            title: title === undefined ? undefined : title.trim(),
            body: body === undefined ? undefined : body.trim(),
            tags: uniqueTags
        });

        return res.status(200).json({
            success: true,
            message: "Question updated successfully",
            data: question
        });
    } catch (error) {
        console.error("Update question error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to update question"
        });
    }
};

// DELETE QUESTION
export const deleteQuestion = async (req, res) => {
    try {
        await deleteQuestionService({
            questionId: req.params.id,
            userId: req.user._id
        });

        return res.status(200).json({
            success: true,
            message: "Question deleted successfully"
        });
    } catch (error) {
        console.error("Delete question error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to delete question"
        });
    }
};
