import Message from "../models/Message.js";

export const sendMessage= async (req,res)=>{
    const msg=await Message.create(req.body);
    res.json(msg);
}

export const getMessages=async(req,res)=>{
    const {user1, user2}= req.query;

    const messages= await Message.find({
        $or: [
            { senderId: user1, receiverId: user2},
            { senderId: user2, receiverId: user1},
        ]
    }).sort("createdAt");

    res.json(messages);
}