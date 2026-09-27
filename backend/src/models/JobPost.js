import mongoose from "mongoose";

const jobPostSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim : true
  },

  company: {
    type:String, 
    required: true,
    trim : true
  },

  location: { 
    type: String, 
    required: true,
    trim : true
  },

  description: { 
    type: String, 
    required: true,
    trim : true
  },
  
  typeOfEmployment: { 
    type: String, 
    enum: ["job","internship"], 
    required: true 
  },

  requiredSkills: { 
    type: [String], 
    required: true 
  },

  minExperience: { 
    type: Number, 
    default: 0 
  },

  salary: {
    type:Number,
    required: true
  },

  difficultyLevel: { 
    type: String, 
    enum: ["easy", "medium", "hard"], 
    required: true 
  },

  openings: { 
    type: Number, 
    default: 1 
  },

  deadline: { 
    type: Date 
  },

  postedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  status: { 
    type: String, 
    enum: ["open", "closed"], 
    default: "open"
  },
},
  {timestamps: true}
);

const JobPost = mongoose.model("JobPost", jobPostSchema);
export default JobPost;