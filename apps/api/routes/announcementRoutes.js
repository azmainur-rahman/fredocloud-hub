import express from "express";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from "../controllers/announcementController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(protect, getAnnouncements)
  .post(protect, createAnnouncement);
router
  .route("/:announcementId")
  .get(protect, getAnnouncement)
  .put(protect, updateAnnouncement)
  .delete(protect, deleteAnnouncement);

export default router;
