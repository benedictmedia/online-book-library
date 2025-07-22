// client/src/components/BookDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../UserContext';
import toast from 'react-hot-toast'; // Import toast for notifications

function BookDetail({ backendUrl }) {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [comments, setComments] = useState([]); // State to store comments
  const [newCommentText, setNewCommentText] = useState(''); // State for new comment input
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const fetchBookAndComments = async () => {
      try {
        // Fetch book details
        const bookResponse = await fetch(`${backendUrl}/api/books/${id}`);
        if (!bookResponse.ok) {
          if (bookResponse.status === 404) {
            throw new Error('Book not found.');
          }
          throw new Error(`HTTP error! status: ${bookResponse.status}`);
        }
        const bookData = await bookResponse.json();
        setBook(bookData);

        // Fetch comments for the book
        const commentsResponse = await fetch(`${backendUrl}/api/books/${id}/comments`);
        if (!commentsResponse.ok) {
          throw new Error(`HTTP error! status: ${commentsResponse.status} fetching comments`);
        }
        const commentsData = await commentsResponse.json();
        setComments(commentsData);

      } catch (err) {
        console.error(`Error fetching book or comments with ID ${id}:`, err);
        setError(`Failed to load details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchBookAndComments();
  }, [id, backendUrl]);

  // Function to handle posting a new comment
  const handlePostComment = async (e) => {
    e.preventDefault(); // Prevent default form submission

    if (!user) {
      toast.error('You must be logged in to post a comment.');
      return;
    }
    if (!newCommentText.trim()) {
      toast.error('Comment cannot be empty.');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/books/${book.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Send auth token
        },
        body: JSON.stringify({ comment_text: newCommentText })
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error('You are not authorized to post comments. Please log in.');
        } else {
          toast.error('Failed to post comment.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const postedComment = await response.json();
      // Add the new comment to the top of the comments list
      setComments([postedComment, ...comments]);
      setNewCommentText(''); // Clear the input field
      toast.success('Comment posted successfully!');

    } catch (err) {
      console.error('Error posting comment:', err);
      // Error message already handled by toast
    }
  };


  const handleDownload = () => {
    if (book.file_path) {
      window.open(`${backendUrl}${book.file_path}`, '_blank');
    } else {
      toast.error("No download file available for this book."); // Use toast for better UX
    }
  };

  if (loading) {
    return <p style={{ color: 'white' }}>Loading book details...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (!book) {
    return <p style={{ color: 'white' }}>No book found with this ID.</p>;
  }

  return (
    <div style={{ color: 'white', maxWidth: '800px', margin: 'auto', padding: '20px' }}>
      <h2>{book.title}</h2>
      <p><strong>Author:</strong> {book.author}</p>
      <p><strong>ISBN:</strong> {book.isbn}</p>
      {book.published_date && (
        <p><strong>Published:</strong> {new Date(book.published_date).getFullYear()}</p>
      )}
      {book.introduction && <p><strong>Introduction:</strong> {book.introduction}</p>}

      {user && book.file_path && (
        <button
          onClick={handleDownload}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s ease',
            marginRight: '10px'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
        >
          Download Book ⬇️
        </button>
      )}

      <Link to="/books" style={{ color: '#007bff', textDecoration: 'none', display: 'inline-block', marginTop: '20px' }}>Back to Book List</Link>

      <hr style={{ borderColor: '#444', margin: '40px 0' }} /> {/* Separator */}

      {/* Comments Section */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '20px' }}>Comments ({comments.length})</h3>

        {/* Comment Submission Form (only for logged-in users) */}
        {user ? (
          <form onSubmit={handlePostComment} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Write your comment here..."
              rows="4"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #555',
                backgroundColor: '#333',
                color: 'white',
                resize: 'vertical',
                outline: 'none'
              }}
            ></textarea>
            <button
              type="submit"
              style={{
                alignSelf: 'flex-end',
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '1em'
              }}
            >
              Post Comment
            </button>
          </form>
        ) : (
          <p style={{ textAlign: 'center', color: '#aaa', fontStyle: 'italic', marginBottom: '30px' }}>
            <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Log in</Link> to post a comment.
          </p>
        )}

        {/* Display Comments */}
        {comments.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#aaa', fontStyle: 'italic' }}>No comments yet. Be the first to comment!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {comments.map((comment) => (
              <div key={comment.id} style={{ border: '1px solid #444', borderRadius: '6px', padding: '15px', backgroundColor: '#2a2a2a' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '1.1em', fontWeight: 'bold', color: '#b3e0ff' }}>{comment.username}</p>
                <p style={{ margin: '0 0 10px 0', lineHeight: '1.6' }}>{comment.comment_text}</p>
                <p style={{ margin: '0', fontSize: '0.8em', color: '#888' }}>
                  {new Date(comment.created_at).toLocaleString('en-GH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true, // Use 12-hour format with AM/PM
                    timeZone: 'Africa/Accra' // Set to Ghana's timezone
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookDetail;