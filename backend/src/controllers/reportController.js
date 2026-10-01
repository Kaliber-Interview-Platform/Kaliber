import JobPost from "../models/JobPost.js";
import Application from "../models/Application.js";

export const getReport = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate("candidate", "name email yearsOfExperience githubUrl projectUrl expectedSalary")
      .populate({
        path: "testInstance",
        populate: { path: "questions.question", select: "title difficulty" }
      });

      if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

      const jobPost = await JobPost.findById(application.jobPost);

      if (!jobPost) {
        return res.status(404).json({
          message : "Job Post not found"
        });
      }

      if (jobPost.postedBy.toString() !== req.user.id){
        return res.status(403).json({
          message:"You are not allowed to view this report"
        });
      }

    if (!application.testInstance) {
      return res.status(400).json({ message: "Candidate has not completed a test yet" });
    }

    const test = application.testInstance;

    // total time in seconds, only if both timestamps exist
    const totalTimeSeconds = test.completedAt && test.startedAt
      ? Math.round((test.completedAt - test.startedAt) / 1000)
      : null;

    // breakdown by difficulty (easy/medium/hard passed vs total)
    const breakdown = { easy: { passed: 0, total: 0 }, medium: { passed: 0, total: 0 }, hard: { passed: 0, total: 0 } };
    test.questions.forEach((q) => {
      const diff = q.question.difficulty;
      breakdown[diff].total += 1;
      if (q.passed) breakdown[diff].passed += 1;
    });

    res.status(200).json({
      candidate: application.candidate,
      applicationStatus: application.status,
      score: test.score,
      totalQuestions: test.questions.length,
      totalTimeSeconds,
      breakdown,
      questions: test.questions // full per-question detail (code, passed, time) if admin wants to drill in
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to build report", error: error.message });
  }
};