const API_BASE = '/api';

const request = async (url, options = {}) => {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Ошибка ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
};

export const getExpenses = () => request('/transactions?type=expense');

export const getExpenseById = (id) => request(`/transactions/${id}`);

export const addExpense = (data) =>
  request('/transactions', {
    method: 'POST',
    body: JSON.stringify({ ...data, type: 'expense' }),
  });

export const updateExpense = (id, data) =>
  request(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteExpense = (id) =>
  request(`/transactions/${id}`, { method: 'DELETE' });

export const getTotalExpense = async () => {
  const { expense } = await request('/transactions/summary/balance');
  return expense;
};
