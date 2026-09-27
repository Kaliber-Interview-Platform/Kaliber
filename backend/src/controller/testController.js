import TestInstance from "../models/TestInstance.js";
import Application from "../models/Application.js";
import Question from "../models/Question.js";
import { createNotification } from "./notificationController.js";
import { gradeSubmission, LANGUAGE_IDS } from "../utils/judge0.js";

// pre-determined mix per difficulty level - tweak as needed
const difficultyConfig = {
  1: { easy: 7, medium: 2, hard: 1 },
  2: { easy: 5, medium: 4, hard: 1 },
  3: { easy: 3, medium: 5, hard: 2 },
  4: { easy: 2, medium: 4, hard: 4 },
  5: { easy: 1, medium: 3, hard: 6 }
};

const pickRandomQuestions = async (difficulty, count) => {
  if (count === 0) return [];
  return Question.aggregate([
    { $match: { difficulty } },
    { $sample: { size: count } }
  ]);
};

// ADMIN: generates and assigns a 10-question test to one candidate's application
export const assignTest = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { difficultyLevel } = req.body; // admin picks level 1-5

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const config = difficultyConfig[difficultyLevel];
    if (!config) {
      return res.status(400).json({ message: "Invalid difficulty level" });
    }

    const easyQs = await pickRandomQuestions("easy", config.easy);
    const mediumQs = await pickRandomQuestions("medium", config.medium);
    const hardQs = await pickRandomQuestions("hard", config.hard);
    const allQuestions = [...easyQs, ...mediumQs, ...hardQs];

    const testInstance = await TestInstance.create({
      application: applicationId,
      candidate: application.candidate,
      difficultyLevel,
      questions: allQuestions.map((q) => ({ question: q._id }))
    });

    application.testInstance = testInstance._id;
    application.status = "test_assigned";
    await application.save();

    await createNotification(application.candidate, "You've been assigned a coding test - check it out!");

    res.status(201).json({ message: "Test assigned", testInstance });
  } catch (error) {
    res.status(500).json({ message: "Failed to assign test", error: error.message });
  }
};

// CANDIDATE: fetches their assigned test (question text only, not test cases/answers)
export const getMyTest = async (req, res) => {
  try {
    const { testInstanceId } = req.params;

    const testInstance = await TestInstance.findById(testInstanceId)
      .populate("questions.question", "title description difficulty"); // no testCases/expectedOutput sent to frontend

    if (!testInstance) {
      return res.status(404).json({ message: "Test not found" });
    }

    if (testInstance.candidate.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your test" });
    }

    // mark start time only the first time they open it
    if (!testInstance.startedAt) {
      testInstance.startedAt = new Date();
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
    const { code, language } = req.body; // language: "javascript" | "python" | etc.

    const testInstance = await TestInstance.findById(testInstanceId);
    if (!testInstance) {
      return res.status(404).json({ message: "Test not found" });
    }
    if (testInstance.candidate.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your test" });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const languageId = LANGUAGE_IDS[language];
    if (!languageId) {
      return res.status(400).json({ message: "Unsupported language" });
    }

    const { passed } = await gradeSubmission(code, languageId, question.testCases);

    const entry = testInstance.questions.find((q) => q.question.toString() === questionId);
    if (!entry) {
      return res.status(400).json({ message: "This question isn't part of your test" });
    }

    entry.code = code;
    entry.passed = passed;
    entry.submittedAt = new Date();

    await testInstance.save();

    res.status(200).json({ message: "Answer submitted", passed });
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
    testInstance.score = testInstance.questions.filter((q) => q.passed).length;
    await testInstance.save();

    await Application.findByIdAndUpdate(testInstance.application, { status: "test_completed" });

    res.status(200).json({ message: "Test completed", score: testInstance.score });
  } catch (error) {
    res.status(500).json({ message: "Failed to complete test", error: error.message });
  }
};