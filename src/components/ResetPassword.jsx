import React, { useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const ResetPassword = () => {
  const { token } = useParams(); 
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/emailService/reset-password", {
        token,
        password,
      });
      if (res.status === 200) {
        alert("Password updated successfully!");
      }
    } catch (error) {
      alert("Something went wrong: " + error.response?.data?.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        placeholder="Enter new password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Reset Password</button>
    </form>
  );
};

export default ResetPassword;
