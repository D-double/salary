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

function parseBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded
    ? atob(event.body)
    : event.body;
  return JSON.parse(raw);
}

function getApiPath(event) {
  const p = event.path;
  const prefix = '/.netlify/functions/api';
  if (p.startsWith(prefix)) return p.slice(prefix.length) || '/';
  return p;
}

export default async (event) => {
  await ensureDb();

  const { httpMethod, queryStringParameters } = event;
  const apiPath = getApiPath(event);

  try {
    if (httpMethod === 'GET' && apiPath === '/transactions/summary/balance') {
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

    if (httpMethod === 'GET' && apiPath === '/transactions/summary/category') {
      const type = queryStringParameters?.type || 'expense';
      if (!['income', 'expense'].includes(type)) {
        return json({ error: 'type должен быть income или expense' }, 400);
      }
      return json(await all(`
        SELECT category, SUM(amount) AS total
        FROM transactions WHERE type = ?
        GROUP BY category ORDER BY total DESC
      `, [type]));
    }

    if (httpMethod === 'GET' && apiPath === '/transactions/summary/monthly') {
      const monthsCount = parseInt(queryStringParameters?.months) || 6;
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

    if (httpMethod === 'GET' && apiPath === '/transactions/recent') {
      const limit = parseInt(queryStringParameters?.limit) || 5;
      return json(await all(
        'SELECT * FROM transactions ORDER BY date DESC, createdAt DESC LIMIT ?',
        [limit]
      ));
    }

    if (httpMethod === 'GET' && apiPath === '/transactions') {
      let sql = 'SELECT * FROM transactions WHERE 1=1';
      const params = [];
      const { type, category, dateFrom, dateTo } = queryStringParameters || {};
      if (type) { sql += ' AND type = ?'; params.push(type); }
      if (category) { sql += ' AND category = ?'; params.push(category); }
      if (dateFrom) { sql += ' AND date >= ?'; params.push(dateFrom); }
      if (dateTo) { sql += ' AND date <= ?'; params.push(dateTo); }
      sql += ' ORDER BY date DESC, createdAt DESC';
      return json(await all(sql, params));
    }

    if (httpMethod === 'POST' && apiPath === '/transactions') {
      const { type, category, amount, date, comment } = parseBody(event);
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

    const idMatch = apiPath.match(/^\/transactions\/([^/]+)$/);
    if (idMatch) {
      const id = idMatch[1];

      if (httpMethod === 'GET') {
        const transaction = await get('SELECT * FROM transactions WHERE id = ?', [id]);
        if (!transaction) return json({ error: 'Транзакция не найдена' }, 404);
        return json(transaction);
      }

      if (httpMethod === 'PUT') {
        const existing = await get('SELECT * FROM transactions WHERE id = ?', [id]);
        if (!existing) return json({ error: 'Транзакция не найдена' }, 404);

        const body = parseBody(event);
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

      if (httpMethod === 'DELETE') {
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
