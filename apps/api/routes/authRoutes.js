import express from "express";
import {
  getMe,
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/refresh", refreshToken);
router.get("/me", protect, getMe);

export default router;
