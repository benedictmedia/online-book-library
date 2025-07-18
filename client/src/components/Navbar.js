// client/src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../UserContext'; // Assuming UserContext is in ../UserContext

function Navbar() {
  const { user, logout } = useUser(); // Get user and logout function from context

  return (
    <nav style={{
      backgroundColor: '#f8f8f8', // Light background for the navbar
      padding: '15px 20px',
      borderBottom: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      marginBottom: '20px' // Add some space below the navbar
    }}>
      <div className="navbar-brand">
        <Link to="/" style={{
          fontSize: '1.5em',
          fontWeight: 'bold',
          color: '#333',
          textDecoration: 'none'
        }}>
          Online Book Library
        </Link>
      </div>
      <ul style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        gap: '20px'
      }}>
        <li>
          <Link to="/books" style={{ color: '#555', textDecoration: 'none' }}>Books</Link>
        </li>
        {/* Conditional rendering based on user login status */}
        {user ? (
          <>
            {/* You can add a link to user profile/dashboard here if applicable */}
            <li>
              <span style={{ color: '#007bff', fontWeight: 'bold' }}>Welcome, {user.username}!</span>
            </li>
            <li>
              <button onClick={logout} style={{
                padding: '8px 15px',
                backgroundColor: '#dc3545', // Red for logout
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login" style={{ color: '#555', textDecoration: 'none' }}>Login</Link>
            </li>
            <li>
              <Link to="/register" style={{ color: '#555', textDecoration: 'none' }}>Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;