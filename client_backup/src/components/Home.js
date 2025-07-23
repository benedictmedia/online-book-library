// src/components/Home.js
import React from 'react';
import { useUser } from '../UserContext'; // Assuming you want to display user info on home

function Home() {
  const { user } = useUser(); // Get user info from context

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Welcome to the Online Book Library!</h1>
      {user ? (
        <p>Hello, {user.username}! Explore our collection or manage books as an {user.role}.</p>
      ) : (
        <p>Please register or log in to access the full features of the library.</p>
      )}
      <p>Your one-stop destination for managing and discovering books.</p>
      {/* You can add more content here, like featured books, quick links, etc. */}
    </div>
  );
}

export default Home;