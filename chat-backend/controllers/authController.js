import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res)=> {
    const {name, email, password}= req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User exists"});

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
        name,
        email,
        password: hashedPassword
    });

    res.json({ id: newUser._id, email: newUser.email });
};

export const loginUser= async(req, res) => {
    const {name, email, password}=req.body;

    const exists=await User.findOne({email});
    if (!exists) return res.status(400).json({message: "Invalid credentials"});

    const ok=await bcrypt.compare(password, exists.password);
    if (!ok) return res.status(400).json({message: "Wrong credentials"});

    const token=jwt.sign({id: exists._id}, process.env.JWT_SECRET, {
        expiresIn: "7d",
    })

    res.json({token, exists})
};