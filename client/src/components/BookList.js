/* src/components/BookList.js */
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added 'Link' import
import { useUser } from '../UserContext';
import toast from 'react-hot-toast';

function BookList() {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin, token, backendUrl } = useUser(); // Ensure isAdmin is correctly pulled from context
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage, setBooksPerPage] = useState(10);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL(`${backendUrl}/api/books`);
        if (searchTerm) {
          url.searchParams.append('search', searchTerm);
        }
        url.searchParams.append('page', currentPage);
        url.searchParams.append('limit', booksPerPage);

        const response = await fetch(url.toString());
        if (!response.ok) {
          // It's useful to log the full response for debugging
          const errorText = await response.text();
          console.error(`Fetch error: ${response.status} - ${errorText}`);
          throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
        }
        const responseData = await response.json();

        setBooks(responseData.books);
        setTotalBooks(responseData.totalBooks);
        setTotalPages(responseData.totalPages);
      } catch (err) {
        console.error("Error fetching books:", err);
        setError(`Failed to load books: ${err.message}`);
        toast.error(`Failed to load books: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    const handler = setTimeout(() => {
      fetchBooks();
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [backendUrl, searchTerm, currentPage, booksPerPage, token]); // Added 'token' as a dependency

  // Handle book deletion
  const handleDelete = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/books/${bookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 204) {
        toast.success('Book deleted successfully! 🗑️');
        // Re-fetch books intelligently to maintain pagination state
        if (books.length === 1 && currentPage > 1) {
          setCurrentPage(prevPage => prevPage - 1);
        } else {
          // Re-fetch the current page, by re-running the useEffect
          setBooks([]); // Triggering a state update that causes useEffect to re-run
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete book.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(`Delete failed: ${err.message} 🚫`);
    }
  };

  // Pagination navigation handlers
  const handlePreviousPage = () => {
    setCurrentPage(prevPage => Math.max(1, prevPage - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prevPage => Math.min(totalPages, prevPage + 1));
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Generate page numbers for display
  const pageNumbers = [];
  const safeTotalPages = isNaN(totalPages) ? 1 : totalPages;
  for (let i = 1; i <= safeTotalPages; i++) {
    pageNumbers.push(i);
  }

  if (loading) {
    return <p>Loading books...</p>;
  }

  if (error && !loading && books.length === 0) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h2>All Books</h2>

      {/* Add New Book Button - ONLY SHOW IF ADMIN */}
      {isAdmin && (
        <div style={{ marginBottom: '20px' }}>
          <Link to="/add-book" style={{
            padding: '10px 15px',
            backgroundColor: '#28a745', // Green color
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            display: 'inline-block' // Ensures proper spacing if other elements are inline
          }}>
            Add New Book ➕
          </Link>
        </div>
      )}

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by title, author, or ISBN..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page on new search
          }}
          style={{ padding: '8px', width: '300px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <label htmlFor="booksPerPage" style={{ marginLeft: '20px' }}>Items per page:</label>
        <select
          id="booksPerPage"
          value={booksPerPage}
          onChange={(e) => {
            setBooksPerPage(Number(e.target.value));
            setCurrentPage(1); // Reset to page 1 when changing items per page
          }}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>

      {books.length > 0 ? (
        <>
          <ul>
            {books.map((book) => (
              <li key={book.id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 5px 0' }}>{book.title}</h3>
                <p style={{ margin: '0' }}><strong>Author:</strong> {book.author}</p>
                <p style={{ margin: '0' }}><strong>ISBN:</strong> {book.isbn}</p>
                {book.published_date && (
                  <p style={{ margin: '0' }}>
                    <strong>Published:</strong> {book.published_date}
                  </p>
                )}
                {book.introduction && <p style={{ fontSize: '0.9em', color: '#555' }}>{book.introduction}</p>}

                {/* Edit and Delete Buttons - ONLY SHOW IF ADMIN */}
                {isAdmin && (
                  <div style={{ marginTop: '10px' }}>
                    <button onClick={() => navigate(`/edit-book/${book.id}`)} style={{ marginRight: '10px', padding: '8px 12px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDelete(book.id)} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>Delete</button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Pagination controls */}
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <p>Total Books: {totalBooks}</p>
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || loading}
              style={{ padding: '8px 15px', marginRight: '10px', cursor: 'pointer', border: '1px solid #007bff', borderRadius: '4px', backgroundColor: '#007bff', color: 'white' }}
            >
              Previous
            </button>
            {pageNumbers.map(number => (
              <button
                key={number}
                onClick={() => handlePageClick(number)}
                disabled={loading}
                style={{
                  padding: '8px 15px',
                  margin: '0 5px',
                  cursor: 'pointer',
                  border: `1px solid ${currentPage === number ? '#0056b3' : '#ccc'}`,
                  borderRadius: '4px',
                  backgroundColor: currentPage === number ? '#0056b3' : '#f8f8f8',
                  color: currentPage === number ? 'white' : '#333'
                }}
              >
                {number}
              </button>
            ))}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || loading}
              style={{ padding: '8px 15px', marginLeft: '10px', cursor: 'pointer', border: '1px solid #007bff', borderRadius: '4px', backgroundColor: '#007bff', color: 'white' }}
            >
              Next
            </button>
            <p>Page {currentPage} of {totalPages}</p>
          </div>
        </>
      ) : (
        // Only show 'No books found' if not loading and no error
        !loading && !error && <p>No books found in the library. Try adding one or adjust your search.</p>
      )}
    </div>
  );
}

export default BookList;