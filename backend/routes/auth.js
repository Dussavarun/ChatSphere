import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/User.js";

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.body.email });
        if (!user) {
            return res.status(400).send("User not found");
        }
        
        bcrypt.compare(req.body.password, user.password, (err, result) => {
            if (err) {
                return res.status(500).send("Error comparing passwords");
            }
            
            if (result) {
                let token = jwt.sign({ email: user.email }, "secretKey");
                res.cookie("token", token, { httpOnly: true, secure: false });
                // Also send the token in the response so it can be stored in localStorage
                return res.send({
                    message: "Logged in successfully",
                    user: { email: user.email },
                    token: token
                });
            } else {
                return res.status(401).send("Incorrect password");
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        if (!res.headersSent) {
            res.status(500).send("Internal Server Error");
        }
    }
});


router.post('/register', async (req, res) => {
    try {
        let { fullname, email, password, mobilenumber } = req.body;
        
        // Check if user already exists
        let existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).send("User already exists");
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        //saving to db storage
        let registeredUser = await userModel.create({
            fullname,
            email,
            password: hashedPassword,
            mobilenumber
        });
        // { expiresIn: "1h" }
        let token = jwt.sign({ email }, "secretKey");
        
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: false
        });

        // Send token in response body for localStorage
        return res.send({
            success: true,
            user: registeredUser,
            token: token
        });

    } catch (error) {
        console.error("Error during registration:", error);
        if (!res.headersSent) {
            res.status(500).send("Internal Server Error");
        }
    }
});


export default router;