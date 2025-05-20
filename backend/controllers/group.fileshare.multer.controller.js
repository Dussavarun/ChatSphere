import multer from "multer";
import User from "../models/User.js";
import groupchatmodel from "../models/groupchatmodel.js";
import groupMessage from "../models/groupMessage.js";
import { getIo } from "../sockets/chatserver.js";

// File filter to allow only image, video, and application files
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("video/") ||
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("application/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only image, video, and application files are allowed"), false);
  }
};

// Use memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // upto 100 MB
  fileFilter,
});

// Main middleware
export const groupfilesharecontroller = [
  upload.single("file"),
  async (req, res) => {
    try {
      const { userEmail, groupName, text } = req.body;
      const sender = await User.findOne({ email: userEmail });
      const group = await groupchatmodel.findOne({ groupchatName: groupName });

      if (!sender || !group) {
        return res.status(404).json({ error: "Sender or group not found" });
      }

      let fileUrl = null;
      let fileName = null;

      if (req.file) {
        const fileData = req.file.buffer.toString("base64");
        const fileType = req.file.mimetype;
        fileUrl = `data:${fileType};base64,${fileData}`;
        fileName = req.file.originalname;
      }

      const newgroupmessage = new groupMessage({
        group: group._id,
        senderId: sender._id,
        text: text || null,
        fileUrl,
        fileName,
        // createdAt : new new Date().toISOString()
      });

      await newgroupmessage.save();

      const io = getIo();
      io.to(groupName).emit("group-recieved-message", {
        message: text || null,
        fileUrl,
        fileName,
        userEmail,
        // createdAt : new new Date().toISOString()
      });

      res.status(200).json({ 
                message: "File uploaded successfully",
                data: {
                    fileUrl,
                    fileName
                }
            });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
];
