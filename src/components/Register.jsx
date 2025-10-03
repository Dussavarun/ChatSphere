import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { userAuthstore } from "../../backend/store/userauthstore";
import { saveKeysToStorage } from "../crypto/keymanager";

const Register = () => {
  const navigate = useNavigate();
  const [formdata, setFormdata] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobilenumber: "",
  });
  const {login, setpgpkeys } = userAuthstore.getState();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const API_BASE_URL = "https://chatsphere-2-7q7m.onrender.com"

  const handleformdataChange = (e) => {
    const { name, value } = e.target;
    setFormdata((prevdata) => ({ ...prevdata, [name]: value }));
  };

  const handleFormsubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formdata.password !== formdata.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsLoading(true);
    const dataToSend = { ...formdata };
    delete dataToSend.confirmPassword;

    try {
      const res = await axios.post(`${API_BASE_URL}/register`, dataToSend, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      const { user, token, publickey, privatekey } = res.data;

      // Save keys to localStorage
      saveKeysToStorage({ privatekey, publickey });

      // Save token to localStorage
      localStorage.setItem("token", token);

      // Update auth store
      login(user);

      setpgpkeys({
        publickey,
        privatekey
      });

      // Navigate to login or dashboard
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      setError(
        error.response?.data?.message ||
          error.response?.data ||
          "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-white mb-2">ChatSphere</h1>
          <p className="text-gray-400">Create your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleFormsubmit} className="space-y-4">
          <input
            type="text"
            name="fullname"
            placeholder="Full Name"
            value={formdata.fullname}
            onChange={handleformdataChange}
            required
            className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-gray-500 focus:outline-none"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formdata.email}
            onChange={handleformdataChange}
            required
            className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-gray-500 focus:outline-none"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formdata.password}
            onChange={handleformdataChange}
            required
            className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-gray-500 focus:outline-none"
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formdata.confirmPassword}
            onChange={handleformdataChange}
            required
            className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-gray-500 focus:outline-none"
          />

          <input
            type="tel"
            name="mobilenumber"
            placeholder="Mobile Number"
            value={formdata.mobilenumber}
            onChange={handleformdataChange}
            required
            className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-gray-500 focus:outline-none"
          />

          <div className="flex items-start space-x-3 mt-6">
            <input
              id="terms"
              type="checkbox"
              required
              className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="terms" className="text-sm text-gray-400">
              I agree to the{" "}
              <a href="#" className="text-blue-400 hover:text-blue-300">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-400 hover:text-blue-300">
                Privacy Policy
              </a>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-center text-gray-400 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-white hover:text-gray-300">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
