/* src/components/BookForm.js */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../UserContext';
import { toast } from 'react-toastify';

function BookForm() {
  const { id } = useParams();
  const [book, setBook] = useState({
    title: '',
    author: '',
    isbn: '',
    published_date: '',
    introduction: '',
    file_path: ''
  });

  const [validationErrors, setValidationErrors] = useState({}); // <--- ADDED: State for validation errors
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { token, backendUrl } = useUser();

  // useEffect to fetch book data if in edit mode (i.e., id is present)
  useEffect(() => {
    if (id) {
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
          if (data.published_date) {
            data.published_date = data.published_date.toString();
          } else {
            data.published_date = '';
          }
          setBook(data);
        } catch (err) {
          console.error(`Error fetching book ${id} for edit:`, err);
          toast.error(`Failed to load book for editing: ${err.message}`);
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
    // Clear validation error for the field as user types
    if (validationErrors[name]) {
      setValidationErrors(prevErrors => ({ ...prevErrors, [name]: null }));
    }
  };

  // <--- ADDED: Validation function
  const validateForm = () => {
    const errors = {};
    const currentYear = new Date().getFullYear();

    if (!book.title.trim()) {
      errors.title = 'Title is required.';
    }
    if (!book.author.trim()) {
      errors.author = 'Author is required.';
    }
    if (!book.isbn.trim()) {
      errors.isbn = 'ISBN is required.';
    } else if (!/^\d{13}$/.test(book.isbn.trim())) { // Checks for exactly 13 digits
      errors.isbn = 'ISBN must be exactly 13 digits.';
    }
    if (!book.file_path.trim()) {
      errors.file_path = 'File path is required.';
    } else if (!book.file_path.startsWith('/files/')) {
        errors.file_path = 'File path must start with /files/.';
    }

    if (book.published_date) {
        const year = parseInt(book.published_date, 10);
        if (isNaN(year) || year < 1000 || year > currentYear + 5) {
            errors.published_date = 'Published Year must be a valid 4-digit year (e.g., 1999) and not in the far future.';
        }
    } else {
        // You can make published_date optional, or required here
        // errors.published_date = 'Published Year is required.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0; // Returns true if no errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) { // <--- ADDED: Run validation before submitting
      toast.error('Please correct the highlighted errors in the form.');
      return; // Stop submission if validation fails
    }

    setSubmitting(true);
    // setMessage(''); // No longer needed, toasts handle feedback
    // setError('');   // No longer needed, toasts handle feedback

    try {
      const method = id ? 'PUT' : 'POST';
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

      toast.success(`Book ${id ? 'updated' : 'added'} successfully!`);

      if (!id) {
        setBook({ title: '', author: '', isbn: '', published_date: '', introduction: '', file_path: '' });
      }
      setTimeout(() => navigate('/books'), 1500);
    } catch (err) {
      console.error(`Error ${id ? 'updating' : 'adding'} book:`, err);
      toast.error(`Failed to ${id ? 'update' : 'add'} book: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p>Loading book for editing...</p>;
  }

  return (
    <div>
      <h2>{id ? 'Edit Book' : 'Add New Book'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={book.title}
            onChange={handleChange}
            // Removed HTML 'required' as JS validation is more granular
          />
          {validationErrors.title && <p style={{ color: 'red', fontSize: '0.8em' }}>{validationErrors.title}</p>} {/* <--- ADDED: Error display */}
        </div>
        <div>
          <label htmlFor="author">Author:</label>
          <input
            type="text"
            id="author"
            name="author"
            value={book.author}
            onChange={handleChange}
            // Removed HTML 'required'
          />
          {validationErrors.author && <p style={{ color: 'red', fontSize: '0.8em' }}>{validationErrors.author}</p>} {/* <--- ADDED: Error display */}
        </div>
        <div>
          <label htmlFor="isbn">ISBN (13 digits):</label>
          <input
            type="text"
            id="isbn"
            name="isbn"
            value={book.isbn}
            onChange={handleChange}
            // Removed HTML 'required'
          />
          {validationErrors.isbn && <p style={{ color: 'red', fontSize: '0.8em' }}>{validationErrors.isbn}</p>} {/* <--- ADDED: Error display */}
        </div>
        <div>
          <label htmlFor="published_date">Published Year:</label>
          <input
            type="number"
            id="published_date"
            name="published_date"
            value={book.published_date}
            onChange={handleChange}
            min="1000"
            max={new Date().getFullYear() + 5}
            placeholder="e.g., 2023"
          />
          {validationErrors.published_date && <p style={{ color: 'red', fontSize: '0.8em' }}>{validationErrors.published_date}</p>} {/* <--- ADDED: Error display */}
        </div>
        <div>
          <label htmlFor="introduction">Introduction:</label>
          <textarea
            id="introduction"
            name="introduction"
            value={book.introduction}
            onChange={handleChange}
          ></textarea>
        </div>
        <div>
          <label htmlFor="file_path">File Path (e.g., /files/bookname.pdf):</label>
          <input
            type="text"
            id="file_path"
            name="file_path"
            value={book.file_path}
            onChange={handleChange}
            // Removed HTML 'required'
          />
          {validationErrors.file_path && <p style={{ color: 'red', fontSize: '0.8em' }}>{validationErrors.file_path}</p>} {/* <--- ADDED: Error display */}
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? (id ? 'Updating...' : 'Adding...') : (id ? 'Update Book' : 'Add Book')}
        </button>
      </form>
    </div>
  );
}

export default BookForm;