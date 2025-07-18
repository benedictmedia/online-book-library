/* src/components/LoginForm.js */
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Keep Link for the Register link
import { useUser } from '../UserContext'; // Import useUser hook

// No need to import useNavigate or toast here directly,
// as they are handled by UserContext's login function.

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Loading state for button
  const { login } = useUser(); // Get the login function from UserContext

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading state

    // Call the login function from UserContext
    // This function handles the API call, toast notifications, and navigation on success.
    const success = await login(username, password);

    setLoading(false); // Reset loading state
    // The navigation after successful login is now handled by UserContext.
    // If you prefer to handle navigation here, remove navigate('/books') from UserContext
    // and add it here, perhaps conditionally based on 'success'.
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="loginUsername">Username:</label>
          <input
            type="text"
            id="loginUsername"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="loginPassword">Password:</label>
          <input
            type="password"
            id="loginPassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>Don't have an account? <Link to="/register">Register here</Link></p>
    </div>
  );
}

export default LoginForm;