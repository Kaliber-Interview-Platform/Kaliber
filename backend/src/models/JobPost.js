import mongoose from "mongoose";

const jobPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requiredSkills: [{ type: String }],

  minExperience: { type: Number, default: 0 },

  difficultyLevel: { type: Number, min: 1, max: 5, required: true },
  openings: { type: Number, default: 1 },
  deadline: { type: Date },

  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["open", "closed"], default: "open" },

  createdAt: { type: Date, default: Date.now }
});

const JobPost = mongoose.model("JobPost", jobPostSchema);
export default JobPost;