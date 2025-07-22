// client/src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../UserContext';
import '../App.css'; // Import the App.css where the Navbar styles now reside

function Navbar() {
  const { user, logout } = useUser();

  return (
    <nav className="navbar"> {/* Apply the navbar class */}
      <div className="navbar-brand">
        <Link to="/">
          Online Book Library
        </Link>
      </div>
      <ul className="navbar-nav"> {/* Apply the navbar-nav class */}
        <li>
          <Link to="/books">Books</Link>
        </li>
        {user && ( // Only show "Help Chat" if a user is logged in
          <li>
            <Link to="/help-chat">Help Chat 💬</Link>
          </li>
        )}
        {user ? (
          <>
            {user.is_admin && ( // Only show "Add New Book" if the user is an admin
              <li>
                <Link to="/add-book">Add New Book</Link>
              </li>
            )}
            <li>
              <span>Welcome, {user.username}!</span>
            </li>
            <li>
              <button onClick={logout}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;