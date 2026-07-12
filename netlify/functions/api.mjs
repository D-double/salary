import { db, initDb } from '../../server/db.js';

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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export default async (req) => {
  await ensureDb();

  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  try {
    if (method === 'GET' && path === '/api/transactions/summary/balance') {
      const result = await get(`
        SELECT
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS totalIncome,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS totalExpense
        FROM transactions
      `);
      return json({
        income: result.totalIncome,
        expense: result.totalExpense,
        balance: result.totalIncome - result.totalExpense,
      });
    }

    if (method === 'GET' && path === '/api/transactions/summary/category') {
      const type = url.searchParams.get('type') || 'expense';
      if (!['income', 'expense'].includes(type)) {
        return json({ error: 'type должен быть income или expense' }, 400);
      }
      return json(await all(`
        SELECT category, SUM(amount) AS total
        FROM transactions WHERE type = ?
        GROUP BY category ORDER BY total DESC
      `, [type]));
    }

    if (method === 'GET' && path === '/api/transactions/summary/monthly') {
      const monthsCount = parseInt(url.searchParams.get('months')) || 6;
      return json(await all(`
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
      return json(await all(
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
      return json(await all(sql, params));
    }

    if (method === 'POST' && path === '/api/transactions') {
      const body = await req.json().catch(() => ({}));
      const { type, category, amount, date, comment } = body;
      if (!type || !category || amount == null || !date) {
        return json({ error: 'Обязательные поля: type, category, amount, date' }, 400);
      }
      if (!['income', 'expense'].includes(type)) {
        return json({ error: 'type должен быть income или expense' }, 400);
      }
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return json({ error: 'amount должен быть положительным числом' }, 400);
      }
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await run(
        `INSERT INTO transactions (id, type, category, amount, date, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, type, category, parsedAmount, date, comment || '', now]
      );
      return json(await get('SELECT * FROM transactions WHERE id = ?', [id]), 201);
    }

    const idMatch = path.match(/^\/api\/transactions\/([^/]+)$/);
    if (idMatch) {
      const id = idMatch[1];

      if (method === 'GET') {
        const transaction = await get('SELECT * FROM transactions WHERE id = ?', [id]);
        if (!transaction) return json({ error: 'Транзакция не найдена' }, 404);
        return json(transaction);
      }

      if (method === 'PUT') {
        const existing = await get('SELECT * FROM transactions WHERE id = ?', [id]);
        if (!existing) return json({ error: 'Транзакция не найдена' }, 404);

        const body = await req.json().catch(() => ({}));
        const updatedType = body.type ?? existing.type;
        const updatedCategory = body.category ?? existing.category;
        const updatedAmount = body.amount != null ? parseFloat(body.amount) : existing.amount;
        const updatedDate = body.date ?? existing.date;
        const updatedComment = body.comment !== undefined ? body.comment : existing.comment;

        if (body.type && !['income', 'expense'].includes(body.type)) {
          return json({ error: 'type должен быть income или expense' }, 400);
        }
        if (isNaN(updatedAmount) || updatedAmount <= 0) {
          return json({ error: 'amount должен быть положительным числом' }, 400);
        }

        const now = new Date().toISOString();
        await run(
          `UPDATE transactions SET type = ?, category = ?, amount = ?, date = ?, comment = ?, updatedAt = ? WHERE id = ?`,
          [updatedType, updatedCategory, updatedAmount, updatedDate, updatedComment, now, id]
        );
        return json(await get('SELECT * FROM transactions WHERE id = ?', [id]));
      }

      if (method === 'DELETE') {
        const existing = await get('SELECT * FROM transactions WHERE id = ?', [id]);
        if (!existing) return json({ error: 'Транзакция не найдена' }, 404);
        await run('DELETE FROM transactions WHERE id = ?', [id]);
        return new Response(null, { status: 204 });
      }
    }

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    console.error(err);
    return json({ error: err.message || 'Internal server error' }, 500);
  }
};

export const config = {
  path: '/api/*',
};
