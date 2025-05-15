import mongoose from "mongoose";

const conversationRoomSchema =  mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "message" }
},
{
    timestamps: true
});

export default mongoose.model("conversationroom" , conversationRoomSchema);
