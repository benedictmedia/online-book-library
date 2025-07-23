/* src/components/RegisterForm.js */
import React, { useState } from 'react';
import { useUser } from '../UserContext'; // Import useUser hook

// No need to import toast here directly, as it's handled by UserContext now.
// The toast messages will be triggered by the register function in UserContext.

function RegisterForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Loading state for button
  const { register } = useUser(); // Get the register function from UserContext

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading state

    // Call the register function from UserContext
    // The UserContext's register function handles the API call, toast, and navigation
    const success = await register(username, email, password);

    setLoading(false); // Reset loading state
    // The navigation after successful registration is now handled by UserContext
    // If you prefer to handle navigation here, remove navigate('/login') from UserContext
    // and add it here, perhaps conditionally based on 'success'.
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}

export default RegisterForm;