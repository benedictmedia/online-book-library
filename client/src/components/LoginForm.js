/* src/components/LoginForm.js   */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../UserContext'; // Import useUser hook
import { toast } from 'react-toastify'; // <--- ADDED: Import toast

function LoginForm() { // <--- Renamed from Login to LoginForm for consistency with file name
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // const [message, setMessage] = useState(''); // REMOVED: Replaced by toast
  // const [error, setError] = useState('');     // REMOVED: Replaced by toast
  const [loading, setLoading] = useState(false); // <--- ADDED: Loading state for button
  const navigate = useNavigate();
  const { login, backendUrl } = useUser(); // Get login function and backendUrl from context

  const handleSubmit = async (e) => {
    e.preventDefault();
    // setMessage(''); // REMOVED
    // setError('');   // REMOVED
    setLoading(true); // <--- ADDED: Set loading state

    try {
      const response = await fetch(`${backendUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // If login successful, use the login function from context
      // Note: Your context's login function currently expects (user, token).
      // Your backend returns { token, user: { id, username, email, role } }.
      // So, it should be login(data.user, data.token) as it is.
      login(data.user, data.token);
      // setMessage('Login successful! Redirecting to home...'); // REMOVED
      toast.success('Login successful! Welcome back! 👋'); // <--- ADDED: Success toast
      setTimeout(() => navigate('/'), 1500); // Redirect to home page
    } catch (err) {
      console.error("Login error:", err);
      // setError(`Login failed: ${err.message}`); // REMOVED
      toast.error(`Login failed: ${err.message} 😞`); // <--- ADDED: Error toast
    } finally {
      setLoading(false); // <--- ADDED: Reset loading state
    }
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
            disabled={loading} // <--- ADDED: Disable input during loading
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
            disabled={loading} // <--- ADDED: Disable input during loading
          />
        </div>
        <button type="submit" disabled={loading}> {/* <--- ADDED: Disable button during loading */}
          {loading ? 'Logging in...' : 'Login'} {/* <--- ADDED: Dynamic button text */}
        </button>
      </form>
      {/* {message && <p style={{ color: 'green' }}>{message}</p>} */} {/* REMOVED */}
      {/* {error && <p style={{ color: 'red' }}>{error}</p>} */}     {/* REMOVED */}
      <p>Don't have an account? <Link to="/register">Register here</Link></p>
    </div>
  );
}

export default LoginForm; // <--- Changed export name for consistency