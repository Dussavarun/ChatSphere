import groupMessage from "../models/groupMessage.js"

export const fetchgroupmessages = async (req , res) =>{
    try{
        const messages = await groupMessage.find({groupName : req.params.groupName}).sort({ timestamp: 1 });;
        res.json(messages)
    } catch (err) {
      res.status(500).json({ error: "Could not fetch messages" });
   }
}