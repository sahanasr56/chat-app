import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js"
import messageRoutes from "./routes/messageRoutes.js";
import Message from "./models/Message.js";

dotenv.config();
connectDB();

const app=express();
const server= http.createServer(app);

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", messageRoutes);

const io= new Server(server, {
    cors: {
        origin: "*"
    }
});

const onlineUsers = new Map();
io.on("connection", (socket)=>{
    console.log("User Connected:", socket.id);

    socket.on("markAsSeen", async ({senderId, receiverId})=>{
        try {
            await Message.updateMany(
                {senderId, receiverId, seen: false },
                {$set: {seen: true }}
            );

            io.emit("messagesSeen", { senderId, receiverId})
        } catch (error) {
            console.log("Error marking messages as seen", error)
        }
    });

    socket.on("userConnected", (userId)=>{
        onlineUsers.set(userId, socket.id)
        io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });

    socket.on("typing", ({receiverId,senderId})=>{
        io.emit("typing", {receiverId, senderId});
    });

    socket.on("sendMessage", async(message)=>{
        try {
            const savedMessage= await Message.create({
                senderId: message.senderId,
                receiverId: message.receiverId,
                text: message.text,
                seen: false
            });

            io.emit("receiveMessage", savedMessage);
        } catch (error) {
            console.log("Error", error)
        }
    });

    socket.on("disconnect", ()=>{
        console.log("User disconnected", socket.id);

        for(const [userId, socketId] of onlineUsers.entries()) {
            if (socketId===socket.id) {
                onlineUsers.delete(userId);
                break;
            }
        }
        io.emit("onlineUsers", Array.from(onlineUsers.keys()))
    });
});

server.listen(5000, ()=> console.log("Server running on 5000"));