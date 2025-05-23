import express from "express";
import mongoose from "mongoose";
import Message from "../models/message.js";
import Conversation from "../models/conversation.room.js";
import User from "../models/User.js";
import { getIo } from "../sockets/chatserver.js";
import multer from "multer";
import { messagedelete } from "../controllers/message.delete.js";
const router = express.Router();


// this function is used to share the videos also
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("video/") || file.mimetype.startsWith("image/") || file.mimetype.startsWith("application/")) {
    cb(null, true); // Accept both videos and images
  } else {
    cb(new Error("Only image and video files are allowed"), false); // Reject other files
  }
};

const storage = multer.memoryStorage();
const upload = multer({   storage, 
  limits: { fileSize: 100 * 1024 * 1024 }, 
  fileFilter,  
});


// Send a message
router.post("/send", upload.single("file") ,async (req, res) => {
  try {
    
    const { senderEmail, receiverEmail, text  } = req.body;
    
    if (!receiverEmail || !senderEmail) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    // Find users by email
    const sender = await User.findOne({ email: senderEmail });
    const receiver = await User.findOne({ email: receiverEmail });
    
    if (!sender || !receiver) {
      return res.status(404).json({ 
        error: `User ${!sender ? senderEmail : receiverEmail} not found` 
      });
    }
    
    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [sender._id, receiver._id] }
    });
    
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [sender._id, receiver._id]
      });
    }
    
    let fileUrl = null;
    let fileName = null;

    if (req.file) {
      const fileData = req.file.buffer.toString("base64"); // converts to a binary string 
      const fileType = req.file.mimetype; // this is used to  get the filetype
      fileUrl = `data:${fileType};base64,${fileData}`; // this is used to create a fileurl using filedata and filetype
      fileName = req.file.originalname;
    }

    // Create message
    const newMessage = await Message.create({
      conversationId: conversation._id,
      senderId: sender._id,
      text : text || "" , fileUrl , fileName
    });
    
    // Update conversation's lastMessage
    conversation.lastMessage = newMessage._id;
    await conversation.save();
    
    // Send via socket.io
    const io = getIo();
    
    if (io) {
      //socke.on in chatwindow.jsx
      io.to(receiverEmail).emit("received-message", {
        message: text || null ,
         fileUrl : fileUrl , 
         fileName : fileName,
        senderEmail,
        conversationId: conversation._id
      });
    }
    
    res.status(201).json({ 
      message: "Message sent successfully", 
      data: newMessage,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get messages for a conversation (only messages with that selected user i mean chats)
router.get("/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Verify conversationId is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }
    
    const messages = await Message.find({ conversationId })
      .populate('senderId', 'email')
      .sort({ createdAt: 1 });
    
    // Format messages for client
    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      text: msg.text,
      fileUrl : msg.fileUrl,
      fileName : msg.fileName,
      senderId: msg.senderId.email,
      createdAt: msg.createdAt
    }));
    
    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.delete('/message-delete/:id',messagedelete);


// Get a single conversation by ID // used in chat window
router.get("/conversation/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Verify conversationId is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }
    
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'email')
      .populate('lastMessage');
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    res.status(200).json(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all conversations for a user
router.get("/conversations/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;
    
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // this is used to get all the conversations where the user is a participant
    const conversations = await Conversation.find({ 
      participants: user._id 
    })
      .populate('participants', 'email')
      .populate({
        path: "lastMessage",
        select: "text createdAt"
      })
      .sort({ updatedAt: -1 });
    
    res.status(200).json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

export default router;