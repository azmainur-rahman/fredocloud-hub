import express from "express";
import {
  createActionItem,
  deleteActionItem,
  getActionItem,
  getActionItems,
  updateActionItem,
} from "../controllers/actionItemController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router.route("/").get(protect, getActionItems).post(protect, createActionItem);
router
  .route("/:actionItemId")
  .get(protect, getActionItem)
  .put(protect, updateActionItem)
  .delete(protect, deleteActionItem);

export default router;
