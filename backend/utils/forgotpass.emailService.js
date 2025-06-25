import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken"
import userModel from "../models/User.js"

dotenv.config();

const emailServicerouter = express.Router();

const EMAIL_USER = import.meta.env.EMAIL_USER;
const EMAIL_PASS = import.meta.env.EMAIL_USER;
const JWT_SECRET = import.meta.env.EMAIL_USER;


emailServicerouter.post('/forgot-email-pass', async (req, res) => {
  const { email } = req.body;

  try {
      const user = await userModel.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "15m" });
      const resetLink = `http://localhost:3000/reset-password/${token}`;

      const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
              user: EMAIL_USER,
              pass: EMAIL_PASS,
          },
      });

      const mailOptions = {
          from: EMAIL_USER,
          to: email,
          subject: "Reset your password",
          html: `<p>Click the link to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: "Reset email sent!" });

  } catch (error) {
      console.error("Error sending mail:", error);
      res.status(500).json({ message: "Failed to send email" });
  }
});


emailServicerouter.post("/reset-password", async (req, res) => {
    const { token, password } = req.body;
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userEmail = decoded.email;
  
      // Update the user password here in your DB
      // You must hash it first with bcrypt
  
      const bcrypt = await import('bcrypt');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // Replace this with actual DB code
      await userModel.findOneAndUpdate({ email: userEmail }, { password: hashedPassword });
  
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Token error:", error);
      res.status(400).json({ message: "Invalid or expired token" });
    }
  });
  

export default  emailServicerouter;