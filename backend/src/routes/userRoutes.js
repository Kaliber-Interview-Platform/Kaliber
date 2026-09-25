import express from 'express';
import { getUser,updateUser, deleteUser } from '../controller/userController.js';

import authMiddleware from '../middlewares/Protect.js';

const router = express.Router();

router.get("/profile", authMiddleware, getUser);
router.put("/profile", authMiddleware, updateUser);
router.delete("/profile", authMiddleware, deleteUser);

export default router;