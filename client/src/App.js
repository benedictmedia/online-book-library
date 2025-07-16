// src/App.js
import React from 'react'; // Ensure React is imported here
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BookList from './components/BookList';
import BookDetail from './components/BookDetail';
import BookForm from './components/BookForm';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import Home from './components/Home';
import { UserProvider, useUser } from './UserContext';
import './App.css';

import { ToastContainer } from 'react-toastify'; // Keep this import
import 'react-toastify/dist/ReactToastify.css'; // Keep this import

// Define your backend URL (make sure this is the CORRECT, current Codespace URL)
// Please VERIFY THIS URL from your Codespaces "Ports" tab for port 3000
const BACKEND_URL = "https://vigilant-pancake-4jqgvggg5pjr3jq67-3000.app.github.dev/"; // <--- DOUBLE-CHECK AND UPDATE THIS!


function AppContent() {
  const { user, isAdmin, logout } = useUser();
  // Removed backendMessage state and useEffect for simplicity, as it's not critical for debugging the main issue.
  // We can add it back later if everything else is working.

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
        {/* Temporarily remove backend message display to isolate the hook issue */}
        {/* <p><strong>Frontend Status:</strong> Running!</p>
        <p><strong>Backend Message:</strong> {backendMessage}</p>
        <p><strong>Backend URL being used:</strong> {BACKEND_URL}</p> */}

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
      {/* ToastContainer should be directly within a functional component's render method */}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
}

// The main App component wraps AppContent with Router and UserProvider
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