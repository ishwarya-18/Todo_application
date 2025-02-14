import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import cors from 'cors';
import pkg from 'pg';  
dotenv.config();  
const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = ['http://localhost:3002', 'http://localhost:3000','http://localhost:3001'];

app.use(cors({
    origin: allowedOrigins,  // Allows requests from the specified origins
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
}));

app.use(bodyParser.json());

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: 'todo_db',
  password: process.env.POSTGRES_PASSWORD,
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/todo_db`,
  port: process.env.POSTGRES_PORT || 5432,
});

pool.connect((err) => {
    if (err) {
        process.exit(1);
    } else {
        console.log('Connected to the PostgreSQL database');
    }
});

app.get('/', (req, res) => {
    res.send('Backend server is running! Use the API endpoints to interact.');
});

// Auth routes
app.post('/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({  message: 'User registered successfully, please login.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, hashedPassword, 'user']  // Default role set to 'user'
        );

        const token = jwt.sign({ userId: result.rows[0].id, role: result.rows[0].role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ message: 'User registered successfully', token });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error, please try again later' });
    }
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];
        
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Generate token including the role
        const token = jwt.sign(
            { userId: user.id, role: user.role },  // Include the role in the token
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});


// Middleware to verify token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];  // Extract token from the Authorization header

    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.userId = decoded.userId;
        req.role = decoded.role;  // Store the role from the token
        next();
    });
};

const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];  // Extract token from the Authorization header

    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        req.userId = decoded.userId;
        req.role = decoded.role;  // Store the role from the token

        if (req.role === 'admin') {
            return next();  // Admin role confirmed, proceed to next middleware or route handler
        } else {
            return res.status(403).json({ error: 'Access denied: Admins only' });
        }
    });
};


// Task Routes
app.get('/todos', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM todos WHERE user_id = $1', [req.userId]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching tasks' });
    }
});

app.post('/todos', verifyToken, async (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Task title is required' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO todos (task, user_id, completed) VALUES ($1, $2, $3) RETURNING *',
            [title, req.userId, false]
        );
        res.status(201).json(result.rows[0]);  // Return the newly added task
    } catch (err) {
        res.status(500).json({ error: 'Error adding task', details: err.message });
    }
});

app.patch('/todos/:taskId', verifyToken, async (req, res) => {
    const { taskId } = req.params;
    const { completed } = req.body;

    try {
        const result = await pool.query(
            'UPDATE todos SET completed = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
            [completed, taskId, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(result.rows[0]);  // Return the updated task
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error updating task' });
    }
});

app.delete('/todos/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json({ message: 'Task deleted successfully', task: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Admin route that requires admin role
app.get('/admin', verifyToken, verifyAdmin, (req, res) => {
    // This route will serve the admin page/dashboard
    res.status(200).send('Welcome to the Admin Page');
});

// Get all users (for admin use)
app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email FROM users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching users' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
    const userId = req.params.id;
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully', user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});
