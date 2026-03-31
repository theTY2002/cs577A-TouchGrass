const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// GET: Retrieve user information
router.get('/:user_id', async (req, res) => {
    const userId = parseInt(req.params.user_id);

    try {
        const queryText = `
            SELECT 
                u.u_id AS user_id, 
                SPLIT_PART(u.email, '@', 1) AS name, 
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