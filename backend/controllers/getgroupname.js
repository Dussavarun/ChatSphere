import groupChatModel from "../models/groupchatmodel.js";

export const groupchatname = async (req , res)=>{
        const group = await groupChatModel.findById(req.params.id);
        if (!group) return res.status(404).json({ error: "Group not found" });
        res.json({name : group.groupchatName});
}