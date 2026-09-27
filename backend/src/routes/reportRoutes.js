import express from "express";
import protect from "../middleware/protect.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { getReport } from "../controllers/reportController.js";

const router = express.Router();

router.get("/:applicationId", protect, roleMiddleware("admin"), getReport);

export default router;