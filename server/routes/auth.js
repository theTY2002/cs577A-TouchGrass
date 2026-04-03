const express = require('express');
const { authenticateUser, createUser } = require('../auth/authService');
const { createSession, clearSession } = require('../auth/sessionStore');
const { requireAuth } = require('../middleware/auth');
const { pool } = require('../db/pool');

const router = express.Router();

function isUscEmail(value) {
  return String(value).trim().toLowerCase().includes('@usc');
}

router.post('/signup', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim();
    const password = String(req.body?.password || '');
    const displayName = String(req.body?.fullName || '').trim();
    const username = String(req.body?.username || '').trim();

    if (!email || !password) {
      console.log('[auth] signup rejected: missing email/password');
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (!isUscEmail(email)) {
      console.log(`[auth] signup rejected for ${email}: non-USC email`);
      return res.status(400).json({ error: 'USC email is required' });
    }
    if (password.length < 8) {
      console.log(`[auth] signup rejected for ${email}: short password`);
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await createUser({ email, password, displayName, username });
    console.log(`[auth] signup success user_id=${user.id} email=${user.email}`);
    return res.status(201).json({ user });
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) console.error('Signup error:', error);
    return res.status(status).json({ error: error.message || 'Failed to create account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      console.log('[auth] login rejected: missing email/password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await authenticateUser({ email, password });
    if (!user) {
      console.log(`[auth] login failed for email=${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createSession(user.id);
    console.log(`[auth] login success user_id=${user.id} email=${user.email}`);
    return res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to log in' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  console.log(`[auth] /me success user_id=${req.user.id}`);
  let joined_post_ids = [];
  try {
    const r = await pool.query(
      `SELECT DISTINCT g.post_id AS post_id
       FROM group_members gm
       INNER JOIN groups g ON g.g_id = gm.group_id
       WHERE gm.user_id = $1
       ORDER BY g.post_id`,
      [req.user.id],
    );
    joined_post_ids = r.rows.map((row) => row.post_id);
  } catch (e) {
    console.error('[auth] /me joined_post_ids query failed:', e);
  }
  res.json({ user: req.user, joined_post_ids });
});

router.post('/logout', requireAuth, async (req, res) => {
  console.log(`[auth] logout user_id=${req.user.id}`);
  clearSession(req.authToken);
  res.json({ ok: true });
});

module.exports = router;
