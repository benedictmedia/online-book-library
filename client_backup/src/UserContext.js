import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export const UserContext = createContext(null);

export const UserProvider = ({ children, backendUrl }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to handle user login
  const login = useCallback(async (username, password) => {
    try {
      const response = await axios.post(`${backendUrl}/api/auth/login`, { username, password });
      const { token, user: userData } = response.data;

      setUser({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        is_admin: userData.is_admin // <--- FIXED: Changed from isAdmin to is_admin
      });
      setToken(token);
      localStorage.setItem('user', JSON.stringify({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        is_admin: userData.is_admin // <--- FIXED: Changed from isAdmin to is_admin
      }));
      localStorage.setItem('token', token);
      toast.success(`Welcome, ${userData.username}!`);
      navigate('/books');
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
      return false;
    }
  }, [backendUrl, navigate]);

  // Function to handle user registration
  const register = useCallback(async (username, email, password) => {
    try {
      // IMPORTANT: Changed isAdmin: true back to isAdmin: false for default registrations
      const response = await axios.post(`${backendUrl}/api/auth/register`, { username, email, password, isAdmin: false });
      toast.success(response.data.message || 'Registration successful! Please log in.');
      navigate('/login');
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
      return false;
    }
  }, [backendUrl, navigate]);


  // Function to handle user logout
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast('You have been logged out.');
    navigate('/login');
  }, [navigate]);


  // Effect to load user/token from localStorage on initial load
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Ensure that if user was stored with 'isAdmin', we convert it to 'is_admin'
        // This handles cases where old localStorage data might exist.
        if (parsedUser.isAdmin !== undefined && parsedUser.is_admin === undefined) {
          parsedUser.is_admin = parsedUser.isAdmin;
          delete parsedUser.isAdmin; // Clean up old property
        }
        setUser(parsedUser);
        setToken(storedToken);
      }
    } catch (e) {
      console.error("Failed to parse stored user data or token:", e);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);


  // Determine isAdmin based on the user object's is_admin property
  // Make sure user is not null before accessing user.is_admin
  const isAdmin = user ? user.is_admin : false; // <--- FIXED: Check user.is_admin

  const value = {
    user,
    token,
    isAdmin, // This is the value exposed to other components
    loading,
    login,
    register,
    logout,
    backendUrl
  };

  if (loading) {
    return <div>Loading user session...</div>;
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};