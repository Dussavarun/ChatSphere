import groupChatModel from "../models/groupchatmodel.js";

export const createGroupController = async (req, res) => {
  try {
    const { groupchatName, members , createdBy} = req.body;

    if (!groupchatName || !members || !Array.isArray(members) || members.length === 0 || !createdBy) {
      return res.status(400).json({ error: "Group name and members are required." });
    }


    const group = await groupChatModel.create({
      groupchatName,
      createdBy,
      members ,
      messages : []
    });

    return res.status(201).json(group);
  } catch (error) {
    console.error("Error creating group:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
