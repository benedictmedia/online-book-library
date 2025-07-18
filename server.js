require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const cors = require('cors');

const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET; // Ensure this is set in your .env file!

// Use CORS middleware - This should be before your routes
app.use(cors());

app.use(express.json());

// Configure the PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // For local Docker connections, SSL is usually not needed and can cause issues.
  // Only enable if connecting to a remote database that requires SSL.
  // ssl: {
  //   rejectUnauthorized: false
  // }
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
// Changed route from /register to /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, isAdmin } = req.body; // isAdmin is a boolean from frontend

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    // Check if username or email already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existingUser.rows.length > 0) {
      const duplicateUsername = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
      if (duplicateUsername.rows.length > 0) {
        return res.status(409).json({ message: 'Username already exists.' });
      }
      const duplicateEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (duplicateEmail.rows.length > 0) {
        return res.status(409).json({ message: 'Email already exists.' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

    // Insert isAdmin (boolean) directly into the is_admin column
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, username, email, is_admin',
      [username, email, hashedPassword, isAdmin] // Use isAdmin directly
    );
    res.status(201).json({ message: 'User registered successfully!', user: result.rows[0] });
  } catch (err) {
    console.error('Error during registration:', err.stack);
    res.status(500).json({ message: 'Error registering user.' });
  }
});

// User Login
// Changed route from /login to /api/auth/login
app.post('/api/auth/login', async (req, res) => {
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
      { id: user.id, username: user.username, is_admin: user.is_admin }, // Include is_admin directly in JWT payload
      jwtSecret,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    res.json({
      message: 'Logged in successfully!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin // Send is_admin directly
      }
    });
  } catch (err) {
    console.error('Error during login:', err.stack);
    res.status(500).json({ message: 'Error logging in.' });
  }
});

// --- AUTHENTICATION MIDDLEWARE ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    // Attach user payload to the request, expecting is_admin from JWT
    req.user = {
      id: user.id,
      username: user.username,
      is_admin: user.is_admin // Access is_admin directly from JWT payload
    };
    next();
  });
}

// --- AUTHORIZATION MIDDLEWARE ---
// This middleware now specifically checks for admin role based on is_admin boolean
function authorizeRole(roles) { // Expects roles like ['admin']
  return (req, res, next) => {
    // If 'admin' role is required and user is not admin, deny
    if (roles.includes('admin') && (!req.user || !req.user.is_admin)) {
      return res.status(403).json({ message: 'Access forbidden: Only administrators can perform this action.' });
    }
    // If you were to add other string roles (e.g., 'moderator'),
    // you would expand this logic, but for simple admin/user, this works.
    next();
  };
}

// --- BOOK API ENDPOINTS ---
// Prefixed all book routes with /api/
// GET all books (with optional search/filter and pagination)
app.get('/api/books', async (req, res) => {
  try {
    const { search, author, isbn, published_year, page = 1, limit = 10 } = req.query;
    let query = 'SELECT * FROM books';
    let countQuery = 'SELECT COUNT(*) FROM books';
    const queryParams = [];
    let paramIndex = 1;
    const conditions = [];

    // Build WHERE clause based on provided search/filter parameters
    if (search) {
      conditions.push(`(title ILIKE $${paramIndex} OR author ILIKE $${paramIndex} OR isbn ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    if (author) {
      conditions.push(`author ILIKE $${paramIndex}`);
      queryParams.push(`%${author}%`);
      paramIndex++;
    }
    if (isbn) {
      conditions.push(`isbn ILIKE $${paramIndex}`);
      queryParams.push(`%${isbn}%`);
      paramIndex++;
    }
    if (published_year) {
      const yearInt = parseInt(published_year, 10);
      if (!isNaN(yearInt)) {
        conditions.push(`published_date = $${paramIndex}`);
        queryParams.push(yearInt);
        paramIndex++;
      }
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // Get total count first (without LIMIT/OFFSET)
    const totalCountResult = await pool.query(countQuery, queryParams);
    const totalBooks = parseInt(totalCountResult.rows[0].count, 10);

    // Add ORDER BY, LIMIT, and OFFSET for pagination
    query += ' ORDER BY title ASC';

    // Ensure page and limit are positive integers
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, parseInt(limit, 10));
    const offset = (parsedPage - 1) * parsedLimit;

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parsedLimit, offset);

    const result = await pool.query(query, queryParams);
    res.json({
      books: result.rows,
      totalBooks,
      currentPage: parsedPage,
      totalPages: Math.ceil(totalBooks / parsedLimit)
    });
  } catch (err) {
    console.error('Error executing query for GET /api/books:', err.stack);
    res.status(500).send('Error retrieving books from database');
  }
});

// GET a single book by ID
app.get('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Book not found');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error executing query for GET /api/books/${req.params.id}:`, err.stack);
    res.status(500).send('Error retrieving book from database');
  }
});

// POST a new book (requires admin role)
app.post('/api/books', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { title, author, isbn, published_date, introduction, file_path } = req.body;

    // Basic validation for published_date (ensure it's a valid year if provided)
    let publishedYear = null;
    if (published_date) {
      const year = parseInt(published_date, 10);
      if (isNaN(year) || year < 1000 || year > new Date().getFullYear() + 50) {
        return res.status(400).send('Published Year must be a valid year (e.g., 1999).');
      }
      publishedYear = year;
    }

    if (!title || !author || !isbn || !file_path) {
      return res.status(400).send('Title, author, ISBN, and file path are required.');
    }

    const result = await pool.query(
      'INSERT INTO books (title, author, isbn, published_date, introduction, file_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, author, isbn, publishedYear, introduction, file_path]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error executing query for POST /api/books:', err.stack);
    if (err.code === '23505') {
      return res.status(409).send('Book with this ISBN already exists.');
    }
    res.status(500).send('Error adding new book to database');
  }
});

// PUT (Update) an existing book by ID (requires admin role)
app.put('/api/books/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, published_date, introduction, file_path } = req.body;

    // Basic validation for published_date (ensure it's a valid year if provided)
    let publishedYear = null;
    if (published_date) {
      const year = parseInt(published_date, 10);
      if (isNaN(year) || year < 1000 || year > new Date().getFullYear() + 50) {
        return res.status(400).send('Published Year must be a valid year (e.g., 1999).');
      }
      publishedYear = year;
    }

    const result = await pool.query(
      'UPDATE books SET title = $1, author = $2, isbn = $3, published_date = $4, introduction = $5, file_path = $6 WHERE id = $7 RETURNING *',
      [title, author, isbn, publishedYear, introduction, file_path, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send('Book not found');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error executing query for PUT /api/books/${req.params.id}:`, err.stack);
    if (err.code === '23505') {
      return res.status(409).send('Another book with this ISBN already exists.');
    }
    res.status(500).send('Error updating book in database');
  }
});

// DELETE a book by ID (requires admin role)
app.delete('/api/books/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Book not found');
    }
    res.status(204).send(); // 204 No Content for successful deletion
  } catch (err) {
    console.error(`Error executing query for DELETE /api/books/${req.params.id}:`, err.stack);
    res.status(500).send('Error deleting book from database');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
  console.log(`Access the backend via Codespaces forwarded port: https://[your-codespace-url]-${port}.githubpreview.dev`);
});