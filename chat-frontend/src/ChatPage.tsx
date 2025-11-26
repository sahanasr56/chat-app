import React, { useEffect, useState } from "react";
import { socket } from "./socket";

export default function ChatPage() {
  const urlParams = new URLSearchParams(window.location.search);

  const senderId = urlParams.get("id") || "user1";
  const receiverId = senderId === "user1" ? "user2" : "user1";

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    // 1️⃣ Load messages from DB
    fetch(`http://localhost:5000/api/messages?user1=${senderId}&user2=${receiverId}`)
      .then(res => res.json())
      .then(data => {
        const msgs = Array.isArray(data) ? data : data.messages;
        setMessages(msgs || []);
      })
      .catch(err => console.log("Error loading messages:", err));
  
    // 2️⃣ Connect socket
    socket.connect();
  
    socket.emit("userConnected", senderId);
  
    // 3️⃣ Mark messages as seen
    socket.emit("markAsSeen", {
      senderId: receiverId,
      receiverId: senderId,
    });
  
    // ---- Socket listeners ----
  
    socket.off("receiveMessage");
    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
  
    socket.off("messagesSeen");
    socket.on("messagesSeen", ({ senderId: s, receiverId: r }) => {
      if (s === senderId && r === receiverId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderId === senderId ? { ...msg, seen: true } : msg
          )
        );
      }
    });
  
    socket.off("typing");
    socket.on("typing", ({ receiverId: rec, senderId: send }) => {
      if (send === receiverId && rec === senderId) {
        setTyping(true);
        setTimeout(() => setTyping(false), 1500);
      }
    });
  
    socket.off("onlineUsers");
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });
  
    return () => {
      socket.off("receiveMessage");
      socket.off("typing");
      socket.off("onlineUsers");
      socket.off("messagesSeen");
      socket.disconnect();
    };
  }, []);
  

  // SEND MESSAGE
  const send = () => {
    if (!text.trim()) return;

    const msg = {
      senderId,
      receiverId,
      text,
      seen: false, // default
    };

    socket.emit("sendMessage", msg);
    setText("");
  };

  return (
    <div style={{ padding: 20 }}>
      {/* HEADER */}
      <h2 style={{ textAlign: "center"}}>
        Chat ({receiverId}) —{" "}
        {onlineUsers.includes(receiverId) ? (
          <span style={{ color: "green" }}>● Online</span>
        ) : (
          <span style={{ color: "red" }}>● Offline</span>
        )}
      </h2>

      {/* MESSAGE BOX */}
      <div
        style={{
          border: "1px solid #ccc",
          height: 350,
          overflowY: "auto",
          padding: 10,
          marginTop: 10,
          marginBottom: 10,
          borderRadius: 10,
          width: "50%",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {messages.map((msg, i) => {
          const isMine = msg.senderId === senderId;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  background: isMine ? "#DCF8C6" : "#fff",
                  padding: "8px 12px",
                  borderRadius: 12,
                  maxWidth: "70%",
                  border: "1px solid #ddd",
                }}
              >
                <div style={{ fontSize: 15 }}>{msg.text}</div>

                {isMine && (
                  <div
                    style={{
                      fontSize: 12,
                      textAlign: "right",
                      marginTop: 4,
                      opacity: 0.7,
                    }}
                  >
                    {msg.seen ? "✓✓" : "✓"}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {typing && (
          <p style={{ color: "gray", fontStyle: "italic" }}>
            {receiverId} is typing...
          </p>
        )}
      </div>

      {/* INPUT */}
      <div style={{ textAlign: "center"}}>
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            socket.emit("typing", { senderId, receiverId });
          }}
          style={{ width: "40%", padding: 8, }}
        />
        <button
          onClick={send}
          style={{
            padding: "8px 16px",
            marginLeft: 10,
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
