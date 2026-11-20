
export const uploadMyAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image to upload",
      });
    }

    const uploadedImage = await uploadToCloudinary(
      req.file.buffer,
      "quora/avatars"
    );

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          profilePicture: uploadedImage.secure_url,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Upload avatar error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile picture",
    });
  }
};

