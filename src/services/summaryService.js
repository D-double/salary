import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/constants';

const API_BASE = '/api';

const request = async (url) => {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Ошибка ${res.status}`);
  }
  return res.json();
};

export const getBalance = async () => {
  const data = await request('/transactions/summary/balance');
  return data.balance;
};

export const getByCategory = async (type = 'expense') => {
  const rows = await request(`/transactions/summary/category?type=${type}`);
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const map = {};
  rows.forEach((r) => { map[r.category] = r.total; });

  return categories
    .map((c) => ({ name: c.label, value: map[c.id] || 0 }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
};

export const getMonthlySummary = async (monthsCount = 6) => {
  const rows = await request(`/transactions/summary/monthly?months=${monthsCount}`);

  return rows.map((r) => ({
    month: r.monthKey,
    income: r.income,
    expense: r.expense,
  }));
};

export const getRecentTransactions = async (limit = 5) => {
  return request(`/transactions/recent?limit=${limit}`);
};
