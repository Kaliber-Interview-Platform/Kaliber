import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
  constraints: { type: String, default: "" },
  sampleInput: { type: String, default: "" },
  sampleOutput: { type: String, default: "" },
  timeLimit: { type: Number, default: 60 },
  testCases: [testCaseSchema],
  tags: [{ type: String }], 

  createdAt: { type: Date, default: Date.now }
});

const Question = mongoose.models.Question || mongoose.model("Question", questionSchema);
export default Question;