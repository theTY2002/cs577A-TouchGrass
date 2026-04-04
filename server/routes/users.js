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

/**
 * POST body: { ids: (string|number)[] } — values are chat_messages.sender_user_id / users.u_id.
 * Returns { [u_id: string]: label } using users.name, then email local part (no user_profiles.display_name — column may be absent).
 * Must be registered before GET /:user_id so "display-names" is not parsed as an id.
 */
router.post('/display-names', async (req, res) => {
    const raw = req.body?.ids;
    if (!Array.isArray(raw) || raw.length === 0) {
        return res.json({});
    }

    const numericIds = [
        ...new Set(
            raw
                .map((id) => parseInt(String(id), 10))
                .filter((n) => !Number.isNaN(n)),
        ),
    ];

    if (numericIds.length === 0) {
        return res.json({});
    }

    try {
        const result = await pool.query(
            `
            SELECT
                u.u_id,
                COALESCE(
                    NULLIF(TRIM(COALESCE(u.name, '')), ''),
                    NULLIF(TRIM(SPLIT_PART(COALESCE(u.email, ''), '@', 1)), '')
                ) AS display_name
            FROM users u
            WHERE u.u_id = ANY($1::int[])
            `,
            [numericIds],
        );

        const map = {};
        for (const row of result.rows) {
            const id = String(row.u_id);
            map[id] = row.display_name?.trim() || `User ${id}`;
        }
        res.json(map);
    } catch (error) {
        console.error('Error batch-fetching display names:', error);
        res.status(500).json({ error: 'Failed to resolve display names' });
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