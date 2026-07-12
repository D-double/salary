import serverless from 'serverless-http';
import app from '../../server/app.js';
import { initDb } from '../../server/db.js';

let initialized = false;

async function ensureDb() {
  if (!initialized) {
    await initDb();
    initialized = true;
  }
}

export default async (request, context) => {
  await ensureDb();
  const handler = serverless(app);
  return handler(request, context);
};

export const config = {
  path: '/api/*',
};
