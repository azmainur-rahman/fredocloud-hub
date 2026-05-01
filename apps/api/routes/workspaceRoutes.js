import express from "express";
import {
  createWorkspace,
  deleteWorkspace,
  getUserWorkspaces,
  inviteMember,
} from "../controllers/workspaceController.js";
import { protect, requireAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getUserWorkspaces)
  .post(protect, createWorkspace);
router.post("/:workspaceId/invite", protect, requireAdmin, inviteMember);
router.delete("/:workspaceId", protect, requireAdmin, deleteWorkspace);

export default router;
