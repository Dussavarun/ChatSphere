import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Chatui from './components/Chatui';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

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