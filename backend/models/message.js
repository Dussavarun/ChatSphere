import mongoose from "mongoose";


const MessageSchema =  mongoose.Schema(
    {
        conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "conversationroom" },
        senderId : { type : mongoose.Schema.Types.ObjectId , ref : "User" , required : true},
        text: { type: String, required: function () { return !this.fileUrl; } },
        fileUrl: { type: String },          
        fileName: { type: String },
         createdAt: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    {
        timestamps: true
    }
)

export default mongoose.model("message" , MessageSchema);