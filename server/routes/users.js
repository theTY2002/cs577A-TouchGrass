const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { requireAuth } = require('../middleware/auth');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// PATCH: Update the authenticated user's name + profile fields
router.patch('/profile', requireAuth, async (req, res) => {
    const userId = req.user.id;
    const { name, bio, major, interests, avatar_url } = req.body;

    try {
        // Update display name on the users row
        if (name !== undefined) {
            await pool.query(
                `UPDATE users SET name = $1 WHERE u_id = $2;`,
                [name || null, userId]
            );
        }

        // Upsert extended profile fields
        await pool.query(
            `INSERT INTO user_profiles (user_id, bio, major, interests, avatar_url, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT (user_id) DO UPDATE SET
               bio        = EXCLUDED.bio,
               major      = EXCLUDED.major,
               interests  = EXCLUDED.interests,
               avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
               updated_at = NOW();`,
            [userId, bio ?? null, major ?? null, interests ?? null, avatar_url ?? null]
        );

        res.json({ ok: true });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// GET: Retrieve user information
router.get('/:user_id', async (req, res) => {
    const userId = parseInt(req.params.user_id);

    try {
        const queryText = `
            SELECT
                u.u_id AS user_id,
                COALESCE(u.name, SPLIT_PART(u.email, '@', 1)) AS name,
                u.email,
                up.major,
                up.bio,
                up.interests,
                up.avatar_url
            FROM users u
            LEFT JOIN user_profiles up ON u.u_id = up.user_id
            WHERE u.u_id = $1;
        `;
        
        const result = await pool.query(queryText, [userId]);
        
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({ error: 'Failed to retrieve user information' });
    }
});

module.exports = router;