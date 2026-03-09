const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

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


// Get the social media feed from Supabase
app.get('/api/feed', async (req, res) => {
  try {
      let queryText = `
          SELECT 
              p.post_id, 
              p.title, 
              p.datetime AS date, 
              p.location_text AS location,
              p.plan_text AS description, 
              p.tags, 
              p.capacity AS max_members, 
              p.status,
              u.username AS author_name
          FROM posts p
          JOIN users u ON p.owner_user_id = u.u_id
      `;
      let values = [];

      // Add a filter if the tag query parameter exists
      if (req.query.tag) {
          queryText += ` WHERE p.tags ILIKE $1`;
          values.push(`%${req.query.tag}%`);
      }

      queryText += ` ORDER BY p.datetime DESC;`;

      const result = await pool.query(queryText, values);
      res.json(result.rows);
  } catch (error) {
      console.error('Feed query error:', error);
      res.status(500).json({ error: 'Failed to fetch the feed' });
  }
});

// Get a specific user profile from Supabase
app.get('/api/profile/:user_id', async (req, res) => {
  try {
      const userId = parseInt(req.params.user_id);
      const queryText = `
          SELECT 
              u.u_id AS user_id, 
              u.username AS name, 
              up.major, 
              up.bio, 
              up.interests
          FROM users u
          LEFT JOIN user_profiles up ON u.u_id = up.user_id
          WHERE u.u_id = $1;
      `;
      
      const result = await pool.query(queryText, [userId]);
      
      if (result.rows.length > 0) {
          res.json(result.rows[0]);
      } else {
          res.status(404).json({ error: 'User profile not found' });
      }
  } catch (error) {
      console.error('Profile query error:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});


// Get a specific user profile from Supabase
app.get('/api/profile/:user_id', async (req, res) => {
  try {
      const userId = parseInt(req.params.user_id);
      
      // This query joins the authentication table (users) with the details table (user_profiles)
      const queryText = `
          SELECT 
              u.u_id AS user_id, 
              u.username AS name, 
              up.major, 
              up.bio, 
              up.interests
          FROM users u
          LEFT JOIN user_profiles up ON u.u_id = up.user_id
          WHERE u.u_id = $1;
      `;
      
      const result = await pool.query(queryText, [userId]);
      
      if (result.rows.length > 0) {
          res.json(result.rows[0]);
      } else {
          res.status(404).json({ error: 'User profile not found' });
      }
  } catch (error) {
      console.error('Profile query error:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Get the status of a specific group from Supabase
app.get('/api/groups/:post_id/status', async (req, res) => {
  try {
      const postId = parseInt(req.params.post_id);
      
      // This query connects posts to groups, then counts the matching rows in group_members
      const queryText = `
          SELECT 
              p.status,
              COUNT(gm.user_id)::int AS current_members
          FROM posts p
          LEFT JOIN groups g ON p.post_id = g.post_id
          LEFT JOIN group_members gm ON g.group_id = gm.group_id
          WHERE p.post_id = $1
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

app.get('/api/seed', async (req, res) => {
  try {
      const queryText = `
          INSERT INTO posts (owner_user_id, title, tags, datetime, location_text, plan_text, capacity, status)
          VALUES
          (1, 'Weekend Hike at Griffith', 'Hiking', '2026-03-14 10:00:00-07', 'Griffith Observatory', 'Looking for people to hike and touch grass!', 5, 'OPEN'),
          (1, 'Morning Coffee & Chat', 'Coffee', '2026-03-15 09:00:00-07', 'Campus Cafe', 'Casual meetup for anyone who wants to start the day with good vibes.', 6, 'OPEN'),
          (1, 'Study Session at the Library', 'Study', '2026-03-16 14:00:00-07', 'Leavey Library', 'Let us grind some LeetCode and finish our projects.', 4, 'OPEN'),
          (1, 'Basketball at the Village', 'Sport', '2026-03-17 17:00:00-07', 'USC Village Courts', 'Running some pickup games today.', 10, 'OPEN')
          RETURNING *;
      `;
      const result = await pool.query(queryText);
      res.json({
          message: 'Successfully inserted test posts',
          inserted_rows: result.rows
      });
  } catch (error) {
      console.error('Seed query error:', error);
      res.status(500).json({ error: 'Failed to insert test data' });
  }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});