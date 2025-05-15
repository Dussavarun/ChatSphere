import {Server} from "socket.io";
import redisClient from "../redis/redisclient.js";
import  groupChatModel from "../models/groupchatmodel.js";

// server side socket 
// const users = {};
// const userEmails = {}; // To track email by socket ID // here instead we can use redis for handling online users instead of these objects

let io;

export const chatapp = (server) => {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });
                        //this socket is automatically created when a client connects in the frontend
    io.on("connection", async (socket) => {
        console.log(`A user is connected with id (in chatserver.js) ${socket.id}`);
        
        socket.on("user-login", async(email) => {
      
            // users[email] = socket.id;
            // userEmails[socket.id] = email; // Store email by socket ID

            await redisClient.set(`user:${email}`, socket.id);
            await redisClient.set(`socket:${socket.id}`, email);

            // const users = await getAllLoggedInUsers();
            // console.log("Current logged-in users:", users);
            // console.log(`User logged in with email: ${email}`);
            // console.log(`Current users: ${JSON.stringify(users, null, 2)}`);
            


            // Join a room with the user's email for direct messaging // so here you joins your own room with your name i.e your email so 
            // when other wants to send a message they join to your room and starts messaging
            socket.join(email);


            socket.broadcast.emit("user-status-change",{
                email : email,
                status : true,
            })

        });


        socket.on("join-groups", async(email)=>{
            const groups = await groupChatModel.find({'members.email' : email} , 'groupchatName')
            const groupNames = groups.map(group => group.groupchatName);
            socket.join(groupNames);
            console.log(`User with email : ${email} joined group rooms:`, groupNames);
            groupNames.forEach(groupName => {
              const room = io.sockets.adapter.rooms.get(groupName);
              const count = room ? room.size : 0;
              console.log(`Users in room ${groupName}: ${count}`);
            });
        })

        socket.on("check-online-status", async(email,callback)=>{
                try{
                    const socketId = await redisClient.get(`user:${email}`);
                    if(socketId){
                        callback({
                           online : !!socketId,
                           lastSeen : Date.now()
                       })
                    }else{
                        lastSeen = await redisClient.get(`lastseen:${email}`);
                        callback({ 
                            online: false, 
                            lastSeen : lastSeen ? Number(lastSeen) : null
                        });
                    }
                }catch(error){
                    callback({
                        online : false,
                        lastSeen : Date.now()
                    })
                }
        })

        socket.on("message", async ({ receiverEmail, message, senderEmail }) => {
            try {
            
              if (!senderEmail) {
                senderEmail = await redisClient.get(`socket:${socket.id}`);
              }
              //since when the user logins socket.join(email) so we can directly message using email rather than using the socket id
              if (receiverEmail) {
                io.to(receiverEmail).emit("received-message", {
                  message,
                  senderEmail: senderEmail || "Unknown Sender"
                });
                console.log(`Message sent from ${senderEmail} to ${receiverEmail}`);
              } else {
                console.log(`User ${receiverEmail} is offline or not found`);
                socket.emit("error", "User is offline or not found");
              }
            } catch (error) {
              console.error("Error sending message:", error);
              socket.emit("error", "Server error while sending message");
            }
          });
        
        socket.on("disconnect", async () => {
            
                // delete users[email];
                // delete userEmails[socket.id];
                // console.log(`User disconnected: ${email}`);
                // console.log(`Current users: ${JSON.stringify(users, null, 2)}`);
            
              try {
                const email = await redisClient.get(`socket:${socket.id}`);
                if (email) {
                  await redisClient.del(`user:${email}`);
                  await redisClient.del(`socket:${socket.id}`);
                  console.log(` Disconnected: ${email}`);
                }
                socket.broadcast.emit("user-status-change", {
                  email,
                  status: false,
                  lastSeen: Date.now()
                });
              } catch (err) {
                console.error(" Error in disconnect handler:", err);
              }
        });

        socket.on("ping", () => {
            socket.emit("pong");
        });
    });
};

export const getIo = () => io;

export default {chatapp, getIo};