
import multer from "multer";

const storage = multer.memoryStorage();

const imageFileFilter = (req, file, callback) => {
  if (!file.mimetype?.startsWith("image/")) {
    return callback(new Error("Only image files are allowed."));
  }

  callback(null, true);
};

const createUpload = (maxFiles) =>
  multer({
    storage,
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: maxFiles,
    },
  });

export const uploadPostImages = createUpload(5).array("images", 5);

export const uploadAvatar = createUpload(1).single("avatar");

