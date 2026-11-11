
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";

// Route imports
import adminRoutes from "./routes/admin.route.js";
import authRoutes from "./routes/auth.route.js";
import postRoutes from "./routes/post.route.js";
import questionRoutes from "./routes/question.route.js";
import answerRoutes from "./routes/answer.route.js";
import voteRoutes from "./routes/vote.route.js";
import commentRoutes from "./routes/comment.route.js";
import userRoutes from "./routes/user.route.js";
import notificationRoutes from "./routes/notification.route.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Normalize origins so that URLs with trailing slashes
// or additional paths are reduced to their actual origin.
const normalizeOrigin = (value) => {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
};

// Allowed frontend origins
const allowedOrigins = new Set(
  [
    "http://localhost:5173",

    // Main production frontend
    "quora-clone-nine-woad.vercel.app",
    // "https://quora-web.vercel.app",

    // Previously used Vercel deployments
    "https://quora-rhhk2cu89-eneojo111s-projects.vercel.app",
    "https://quora-swart.vercel.app",

    // Additional frontend URLs from environment variables
    ...(process.env.CLIENT_URL || "").split(",")
  ]
    .map(normalizeOrigin)
    .filter(Boolean)
);

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {

    // Allow requests without an Origin header
    if (!origin) {
      return callback(null, true);
    }

    const requestOrigin = normalizeOrigin(origin);

    if (requestOrigin && allowedOrigins.has(requestOrigin)) {
      return callback(null, true);
    }

    console.warn("CORS blocked origin:", origin);

    return callback(null, false);
  },

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS"
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization"
  ],

  credentials: true,

  optionsSuccessStatus: 204
};

// Register CORS before API routes and other middleware
// This also handles browser CORS preflight requests.
app.use(cors(corsOptions));

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    }
  })
);

// Request logging
app.use(morgan("dev"));

// Parse incoming request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images and files
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// API routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

// Home route / API health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Quora Clone API is running"
  });
});

// Handle unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

// Start server after connecting to MongoDB
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      console.log(
        "Allowed frontend origins:",
        [...allowedOrigins]
      );
    });

  } catch (error) {
    console.error(
      "Failed to connect to MongoDB:",
      error.message
    );

    process.exit(1);
  }
};

startServer();

