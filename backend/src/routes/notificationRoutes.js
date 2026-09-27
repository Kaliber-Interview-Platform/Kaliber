import express from "express";
import protect from "../middlewares/Protect.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { sendAdminMessage, getMyNotifications, markAsRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", protect, getMyNotifications);
router.patch("/:notificationId/read", protect, markAsRead);
router.post("/message", protect, roleMiddleware("admin"), sendAdminMessage); // admin-only

export default router;