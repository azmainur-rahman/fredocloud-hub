import express from "express";
import multer from "multer";
import { uploadAvatar } from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

router.post("/avatar", protect, upload.single("avatar"), uploadAvatar);

export default router;
