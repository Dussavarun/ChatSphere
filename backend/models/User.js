import mongoose from "mongoose";

// ChatApp User Schema
const UserSchema = new mongoose.Schema(
  {
    fullname: String,
    email: { type: String, unique: true },
    password: String,
    mobilenumber: Number,
    publickey : String,
  },
  {
    timestamps: true,
  }
);

// Prevent OverwriteModelError
export default mongoose.model("User", UserSchema);
