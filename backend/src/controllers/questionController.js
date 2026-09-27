import Question from "../models/Question.js";

export const createQuestion = async (req, res) => {
  try {
    const { title, description, difficulty, testCases, tags } = req.body;

    const question = await Question.create({ title, description, difficulty, testCases, tags });

    res.status(201).json({ message: "Question added", question });
  } catch (error) {
    res.status(500).json({ message: "Failed to add question", error: error.message });
  }
};

// ADMIN views all questions, optionally filtered by difficulty
export const getQuestions = async (req, res) => {
  try {
    const { difficulty } = req.query; // e.g. /api/questions?difficulty=easy
    const filter = difficulty ? { difficulty } : {};

    const questions = await Question.find(filter);
    res.status(200).json({ count: questions.length, questions });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch questions", error: error.message });
  }
};

// ADMIN edits a question
export const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findByIdAndUpdate(questionId, req.body, { new: true });
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json({ message: "Question updated", question });
  } catch (error) {
    res.status(500).json({ message: "Failed to update question", error: error.message });
  }
};

// ADMIN deletes a question
export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findByIdAndDelete(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json({ message: "Question deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete question", error: error.message });
  }
};