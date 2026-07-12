import serverless from 'serverless-http';
import app from '../../server/app.js';
import { initDb } from '../../server/db.js';

let handler;

async function getHandler() {
  if (!handler) {
    await initDb();
    handler = serverless(app);
  }
  return handler;
}

export default async (request, context) => {
  const h = await getHandler();
  return h(request, context);
};

export const config = {
  path: '/api/*',
};
