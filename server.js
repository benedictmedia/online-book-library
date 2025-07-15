require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const app = express();
const cors = require('cors'); // Require the cors middleware

const port = process.env.PORT || 3000; // Use port 3000 by default

// Use CORS middleware - This should be before your routes
app.use(cors());

app.use(express.json());

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

// --- BOOK API ENDPOINTS ---

// GET all books (already exists, but kept for context)
app.get('/books', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books ORDER BY title ASC'); // Added ORDER BY
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query for GET /books:', err.stack);
    res.status(500).send('Error fetching all books from database');
  }
});

// GET a single book by ID
app.get('/books/:id', async (req, res) => {
  try {
    const { id } = req.params; // Get ID from URL parameters
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Book not found');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error executing query for GET /books/${req.params.id}:`, err.stack);
    res.status(500).send('Error fetching single book from database');
  }
});

// POST a new book
app.post('/books', async (req, res) => {
  try {
    const { title, author, isbn, published_date, introduction, file_path } = req.body;
    // Basic validation
    if (!title || !author || !isbn || !file_path) {
        return res.status(400).send('Title, author, ISBN, and file path are required.');
    }

    const result = await pool.query(
      'INSERT INTO books (title, author, isbn, published_date, introduction, file_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, author, isbn, published_date, introduction, file_path]
    );
    res.status(201).json(result.rows[0]); // Return the newly created book
  } catch (err) {
    console.error('Error executing query for POST /books:', err.stack);
    // Check for unique constraint violation (e.g., duplicate ISBN)
    if (err.code === '23505') { // PostgreSQL unique violation error code
        return res.status(409).send('Book with this ISBN already exists.');
    }
    res.status(500).send('Error adding new book to database');
  }
});

// PUT (Update) an existing book by ID
app.put('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, published_date, introduction, file_path } = req.body;

    const result = await pool.query(
      'UPDATE books SET title = $1, author = $2, isbn = $3, published_date = $4, introduction = $5, file_path = $6 WHERE id = $7 RETURNING *',
      [title, author, isbn, published_date, introduction, file_path, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send('Book not found');
    }
    res.json(result.rows[0]); // Return the updated book
  } catch (err) {
    console.error(`Error executing query for PUT /books/${req.params.id}:`, err.stack);
    if (err.code === '23505') { // PostgreSQL unique violation error code
        return res.status(409).send('Another book with this ISBN already exists.');
    }
    res.status(500).send('Error updating book in database');
  }
});

// DELETE a book by ID
app.delete('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Book not found');
    }
    res.status(204).send(); // 204 No Content for successful deletion
  } catch (err) {
    console.error(`Error executing query for DELETE /books/${req.params.id}:`, err.stack);
    res.status(500).send('Error deleting book from database');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
  console.log(`Access the backend via Codespaces forwarded port: https://[your-codespace-url]-${port}.githubpreview.dev`);
});