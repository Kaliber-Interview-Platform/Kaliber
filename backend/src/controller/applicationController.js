import Application from "../models/Application.js";
import JobPost from "../models/JobPost.js";
import { createNotification } from "./notificationController.js";

export const applyToJob = async (req, res) => {
  try {
    const { jobPostId } = req.params;

    const jobPost = await JobPost.findById(jobPostId);
    if (!jobPost) {
      return res.status(404).json({ message: "Job post not found" });
    }

    const alreadyApplied = await Application.findOne({
      candidate: req.user.id,
      jobPost: jobPostId
    });
    if (alreadyApplied) {
      return res.status(400).json({ message: "You already applied to this job" });
    }

    const application = await Application.create({
      candidate: req.user.id,
      jobPost: jobPostId
    });

    res.status(201).json({ message: "Application submitted", application });
  } catch (error) {
    res.status(500).json({ message: "Failed to apply", error: error.message });
  }
};

// CANDIDATE views their own applications
export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ candidate: req.user.id })
      .populate("jobPost", "title difficultyLevel status");

    res.status(200).json({ applications });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch applications", error: error.message });
  }
};

// ADMIN views all applications for one of their job posts
export const getApplicationsForJobPost = async (req, res) => {
  try {
    const { jobPostId } = req.params;

    const applications = await Application.find({ jobPost: jobPostId })
      .populate("candidate", "name email yearsOfExperience githubUrl expectedSalary");

    res.status(200).json({ applications });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch applications", error: error.message });
  }
};

// ADMIN updates an application's status (shortlist / reject / selected etc.)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    const validStatuses = ["applied", "shortlisted", "test_assigned", "test_completed", "selected", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const application = await Application.findByIdAndUpdate(
      applicationId,
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    await createNotification(application.candidate, `Your application status changed to: ${status}`);

    res.status(200).json({ message: "Status updated", application });
  } catch (error) {
    res.status(500).json({ message: "Failed to update status", error: error.message });
  }
};