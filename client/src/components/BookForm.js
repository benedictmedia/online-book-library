/* src/components/BookForm.js */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../UserContext';
import toast from 'react-hot-toast';

function BookForm() {
  const { id } = useParams();
  const [bookDetails, setBookDetails] = useState({ // Renamed 'book' to 'bookDetails' for clarity
    title: '',
    author: '',
    isbn: '',
    published_date: '',
    introduction: '',
    // file_path is no longer managed directly via text input in state
  });
  const [bookFile, setBookFile] = useState(null); // <--- NEW: State for the selected file
  const [currentFilePath, setCurrentFilePath] = useState(''); // <--- NEW: To display/retain existing file path in edit mode

  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(true); // Changed initial state to true for loading existing book
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { token, backendUrl } = useUser();

  // useEffect to fetch book data if in edit mode (i.e., id is present)
  useEffect(() => {
    // If it's an 'add book' scenario (no ID), no loading needed, set loading to false immediately
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const fetchBookToEdit = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/books/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}` // Ensure token is sent for protected routes
            }
        });
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Book not found for editing.');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Populate bookDetails state
        setBookDetails({
          title: data.title || '',
          author: data.author || '',
          isbn: data.isbn || '',
          published_date: data.published_date ? data.published_date.toString() : '',
          introduction: data.introduction || '',
        });
        setCurrentFilePath(data.file_path || ''); // <--- Store the existing file path
      } catch (err) {
        console.error(`Error fetching book ${id} for edit:`, err);
        toast.error(`Failed to load book for editing: ${err.message}`);
        navigate('/books'); // Redirect if book not found or error
      } finally {
        setLoading(false);
      }
    };
    fetchBookToEdit();
  }, [id, backendUrl, navigate, token]); // Added 'token' to dependencies

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookDetails(prevBook => ({
      ...prevBook,
      [name]: value
    }));
    // Clear validation error for the field as user types
    if (validationErrors[name]) {
      setValidationErrors(prevErrors => ({ ...prevErrors, [name]: null }));
    }
  };

  // <--- NEW: Handler for file input change
  const handleFileChange = (e) => {
    setBookFile(e.target.files[0]); // Get the first file selected
    // Clear file path error if file is selected
    if (validationErrors.bookFile) {
        setValidationErrors(prevErrors => ({ ...prevErrors, bookFile: null }));
    }
  };

  // Validation function
  const validateForm = () => {
    const errors = {};
    const currentYear = new Date().getFullYear();

    if (!bookDetails.title.trim()) {
      errors.title = 'Title is required.';
    }
    if (!bookDetails.author.trim()) {
      errors.author = 'Author is required.';
    }
    if (!bookDetails.isbn.trim()) {
      errors.isbn = 'ISBN is required.';
    } else if (!/^\d{13}$/.test(bookDetails.isbn.trim())) { // Checks for exactly 13 digits
      errors.isbn = 'ISBN must be exactly 13 digits.';
    }

    // <--- NEW Validation for file
    // In add mode, file is required. In edit mode, if no new file is chosen AND no current file exists, it's an error.
    if (!id && !bookFile) { // If adding a new book and no file is selected
      errors.bookFile = 'Book file is required.';
    } else if (id && !bookFile && !currentFilePath) { // If editing and no new file selected AND no existing file
      errors.bookFile = 'Book file is required if no previous file exists.';
    }


    if (bookDetails.published_date) {
      const year = parseInt(bookDetails.published_date, 10);
      if (isNaN(year) || year < 1000 || year > currentYear + 5) {
        errors.published_date = 'Published Year must be a valid 4-digit year (e.g., 1999) and not in the far future.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0; // Returns true if no errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please correct the highlighted errors in the form.');
      return;
    }

    setSubmitting(true);

    // <--- NEW: Create FormData object for file upload
    const formData = new FormData();
    formData.append('title', bookDetails.title);
    formData.append('author', bookDetails.author);
    formData.append('isbn', bookDetails.isbn);
    formData.append('published_date', bookDetails.published_date);
    formData.append('introduction', bookDetails.introduction);

    if (bookFile) {
      formData.append('bookFile', bookFile); // Append the actual file with the key 'bookFile'
    } else if (id && currentFilePath) {
      // If in edit mode and no new file is selected, but there's an existing file,
      // tell the backend to keep the current file.
      formData.append('current_file_path', currentFilePath);
    }
    // </--- END NEW: FormData creation

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${backendUrl}/api/books/${id}` : `${backendUrl}/api/books`;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type': 'application/json' IS REMOVED WHEN USING FormData
          // The browser automatically sets 'Content-Type': 'multipart/form-data'
        },
        body: formData, // <--- Send formData directly
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      toast.success(`Book ${id ? 'updated' : 'added'} successfully!`);

      if (!id) { // If adding a new book, clear the form and file selection
        setBookDetails({ title: '', author: '', isbn: '', published_date: '', introduction: '' });
        setBookFile(null); // Clear selected file
      }
      setTimeout(() => navigate('/books'), 1500); // Navigate to books list after success
    } catch (err) {
      console.error(`Error ${id ? 'updating' : 'adding'} book:`, err);
      toast.error(`Failed to ${id ? 'update' : 'add'} book: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p style={{ color: 'white' }}>Loading book for editing...</p>;
  }

  return (
    <div style={{ color: 'white' }}>
      <h2>{id ? 'Edit Book' : 'Add New Book'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={bookDetails.title} // Use bookDetails
            onChange={handleChange}
            required // Added required attribute
          />
          {validationErrors.title && <p style={{ color: 'red', fontSize: '0.8em' }}>{validationErrors.title}</p>}
        </div>
        <div>
          <label htmlFor="author">Author:</label>
          <input
            type="text"
            id="author"
            name="author"
            value={bookDetails.author} // Use bookDetails
            onChange={handleChange}
            required // Added required attribute
          />
          {validationErrors.author && <p style={{ color: 'red', fontSize: '0.8em' }}>{validationErrors.author}</p>}
        </div>
        <div>
          <label htmlFor="isbn">ISBN (13 digits):</label>
          <input
            type="text"
            id="isbn"
            name="isbn"
            value={bookDetails.isbn} // Use bookDetails
            onChange={handleChange}
            required // Added required attribute
          />
          {validationErrors.isbn && <p style={{ color: 'red', fontSize: '0.8em' }}>{validationErrors.isbn}</p>}
        </div>
        <div>
          <label htmlFor="published_date">Published Year:</label>
          <input
            type="number"
            id="published_date"
            name="published_date"
            value={bookDetails.published_date} // Use bookDetails
            onChange={handleChange}
            min="1000"
            max={new Date().getFullYear() + 5}
            placeholder="e.g., 2023"
          />
          {validationErrors.published_date && <p style={{ color: 'red', fontSize: '0.8em' }}>{validationErrors.published_date}</p>}
        </div>
        <div>
          <label htmlFor="introduction">Introduction:</label>
          <textarea
            id="introduction"
            name="introduction"
            value={bookDetails.introduction} // Use bookDetails
            onChange={handleChange}
            rows="5"
          ></textarea>
        </div>
        {/* <--- NEW: File input field */}
        <div>
          <label htmlFor="bookFile">Book File (PDF, EPUB, etc.):</label>
          <input
            type="file"
            id="bookFile"
            name="bookFile" // Name must match what Multer expects ('bookFile')
            onChange={handleFileChange}
            // `required` only applies if it's a new book AND no current file exists
            // This is handled by validationForm
          />
          {validationErrors.bookFile && <p style={{ color: 'red', fontSize: '0.8em' }}>{validationErrors.bookFile}</p>}
          {id && currentFilePath && !bookFile && ( // Display current file in edit mode if no new file is selected
              <p style={{ fontSize: '0.8em', color: '#ccc' }}>Current file: {currentFilePath.split('/').pop()}</p>
          )}
        </div>
        {/* Removed the old file_path text input as it's now handled by the file input */}
        <button type="submit" disabled={submitting}>
          {submitting ? (id ? 'Updating...' : 'Adding...') : (id ? 'Update Book' : 'Add Book')}
        </button>
      </form>
    </div>
  );
}

export default BookForm;