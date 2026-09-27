import express from "express";
import protect from "../middleware/protect.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { sendAdminMessage, getMyNotifications, markAsRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", protect, getMyNotifications);
router.patch("/:notificationId/read", protect, markAsRead);
router.post("/message", protect, roleMiddleware("admin"), sendAdminMessage); // admin-only

export default router;