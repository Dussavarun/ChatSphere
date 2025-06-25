import React, { useEffect } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Chatui from './components/Chatui';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { userAuthstore } from '../backend/store/userauthstore';
import { userSocketstore } from '../backend/store/userSocketstore';

const Layout = () => {
  return <Outlet />
}

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword/>} />
      </Route>
      <Route path="/chat" element={<Chatui />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
    </Routes>
  )
}

export default App;