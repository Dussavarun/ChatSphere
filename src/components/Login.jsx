import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import socket from '../../backend/sockets/socket';

const Login = () => {
  const navigate = useNavigate();
  const [logformdata, setlogformdata] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  const handleformchange = (e) => {
    const {name, value} = e.target;
    setlogformdata((prevdata) => ({ ...prevdata, [name]: value }));
  };

  const hanldeloginformsubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    axios.post(`${API_BASE_URL}/login`, logformdata, {
      headers: { "Content-Type": "application/json" }, withCredentials: true
    })
    .then((response) => {
      if (response.status === 200) {
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }
        socket.connect();
        socket.emit("user-login", logformdata.email);
        navigate('/chat');
      }
    })
    .catch((error) => setError(error.response?.data || 'Login failed. Please try again.'))
    .finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-white mb-2">ChatSphere</h1>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={hanldeloginformsubmit} className="space-y-4">
          <input type="email" name="email" placeholder="Email" value={logformdata.email} onChange={handleformchange} required 
            className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-gray-500 focus:outline-none" />
          
          <div>
            <input type="password" name="password" placeholder="Password" value={logformdata.password} onChange={handleformchange} required 
              className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-gray-500 focus:outline-none" />
            <Link to="/forgot-password" className="block text-right text-sm text-gray-400 hover:text-gray-300 mt-2">
              Forgot password?
            </Link>
          </div>
          
          <div className="flex items-center space-x-3 mt-6">
            <input id="remember" type="checkbox" className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500" />
            <label htmlFor="remember" className="text-sm text-gray-400">Remember me</label>
          </div>
          
          <button type="submit" disabled={isLoading} 
            className="w-full mt-6 py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors">
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
          
          <p className="text-center text-gray-400 mt-6">
            Don't have an account? <Link to="/register" className="text-white hover:text-gray-300">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;