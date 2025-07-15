import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BookList from './components/BookList'; // Import the new BookList component
import './App.css'; // Assuming you have App.css for basic styling

function App() {
  const [backendMessage, setBackendMessage] = useState('Loading...');
  const backendUrl = "https://vigilant-pancake-4jqgvggg5pjr3jq67-3000.app.github.dev"; // Your backend URL

  useEffect(() => {
    // Fetch welcome message from the backend's root route
    const fetchWelcomeMessage = async () => {
      try {
        const response = await fetch(`${backendUrl}/`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text(); // Get text for root message
        setBackendMessage(data);
      } catch (error) {
        console.error("Error fetching welcome message:", error);
        setBackendMessage(`Failed to load backend message: ${error.message}`);
      }
    };

    fetchWelcomeMessage();
  }, [backendUrl]);

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Online Book Library</h1>
          <nav>
            <Link to="/">Home</Link> | <Link to="/books">Books</Link>
            {/* We'll add more links later for Add Book, Login, etc. */}
          </nav>
        </header>

        <main>
          <p><strong>Frontend Status:</strong> Running!</p>
          <p><strong>Backend Message:</strong> {backendMessage}</p>
          <p><strong>Backend URL being used:</strong> {backendUrl}</p>

          <hr /> {/* Separator */}

          <Routes>
            <Route path="/" element={<h2>Welcome to the Library Home Page!</h2>} />
            <Route path="/books" element={<BookList backendUrl={backendUrl} />} />
            {/* More routes will go here (e.g., /books/:id, /add-book, /login) */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;