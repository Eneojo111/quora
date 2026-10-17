
import express from "express";

import {
  getMyProfile,
  getUserProfile,
  updateMyProfile,
  uploadMyAvatar,
  getMyFollowers,
  getMyFollowing,
  followUser,
  unfollowUser
} from "../controllers/user.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";

const router = express.Router();

// Current user's profile and relationship lists.
router.get("/me", protect, getMyProfile);
router.get("/me/followers", protect, getMyFollowers);
router.get("/me/following", protect, getMyFollowing);

router.patch("/me", protect, updateMyProfile);
router.put("/me", protect, updateMyProfile);

router.patch(
  "/me/avatar",
  protect,
  uploadAvatar,
  uploadMyAvatar
);

// Follow and unfollow another user.
router.post("/:userId/follow", protect, followUser);
router.delete("/:userId/follow", protect, unfollowUser);

// Public profile. Keep this after the specific routes above.
router.get("/:username", getUserProfile);

export default router;

