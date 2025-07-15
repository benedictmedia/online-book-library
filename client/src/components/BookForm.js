import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../UserContext'; // <--- ADD THIS

function BookForm() {
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
  const navigate = useNavigate();
const { token, backendUrl } = useUser(); // <--- MODIFIED: Get token and backendUrl

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBook(prevBook => ({
      ...prevBook,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission

    setMessage(''); // Clear previous messages
    setError('');   // Clear previous errors

    try {
      const response = await fetch(`${backendUrl}/books`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // <--- ADD THIS HEADER
  },
  body: JSON.stringify(book),
});
      const data = await response.json(); // Even if error, try to parse JSON for server message

      if (!response.ok) {
        // If response is not 2xx, it's an error
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      setMessage('Book added successfully!');
      // Optionally clear form or redirect
      setBook({ // Clear form fields
        title: '', author: '', isbn: '', published_date: '', introduction: '', file_path: ''
      });
      // Redirect to the book list after a short delay
      setTimeout(() => navigate('/books'), 1500);

    } catch (err) {
      console.error("Error adding book:", err);
      setError(`Error: ${err.message}`);
    }
  };

  return (
    <div>
      <h2>Add New Book</h2>
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
        <button type="submit">Add Book</button>
      </form>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default BookForm;