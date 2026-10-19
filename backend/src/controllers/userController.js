import User from "../models/User.js";
import bcrypt from "bcryptjs";
import Application from "../models/Application.js";
import JobPost from "../models/JobPost.js";
import Notification from "../models/Notification.js";
import TestInstance from "../models/TestInstance.js";

export const getUser = async(req,res) =>{
    try{
        const user= await User.findById(req.user.id).select('-password');

        if(!user){
            return res.status(404).json({message:"User not found"});
        }

        res.status(200).json({user});
    } catch(error){
        res.status(500).json({message:"Failed to fetch user profile",error:error.message});
    }
}

// Get candidate profile (for admin)
export const getCandidateProfile = async (req, res) => {
  try {
    const candidate = await User.findById(req.params.candidateId).select("-password");

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.status(200).json({ candidate });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch candidate profile",
      error: error.message
    });
  }
};

// Logout handler
export const logout = async (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
};

//Update user profile

export const updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      yearsOfExperience,
      jobRole,
      githubUrl,
      projectUrl,
      expectedSalary,
      resumeUrl
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    if (yearsOfExperience !== undefined) {
      user.yearsOfExperience = yearsOfExperience;
    }

    if (jobRole !== undefined) user.jobRole = jobRole;
    if (githubUrl !== undefined) user.githubUrl = githubUrl;
    if (projectUrl !== undefined) user.projectUrl = projectUrl;
    if (expectedSalary !== undefined) {
      user.expectedSalary = expectedSalary;
    }
    if (resumeUrl !== undefined) user.resumeUrl = resumeUrl;

    await user.save();

    res.status(200).json({
      message: "User profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        yearsOfExperience: user.yearsOfExperience,
        jobRole: user.jobRole,
        githubUrl: user.githubUrl,
        projectUrl: user.projectUrl,
        expectedSalary: user.expectedSalary,
        resumeUrl: user.resumeUrl
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This email is already registered"
      });
    }

    res.status(500).json({
      message: "Failed to update user profile",
      error: error.message
    });
  }
};

//Delete user profile

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
 
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
 
    if (user.role === "admin") {
      const jobIds = await JobPost.find({ postedBy: user._id }).distinct("_id");
      const appIds = await Application.find({ jobPost: { $in: jobIds } }).distinct("_id");
      await TestInstance.deleteMany({ application: { $in: appIds } });
      await Application.deleteMany({ jobPost: { $in: jobIds } });
      await JobPost.deleteMany({ postedBy: user._id });
    } else {
      await TestInstance.deleteMany({ candidate: user._id });
      await Application.deleteMany({ candidate: user._id });
    }
 
    await Notification.deleteMany({
      $or: [{ user: user._id }, { sentBy: user._id }]
    });
 
    await user.deleteOne();
 
    res.status(200).json({ message: "User profile deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete user profile",
      error: error.message
    });
  }
};