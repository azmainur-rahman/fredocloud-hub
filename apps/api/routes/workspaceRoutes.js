import express from "express";
import multer from "multer";
import {
  createWorkspace,
  deleteWorkspace,
  getAuditLogs,
  getWorkspaceMembers,
  getUserWorkspaces,
  inviteMember,
  updateWorkspace,
} from "../controllers/workspaceController.js";
import { uploadAttachment } from "../controllers/userController.js";
import { protect, requireAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router
  .route("/")
  .get(protect, getUserWorkspaces)
  .post(protect, createWorkspace);
router.get("/:workspaceId/members", protect, getWorkspaceMembers);
router.get("/:workspaceId/audit-logs", protect, getAuditLogs);
router.post(
  "/:workspaceId/attachments",
  protect,
  requireAdmin,
  upload.single("attachment"),
  uploadAttachment,
);
router.post("/:workspaceId/invite", protect, requireAdmin, inviteMember);
router.put("/:workspaceId", protect, requireAdmin, updateWorkspace);
router.delete("/:workspaceId", protect, requireAdmin, deleteWorkspace);

export default router;
