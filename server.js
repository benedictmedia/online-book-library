require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const app = express();
const cors = require('cors'); // Require the cors middleware

const port = process.env.PORT || 3000; // Use port 3000 by default

// Use CORS middleware - This should be before your routes
app.use(cors());

// Configure the PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
  done(); // Release the client back to the pool
});

// Basic route for the home page
app.get('/', (req, res) => {
  res.send('Welcome to the Online Book Library Backend!');
});

// Route to fetch data from the database (example for /books)
app.get('/books', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time'); // Example query
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query for /books:', err.stack);
    res.status(500).send('Error fetching data from database for /books');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
  console.log(`Access the backend via Codespaces forwarded port: https://[your-codespace-url]-${port}.githubpreview.dev`);
});