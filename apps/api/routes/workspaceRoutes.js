import express from "express";
import {
  createWorkspace,
  getUserWorkspaces,
} from "../controllers/workspaceController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getUserWorkspaces)
  .post(protect, createWorkspace);

export default router;
