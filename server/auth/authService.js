const { pool } = require("../db/pool");
const { hashPassword, verifyPassword } = require("./passwords");

/** No `users.username` column — use email local part for session/UI when a handle is useful. */
function emailLocalPart(email) {
  const s = String(email || "").trim().toLowerCase();
  const at = s.lastIndexOf("@");
  return at >= 1 ? s.slice(0, at) : "";
}

function toSafeUser(row) {
  return {
    id: row.u_id,
    email: row.email,
    displayName: String(row.name ?? "").trim(),
    username: emailLocalPart(row.email),
  };
}

async function createUser({ email, password, displayName, username: _username }) {
  const passwordHash = await hashPassword(password);
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedDisplayName = String(displayName || "").trim();

  if (!normalizedDisplayName) {
    const err = new Error("Display name is required");
    err.status = 400;
    throw err;
  }

  const existing = await pool.query(
    "SELECT u_id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;",
    [normalizedEmail],
  );

  if (existing.rowCount > 0) {
    const err = new Error("Email already in use");
    err.status = 409;
    throw err;
  }

  const result = await pool.query(
    `
      INSERT INTO users (email, password_hash, name)
      VALUES ($1, $2, $3)
      RETURNING u_id, email, name;
    `,
    [normalizedEmail, passwordHash, normalizedDisplayName],
  );

  const user = result.rows[0];

  await pool.query(
    `
      INSERT INTO user_profiles (user_id, bio, major, interests, avatar_url, updated_at)
      VALUES ($1, NULL, NULL, NULL, NULL, NOW())
      ON CONFLICT (user_id) DO NOTHING;
    `,
    [user.u_id],
  );

  return toSafeUser(user);
}

async function authenticateUser({ email, password }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const result = await pool.query(
    "SELECT u_id, email, name, password_hash FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;",
    [normalizedEmail],
  );

  if (result.rowCount === 0) return null;

  const row = result.rows[0];
  const storedHash = String(row.password_hash || "");
  const ok = storedHash.includes(":")
    ? await verifyPassword(password, storedHash)
    : password === storedHash;

  if (!ok) return null;

  return toSafeUser(row);
}

async function getUserById(userId) {
  const result = await pool.query(
    "SELECT u_id, email, name FROM users WHERE u_id = $1 LIMIT 1;",
    [userId],
  );

  if (result.rowCount === 0) return null;
  return toSafeUser(result.rows[0]);
}

module.exports = {
  createUser,
  authenticateUser,
  getUserById,
};
