import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    members: [String],
});

export default mongoose.model("Conversation", conversationSchema);