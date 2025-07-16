import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BookList from './components/BookList';
import BookDetail from './components/BookDetail';
import BookForm from './components/BookForm';
import Register from './components/Register'; // <--- ADD THIS
import Login from './components/Login';       // <--- ADD THIS
import { UserProvider, useUser } from './UserContext'; // <--- ADD THIS
import './App.css';

// Define your backend URL (keep it here as it's passed to UserProvider)
const BACKEND_URL = "https://vigilant-pancake-4jqgvggg5pjr3jq67-3000.app.github.dev";


function AppContent() {
  const { user, isAdmin, logout } = useUser(); // Use the hook to access user context
  const [backendMessage, setBackendMessage] = useState('Loading...');

  useEffect(() => {
    // Fetch welcome message from the backend's root route
    const fetchWelcomeMessage = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        setBackendMessage(data);
      } catch (error) {
        console.error("Error fetching welcome message:", error);
        setBackendMessage(`Failed to load backend message: ${error.message}`);
      }
    };

    fetchWelcomeMessage();
  }, []); // Empty dependency array, runs once on mount

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
        <p><strong>Frontend Status:</strong> Running!</p>
        <p><strong>Backend Message:</strong> {backendMessage}</p>
        <p><strong>Backend URL being used:</strong> {BACKEND_URL}</p>

        <hr />

        <Routes>
  <Route path="/" element={<h2>Welcome to the Library Home Page!</h2>} />
  <Route path="/books" element={<BookList />} /> {/* backendUrl is now passed via UserProvider */}
  <Route path="/books/:id" element={<BookDetail />} /> {/* backendUrl is now passed via UserProvider */}
  <Route path="/add-book" element={<BookForm />} />
  <Route path="/edit-book/:id" element={<BookForm />} /> {/* New route for editing */}
  <Route path="/register" element={<Register />} />
  <Route path="/login" element={<Login />} />
        </Routes>

      </main>
    </div>
  );
}

// The main App component wraps AppContent with Router and UserProvider
function App() {
  return (
    <Router>
      <UserProvider backendUrl={BACKEND_URL}> {/* Pass backendUrl to the Provider */}
        <AppContent />
      </UserProvider>
    </Router>
  );
}

export default App;