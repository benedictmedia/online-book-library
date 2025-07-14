// server.js
// Load environment variables from .env file - this line should be at the very top
require('dotenv').config();

const express = require('express'); // This line should appear ONLY ONCE
const { Pool } = require('pg'); // Import Pool from pg
const app = express();
const port = process.env.PORT || 3000;

// Configure the PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Optional: Add SSL configuration if Render requires it and you're not using it directly
  // from a secure Render environment for the backend.
  // For Render services connecting to Render DB, often not needed explicitly.
  // If you encounter SSL issues later, uncomment and set up properly for your environment.
   ssl: {
     rejectUnauthorized: false 
   }
});

// Test database connection
pool.connect((err, client, done) => {
  if (err) {
    console.error('Database connection error:', err.message);
    return;
  }
  console.log('Successfully connected to the PostgreSQL database!');
   
  done();
});

// Basic route for the home page
app.get('/', (req, res) => {
  res.send('Welcome to the Online Book Library Backend!');
});

// Add a simple route to fetch data from the database (example)
app.get('/books', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time'); // Example query
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error fetching data from database');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
  console.log(`Access the backend via Codespaces forwarded port: https://[your-codespace-url]-${port}.githubpreview.dev`);
});