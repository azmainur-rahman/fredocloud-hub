import express from "express";
import {
  createGoal,
  createGoalUpdate,
  deleteGoal,
  getGoal,
  getGoals,
  updateGoal,
} from "../controllers/goalController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router.route("/").get(protect, getGoals).post(protect, createGoal);
router
  .route("/:goalId")
  .get(protect, getGoal)
  .put(protect, updateGoal)
  .delete(protect, deleteGoal);
router.post("/:goalId/updates", protect, createGoalUpdate);

export default router;
