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

export const getIncomes = () => request('/transactions?type=income');

export const getIncomeById = (id) => request(`/transactions/${id}`);

export const addIncome = (data) =>
  request('/transactions', {
    method: 'POST',
    body: JSON.stringify({ ...data, type: 'income' }),
  });

export const updateIncome = (id, data) =>
  request(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteIncome = (id) =>
  request(`/transactions/${id}`, { method: 'DELETE' });

export const getTotalIncome = async () => {
  const { income } = await request('/transactions/summary/balance');
  return income;
};
