import express from "express";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  getAnnouncements,
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

export default router;
