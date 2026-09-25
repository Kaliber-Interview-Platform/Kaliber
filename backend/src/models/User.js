import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  role: { type: String, enum: ["candidate", "admin"], default: "candidate" },

  yearsOfExperience: { type: Number },
  jobRole: { type: String },
  githubUrl: { type: String },
  projectUrl: { type: String },
  expectedSalary: { type: Number },
  resumeUrl: { type: String },

  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "JobPost" }],

  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User ||  mongoose.model("User", userSchema);
export default User;