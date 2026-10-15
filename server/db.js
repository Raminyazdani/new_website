'use strict';
const { Pool } = require('pg');
let pool;
function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_NOT_CONFIGURED');
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3, idleTimeoutMillis: 5000, connectionTimeoutMillis: 15000 });
    if (process.env.VERCEL) require('@vercel/functions').attachDatabasePool(pool);
  }
  return pool;
}
module.exports = { getPool };
