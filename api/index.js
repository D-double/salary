import { db, initDb } from '../server/db.js';

let initialized = false;

async function ensureDb() {
  if (!initialized) {
    await initDb();
    initialized = true;
  }
}

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

export default async function handler(req, res) {
  await ensureDb();

  const { method } = req;
  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname;

  res.setHeader('content-type', 'application/json');

  try {
    if (method === 'GET' && path === '/api/transactions/summary/balance') {
      const result = await get(`
        SELECT
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS totalIncome,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS totalExpense
        FROM transactions
      `);
      return res.status(200).json({
        income: result.totalIncome,
        expense: result.totalExpense,
        balance: result.totalIncome - result.totalExpense,
      });
    }

    if (method === 'GET' && path === '/api/transactions/summary/category') {
      const type = url.searchParams.get('type') || 'expense';
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ error: 'type должен быть income или expense' });
      }
      return res.status(200).json(await all(`
        SELECT category, SUM(amount) AS total
        FROM transactions WHERE type = ?
        GROUP BY category ORDER BY total DESC
      `, [type]));
    }

    if (method === 'GET' && path === '/api/transactions/summary/monthly') {
      const monthsCount = parseInt(url.searchParams.get('months')) || 6;
      return res.status(200).json(await all(`
        SELECT
          substr(date, 1, 7) AS monthKey,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
        FROM transactions
        WHERE date >= date('now', '-' || ? || ' months', 'start of month')
        GROUP BY monthKey ORDER BY monthKey ASC
      `, [monthsCount]));
    }

    if (method === 'GET' && path === '/api/transactions/recent') {
      const limit = parseInt(url.searchParams.get('limit')) || 5;
      return res.status(200).json(await all(
        'SELECT * FROM transactions ORDER BY date DESC, createdAt DESC LIMIT ?',
        [limit]
      ));
    }

    if (method === 'GET' && path === '/api/transactions') {
      let sql = 'SELECT * FROM transactions WHERE 1=1';
      const params = [];
      const type = url.searchParams.get('type');
      const category = url.searchParams.get('category');
      const dateFrom = url.searchParams.get('dateFrom');
      const dateTo = url.searchParams.get('dateTo');
      if (type) { sql += ' AND type = ?'; params.push(type); }
      if (category) { sql += ' AND category = ?'; params.push(category); }
      if (dateFrom) { sql += ' AND date >= ?'; params.push(dateFrom); }
      if (dateTo) { sql += ' AND date <= ?'; params.push(dateTo); }
      sql += ' ORDER BY date DESC, createdAt DESC';
      return res.status(200).json(await all(sql, params));
    }

    if (method === 'POST' && path === '/api/transactions') {
      const body = req.body || {};
      const { type, category, amount, date, comment } = body;
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
      return res.status(201).json(await get('SELECT * FROM transactions WHERE id = ?', [id]));
    }

    const idMatch = path.match(/^\/api\/transactions\/([^/]+)$/);
    if (idMatch) {
      const id = idMatch[1];

      if (method === 'GET') {
        const transaction = await get('SELECT * FROM transactions WHERE id = ?', [id]);
        if (!transaction) return res.status(404).json({ error: 'Транзакция не найдена' });
        return res.status(200).json(transaction);
      }

      if (method === 'PUT') {
        const existing = await get('SELECT * FROM transactions WHERE id = ?', [id]);
        if (!existing) return res.status(404).json({ error: 'Транзакция не найдена' });

        const body = req.body || {};
        const updatedType = body.type ?? existing.type;
        const updatedCategory = body.category ?? existing.category;
        const updatedAmount = body.amount != null ? parseFloat(body.amount) : existing.amount;
        const updatedDate = body.date ?? existing.date;
        const updatedComment = body.comment !== undefined ? body.comment : existing.comment;

        if (body.type && !['income', 'expense'].includes(body.type)) {
          return res.status(400).json({ error: 'type должен быть income или expense' });
        }
        if (isNaN(updatedAmount) || updatedAmount <= 0) {
          return res.status(400).json({ error: 'amount должен быть положительным числом' });
        }

        const now = new Date().toISOString();
        await run(
          `UPDATE transactions SET type = ?, category = ?, amount = ?, date = ?, comment = ?, updatedAt = ? WHERE id = ?`,
          [updatedType, updatedCategory, updatedAmount, updatedDate, updatedComment, now, id]
        );
        return res.status(200).json(await get('SELECT * FROM transactions WHERE id = ?', [id]));
      }

      if (method === 'DELETE') {
        const existing = await get('SELECT * FROM transactions WHERE id = ?', [id]);
        if (!existing) return res.status(404).json({ error: 'Транзакция не найдена' });
        await run('DELETE FROM transactions WHERE id = ?', [id]);
        return res.status(204).end();
      }
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
