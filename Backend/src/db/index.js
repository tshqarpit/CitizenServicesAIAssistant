const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const schema = require('./schema');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("Missing DATABASE_URL in .env. Drizzle connection not established.");
}

// Disable prefetch as it is not supported for "Transaction" pool mode in Supabase
const client = postgres(connectionString || 'postgresql://postgres:postgres@localhost:5432/postgres', { prepare: false });
const db = drizzle(client, { schema });

module.exports = db;
