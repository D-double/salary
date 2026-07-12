import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import transactionsRouter from './routes/transactions.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/transactions', transactionsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Внутренняя ошибка сервера' });
});

export default app;
