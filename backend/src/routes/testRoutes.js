import express from "express";
import protect from "../middlewares/Protect.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { assignTest, getMyTest, submitAnswer, completeTest } from "../controllers/testController.js";

const router = express.Router();

router.post("/assign/:applicationId", protect, roleMiddleware("admin"), assignTest);
router.get("/:testInstanceId", protect, roleMiddleware("candidate"), getMyTest);
router.post("/:testInstanceId/question/:questionId", protect, roleMiddleware("candidate"), submitAnswer);
router.post("/:testInstanceId/complete", protect, roleMiddleware("candidate"), completeTest);

export default router;