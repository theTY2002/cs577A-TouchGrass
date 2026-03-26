const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const pool = require("./db");

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(
    session({
        secret: "my-secret-key", // hard-coded for dev only
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 // 1 day
        }
    })
);

// helper middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ error: "Unauthorized" });
    }
}

// Test root
app.get("/", (req, res) => {
    res.json({ message: "Server is running!" });
});

// Test database
app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ time: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// Register
app.post("/api/register", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }
    const allowedDomains = ["usc.edu"];
    const domain = email.split("@")[1];
    if (!allowedDomains.includes(domain)) {
        return res.status(400).json({
            error: "Only emails with allowed domain are accepted"
        });
    }
    try {
        const existingUser = await pool.query(
            "SELECT u_id FROM users WHERE email = $1",
            [email]
        );
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: "User already exists" });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING u_id, email, created_at`,
            [email, passwordHash]
        );
        res.json({
            message: "User registered successfully",
            user: result.rows[0]
        });
    } catch (err) {
        console.error("REGISTER ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }
    try {
        const result = await pool.query(
            "SELECT u_id, email, password_hash FROM users WHERE email = $1",
            [email]
        );
        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        req.session.user = {
            u_id: user.u_id,
            email: user.email
        };
        res.json({
            message: "Logged in successfully",
            user: {
                u_id: user.u_id,
                email: user.email
            }
        });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// Auth check
app.get("/api/me", (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.status(401).json({ loggedIn: false });
    }
});

// Protected route
app.get("/api/dashboard", requireAuth, (req, res) => {
    res.json({
        message: `Welcome to the dashboard, ${req.session.user.email}`,
        userId: req.session.user.u_id,
        secretData: "This is protected data"
    });
});

// Logout
app.post("/api/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Session destroy error:", err);
            return res.status(500).json({ error: "Could not log out" });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out" });
    });
});


// DB tests
app.get("/api/test-user", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM users");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database query failed" });
    }
});
app.get("/api/schema-users", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'users'`
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});




app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
