import express from 'express';
import { getAllUsers,getUser,updateUser, deleteUser } from '../controllers/userController.js';

import authMiddleware from '../middlewares/Protect.js';

const router = express.Router();

router.get("/",getAllUsers); // TEMPORARY CODE
router.get("/profile", authMiddleware, getUser);
router.put("/profile", authMiddleware, updateUser);
router.delete("/profile", authMiddleware, deleteUser);

export default router;