import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

async function all(sql, params = []) {
  const result = await db.execute({ sql, args: params });
  return result.rows;
}

async function get(sql, params = []) {
  const result = await db.execute({ sql, args: params });
  return result.rows[0] || null;
}

async function run(sql, params = []) {
  await db.execute({ sql, args: params });
}

router.get('/', async (req, res) => {
  const { type, category, dateFrom, dateTo } = req.query;

  let sql = 'SELECT * FROM transactions WHERE 1=1';
  const params = [];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  if (dateFrom) {
    sql += ' AND date >= ?';
    params.push(dateFrom);
  }

  if (dateTo) {
    sql += ' AND date <= ?';
    params.push(dateTo);
  }

  sql += ' ORDER BY date DESC, createdAt DESC';

  const transactions = await all(sql, params);
  res.json(transactions);
});

router.get('/recent', async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;

  const transactions = await all(
    'SELECT * FROM transactions ORDER BY date DESC, createdAt DESC LIMIT ?',
    [limit]
  );

  res.json(transactions);
});

router.get('/summary/balance', async (_req, res) => {
  const result = await get(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS totalIncome,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS totalExpense
    FROM transactions
  `);

  res.json({
    income: result.totalIncome,
    expense: result.totalExpense,
    balance: result.totalIncome - result.totalExpense
  });
});

router.get('/summary/category', async (req, res) => {
  const { type = 'expense' } = req.query;

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'type должен быть income или expense' });
  }

  const categories = await all(`
    SELECT category, SUM(amount) AS total
    FROM transactions
    WHERE type = ?
    GROUP BY category
    ORDER BY total DESC
  `, [type]);

  res.json(categories);
});

router.get('/summary/monthly', async (req, res) => {
  const monthsCount = parseInt(req.query.months) || 6;

  const months = await all(`
    SELECT
      substr(date, 1, 7) AS monthKey,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
    FROM transactions
    WHERE date >= date('now', '-' || ? || ' months', 'start of month')
    GROUP BY monthKey
    ORDER BY monthKey ASC
  `, [monthsCount]);

  res.json(months);
});

router.get('/:id', async (req, res) => {
  const transaction = await get('SELECT * FROM transactions WHERE id = ?', [req.params.id]);

  if (!transaction) {
    return res.status(404).json({ error: 'Транзакция не найдена' });
  }

  res.json(transaction);
});

router.post('/', async (req, res) => {
  const { type, category, amount, date, comment } = req.body;

  if (!type || !category || amount == null || !date) {
    return res.status(400).json({ error: 'Обязательные поля: type, category, amount, date' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'type должен быть income или expense' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'amount должен быть положительным числом' });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await run(
    `INSERT INTO transactions (id, type, category, amount, date, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, type, category, parsedAmount, date, comment || '', now]
  );

  const transaction = await get('SELECT * FROM transactions WHERE id = ?', [id]);
  res.status(201).json(transaction);
});

router.put('/:id', async (req, res) => {
  const existing = await get('SELECT * FROM transactions WHERE id = ?', [req.params.id]);

  if (!existing) {
    return res.status(404).json({ error: 'Транзакция не найдена' });
  }

  const { type, category, amount, date, comment } = req.body;

  if (type && !['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'type должен быть income или expense' });
  }

  const updatedType = type ?? existing.type;
  const updatedCategory = category ?? existing.category;
  const updatedAmount = amount != null ? parseFloat(amount) : existing.amount;
  const updatedDate = date ?? existing.date;
  const updatedComment = comment !== undefined ? comment : existing.comment;

  if (isNaN(updatedAmount) || updatedAmount <= 0) {
    return res.status(400).json({ error: 'amount должен быть положительным числом' });
  }

  const now = new Date().toISOString();

  await run(
    `UPDATE transactions SET type = ?, category = ?, amount = ?, date = ?, comment = ?, updatedAt = ? WHERE id = ?`,
    [updatedType, updatedCategory, updatedAmount, updatedDate, updatedComment, now, req.params.id]
  );

  const transaction = await get('SELECT * FROM transactions WHERE id = ?', [req.params.id]);
  res.json(transaction);
});

router.delete('/:id', async (req, res) => {
  const existing = await get('SELECT * FROM transactions WHERE id = ?', [req.params.id]);

  if (!existing) {
    return res.status(404).json({ error: 'Транзакция не найдена' });
  }

  await run('DELETE FROM transactions WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

export default router;
