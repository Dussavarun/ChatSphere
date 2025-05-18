import groupMessage from "../models/groupMessage.js";
import groupchatmodel from "../models/groupchatmodel.js";
import mongoose from "mongoose";
export const fetchgroupmessages = async (req, res) => {
  try {
    console.log("Received groupchatId:", req.params.groupchatId);
    if (!mongoose.Types.ObjectId.isValid(req.params.groupchatId)) {
      console.log("Invalid groupchat ID format");
      return res.status(400).json({ error: "Invalid group ID format" });
    }
    
    const group = await groupchatmodel.findById(req.params.groupchatId);
    console.log(`Group found:`, group ? "Yes" : "No");
    
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    
    const messages = await groupMessage.find({ group: group._id })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email");
      
    console.log(`Found ${messages.length} messages for this group`);
    res.json(messages);
  } catch (err) {
    console.error("Error in fetchgroupmessages:", err);
    res.status(500).json({ error: "Could not fetch messages", details: err.message });
  }
};