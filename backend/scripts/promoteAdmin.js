import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.js";

const promoteAdmin = async () => {
  try {
    const email = process.env.ADMIN_EMAIL;

    if (!email) {
      throw new Error("ADMIN_EMAIL is missing from environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { role: "admin" },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      throw new Error("No account found with that email address");
    }

    console.log("Administrator account successfully created:");
    console.log({
      name: user.name,
      email: user.email,
      role: user.role
    });

  } catch (error) {
    console.error("Admin promotion failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

promoteAdmin();