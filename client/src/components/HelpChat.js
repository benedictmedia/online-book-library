// client/src/components/HelpChat.js
import React from 'react';
import { useUser } from '../UserContext';
import { Link } from 'react-router-dom';

function HelpChat() {
  const { user } = useUser();

  if (!user) {
    // Redirect or show a message if not logged in
    return (
      <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>
        <h2>Access Denied</h2>
        <p>Please log in to access the Help Chat.</p>
        <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Go to Login</Link>
      </div>
    );
  }

  return (
    <div style={{ color: 'white', maxWidth: '800px', margin: 'auto', padding: '20px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#222' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Help Chat</h2>
      <p style={{ textAlign: 'center', marginBottom: '30px', fontSize: '1.1em' }}>
        Welcome, {user.username}! Here you can communicate with an admin for assistance.
        {user.is_admin ? (
            <span style={{ display: 'block', marginTop: '10px', color: '#ffeb3b' }}>
                (You are an Admin. This is where you would see user queries.)
            </span>
        ) : (
            <span style={{ display: 'block', marginTop: '10px', color: '#8bc34a' }}>
                (Your messages will be sent to an admin.)
            </span>
        )}
      </p>

      <div style={{
        height: '400px',
        border: '1px solid #444',
        borderRadius: '4px',
        padding: '15px',
        overflowY: 'auto',
        backgroundColor: '#1a1a1a',
        marginBottom: '20px'
      }}>
        {/* This is where chat messages would appear */}
        <p style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>
          Chat history will appear here. (Future: Integrate a real-time chat system.)
        </p>
      </div>

      {/* This is where the message input would go */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Type your message..."
          style={{
            flexGrow: 1,
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #444',
            backgroundColor: '#333',
            color: 'white',
            outline: 'none'
          }}
          // This input would be controlled by state for a real chat
          readOnly={true} // Set to true for now as it's not a functional chat
        />
        <button
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: 0.7 // Indicate it's not fully functional yet
          }}
          disabled={true} // Set to true for now as it's not a functional chat
        >
          Send
        </button>
      </div>

      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>Back to Home</Link>
      </p>
    </div>
  );
}

export default HelpChat;