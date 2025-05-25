import {Server} from "socket.io";
import redisClient from "../redis/redisclient.js";
import groupChatModel from "../models/groupchatmodel.js";
import message from "../models/message.js";
import groupMessage from "../models/groupMessage.js";
import User from "../models/User.js";

let io;

export const chatapp = (server) => {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", async (socket) => {
        console.log(`A user is connected with id: ${socket.id}`);
        
        socket.on("user-login", async(email) => {
            await redisClient.set(`user:${email}`, socket.id);
            await redisClient.set(`socket:${socket.id}`, email);
            
            // Join user's personal room for direct messaging
            socket.join(email);
            
            socket.broadcast.emit("user-status-change", {
                email: email,
                status: true,
            });
        });

       // this is done once the component mounts 
        socket.on("join-groups", async(email) => {
            try { 
               // to remove any stale or inactive or removed rooms the user is in 
                const currentRooms = Array.from(socket.rooms);
                for (const room of currentRooms) {
                    if (room !== socket.id && room !== email) {
                        socket.leave(room);
                    }
                }

                // joining the user in all the groups he is in
                const groups = await groupChatModel.find(
                    {'members.email': email}, 
                    'groupchatName _id'
                );
                
                for (const group of groups) {
                    const roomName = `group_${group._id}`; // Using groupID instead of name for uniqueness
                    socket.join(roomName);
                    console.log(`User ${email} joined group room: ${roomName}`);
                }
                
                // redis storage for fater acess and verification
                const groupIds = groups.map(g => g._id.toString());
                await redisClient.set(`user_groups:${email}`, JSON.stringify(groupIds));
                
            } catch (error) {
                console.error("Error joining groups:", error);
                socket.emit("error", "Failed to join groups");
            }
        });
        
        // join specific group room (when user selects a group) // basically for real time chatting 
        socket.on('join-specific-group', async({groupId, userEmail}) => {
            try {
                // Verify user is member of this group
                const group = await groupChatModel.findById(groupId);
                if (!group) {
                    socket.emit("error", "Group not found");
                    return;
                }

                const isMember = group.members.some(member => member.email === userEmail);
                if (!isMember) {
                    socket.emit("error", "Access denied");
                    return;
                }

                const roomName = `group_${groupId}`;
                socket.join(roomName);                
            } catch (error) {
                console.error("Error joining specific group:", error);
                socket.emit("error", "Failed to join group");
            }
        });

        socket.on('groupmessage', async({groupName, sender, message}) => {
            try {
                
                const senderEmail = await redisClient.get(`socket:${socket.id}`);
                if (senderEmail !== sender) {
                    socket.emit("error", "Authentication mismatch");
                    return;
                }

                // just to check the user and group are present and user belongs to this group
                const group = await groupChatModel.findOne({groupchatName: groupName});
                if (!group) {
                    socket.emit("error", "Group not found");
                    return;
                }

                const isMember = group.members.some(member => member.email === sender);
                if (!isMember) {
                    socket.emit("error", "You are not a member of this group");
                    return;
                }

                // Use group ID for room name to ensure uniqueness (in case if they have same group names)
                const roomName = `group_${group._id}`;
                
                io.to(roomName).emit('group-recieved-message', {
                    message,
                    sender,
                    groupName,
                    groupId: group._id,
                    timestamp: new Date().toISOString()
                });

                console.log(`Message sent to group ${groupName} (${roomName}) by ${sender}`);

                // saving message to database
                const user = await User.findOne({ email: sender });
                if (user) {
                    const newGroupMessage = new groupMessage({
                        group: group._id,
                        senderId: user._id,
                        text: message,
                        fileUrl: null,
                        fileName: null,
                    });
                    await newGroupMessage.save();
                }

            } catch (error) {
                console.error("Error sending group message:", error);
                socket.emit("error", "Server error while sending group message");
            }
        });

        socket.on("disconnect", async () => {
            try {
                const email = await redisClient.get(`socket:${socket.id}`);
                if (email) {
                    await redisClient.del(`user:${email}`);
                    await redisClient.del(`socket:${socket.id}`);
                    await redisClient.del(`user_groups:${email}`);
                    
                    socket.broadcast.emit("user-status-change", {
                        email,
                        status: false,
                        lastSeen: Date.now()
                    });
                    
                    console.log(`User disconnected: ${email}`);
                }
            } catch (err) {
                console.error("Error in disconnect handler:", err);
            }
        });

        // Other existing socket events...
        socket.on("check-online-status", async(email, callback) => {
            try {
                const socketId = await redisClient.get(`user:${email}`);
                if (socketId) {
                    callback({
                        online: !!socketId,
                        lastSeen: Date.now()
                    });
                } else {
                    const lastSeen = await redisClient.get(`lastseen:${email}`);
                    callback({ 
                        online: false, 
                        lastSeen: lastSeen ? Number(lastSeen) : null
                    });
                }
            } catch (error) {
                callback({
                    online: false,
                    lastSeen: Date.now()
                });
            }
        });

        socket.on("message", async ({ receiverEmail, message, senderEmail }) => {
            try {
                if (!senderEmail) {
                    senderEmail = await redisClient.get(`socket:${socket.id}`);
                }
                
                if (receiverEmail) {
                    io.to(receiverEmail).emit("received-message", {
                        message,
                        senderEmail: senderEmail || "Unknown Sender"
                    });
                    console.log(`Message sent from ${senderEmail} to ${receiverEmail}`);
                } else {
                    socket.emit("error", "User is offline or not found");
                }
            } catch (error) {
                console.error("Error sending message:", error);
                socket.emit("error", "Server error while sending message");
            }
        });
    });
};

export const getIo = () => io;