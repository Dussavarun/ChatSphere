import express from "express";
import {createServer} from "http";
import cors from "cors";
import dotenv from "dotenv";
import userModel from "./models/User.js";
// import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import {chatapp} from "./sockets/chatserver.js";
import mongoose from "mongoose";


import groupRoutes from "./routes/groupRoutes.js"
import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/messageRoute.js";
import emailServicerouter from "./utils/forgotpass.emailService.js";

dotenv.config();

// Connect to MongoDB
//local mongo url = "mongodb://localhost:27017/chatapp";
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to MongoDB from server.js");
}).catch(err => {
    console.error("MongoDB connection error:", err);
});

const app = express();
const PORT = 3000;

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({limit : "100mb"}));
app.use(express.urlencoded({ extended: true , limit: "100mb"}));
app.use(cookieParser());

const server = createServer(app);



//messageRoute.js routes to send message , get the receiver id and receive the messages 
app.use("/message", messageRoutes);

//authentication routes
app.use("/", authRoutes);

//email service 
app.use("/emailService",emailServicerouter)

//handling geoup functions
app.use('/group' , groupRoutes);

// Verify token and get user , its a middleware // here main use case to build a protected routes
const verifyUser = async (req, res, next) => {
    try {
        // First check if there's a token in the cookies
        const cookieToken = req.cookies.token;
        
        // Then check if there's a token in the Authorization header
        const authHeader = req.headers.authorization;
        const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
        
        // Use whichever token is available
        const token = cookieToken || headerToken;
        
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }
        
        const decoded = jwt.verify(token, "secretKey");
        req.user = { email: decoded.email };
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};

// Get current user route //used in the chatui
app.get('/current-user', verifyUser, (req, res) => {
    res.json({ email: req.user.email });
});

app.use("/user", async (req, res, next) => {
    if (req.path === "/check/:email") {
        try {
            const email = req.params.email;
            const user = await userModel.findOne({ email });
            return res.status(200).json({ exists: !!user });
        } catch (error) {
            console.error("Error checking user:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }
    next();
});


// used in chat ui when first sending a message to a recepient to check the user is in db or not
app.get("/user/check/:email", async (req, res) => {
    try {
        const { email } = req.params;
        const user = await userModel.findOne({ email });
        res.status(200).json({ exists: !!user });
    } catch (error) {
        console.error("Error checking user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Chat route - protected
app.get("/chat", verifyUser, (req, res) => {
    res.json({ message: "Authorized to access chat" });
});

// Initialize Socket.IO with the server
chatapp(server);

// Logout route
app.post('/logout', (req, res) => {
    res.clearCookie("token", { httpOnly: true, path: '/' });
    res.json({ message: "Logged out successfully" });
});




// Start server
server.listen(PORT,"0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});