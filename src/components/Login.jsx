import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../../backend/sockets/socket';
import { Link } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [logformdata, setlogformdata] = useState({
    email: '',
    password: '',
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleformchange = (e) => {
    const {name, value} = e.target;
    setlogformdata((prevdata) => ({
      ...prevdata, [name]: value,
    }));
  };

  const hanldeloginformsubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    axios.post("http://localhost:3000/login", logformdata, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true
    })
    .then((response) => {
      if (response.status === 200) {
        // Store token in localStorage for persistent auth
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }
        
        // after login connect to socket 
        socket.connect();
        socket.emit("user-login", logformdata.email);
        
        // Navigate to chat
        navigate('/chat');
      }
    })
    .catch((error) => {
      console.log(error);
      setError(error.response?.data || 'Login failed. Please try again.');
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  return (
    <div className="transition-all duration-300 animate-fadeIn">
      {error && (
        <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200 text-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
            </svg>
            {error}
          </div>
        </div>
      )}
      
      <form onSubmit={hanldeloginformsubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="yourname@example.com"
            value={logformdata.email}
            required
            onChange={handleformchange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-gray-700 text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            value={logformdata.password}
            required
            onChange={handleformchange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
            Remember me
          </label>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
        
        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          {/* <a href="#/register" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up now
          </a> */}
          <Link to="/register"  className="font-medium text-blue-600 hover:text-blue-500">Sign up</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;