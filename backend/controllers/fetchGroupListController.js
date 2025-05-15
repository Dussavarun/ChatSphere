import  groupChatModel from "../models/groupchatmodel.js";

export const fetchGroupList = async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    console.log("Request body:", req.body); // Log the entire request body
    
    if (!userEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    console.log("Searching for groups with user:", userEmail);
    
    // First check if any groups exist at all (debugging)
    const allGroups = await groupChatModel.find({});
    console.log("All groups in database:", allGroups.length);
    
    // Now search for the user's groups
    const groups = await groupChatModel.find({ 
      "members.email": userEmail 
    });
    
    console.log("Found groups for user:", groups.length);
    
    res.status(200).json(groups);
  } catch (error) {
    console.error("Error fetching group list:", error);
    res.status(500).json({ message: "Server error" });
  }
}