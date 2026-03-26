const { Pool } = require("pg");

const pool = new Pool({
    connectionString: "postgresql://postgres.qanzkdcvtzcovaykwmks:pANciGy2-%2FJgf58@aws-1-us-east-1.pooler.supabase.com:5432/postgres",
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;