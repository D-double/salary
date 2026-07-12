import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

export async function initDb() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      date TEXT NOT NULL,
      comment TEXT DEFAULT '',
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    )
  `);

  await client.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)`);
}

export { client as db };
