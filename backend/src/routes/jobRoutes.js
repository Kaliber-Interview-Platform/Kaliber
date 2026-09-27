import express from "express";

import { createJobPost,getJobPostById,getAllJobPosts,updateJobPost,deleteJobPost } from "../controller/jobPostController.js";

import authorizeRoles from "../middlewares/roleMiddleware.js";
import protect from "../middlewares/Protect.js";

const router = express.Router()

// Anyone who logged in can view jobs

router.get("/",protect,getAllJobPosts);
router.get("/:id",protect,getJobPostById);

// only admin can create jobs

router.post("/",protect,authorizeRoles("admin"),createJobPost);

// only admin can update jobs

router.put("/:id",protect,authorizeRoles("admin"),updateJobPost);

// only admin can delete jobs

router.delete("/:id",protect,authorizeRoles("admin"),deleteJobPost);

export default router;