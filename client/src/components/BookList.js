import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../UserContext';

function BookList() {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin, token, backendUrl } = useUser(); // Ensure isAdmin, token, backendUrl are here
  const navigate = useNavigate();
  const [deleteMessage, setDeleteMessage] = useState(''); // State for delete messages

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch(`${backendUrl}/books`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setBooks(data);
      } catch (err) {
        console.error("Error fetching books:", err);
        setError(`Failed to load books: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [backendUrl]);

  // Handle book deletion
  const handleDelete = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return; // User cancelled
    }

    setDeleteMessage(''); // Clear previous messages
    try {
      const response = await fetch(`${backendUrl}/books/${bookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}` // Send token for authorization
        }
      });

      if (response.status === 204) { // 204 No Content is successful deletion
        setDeleteMessage('Book deleted successfully!');
        // Remove the deleted book from state to update UI
        setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete book.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setDeleteMessage(`Delete failed: ${err.message}`);
    }
  };

  if (loading) {
    return <p>Loading books...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h2>All Books</h2>
      {books.length > 0 ? (
        <> {/* This fragment is crucial for grouping multiple top-level elements */}
          <ul>
            {books.map((book) => (
              <li key={book.id}>
                <strong>Title:</strong> {book.title} <br />
                <strong>Author:</strong> {book.author} <br />
                <strong>ISBN:</strong> {book.isbn} <br />
                {book.published_date && (
                  <p>
                    <strong>Published:</strong> {book.published_date}
                  </p>
                )}
                {book.introduction && <p>{book.introduction}</p>}

                {/* Conditional rendering for admin buttons - THIS IS KEY */}
                {isAdmin && (
                  <div>
                    <button onClick={() => navigate(`/edit-book/${book.id}`)} style={{ marginRight: '10px' }}>Edit</button>
                    <button onClick={() => handleDelete(book.id)}>Delete</button>
                  </div>
                )}
                <hr />
              </li>
            ))}
          </ul>
          {deleteMessage && <p style={{ color: deleteMessage.includes('successful') ? 'green' : 'red' }}>{deleteMessage}</p>}
        </>
      ) : (
        <p>No books found in the library.</p>
      )}
    </div>
  );
}

export default BookList;