import user from '../models/user.js';
import bycrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const register = async (req, res) => {
    try{
        const {name,email,password,role} =   req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const existingUser = await user.findOne({ email });
        if (existingUser){
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bycrypt.hash(password, 10);

        const createUser=await user.create({
            name,email,password:hashedPassword,
            role: role || "candidate"
        });

        res.status(201).json({ message: "User registered successfully",
            createUser:{id : createUser._id, name : createUser.name, email : createUser.email, role : createUser.role}
        });
        
    } catch(error){
        res.status(500).json({ message: "Registration failed", error: error.message });
    }
}

const login = async (req, res) => {
    try{
        const { email, password } = req.body;

        if (!email || !password){
            return res.status(400).json({ message: "Please provide both email and password" });
        }
        // find registered user by email
        const findUser=await user.findOne({email});

        if(!findUser){
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // compare password

        const isPasswordValid = await bycrypt.compare(password, findUser.password);

        if (!isPasswordValid){
            return res.status(400).json({ message: "Invalid email or password" });
        }   

        // create JWT token

        const token = jwt.sign(
            {
                id : findUser._id,
                role : findUser.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message:"Login successful",
            token,
            user : {
                id : findUser._id,
                name : findUser.name,
                email : findUser.email,
                role : findUser.role
            } 
        })
    } catch (error){
        res.status(500).json({ message: "Login failed", error: error.message });
    }
};

export { register, login };


