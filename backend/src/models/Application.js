import mongoose from "mongoose";
 
const applicationSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId,
     ref: "User",
      required: true 
    },

  jobPost: { type: mongoose.Schema.Types.ObjectId,
     ref: "JobPost",
      required: true 
    },
 
  status: {
    type: String,
    enum: ["Applied", "Shortlisted", "Test_assigned", "Test_completed", "Selected", "Rejected"],
    default: "Applied"
  },
 
  testInstance: {
     type: mongoose.Schema.Types.ObjectId, 
    ref: "TestInstance"
   },
 
  appliedAt: { type: Date, default: Date.now }
});
 
const Application = mongoose.model("Application", applicationSchema);
export default Application;
 