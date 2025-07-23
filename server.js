require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const cors = require('cors');
const multer = require('multer');
const path = require('path'); // Add this line

const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET;

// Use CORS middleware
app.use(cors());
app.use(express.json()); // For parsing application/json - for non-file data

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Files will be saved in the 'uploads/' directory
    },
    filename: (req, file, cb) => {
        // Generate a unique filename: originalname + timestamp + extension
        cb(null, file.originalname.split('.')[0] + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Serve static files from the 'uploads' directory
// This makes files accessible via URL like http://localhost:3000/uploads/yourbook.pdf
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    done();
});

// Basic route for the home page (This will be overridden by the catch-all if in production/build mode)
app.get('/', (req, res) => {
    res.send('Welcome to the Online Book Library Backend!');
});

// --- USER AUTHENTICATION ROUTES ---

// User Registration
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, isAdmin } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required.' });
        }

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

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, username, email, is_admin',
            [username, email, hashedPassword, isAdmin]
        );
        res.status(201).json({ message: 'User registered successfully!', user: result.rows[0] });
    } catch (err) {
        console.error('Error during registration:', err.stack);
        res.status(500).json({ message: 'Error registering user.' });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, is_admin: user.is_admin },
            jwtSecret,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Logged in successfully!',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is_admin: user.is_admin
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
        req.user = {
            id: user.id,
            username: user.username,
            is_admin: user.is_admin
        };
        next();
    });
}

// --- AUTHORIZATION MIDDLEWARE ---
function authorizeRole(roles) {
    return (req, res, next) => {
        if (roles.includes('admin') && (!req.user || !req.user.is_admin)) {
            return res.status(403).json({ message: 'Access forbidden: Only administrators can perform this action.' });
        }
        next();
    };
}

// --- BOOK API ENDPOINTS ---
// GET all books (no changes)
app.get('/api/books', async (req, res) => {
    try {
        const { search, author, isbn, published_year, page = 1, limit = 10 } = req.query;
        let query = 'SELECT * FROM books';
        let countQuery = 'SELECT COUNT(*) FROM books';
        const queryParams = [];
        let paramIndex = 1;
        const conditions = [];

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

        const totalCountResult = await pool.query(countQuery, queryParams);
        const totalBooks = parseInt(totalCountResult.rows[0].count, 10);

        query += ' ORDER BY title ASC';

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

// GET a single book by ID (no changes)
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

// MODIFIED: POST a new book (requires admin role & file upload)
// Add `upload.single('bookFile')` middleware here
app.post('/api/books', authenticateToken, authorizeRole(['admin']), upload.single('bookFile'), async (req, res) => {
    try {
        // req.file contains information about the uploaded file (thanks to multer)
        // req.body contains other text fields
        const { title, author, isbn, published_date, introduction } = req.body;
        // Construct the file_path using the generated filename
        // If no file is uploaded (shouldn't happen with `required` validation, but for safety)
        const file_path = req.file ? `/uploads/${req.file.filename}` : null;

        // Basic validation for published_date (ensure it's a valid year if provided)
        let publishedYear = null;
        if (published_date) {
            const year = parseInt(published_date, 10);
            if (isNaN(year) || year < 1000 || year > new Date().getFullYear() + 50) {
                return res.status(400).send('Published Year must be a valid year (e.g., 1999).');
            }
            publishedYear = year;
        }

        // file_path is now required for new books
        if (!title || !author || !isbn || !file_path) {
            return res.status(400).send('Title, author, ISBN, and book file are required.');
        }

        const result = await pool.query(
            'INSERT INTO books (title, author, isbn, published_date, introduction, file_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, author, isbn, publishedYear, introduction, file_path]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error executing query for POST /api/books (file upload):', err.stack);
        if (err.code === '23505') { // Check for unique constraint violation (e.g., duplicate ISBN)
            return res.status(409).send('Book with this ISBN already exists.');
        }
        res.status(500).send('Error adding new book to database, check server logs.');
    }
});

// MODIFIED: PUT (Update) an existing book by ID (requires admin role & optional file upload)
// Add `upload.single('bookFile')` middleware here as well
app.put('/api/books/:id', authenticateToken, authorizeRole(['admin']), upload.single('bookFile'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, author, isbn, published_date, introduction } = req.body; // req.body will have text fields

        // Determine the file_path:
        // If a new file was uploaded (req.file exists), use its path.
        // Otherwise, assume the frontend sent the existing file path in `req.body.current_file_path`.
        let file_path = req.file ? `/uploads/${req.file.filename}` : req.body.current_file_path;

        // Basic validation for published_date
        let publishedYear = null;
        if (published_date) {
            const year = parseInt(published_date, 10);
            if (isNaN(year) || year < 1000 || year > new Date().getFullYear() + 50) {
                return res.status(400).send('Published Year must be a valid year (e.g., 1999).');
            }
            publishedYear = year;
        }

        // You might want to ensure title, author, isbn are still present
        if (!title || !author || !isbn) {
            return res.status(400).send('Title, author, and ISBN are required.');
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
        console.error(`Error executing query for PUT /api/books/${req.params.id} (file upload):`, err.stack);
        if (err.code === '23505') {
            return res.status(409).send('Another book with this ISBN already exists.');
        }
        res.status(500).send('Error updating book in database, check server logs.');
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

// --- NEW COMMENT API ENDPOINTS ---
// GET all comments for a specific book
app.get('/api/books/:bookId/comments', async (req, res) => {
    const { bookId } = req.params;
    try {
        const result = await pool.query(
            `SELECT c.id, c.comment_text, c.created_at, u.username
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.book_id = $1
             ORDER BY c.created_at DESC`, // Order by newest comments first
            [bookId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Internal server error fetching comments.' });
    }
});

// POST a new comment for a book
app.post('/api/books/:bookId/comments', authenticateToken, async (req, res) => {
    const { bookId } = req.params;
    const { comment_text } = req.body;
    const user_id = req.user.id; // User ID from authenticateToken middleware

    if (!comment_text || comment_text.trim() === '') {
        return res.status(400).json({ error: 'Comment text cannot be empty.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO comments (book_id, user_id, comment_text)
             VALUES ($1, $2, $3)
             RETURNING id, comment_text, created_at`, // Return necessary info for frontend
            [bookId, user_id, comment_text]
        );

        // Fetch the username to return with the new comment
        const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [user_id]);
        const newComment = { ...result.rows[0], username: userResult.rows[0].username };

        res.status(201).json(newComment);
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ error: 'Internal server error adding comment.' });
    }
});

// --- NEW ADDITION: Serve React Frontend ---
// This block should be placed AFTER all your API routes.
// It ensures that any non-API requests are handled by your React app.
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client', 'build')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}
// --- END NEW ADDITION ---

// Start the server
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
    console.log(`Access the backend via Codespaces forwarded port: https://[your-codespace-url]-${port}.githubpreview.dev`);
});