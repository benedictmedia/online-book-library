// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './UserContext';
import { Toaster } from 'react-hot-toast'; // Using react-hot-toast
import Navbar from './components/Navbar';
import Home from './components/Home';
import BookList from './components/BookList';
import BookDetail from './components/BookDetail';
import BookForm from './components/BookForm';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Footer from './components/Footer'; // <--- IMPORT THE FOOTER HERE

const BACKGROUND_IMAGE_URL = `${process.env.PUBLIC_URL}/background-classic.jpg`;

function App() {
  const appBackgroundStyles = {
    backgroundImage: `url(${BACKGROUND_IMAGE_URL})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    // Removed minHeight here as the outer div will manage flex container height
    // minHeight: '100vh', // This will now be handled by the main container div
    backgroundColor: '#f4f4f4',
  };

  return (
    <Router>
      <UserProvider backendUrl={process.env.REACT_APP_BACKEND_URL}>
        {/*
          This outermost div now manages the full viewport height and acts as a flex container.
          It ensures the content (Navbar, main-content-wrapper, Footer) fills the screen
          vertically and the footer stays at the bottom.
        */}
        <div style={{ ...appBackgroundStyles, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Toaster />

          {/*
            The main-content-wrapper now gets flexGrow: 1 to expand and push the footer down.
            I've also removed minHeight: '100vh' from here as it's handled by the parent,
            and padding needs to be on this element or its children to not affect flexGrow.
          */}
          <div className="main-content-wrapper" style={{
            backgroundColor: 'rgba(4, 1, 15, 0.85)',
            flexGrow: 1, // <--- This makes the content area expand and push the footer down
            padding: '20px', // Apply padding here for content spacing
            display: 'flex', // Maintain flex for internal content alignment
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

          <Footer /> {/* <--- ADD THE FOOTER COMPONENT HERE */}
        </div>
      </UserProvider>
    </Router>
  );
}

export default App;