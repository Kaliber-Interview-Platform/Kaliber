import TestInstance from "../models/TestInstance.js";
import Application from "../models/Application.js";
import Question from "../models/Question.js";
import JobPost from "../models/JobPost.js";
import { createNotification } from "./notificationController.js";
import { gradeSubmission, LANGUAGE_IDS } from "../utils/judge0.js";

// pre-determined mix per difficulty level - tweak as needed
const difficultyConfig = {
  "easy": { easy: 7, medium: 2, hard: 1 },
  "medium": { easy: 3, medium: 5, hard: 2 },
  "hard": { easy: 2, medium: 3, hard: 5 }
};

const pickRandomQuestions = async (difficulty, count) => {
  if (count === 0) return [];
  return Question.aggregate([
    { $match: { difficulty } },
    { $sample: { size: count } }
  ]);
};

// ADMIN: generates and assigns a test to one candidate's application
export const assignTest = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { difficultyLevel = "medium", duration = 60, questionIds } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const jobPost = await JobPost.findById(application.jobPost);
    if (!jobPost) {
      return res.status(404).json({ message: "Job Post not found" });
    }

    if (jobPost.postedBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to assign a test to this application"
      });
    }

    let allQuestions = [];

    if (Array.isArray(questionIds) && questionIds.length > 0) {
      const selected = await Question.find({ _id: { $in: questionIds } });
      allQuestions = selected;
    } else {
      const config = difficultyConfig[difficultyLevel] || difficultyConfig["medium"];
      const easyQs = await pickRandomQuestions("easy", config.easy);
      const mediumQs = await pickRandomQuestions("medium", config.medium);
      const hardQs = await pickRandomQuestions("hard", config.hard);
      allQuestions = [...easyQs, ...mediumQs, ...hardQs];

      // If bank doesn't have enough questions, grab whatever is available
      if (allQuestions.length === 0) {
        allQuestions = await Question.find({}).limit(5);
      }
    }

    const testInstance = await TestInstance.create({
      application: applicationId,
      candidate: application.candidate,
      difficultyLevel: difficultyLevel in difficultyConfig ? difficultyLevel : "medium",
      duration: Number(duration) || 60,
      status: "not_started",
      questions: allQuestions.map((q) => ({ question: q._id }))
    });

    application.testInstance = testInstance._id;
    application.status = "test_assigned";
    await application.save();

    await createNotification(
      application.candidate,
      `You've been assigned a coding test for "${jobPost.title}". You have ${testInstance.duration} minutes to complete it.`
    );

    res.status(201).json({ message: "Test assigned", testInstance });
  } catch (error) {
    res.status(500).json({ message: "Failed to assign test", error: error.message });
  }
};

// CANDIDATE: fetches their assigned test
export const getMyTest = async (req, res) => {
  try {
    const { testInstanceId } = req.params;

    const testInstance = await TestInstance.findById(testInstanceId)
      .populate("questions.question", "title description difficulty constraints sampleInput sampleOutput timeLimit tags");

    if (!testInstance) {
      return res.status(404).json({ message: "Test not found" });
    }

    if (testInstance.candidate.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your test" });
    }

    // Mark start time and compute expiry only the first time they open it
    if (!testInstance.startedAt) {
      testInstance.startedAt = new Date();
      const durMinutes = testInstance.duration || 60;
      testInstance.expiresAt = new Date(Date.now() + durMinutes * 60 * 1000);
      testInstance.status = "in_progress";
      await testInstance.save();
    } else if (
      testInstance.expiresAt &&
      new Date() > testInstance.expiresAt &&
      testInstance.status !== "completed"
    ) {
      testInstance.status = "expired";
      await testInstance.save();
    }

    res.status(200).json({ testInstance });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch test", error: error.message });
  }
};

// CANDIDATE: submits code for ONE question in their test
export const submitAnswer = async (req, res) => {
  try {
    const { testInstanceId, questionId } = req.params;
    const { code, language = "javascript" } = req.body;

    const testInstance = await TestInstance.findById(testInstanceId);
    if (!testInstance) {
      return res.status(404).json({ message: "Test not found" });
    }

    if (testInstance.completedAt || testInstance.status === "completed") {
      return res.status(400).json({ message: "Test has already been completed" });
    }

    if (testInstance.expiresAt && new Date() > testInstance.expiresAt) {
      testInstance.status = "expired";
      await testInstance.save();
      return res.status(400).json({ message: "Test time has expired" });
    }

    if (testInstance.candidate.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your test" });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const languageId = LANGUAGE_IDS[language.toLowerCase()] || LANGUAGE_IDS.javascript;

    const { passed, results } = await gradeSubmission(code, languageId, question.testCases || []);

    const entry = testInstance.questions.find((q) => q.question.toString() === questionId);
    if (!entry) {
      return res.status(400).json({ message: "This question isn't part of your test" });
    }

    entry.code = code;
    entry.passed = passed;
    entry.submittedAt = new Date();

    await testInstance.save();

    res.status(200).json({ message: "Answer submitted", passed, results });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit answer", error: error.message });
  }
};

// CANDIDATE: marks the whole test as done, computes final score
export const completeTest = async (req, res) => {
  try {
    const { testInstanceId } = req.params;

    const testInstance = await TestInstance.findById(testInstanceId);
    if (!testInstance) {
      return res.status(404).json({ message: "Test not found" });
    }
    if (testInstance.candidate.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your test" });
    }

    testInstance.completedAt = new Date();
    testInstance.status = "completed";
    testInstance.score = testInstance.questions.filter((q) => q.passed).length;
    await testInstance.save();

    const application = await Application.findByIdAndUpdate(
      testInstance.application,
      { status: "test_completed" },
      { new: true }
    );

    if (application) {
      const jobPost = await JobPost.findById(application.jobPost);
      if (jobPost) {
        await createNotification(
          jobPost.postedBy,
          `${req.user.name || "Candidate"} completed the coding test for "${jobPost.title}". Score: ${testInstance.score}/${testInstance.questions.length}`
        );
      }
    }

    res.status(200).json({
      message: "Test completed",
      score: testInstance.score,
      total: testInstance.questions.length
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to complete test", error: error.message });
  }
};