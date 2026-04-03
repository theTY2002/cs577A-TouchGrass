const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const { invalidateFeedCache } = require("../feed/feedCache");
const { requireAuth } = require("../middleware/auth");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// POST: Create a new event and its associated group
router.post("/", async (req, res) => {
  const {
    owner_user_id,
    title,
    tags,
    datetime_start,
    location_text,
    plan_text,
    capacity,
  } = req.body;

  try {
    // 1. Create the post in the posts table
    const postResult = await pool.query(
      `INSERT INTO posts (owner_user_id, title, tags, datetime_start, location_text, plan_text, capacity, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'open') 
             RETURNING p_id;`,
      [
        owner_user_id,
        title,
        tags,
        datetime_start,
        location_text,
        plan_text,
        capacity,
      ],
    );

    const newPostId = postResult.rows[0].p_id;

    // 2. Automatically create a group for this post
    const groupResult = await pool.query(
      `INSERT INTO groups (post_id) VALUES ($1) RETURNING g_id;`,
      [newPostId],
    );

    const newGroupId = groupResult.rows[0].g_id;

    // 3. Automatically add the creator as a member of their own group
    await pool.query(
      `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'admin');`,
      [newGroupId, owner_user_id],
    );

    invalidateFeedCache();

    res.status(201).json({
      message: "Event and group successfully created",
      post_id: newPostId,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create the event" });
  }
});

// POST: Join an existing event — resolve group via groups.post_id, then insert group_members.
router.post("/:post_id/join", async (req, res) => {
  const postId = parseInt(req.params.post_id, 10);
  const userId = parseInt(req.body?.user_id, 10);

  if (!Number.isFinite(postId) || postId < 1) {
    return res.status(400).json({ error: "Invalid post id" });
  }
  if (!Number.isFinite(userId) || userId < 1) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const groupResult = await client.query(
      `SELECT g.g_id, p.capacity
       FROM groups g
       INNER JOIN posts p ON p.p_id = g.post_id
       WHERE g.post_id = $1
       FOR UPDATE OF g`,
      [postId],
    );

    if (groupResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Group not found for this event" });
    }

    const { g_id: groupId, capacity } = groupResult.rows[0];
    const capNum = capacity != null ? Number(capacity) : null;
    const hasCap = Number.isFinite(capNum) && capNum > 0;

    const existing = await client.query(
      "SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2",
      [groupId, userId],
    );
    const alreadyMember = existing.rows.length > 0;

    const countResult = await client.query(
      "SELECT COUNT(*)::int AS count FROM group_members WHERE group_id = $1",
      [groupId],
    );
    const currentCount = countResult.rows[0].count;

    if (!alreadyMember && hasCap && currentCount >= capNum) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Group is full",
        code: "GROUP_FULL",
      });
    }

    const insertResult = await client.query(
      "INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [groupId, userId, "member"],
    );

    const inserted = insertResult.rowCount > 0;
    console.log(
      `[events/join] p_id=${postId} g_id=${groupId} group_members: ${
        inserted
          ? `inserted (user_id=${userId}, role=member)`
          : `skipped insert — user_id=${userId} already in group_members`
      }`,
    );

    const finalCount = await client.query(
      "SELECT COUNT(*)::int AS count FROM group_members WHERE group_id = $1",
      [groupId],
    );

    await client.query("COMMIT");
    invalidateFeedCache();

    res.json({
      message: "Successfully joined event",
      current_members: finalCount.rows[0].count,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error joining event:", error);
    res.status(500).json({ error: "Failed to join the event" });
  } finally {
    client.release();
  }
});

// POST: Leave an event — remove authenticated user from group_members (not available to event owner).
router.post("/:post_id/leave", requireAuth, async (req, res) => {
  const postId = parseInt(req.params.post_id, 10);
  const userId = Number(req.user.id);

  if (!Number.isFinite(postId) || postId < 1) {
    return res.status(400).json({ error: "Invalid post id" });
  }
  if (!Number.isFinite(userId) || userId < 1) {
    return res.status(400).json({ error: "Invalid session user" });
  }

  try {
    const postResult = await pool.query(
      "SELECT owner_user_id FROM posts WHERE p_id = $1",
      [postId],
    );
    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    if (Number(postResult.rows[0].owner_user_id) === userId) {
      return res.status(403).json({
        error: "Event host cannot leave the group",
        code: "HOST_CANNOT_LEAVE",
      });
    }

    const groupResult = await pool.query(
      "SELECT g_id FROM groups WHERE post_id = $1",
      [postId],
    );
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found for this event" });
    }
    const groupId = groupResult.rows[0].g_id;

    await pool.query(
      "DELETE FROM group_members WHERE group_id = $1 AND user_id = $2",
      [groupId, userId],
    );

    const countResult = await pool.query(
      "SELECT COUNT(*)::int AS count FROM group_members WHERE group_id = $1",
      [groupId],
    );

    invalidateFeedCache();

    res.json({
      message: "Successfully left event",
      current_members: countResult.rows[0].count,
    });
  } catch (error) {
    console.error("Error leaving event:", error);
    res.status(500).json({ error: "Failed to leave the event" });
  }
});

// GET: Retrieve a single event by ID and its members
router.get("/:post_id", async (req, res) => {
  const postId = parseInt(req.params.post_id);
  try {
    // 1. Fetch the main event details
    const eventQuery = `
            SELECT 
                p.p_id AS post_id, 
                p.title, 
                p.datetime_start AS date, 
                p.location_text AS location,
                p.plan_text AS description, 
                p.tags, 
                p.capacity AS max_members, 
                p.status,
                SPLIT_PART(u.email, '@', 1) AS author_name,
                COUNT(gm.user_id)::int AS current_members
            FROM posts p
            JOIN users u ON p.owner_user_id = u.u_id
            LEFT JOIN groups g ON p.p_id = g.post_id
            LEFT JOIN group_members gm ON g.g_id = gm.group_id
            WHERE p.p_id = $1
            GROUP BY p.p_id, u.email;
        `;
    const eventResult = await pool.query(eventQuery, [postId]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const eventData = eventResult.rows[0];

    // 2. Fetch the specific members of this event's group
    const membersQuery = `
            SELECT 
                u.u_id AS id, 
                SPLIT_PART(u.email, '@', 1) AS name, 
                up.avatar_url
            FROM group_members gm
            JOIN groups g ON gm.group_id = g.g_id
            JOIN users u ON gm.user_id = u.u_id
            LEFT JOIN user_profiles up ON u.u_id = up.user_id
            WHERE g.post_id = $1;
        `;
    const membersResult = await pool.query(membersQuery, [postId]);

    // 3. Attach the members array to the event object
    eventData.members = membersResult.rows;

    res.json(eventData);
  } catch (error) {
    console.error("Error fetching single event:", error);
    res.status(500).json({ error: "Failed to fetch event details" });
  }
});

module.exports = router;
