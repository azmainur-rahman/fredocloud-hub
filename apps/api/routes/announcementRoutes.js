import express from "express";
import {
  createAnnouncement,
  createAnnouncementComment,
  deleteAnnouncement,
  getAnnouncement,
  getAnnouncements,
  toggleAnnouncementReaction,
  updateAnnouncement,
} from "../controllers/announcementController.js";
import { protect, requireAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(protect, getAnnouncements)
  .post(protect, requireAdmin, createAnnouncement);
router
  .route("/:announcementId")
  .get(protect, getAnnouncement)
  .put(protect, requireAdmin, updateAnnouncement)
  .delete(protect, requireAdmin, deleteAnnouncement);
router.post("/:announcementId/comments", protect, createAnnouncementComment);
router.post("/:announcementId/reactions", protect, toggleAnnouncementReaction);

export default router;
