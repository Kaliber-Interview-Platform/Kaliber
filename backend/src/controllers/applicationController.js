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

    if (jobPost.deadline) { // a deadline date should stay open through the end of that day
      const endOfDeadline = new Date(jobPost.deadline);
      endOfDeadline.setUTCHours(23, 59, 59, 999);

      if (new Date() > endOfDeadline) {
        return res.status(400).json({ message: "Application deadline has passed" });
      }
    }

    if (jobPost.status !== "open"){
      return res.status(400).json({
        message:"This job is no longer accepting applications."
      })
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

    await createNotification(
      jobPost.postedBy,
      `${req.user.name || "A candidate"} applied for "${jobPost.title}".`
    );

    res.status(201).json({ message: "Application submitted", application });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You already applied to this job" });
    }
    res.status(500).json({ message: "Failed to apply", error: error.message });
  }
};

// CANDIDATE views their own applications
export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ candidate: req.user.id })
      .populate("jobPost", "title company location difficultyLevel status typeOfEmployment salary deadline")
      .populate("testInstance", "score status duration expiresAt completedAt")
      .sort({ createdAt: -1 });

    res.status(200).json({ applications });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch applications", error: error.message });
  }
};

// ADMIN views all applications for one of their job posts
export const getApplicationsForJobPost = async(req,res) => {
  try {
    const {jobPostId} = req.params;

    const jobPost =  await JobPost.findById(jobPostId);

    if (!jobPost) {
      return res.status(404).json({
        message : "Job Post not found"
      });
    }

    if (jobPost.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        message : "You are not allowed to view applications for this job"
      });
    }

    const applications = await Application.find({
      jobPost: jobPostId
    })
      .populate("candidate", "name email yearsOfExperience jobRole githubUrl projectUrl expectedSalary resumeUrl")
      .populate("testInstance", "score status completedAt difficultyLevel")
      .sort({ createdAt: -1 });

    res.status(200).json({ applications });
  } catch(error) {
    res.status(500).json({
      message : "Failed to fetch applications",
      error : error.message
    });
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

    const application = await Application.findById(applicationId)

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const jobPost = await JobPost.findById(application.jobPost);

    if (!jobPost) {
      return res.status(404).json({
        message:"Job Post not found."
      });
    }

    if (jobPost.postedBy.toString() !== req.user.id){
      return res.status(403).json({
        message:"You are not allowed to update this application"
      });
    }

    application.status = status;

    await application.save();

    await createNotification(application.candidate, `Your application status changed to: ${status}`);

    res.status(200).json({ message: "Status updated", application });
  } catch (error) {
    res.status(500).json({ message: "Failed to update status", error: error.message });
  }
};