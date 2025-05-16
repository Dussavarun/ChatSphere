import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema({
    group : {type : mongoose.Schema.Types.ObjectId , ref : 'groupChat' },
    senderId : { type : mongoose.Schema.Types.ObjectId , ref : "User" , required : true},
    text: { type: String, required: function () { return !this.fileUrl; } },
    fileUrl: { type: String },          
    fileName: { type: String } 
    
})


export default mongoose.model("groupMessage" , groupMessageSchema);