import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Session from "../models/session.js";


export const protect = async (req, res, next) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;

    // Check authorization header
    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Check session
    const userSession = await Session.findOne({
      sessionId: decoded.sessionId,
      user: decoded.userId
    });

    // Make sure session exists
    if (!userSession) {
      return res.status(401).json({
        success: false,
        message: "Session is invalid or has been logged out"
      });
    }

    // Check session expiration
    if (userSession.expiresAt < new Date()) {
      await Session.deleteOne({
        sessionId: decoded.sessionId
      });

      return res.status(401).json({
        success: false,
        message: "Session has expired"
      });
    }

    // Find user
    const user = await User.findById(
      decoded.userId
    ).select("-password");

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists"
      });
    }

    // Attach authenticated user and session
    req.user = user;
    req.session = userSession;

    // Continue to the protected route
    next();

  } catch (error) {
    console.error(
      "Authentication error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};
