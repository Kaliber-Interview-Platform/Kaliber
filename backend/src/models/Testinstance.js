import mongoose from "mongoose";

const questionResultSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
  code: { type: String },                 
  passed: { type: Boolean, default: false },
  startedAt: { type: Date },             
  submittedAt: { type: Date }            
}, 
{ _id: false });

const testInstanceSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  difficultyLevel: { type: Number, required: true }, 
  questions: [questionResultSchema],                 

  startedAt: { type: Date },
  completedAt: { type: Date }, 

  score: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

const TestInstance = mongoose.model("TestInstance", testInstanceSchema);
export default TestInstance;