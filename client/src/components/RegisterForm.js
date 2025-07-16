/* src/components/RegisterForm.js      */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../UserContext'; // Import useUser hook
import { toast } from 'react-toastify'; // <--- ADDED: Import toast

function RegisterForm() { // <--- Renamed from Register to RegisterForm for consistency with file name
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [message, setMessage] = useState(''); // REMOVED: Replaced by toast
  // const [error, setError] = useState('');     // REMOVED: Replaced by toast
  const [loading, setLoading] = useState(false); // <--- ADDED: Loading state for button
  const navigate = useNavigate();
  const { backendUrl } = useUser(); // Get backendUrl from context

  const handleSubmit = async (e) => {
    e.preventDefault();
    // setMessage(''); // REMOVED
    // setError('');   // REMOVED
    setLoading(true); // <--- ADDED: Set loading state

    try {
      const response = await fetch(`${backendUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // setMessage('Registration successful! Redirecting to login...'); // REMOVED
      toast.success('Registration successful! Please log in. 🎉'); // <--- ADDED: Success toast
      setTimeout(() => navigate('/login'), 2000); // Redirect after 2 seconds
    } catch (err) {
      console.error("Registration error:", err);
      // setError(`Registration failed: ${err.message}`); // REMOVED
      toast.error(`Registration failed: ${err.message} 🙁`); // <--- ADDED: Error toast
    } finally {
      setLoading(false); // <--- ADDED: Reset loading state
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="regUsername">Username:</label>
          <input
            type="text"
            id="regUsername"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading} // <--- ADDED: Disable input during loading
          />
        </div>
        <div>
          <label htmlFor="regEmail">Email:</label>
          <input
            type="email"
            id="regEmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading} // <--- ADDED: Disable input during loading
          />
        </div>
        <div>
          <label htmlFor="regPassword">Password:</label>
          <input
            type="password"
            id="regPassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading} // <--- ADDED: Disable input during loading
          />
        </div>
        <button type="submit" disabled={loading}> {/* <--- ADDED: Disable button during loading */}
          {loading ? 'Registering...' : 'Register'} {/* <--- ADDED: Dynamic button text */}
        </button>
      </form>
      {/* {message && <p style={{ color: 'green' }}>{message}</p>} */} {/* REMOVED */}
      {/* {error && <p style={{ color: 'red' }}>{error}</p>} */}     {/* REMOVED */}
    </div>
  );
}

export default RegisterForm; // <--- Changed export name for consistency