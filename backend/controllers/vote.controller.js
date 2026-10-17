import {
  getVoteSummary as getVoteSummaryService,
  castVote as castVoteService
} from "../services/vote.service.js";

export const getVoteSummary = async (req, res) => {
  try {
    const summary = await getVoteSummaryService({
      targetType: req.params.targetType,
      targetId: req.params.targetId,
      userId: req.user?._id
    });

    return res.status(200).json({
      success: true,
      message: "Vote summary retrieved successfully",
      data: summary
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve votes"
    });
  }
};

export const castVote = async (req, res) => {
  try {
    const summary = await castVoteService({
      targetType: req.params.targetType,
      targetId: req.params.targetId,
      userId: req.user._id,
      value: req.body?.value
    });

    return res.status(200).json({
      success: true,
      message: "Vote recorded successfully",
      data: summary
    });
  } catch (error) {
    console.error("Cast vote error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to record vote"
    });
  }
};
