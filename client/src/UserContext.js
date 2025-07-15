import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'; // <--- ADD useCallback here
import { useNavigate } from 'react-router-dom';

export const UserContext = createContext(null);

export const UserProvider = ({ children, backendUrl }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const navigate = useNavigate();

  // Function to handle user login
  const login = useCallback((userData, userToken) => { // <--- WRAP WITH useCallback
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
  }, []); // <--- No dependencies needed for login here

  // Function to handle user logout
  const logout = useCallback(() => { // <--- WRAP WITH useCallback
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  }, [navigate]); // <--- logout depends on 'navigate'


  // Effect to load user/token from localStorage on initial load
  useEffect(() => {
    if (token) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error("Failed to parse stored user data:", e);
        logout();
      }
    }
  }, [token, logout]); // Keep logout here

  const isAdmin = user && user.role === 'admin';

  const value = {
    user,
    token,
    isAdmin,
    login,
    logout,
    backendUrl
  };

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