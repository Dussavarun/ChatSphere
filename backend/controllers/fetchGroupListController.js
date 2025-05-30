import groupChatModel from "../models/groupchatmodel.js";

export const fetchGroupList = async (req, res) => {
  try {
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    let groups = await groupChatModel.find({
      "members.email": userEmail,
    }).populate({
      path: "lastgroupMessage",
      select: "text senderId createdAt",
      populate: {
        path: "senderId",
        select: "email name",
      },
    });
    // to sort the groups based on the newest message 
    groups = groups.sort((a, b) => {
      const aDate = a.lastgroupMessage?.createdAt || new Date(0);
      const bDate = b.lastgroupMessage?.createdAt || new Date(0);
      return bDate - aDate; 
    });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error fetching group list:", error);
    res.status(500).json({ message: "Server error" });
  }
};
