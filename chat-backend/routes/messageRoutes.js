import express from "express";
import { sendMessage, getMessages } from "../controllers/messageController.js";
import Message from "../models/Message.js";

const router=express.Router();

router.post("/", sendMessage);
router.get("/", getMessages);

router.get("/messages", async (req,res)=>{
    const {user1, user2 }= req.query;
    const messages=await Message.find({
        $or: [
            {senderId: user1, receiverId: user2},
            {senderId: user2, receiverId: user1},
        ]
    }).sort({createdAt: 1})
    res.json({messages})
})

export default router;