require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt'); // <--- ADD THIS
const jwt = require('jsonwebtoken'); // <--- ADD THIS
const app = express();
const cors = require('cors');
// ... (rest of your existing imports)

const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET; // <--- ADD THIS

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

// --- USER AUTHENTICATION ROUTES ---

// User Registration
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

    // Default role is 'user' as per schema default, or 'admin' if specified (for initial setup)
    // For production, you might not allow 'admin' registration directly
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, 'user'] // Always register as 'user'
    );
    res.status(201).json({ message: 'User registered successfully!', user: result.rows[0] });
  } catch (err) {
    console.error('Error during registration:', err.stack);
    if (err.code === '23505') { // Unique violation (username or email already exists)
      return res.status(409).json({ message: 'Username or email already exists.' });
    }
    res.status(500).json({ message: 'Error registering user.' });
  }
});

// User Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Find user by username
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    res.json({ message: 'Logged in successfully!', token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Error during login:', err.stack);
    res.status(500).json({ message: 'Error logging in.' });
  }
});

// --- AUTHENTICATION MIDDLEWARE ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN"

  if (token == null) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      // Token is invalid or expired
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    req.user = user; // Attach user payload to the request
    next(); // Proceed to the next middleware/route handler
  });
}

// --- AUTHORIZATION MIDDLEWARE ---
function authorizeRole(roles) { // `roles` is an array of allowed roles, e.g., ['admin']
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden: Insufficient permissions.' });
    }
    next(); // User has the required role, proceed
  };
}

// --- BOOK API ENDPOINTS ---

// GET all books (typically public)
app.get('/books', async (req, res) => {
  try {
    const allBooks = await pool.query('SELECT * FROM books');
    res.json(allBooks.rows);
  } catch (err) {
    console.error('Error executing query for GET /books:', err.stack);
    res.status(500).send('Error retrieving books from database');
  }
});

// GET a single book by ID (typically public, or could be authenticated if all book details are protected)
app.get('/books/:id', async (req, res) => { // Make sure no authentication middleware is here for now
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Book not found');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error executing query for GET /books/${req.params.id}:`, err.stack);
    res.status(500).send('Error retrieving book from database');
  }
});

// POST a new book (requires admin role)
app.post('/books', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { title, author, isbn, published_date, introduction, file_path } = req.body;

    // Basic validation for published_date (ensure it's a valid year if provided)
    let publishedYear = null;
    if (published_date) {
      const year = parseInt(published_date, 10);
      if (isNaN(year) || year < 1000 || year > new Date().getFullYear() + 50) { // Example year range validation
        return res.status(400).send('Published Year must be a valid year (e.g., 1999).');
      }
      publishedYear = year;
    }

    if (!title || !author || !isbn || !file_path) {
      return res.status(400).send('Title, author, ISBN, and file path are required.');
    }

    const result = await pool.query(
      'INSERT INTO books (title, author, isbn, published_date, introduction, file_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, author, isbn, publishedYear, introduction, file_path] // Use publishedYear here
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error executing query for POST /books:', err.stack);
    if (err.code === '23505') {
      return res.status(409).send('Book with this ISBN already exists.');
    }
    res.status(500).send('Error adding new book to database');
  }
});

// PUT (Update) an existing book by ID (requires admin role)
app.put('/books/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, published_date, introduction, file_path } = req.body;

    // Basic validation for published_date (ensure it's a valid year if provided)
    let publishedYear = null;
    if (published_date) {
      const year = parseInt(published_date, 10);
      if (isNaN(year) || year < 1000 || year > new Date().getFullYear() + 50) { // Example year range validation
        return res.status(400).send('Published Year must be a valid year (e.g., 1999).');
      }
      publishedYear = year;
    }

    const result = await pool.query(
      'UPDATE books SET title = $1, author = $2, isbn = $3, published_date = $4, introduction = $5, file_path = $6 WHERE id = $7 RETURNING *',
      [title, author, isbn, publishedYear, introduction, file_path, id] // Use publishedYear here
    );
    if (result.rows.length === 0) {
      return res.status(404).send('Book not found');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error executing query for PUT /books/${req.params.id}:`, err.stack);
    if (err.code === '23505') {
      return res.status(409).send('Another book with this ISBN already exists.');
    }
    res.status(500).send('Error updating book in database');
  }
});

// DELETE a book by ID (requires admin role)
app.delete('/books/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => { // <--- MODIFIED
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