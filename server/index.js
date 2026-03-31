const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import your new route files
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const feedRoutes = require('./routes/feed');

const app = express();
const PORT = process.env.PORT || 5001;

function maskDatabaseUrl(url) {
  if (!url) return '(not set)';
  try {
    const u = new URL(url);
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return '(unparseable)';
  }
}

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5174");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(
      `[server] ${req.method} ${req.originalUrl || req.url} → ${res.statusCode} ${ms}ms`,
    );
  });
  next();
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

app.get('/', (req, res) => {
    res.send('TouchGrass API is running');
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is healthy' });
});

app.use('/api/auth', authRoutes);
// events route for creating and joining events
app.use('/api/events', eventRoutes);
// users route for retrieving user information
app.use('/api/users', userRoutes);
app.use('/api/feed', feedRoutes);

// Get the status of a specific group from Supabase
app.get('/api/groups/:post_id/status', async (req, res) => {
    try {
        const postId = parseInt(req.params.post_id, 10);
        console.log(`[server] /api/groups/${postId}/status query start`);
        
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
            const row = result.rows[0];
            console.log(
                `[server] /api/groups/${postId}/status ok status=${row.status} members=${row.current_members}`,
            );
            res.json({
                status: row.status,
                current_members: row.current_members
            });
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (error) {
        console.error('[server] /api/groups/.../status query error:', error.message || error);
        res.status(500).json({ error: 'Failed to fetch group status' });
    }
});

app.listen(PORT, () => {
    console.log(`[server] TouchGrass API listening at http://localhost:${PORT}`);
    console.log(`[server] DATABASE_URL → ${maskDatabaseUrl(process.env.DATABASE_URL)}`);
});