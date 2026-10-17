import express from "express";

import {
    getVoteSummary,
    castVote
} from "../controllers/vote.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public: retrieve vote counts
router.get("/:targetType/:targetId", getVoteSummary);

// Protected: upvote or downvote
router.post("/:targetType/:targetId", protect, castVote);

export default router;
