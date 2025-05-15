import React, { useState } from 'react';
import axios from "axios";
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [formdata, setFormdata] = useState({
    fullname: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobilenumber: ''
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleformdataChange = (e) => {
    const { name, value } = e.target;
    setFormdata((prevdata) => ({
      ...prevdata, [name]: value,
    }));
  };

  const handleFormsubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (formdata.password !== formdata.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    setIsLoading(true);
    
    // Remove confirmPassword before sending to API
    const dataToSend = { ...formdata };
    //no need to send the confirm password so this 
    delete dataToSend.confirmPassword;
    
    axios.post("http://localhost:3000/register", dataToSend, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true
    })
    .then((response) => {
      console.log(response);
      navigate('/chat');
    })
    .catch((error) => {
      console.log(error);
      setError(error.response?.data || 'Registration failed. Please try again.');
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
      
      <form onSubmit={handleFormsubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="fullname">
            Full Name
          </label>
          <input
            type="text"
            id="fullname"
            name="fullname"
            placeholder="John Doe"
            value={formdata.fullname}
            onChange={handleformdataChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="yourname@example.com"
            value={formdata.email}
            onChange={handleformdataChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Create a strong password"
            value={formdata.password}
            onChange={handleformdataChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={formdata.confirmPassword}
            onChange={handleformdataChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="mobilenumber">
            Mobile Number
          </label>
          <input
            type="tel"
            id="mobilenumber"
            name="mobilenumber"
            placeholder="e.g., 1234567890"
            value={formdata.mobilenumber}
            onChange={handleformdataChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div className="flex items-center mt-4">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
            I agree to the <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a> and <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
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
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
        
        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          {/* <a href="#/login" className="font-medium text-blue-600 hover:text-blue-500">
            Log in
          </a> */}
          <Link to="/login"  className="font-medium text-blue-600 hover:text-blue-500">Log in</Link>
        </div>
      </form>
    </div>
  );
};

export default Register;