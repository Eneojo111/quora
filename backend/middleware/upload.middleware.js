
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const postDir = path.join(__dirname, "..", "uploads", "posts");
const avatarDir = path.join(__dirname, "..", "uploads", "avatars");

fs.mkdirSync(postDir, { recursive: true });
fs.mkdirSync(avatarDir, { recursive: true });

const createStorage = (destination) =>
  multer.diskStorage({
    destination: (req, file, cb) => cb(null, destination),
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();

      cb(null, `${crypto.randomUUID()}${extension}`);
    }
  });

const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }

  cb(new Error("Only image files are allowed"));
};

// Post uploads: multipart field "images", maximum 5 files.
export const uploadPostImages = multer({
  storage: createStorage(postDir),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5
  }
}).array("images", 5);

// Avatar upload: multipart field "avatar", one file.
export const uploadAvatar = multer({
  storage: createStorage(avatarDir),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  }
}).single("avatar");
