import express from "express";
import protect from "../middlewares/Protect.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import {
  createQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion
} from "../controllers/questionController.js";

const router = express.Router();

// all question-bank management is admin-only - candidates never see raw questions directly
router.post("/", protect, roleMiddleware("admin"), createQuestion);
router.get("/", protect, roleMiddleware("admin"), getQuestions);
router.put("/:questionId", protect, roleMiddleware("admin"), updateQuestion);
router.delete("/:questionId", protect, roleMiddleware("admin"), deleteQuestion);

export default router;