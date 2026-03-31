const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

// Import your new route files
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5001;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5000");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

app.get('/', (req, res) => {
    res.send('TouchGrass API is running');
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is healthy' });
});

// events route for creating and joining events 
app.use('/api/events', eventRoutes);
// users route for retrieving user information
app.use('/api/users', userRoutes);


// Get the social media feed from Supabase
app.get('/api/feed', async (req, res) => {
    try {
        // p_id is aliased to post_id, datetime_start is aliased to date
        // username was removed from the schema, so we extract the name from the email
        let queryText = `
            SELECT 
                p.p_id AS post_id, 
                p.title, 
                p.datetime_start AS date, 
                p.location_text AS location,
                p.plan_text AS description, 
                p.tags, 
                p.capacity AS max_members, 
                p.status,
                SPLIT_PART(u.email, '@', 1) AS author_name
            FROM posts p
            JOIN users u ON p.owner_user_id = u.u_id
        `;
        let values = [];

        // Add a filter if the tag query parameter exists
        if (req.query.tag) {
            queryText += ` WHERE p.tags ILIKE $1`;
            values.push(`%${req.query.tag}%`);
        }

        queryText += ` ORDER BY p.datetime_start DESC;`;

        const result = await pool.query(queryText, values);
        res.json(result.rows);
    } catch (error) {
        console.error('Feed query error:', error);
        res.status(500).json({ error: 'Failed to fetch the feed' });
    }
});

// Get the status of a specific group from Supabase
app.get('/api/groups/:post_id/status', async (req, res) => {
    try {
        const postId = parseInt(req.params.post_id);
        
        // Updated joins to match the new g_id and p_id schema logic
        const queryText = `
            SELECT 
                p.status,
                COUNT(gm.user_id)::int AS current_members
            FROM posts p
            LEFT JOIN groups g ON p.p_id = g.post_id
            LEFT JOIN group_members gm ON g.g_id = gm.group_id
            WHERE p.p_id = $1
            GROUP BY p.status;
        `;
        
        const result = await pool.query(queryText, [postId]);

        if (result.rows.length > 0) {
            res.json({
                status: result.rows[0].status,
                current_members: result.rows[0].current_members
            });
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (error) {
        console.error('Group status query error:', error);
        res.status(500).json({ error: 'Failed to fetch group status' });
    }
});



// Auth: login (placeholder - always succeeds for now)
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  // Placeholder: accept any email/password
  res.json({
    ok: true,
    user: { id: 1, email },
  });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});