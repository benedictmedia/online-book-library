// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './UserContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar'; // Make sure this path is correct now
import Home from './components/Home';
import BookList from './components/BookList';
import BookDetail from './components/BookDetail';
import BookForm from './components/BookForm';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';

const BACKGROUND_IMAGE_URL = `${process.env.PUBLIC_URL}/background-classic.jpg`;

function App() {
  const appBackgroundStyles = {
    backgroundImage: `url(${BACKGROUND_IMAGE_URL})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    backgroundColor: '#f4f4f4', // This is the very bottom fallback if image fails
  };

  return (
    <Router>
      <UserProvider backendUrl={process.env.REACT_APP_BACKEND_URL}>
        <div style={appBackgroundStyles}>
          <Navbar />
          <Toaster />
          <div className="main-content-wrapper" style={{
            // --- CHANGE MADE HERE ---
            backgroundColor: 'rgba(4, 1, 15, 0.85)', // A warm off-white beige (OldLace) with 85% opacity
            flexGrow: 1,
            padding: '20px',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/books" element={<BookList />} />
              <Route path="/books/:id" element={<BookDetail />} />
              <Route path="/add-book" element={<BookForm />} />
              <Route path="/edit-book/:id" element={<BookForm />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
            </Routes>
          </div>
        </div>
      </UserProvider>
    </Router>
  );
}

export default App;