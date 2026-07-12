import { initDb } from './db.js';
import app from './app.js';

const PORT = process.env.PORT || 3001;

async function start() {
  await initDb();

  app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Ошибка запуска сервера:', err);
  process.exit(1);
});
