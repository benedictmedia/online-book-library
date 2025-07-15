import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function BookDetail({ backendUrl }) {
  const { id } = useParams(); // Get the book ID from the URL
  const [book, setBook] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await fetch(`${backendUrl}/books/${id}`);
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
    return <p>Loading book details...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (!book) {
    return <p>No book found with this ID.</p>; // Should be covered by 404 error but good fallback
  }

  return (
    <div>
      <h2>{book.title}</h2>
      <p><strong>Author:</strong> {book.author}</p>
      <p><strong>ISBN:</strong> {book.isbn}</p>
      {book.published_date && (
        <p><strong>Published:</strong> {new Date(book.published_date).toDateString()}</p>
      )}
      {book.introduction && <p><strong>Introduction:</strong> {book.introduction}</p>}
      <p><strong>File Path:</strong> {book.file_path}</p>
      {/* Add a download link later, once actual files are hosted */}
      <Link to="/books">Back to Book List</Link>
      {/* We'll add Edit/Delete buttons later */}
    </div>
  );
}

export default BookDetail;