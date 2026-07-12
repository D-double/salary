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

export default app;
