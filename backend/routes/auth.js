import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/User.js";
import { generateKeypair } from "../../src/crypto/keymanager.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    let user = await userModel.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    bcrypt.compare(req.body.password, user.password, (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error comparing passwords" });
      }

      if (result) {
        let token = jwt.sign({ email: user.email }, "secretKey");
        res.cookie("token", token, { httpOnly: true, secure: false });
        
        return res.json({
          message: "Logged in successfully",
          user: {
            id: user._id,
            email: user.email,
            fullname: user.fullname,
          },
          token,
        });
      } else {
        return res.status(401).json({ message: "Incorrect password" });
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
});

router.post("/register", async (req, res) => {
  try {
    let { fullname, email, password, mobilenumber } = req.body;

    // Check if user already exists
    let existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const passphrase = process.env.VITE_PGP_PASSPHRASE ;
    const { privateKey, publicKey } = await generateKeypair(email, passphrase);

    // Save user to database with public key
    let registeredUser = await userModel.create({
      fullname,
      email,
      password: hashedPassword,
      mobilenumber,
      publickey: publicKey
    });

    let token = jwt.sign({ email }, "secretKey");

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    // Send response with token and keys
    return res.json({
      success: true,
      message: "Registration successful",
      user: {
        id: registeredUser._id,
        fullname: registeredUser.fullname,
        email: registeredUser.email,
        mobilenumber: registeredUser.mobilenumber,
      },
      token: token,
      publickey: publicKey,
      privatekey: privateKey
    });
  } catch (error) {
    console.error("Error during registration:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
});

export default router;