const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { invalidateFeedCache } = require('../feed/feedCache');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// POST: Create a new event and its associated group
router.post('/', async (req, res) => {
    const { owner_user_id, title, tags, datetime_start, location_text, plan_text, capacity } = req.body;

    try {
        // 1. Create the post in the posts table
        const postResult = await pool.query(
            `INSERT INTO posts (owner_user_id, title, tags, datetime_start, location_text, plan_text, capacity, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'open') 
             RETURNING p_id;`,
            [owner_user_id, title, tags, datetime_start, location_text, plan_text, capacity]
        );
        
        const newPostId = postResult.rows[0].p_id;

        // 2. Automatically create a group for this post
        const groupResult = await pool.query(
            `INSERT INTO groups (post_id) VALUES ($1) RETURNING g_id;`,
            [newPostId]
        );
        
        const newGroupId = groupResult.rows[0].g_id;

        // 3. Automatically add the creator as a member of their own group
        await pool.query(
            `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'admin');`,
            [newGroupId, owner_user_id]
        );

        invalidateFeedCache();

        res.status(201).json({ 
            message: 'Event and group successfully created', 
            post_id: newPostId 
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create the event' });
    }
});

// POST: Join an existing event
router.post('/:post_id/join', async (req, res) => {
    const postId = req.params.post_id;
    const { user_id } = req.body; // The frontend will send the logged-in user's ID

    try {
        // 1. Find the group ID associated with this post
        const groupResult = await pool.query(
            'SELECT g_id FROM groups WHERE post_id = $1', 
            [postId]
        );

        if (groupResult.rows.length === 0) {
            return res.status(404).json({ error: 'Group not found for this event' });
        }

        const groupId = groupResult.rows[0].g_id;

        // 2. Add the user to the group members table
        await pool.query(
            'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [groupId, user_id, 'member']
        );

        // 3. Calculate the new total number of members to send back to the frontend
        const countResult = await pool.query(
            'SELECT COUNT(*)::int AS count FROM group_members WHERE group_id = $1',
            [groupId]
        );

        invalidateFeedCache();

        res.json({ 
            message: 'Successfully joined event', 
            current_members: countResult.rows[0].count 
        });
    } catch (error) {
        console.error('Error joining event:', error);
        res.status(500).json({ error: 'Failed to join the event' });
    }
});

module.exports = router;