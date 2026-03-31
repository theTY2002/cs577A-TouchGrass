const { pool } = require('../db/pool');
const { hashPassword, verifyPassword } = require('./passwords');

function toSafeUser(row) {
  return {
    id: row.u_id,
    email: row.email,
    displayName: row.display_name || '',
    username: row.username || '',
  };
}

async function createUser({ email, password, displayName, username }) {
  const passwordHash = await hashPassword(password);
  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = await pool.query('SELECT u_id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;', [
    normalizedEmail,
  ]);
  if (existing.rowCount > 0) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }

  const result = await pool.query(
    `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING u_id, email;
    `,
    [normalizedEmail, passwordHash],
  );

  const user = result.rows[0];
  await pool.query(
    `
      INSERT INTO user_profiles (user_id, bio)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO NOTHING;
    `,
    [user.u_id, null],
  );

  return {
    ...toSafeUser({
      ...user,
      display_name: displayName,
      username,
    }),
  };
}

async function authenticateUser({ email, password }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const result = await pool.query(
    'SELECT u_id, email, password_hash FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;',
    [normalizedEmail],
  );
  if (result.rowCount === 0) return null;

  const row = result.rows[0];
  // Legacy compatibility: older seed data stores plain text values like "hash1".
  // New accounts use scrypt salt:hash format and should verify through verifyPassword.
  const storedHash = String(row.password_hash || '');
  const ok = storedHash.includes(':')
    ? await verifyPassword(password, storedHash)
    : password === storedHash;
  if (!ok) return null;

  return toSafeUser(row);
}

async function getUserById(userId) {
  const result = await pool.query('SELECT u_id, email FROM users WHERE u_id = $1 LIMIT 1;', [userId]);
  if (result.rowCount === 0) return null;
  return toSafeUser(result.rows[0]);
}

module.exports = {
  createUser,
  authenticateUser,
  getUserById,
};
