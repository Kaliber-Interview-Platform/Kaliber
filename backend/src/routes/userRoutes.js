import express from 'express';
import { getUser, updateUser, deleteUser, getCandidateProfile, logout } from '../controllers/userController.js';
import authMiddleware from '../middlewares/Protect.js';
import authorizeRoles from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get("/profile", authMiddleware, getUser);
router.put("/profile", authMiddleware, updateUser);
router.delete("/profile", authMiddleware, deleteUser);
router.post("/logout", authMiddleware, logout);
router.get("/candidates/:candidateId", authMiddleware, authorizeRoles("admin"), getCandidateProfile);

export default router;