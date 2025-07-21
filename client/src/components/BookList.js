/* src/components/BookList.js */
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../UserContext';
import toast from 'react-hot-toast';
import '../App.css'; // Import the App.css where BookList styles now reside

function BookList() {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin, token, backendUrl } = useUser();
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
  }, [backendUrl, searchTerm, currentPage, booksPerPage, token]);

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
        if (books.length === 1 && currentPage > 1) {
          setCurrentPage(prevPage => prevPage - 1);
        } else {
          setBooks([]);
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

  const handlePreviousPage = () => {
    setCurrentPage(prevPage => Math.max(1, prevPage - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prevPage => Math.min(totalPages, prevPage + 1));
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const pageNumbers = [];
  const safeTotalPages = isNaN(totalPages) ? 1 : totalPages;
  for (let i = 1; i <= safeTotalPages; i++) {
    pageNumbers.push(i);
  }

  if (loading) {
    return <div className="page-container"><p>Loading books...</p></div>;
  }

  if (error && !loading && books.length === 0) {
    return <div className="page-container"><p style={{ color: 'red' }}>{error}</p></div>;
  }

  return (
    <div className="page-container"> {/* Main container for the BookList content */}
      <h2>All Books</h2>

      {isAdmin && (
        <div className="add-book-section"> {/* Apply add-book-section class */}
          <Link to="/add-book" className="add-book-button"> {/* Apply add-book-button class */}
            Add New Book ➕
          </Link>
        </div>
      )}

      <div className="search-pagination-controls"> {/* Apply search-pagination-controls class */}
        <input
          type="text"
          placeholder="Search by title, author, or ISBN..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="search-input"
        />
        <div className="items-per-page-control"> {/* Apply items-per-page-control class */}
          <label htmlFor="booksPerPage">Items per page:</label>
          <select
            id="booksPerPage"
            value={booksPerPage}
            onChange={(e) => {
              setBooksPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      {books.length > 0 ? (
        <>
          <ul className="book-list"> {/* Apply book-list class */}
            {books.map((book) => (
              <li key={book.id} className="book-item"> {/* Apply book-item class */}
                <h3>{book.title}</h3>
                <p><strong>Author:</strong> {book.author}</p>
                <p><strong>ISBN:</strong> {book.isbn}</p>
                {book.published_date && (
                  <p>
                    <strong>Published:</strong> {book.published_date}
                  </p>
                )}
                {book.introduction && <p>{book.introduction}</p>}

                {isAdmin && (
                  <div className="book-actions"> {/* Apply book-actions class */}
                    <button onClick={() => navigate(`/edit-book/${book.id}`)}>Edit</button>
                    <button onClick={() => handleDelete(book.id)}>Delete</button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="pagination-controls"> {/* Apply pagination-controls class */}
            <p>Total Books: {totalBooks}</p>
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </button>
            {pageNumbers.map(number => (
              <button
                key={number}
                onClick={() => handlePageClick(number)}
                disabled={loading}
                className={currentPage === number ? 'page-number-button active' : 'page-number-button'}
              >
                {number}
              </button>
            ))}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || loading}
            >
              Next
            </button>
            <p>Page {currentPage} of {totalPages}</p>
          </div>
        </>
      ) : (
        !loading && !error && (
          <div className="no-books-found">
            <p>No books found in the library. Try adding one or adjust your search.</p>
          </div>
        )
      )}
    </div>
  );
}

export default BookList;