import React, { useState, useEffect } from 'react';

function BookList({ backendUrl }) { // Accept backendUrl as a prop
  const [books, setBooks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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
  }, [backendUrl]); // Re-run if backendUrl changes (though it's constant here)

  if (loading) {
    return <p>Loading books...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  return (
    <div>
      <h2>All Books</h2>
      {books.length > 0 ? (
        <ul>
          {books.map((book) => (
            <li key={book.id}>
              <strong>Title:</strong> {book.title} <br />
              <strong>Author:</strong> {book.author} <br />
              <strong>ISBN:</strong> {book.isbn} <br />
              {book.published_date && (
                <p>
                  <strong>Published:</strong> {new Date(book.published_date).toDateString()}
                </p>
              )}
              {book.introduction && <p>{book.introduction}</p>}
              <hr />
            </li>
          ))}
        </ul>
      ) : (
        <p>No books found in the library.</p>
      )}
    </div>
  );
}

export default BookList;