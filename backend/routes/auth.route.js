import express from "express";

import {
    register,
    login,
    getMe,
    logout,
    // getAll
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";


const router = express.Router();


// Register
router.post("/register", register);


// Login
router.post("/login", login);


// Get currently authenticated user
router.get("/me", protect, getMe);

// router.get("/getAll",getAll)

// logout 
router.post("/logout", protect, logout);




export default router;




