import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Outlet } from 'react-router-dom';

import Login from './components/Login';
import Register from './components/Register';
import Chatui from './components/Chatui';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-500 to-green-300 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">ChatSphere</h1>
        <h4 className="text-center text-gray-600 mb-6">Experience a new dimension of conversation</h4>
        
        {/* <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <Link to="/login" className="flex-1 py-2 text-center rounded-md transition-all duration-300 hover:bg-white hover:shadow-md hover:text-blue-600">
            Login
          </Link>
          <Link to="/register" className="flex-1 py-2 text-center rounded-md transition-all duration-300 hover:bg-white hover:shadow-md hover:text-blue-600">
            Sign Up
          </Link>
        </div>
         */}
        <div className="transition-all duration-300">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Register />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Route>
          <Route path="/chat" element={<Chatui />} />
          <Route path="/forgot-password" element={<ForgotPassword/>}></Route>
          <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </div>
  )
}

export default App;