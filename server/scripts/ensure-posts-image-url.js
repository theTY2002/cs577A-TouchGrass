/**
 * Ensures posts.image_url exists (run once per database).
 * Usage from repo root: cd server && npm run db:ensure-image-column
 */
const fs = require('fs');
const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});

const { pool } = require('../db/pool');

async function main() {
  const sqlPath = path.join(__dirname, '../migrations/003_posts_image_url.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
  console.log('Applied migration:', path.basename(sqlPath));
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
