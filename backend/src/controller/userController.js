import User from "../models/User.js";
import bycrypt from "bcryptjs";

// Get user profile

export const getUser = async(req,res) =>{
    try{
        const user= await User.findById(req.user.id).select('-password');

        if(!user){
            return res.status(404).json({message:"User not found"});
        }

        res.status(200).json({user});
    } catch(error){
        res.status(500).json({message:"Failed to fetch user profile",error:error.message});
    }
}

//Update user profile

export const updateUser = async(req,res) =>{
    try{
        const {name,email,password} = req.body;

        const user = await User.findById(req.user.id);

        if(!user){
            return res.status(404).json({message:"User not found"});
        }

        if (name) {
            user.name = name;
        }

        if (email){
            user.email = email;
        }

        if (password){
            const hashedPassword = await bycrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        await user.save();

        res.status(200).json({message:"User profile updated successfully",
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                role:user.role
            }
        });

    } catch(error){
        res.status(500).json({message:"Failed to update user profile",error:error.message});
    }
}

//Delete user profile

export const deleteUser = async(req,res) =>{
    try{
        const user = await User.findByIdAndDelete(req.user.id);
        
        if(!user){
            return res.status(404).json({message:"User not found"});
        }

        res.status(200).json({message:"User profile deleted successfully"});
    } catch(error){
        res.status(500).json({message:"Failed to delete user profile",error:error.message});
    }
}