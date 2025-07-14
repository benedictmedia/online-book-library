import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('Loading...');
  const [booksData, setBooksData] = useState([]);

  // === PASTE YOUR EXACT BACKEND URL HERE ===
  // Replace "YOUR_ACTUAL_BACKEND_PORT_3000_URL_FROM_PORTS_TAB"
  const backendUrl = "https://vigilant-pancake-4jqgvggg5pjr3jq67-3000.app.github.dev"; // <-- PASTE YOUR URL HERE!
  // === ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ===

  useEffect(() => {
    // Fetch welcome message from the backend's root route
    fetch(`${backendUrl}/`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.text();
      })
      .then(data => {
        setMessage(data);
      })
      .catch(error => {
        console.error("Error fetching welcome message:", error);
        setMessage(`Failed to load welcome message: ${error.message}`);
      });

    // Fetch books data from the backend's /books route
    fetch(`${backendUrl}/books`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setBooksData(data);
      })
      .catch(error => {
        console.error("Error fetching books data:", error);
        setBooksData([{ error: `Failed to load books: ${error.message}` }]);
      });

  }, [backendUrl]); // Add backendUrl to dependency array since it's now a direct dependency

  return (
    <div className="App">
      <header className="App-header">
        <p>
          **Frontend Status:** Running!
        </p>
        <p>
          **Backend Message:** {message}
        </p>
        <h2>Books Data from Backend (showing current time from DB):</h2>
        <ul>
          {booksData.length > 0 ? (
            booksData.map((item, index) => (
              <li key={index}>
                {item.error ? `Error: ${item.error}` : `Current Time: ${item.current_time}`}
              </li>
            ))
          ) : (
            <li>No books data received yet.</li>
          )}
        </ul>
        <p>Backend URL being used: {backendUrl}</p>
      </header>
    </div>
  );
}

export default App;