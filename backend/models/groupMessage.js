import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'groupChat', 
    required: true, 
    index: true
  },
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true
  },
  text: { 
    type: String, 
    required: function() { 
      return !this.fileUrl; 
    } 
  },
  fileUrl: { type: String },
  fileName: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

export default mongoose.model("groupMessage", groupMessageSchema);