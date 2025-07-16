import React, { useState, useEffect } from 'react'; // Add useEffect
import { useNavigate, useParams } from 'react-router-dom'; // <--- ADD useParams
import { useUser } from '../UserContext';

function BookForm() {
  const { id } = useParams(); // Get ID from URL for edit mode
  const [book, setBook] = useState({
    title: '',
    author: '',
    isbn: '',
    published_date: '',
    introduction: '',
    file_path: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // New loading state for edit mode
  const navigate = useNavigate();
  const { token, backendUrl } = useUser();

  // useEffect to fetch book data if in edit mode (i.e., id is present)
  useEffect(() => {
    if (id) { // If there's an ID, we're in edit mode
      setLoading(true);
      const fetchBookToEdit = async () => {
        try {
          const response = await fetch(`${backendUrl}/books/${id}`);
          if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Book not found for editing.');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          // Format date for input type="date"
          if (data.published_date) {
            data.published_date = new Date(data.published_date).toISOString().split('T')[0];
          }
          setBook(data);
        } catch (err) {
          console.error(`Error fetching book ${id} for edit:`, err);
          setError(`Failed to load book for editing: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };
      fetchBookToEdit();
    }
  }, [id, backendUrl]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setBook(prevBook => ({
      ...prevBook,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const method = id ? 'PUT' : 'POST'; // Use PUT for edit, POST for add
      const url = id ? `${backendUrl}/books/${id}` : `${backendUrl}/books`;

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(book),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      setMessage(id ? 'Book updated successfully!' : 'Book added successfully!');
      if (!id) { // Only clear form if it was an add operation
        setBook({ title: '', author: '', isbn: '', published_date: '', introduction: '', file_path: '' });
      }
      setTimeout(() => navigate('/books'), 1500); // Redirect to book list
    } catch (err) {
      console.error(`Error ${id ? 'updating' : 'adding'} book:`, err);
      setError(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return <p>Loading book for editing...</p>;
  }

  if (error && id) { // Show error if in edit mode and fetch failed
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h2>{id ? 'Edit Book' : 'Add New Book'}</h2> {/* Dynamic heading */}
      {/* ... rest of the form is largely the same ... */}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title:</label>
          <input type="text" id="title" name="title" value={book.title} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="author">Author:</label>
          <input type="text" id="author" name="author" value={book.author} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="isbn">ISBN (13 digits):</label>
          <input type="text" id="isbn" name="isbn" value={book.isbn} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="published_date">Published Date:</label>
          <input type="date" id="published_date" name="published_date" value={book.published_date} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="introduction">Introduction:</label>
          <textarea id="introduction" name="introduction" value={book.introduction} onChange={handleChange}></textarea>
        </div>
        <div>
          <label htmlFor="file_path">File Path (e.g., /files/bookname.pdf):</label>
          <input type="text" id="file_path" name="file_path" value={book.file_path} onChange={handleChange} required />
        </div>
        <button type="submit">{id ? 'Update Book' : 'Add Book'}</button> {/* Dynamic button text */}
      </form>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && !id && <p style={{ color: 'red' }}>{error}</p>} {/* Only show general error for add mode */}
    </div>
  );
}

export default BookForm;