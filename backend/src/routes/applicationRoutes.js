import express from "express";
import protect from "../middlewares/Protect.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import {
  applyToJob,
  getMyApplications,
  getApplicationsForJobPost,
  updateApplicationStatus
} from "../controllers/applicationController.js";

const router = express.Router();

router.post("/:jobPostId/apply", protect, roleMiddleware("candidate"), applyToJob);
router.get("/mine", protect, roleMiddleware("candidate"), getMyApplications);
router.get("/jobpost/:jobPostId", protect, roleMiddleware("admin"), getApplicationsForJobPost);
router.patch("/:applicationId/status", protect, roleMiddleware("admin"), updateApplicationStatus);

export default router;