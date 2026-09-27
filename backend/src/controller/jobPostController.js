import JobPost from "../models/JobPost.js";
export const createJobPost = async(req,res) => { 
    try{
        const{
            title,
            company,
            location,
            description,
            typeOfEmployment,
            requiredSkills,
            minExperience,
            salary,
            difficultyLevel,
            openings,
            deadline,
            status
        } = req.body;

        if (
            !title || 
            !company || 
            !location || 
            !description || 
            !typeOfEmployment || 
            !requiredSkills|| 
            !salary || 
            !difficultyLevel || 
            !deadline 
        ) {
            return res.status(400).json({message:"Please provide all required fields."});
        }

        const jobPost = await JobPost.create({
            title,
            company,
            location,
            description,
            typeOfEmployment,
            requiredSkills,
            minExperience,
            salary,
            difficultyLevel,
            openings,
            deadline,
            status,
            postedBy : req.user.id
        });

        res.status(201).json({message: "Job Post created Successfully",jobPost});

    } catch(error){
        res.status(500).json({
            message:"Failed to create Job Post.",
            error: error.message
        });
    }
};

export const getAllJobPosts = async(req,res) => {
    try{
        const jobPosts= await JobPost.find().populate("postedBy","name email").sort({createdAt:-1});

        res.status(200).json({
            jobPosts
        });
    } catch (error){
        res.status(500).json({
            message: "Failed to fetch Job Posts.",
            error:error.message
        });
    }
};

export const getJobPostById = async(req,res) => {
    try{
        const jobPost = await JobPost.findById(req.params.id).populate("postedBy","name email");

        if (!jobPost){
            return res.status(404).json({
                message:"Job Post not found."
            });
        }

        res.status(200).json({
            jobPost
        });
    } catch (error){
        res.status(500).json({
            message:"Failed to fetch job post.",
            error:error.message
        });
    }
};

export const updateJobPost = async(req,res) => {
    try{
        const jobPost=await JobPost.findById(req.params.id);

        if (!jobPost){
            return res.status(404).json({
                message: "Job Post not found."
            });
        }

        if (jobPost.postedBy.toString() !==req.user.id){
            return res.status(403).json({
                message:"You are not allowed to update this Job Post."
            });
        }

        const{
            title,
            company,
            location,
            description,
            typeOfEmployment,
            requiredSkills,
            minExperience,
            salary,
            difficultyLevel,
            openings,
            deadline,
            status
        } = req.body;

        if (title) jobPost.title=title;
        if (company) jobPost.company=company;
        if (location) jobPost.location=location;
        if (description) jobPost.description=description;
        if (typeOfEmployment) jobPost.typeOfEmployment=typeOfEmployment;
        if (requiredSkills) jobPost.requiredSkills=requiredSkills;
        if (minExperience) jobPost.minExperience=minExperience;
        if (salary !== undefined) jobPost.salary=salary;
        if (difficultyLevel) jobPost.difficultyLevel=difficultyLevel;
        if (openings) jobPost.openings=openings;
        if (deadline) jobPost.deadline=deadline;
        if (status) jobPost.status=status;

        await jobPost.save();

        res.status(200).json({
            message:"Job Post updated successfully",
            jobPost
        });
    } catch(error){
        res.status(500).json({
            message:"Failed to update job post",
            error:error.message
        });
    }
};

// delete a job post

export const deleteJobPost = async(req,res) => {
    try{
        const jobPost=await JobPost.findById(req.params.id);

        if(!jobPost){
            return res.status(404).json({
                message:"Job post not found"
            });
        }
        if (jobPost.postedBy.toString() !== req.user.id){
            return res.status(403).json({
                message:"You are not allowed to delete this post"
            });
        }

        await JobPost.findByIdAndDelete(req.params.id);

        

        res.status(200).json({
            message:"Job Post deleted successfully."
        });
    } catch(error){
        res.status(500).json({
            message:"Failed to delete Job Post.",
            error:error.message
        });
    }
};

