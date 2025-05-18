import mongoose from 'mongoose';

const groupChatSchema = new mongoose.Schema({
    groupchatName: { type: String, required: true, unique: true, trim: true },

    createdBy: {
        type: String,
        required: true,
        ref: "User"
     },

    members : [{
    email: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["admin", "member"],
        default: "member"
    },
  }],

    createdAt: {
    type: Date,
    default: Date.now
    },

})
export default mongoose.model("groupChat" , groupChatSchema);