// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BookList from './components/BookList';
import BookDetail from './components/BookDetail';
import BookForm from './components/BookForm';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import Home from './components/Home';
import { UserProvider, useUser } from './UserContext';
import './App.css';

// Add this import for react-hot-toast
import { Toaster } from 'react-hot-toast'; // The component that renders toasts

// Define your backend URL (make sure this is the CORRECT, current Codespace URL)
const BACKEND_URL = "https://vigilant-pancake-4jqgvggg5pjr3jq67-3000.app.github.dev"; // <--- DOUBLE-CHECK AND UPDATE THIS!

function AppContent() {
  const { user, isAdmin, logout } = useUser();

  return (
    <div className="App">
      <header className="App-header">
        <h1>Online Book Library</h1>
        <nav>
          <Link to="/">Home</Link> | <Link to="/books">Books</Link>
          {user ? (
            <>
              {isAdmin && <Link to="/add-book"> | Add New Book</Link>}
              <span> | Welcome, {user.username}! </span>
              <button onClick={logout} style={{ marginLeft: '10px', padding: '5px 10px' }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/register"> | Register</Link> | <Link to="/login">Login</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <hr />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/books" element={<BookList />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/add-book" element={<BookForm />} />
          <Route path="/edit-book/:id" element={<BookForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/login" element={<LoginForm />} />
        </Routes>
      </main>
      {/* Replace ToastContainer with Toaster from react-hot-toast */}
      <Toaster /> {/* This is where toasts will be rendered */}
    </div>
  );
}

function App() {
  return (
    <Router>
      <UserProvider backendUrl={BACKEND_URL}>
        <AppContent />
      </UserProvider>
    </Router>
  );
}

export default App;