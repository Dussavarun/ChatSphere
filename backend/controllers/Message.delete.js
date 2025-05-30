import Message from '../models/message.js';
import GroupMessage from '../models/groupMessage.js'; // Import group message model

export const messagedelete = async (req, res) => {
  const { id } = req.params;
  console.log(`Trying to delete message with ID: ${id}`);

  try {
    // Try deleting from personal messages
    let deleted = await Message.findByIdAndDelete(id);

    if (!deleted) {
      // If not found, try deleting from group messages
      deleted = await GroupMessage.findByIdAndDelete(id);
    }

    if (!deleted) {
      return res.status(404).json({ message: "Message not found in either model" });
    }

    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
