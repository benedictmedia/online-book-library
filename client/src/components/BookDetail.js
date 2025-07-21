// client/src/components/BookDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../UserContext'; // <--- IMPORT useUser hook

function BookDetail({ backendUrl }) { // backendUrl is received as a prop
  const { id } = useParams(); // Get the book ID from the URL
  const [book, setBook] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser(); // <--- Get the current user from UserContext

  // --- ADD THESE CONSOLE.LOGS ---
  console.log('BookDetail - Current User:', user);
  console.log('BookDetail - Book Data:', book);
  // --------------------------------

  useEffect(() => {
    const fetchBook = async () => {
      try {
        // Updated API endpoint to include /api/ prefix as per your server.js
        const response = await fetch(`${backendUrl}/api/books/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Book not found.');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setBook(data);
      } catch (err) {
        console.error(`Error fetching book with ID ${id}:`, err);
        setError(`Failed to load book details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id, backendUrl]); // Re-fetch if ID or backendUrl changes

  if (loading) {
    return <p style={{ color: 'white' }}>Loading book details...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (!book) {
    return <p style={{ color: 'white' }}>No book found with this ID.</p>;
  }

  // New handleDownload function
  const handleDownload = () => {
    if (book.file_path) {
      // Assuming book.file_path is a direct, publicly accessible URL to the file
      // This will open the file in a new tab, prompting download or display depending on browser/file type
      window.open(`${backendUrl}${book.file_path}`, '_blank'); // Prepend backendUrl
    } else {
      alert("No download file available for this book.");
    }
  };

  return (
    <div style={{ color: 'white' }}> {/* Added inline style for text color */}
      <h2>{book.title}</h2>
      <p><strong>Author:</strong> {book.author}</p>
      <p><strong>ISBN:</strong> {book.isbn}</p>
      {book.published_date && (
        <p><strong>Published:</strong> {new Date(book.published_date).getFullYear()}</p> /* Changed to get just the year */
      )}
      {book.introduction && <p><strong>Introduction:</strong> {book.introduction}</p>}
      {/* <p><strong>File Path:</strong> {book.file_path}</p> This line can be removed as it's for debug */}

      {/* Conditional rendering for the Download button */}
      {/* The button now appears if a user is logged in (user exists) AND the book has a file_path */}
      {user && book.file_path && (
        <button
          onClick={handleDownload}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#4CAF50', // Green background
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s ease',
            marginRight: '10px' // Added some margin for spacing
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'} // Darker green on hover
          onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'} // Revert on mouse out
        >
          Download Book ⬇️
        </button>
      )}

      {/* Optional: Message for admins if you want to explicitly tell them why the button is hidden */}
      {/* This message is now removed as admins will also see the download button */}
      {/* {user && user.is_admin && (
        <p style={{ marginTop: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>
          (Admin View: Download button hidden)
        </p>
      )} */}

      <Link to="/books" style={{ color: '#007bff', textDecoration: 'none' }}>Back to Book List</Link>
      {/* We'll add Edit/Delete buttons later */}
    </div>
  );
}

export default BookDetail;