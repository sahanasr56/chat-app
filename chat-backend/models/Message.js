import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: String,
    receiverId: String,
    text: String,
    image: String,
    seen: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);