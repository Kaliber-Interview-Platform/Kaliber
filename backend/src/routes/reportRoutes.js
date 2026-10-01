import express from "express";
import protect from "../middlewares/Protect.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { getReport } from "../controllers/reportController.js";

const router = express.Router();

router.get("/:applicationId", protect, roleMiddleware("admin"), getReport);

export default router;