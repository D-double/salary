/**
 * Форматирует дату в локальный формат (ДД.ММ.ГГГГ)
 * @param {string|Date} date - Дата в формате ISO или объект Date
 * @returns {string} Отформатированная дата
 */
export const formatDate = (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
};

/**
 * Форматирует дату в короткий формат (ДД.ММ)
 * @param {string|Date} date - Дата в формате ISO или объект Date
 * @returns {string} Отформатированная дата
 */
export const formatDateShort = (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit'
    });
  } catch {
    return '—';
  }
};

/**
 * Форматирует дату для графиков (месяц и год)
 * @param {string|Date} date - Дата в формате ISO или объект Date
 * @returns {string} Отформатированная дата (например, "Янв 2024")
 */
export const formatMonthYear = (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('ru-RU', {
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
};

/**
 * Получает ключ месяца для группировки (ГГГГ-ММ)
 * @param {string|Date} date - Дата в формате ISO или объект Date
 * @returns {string} Ключ месяца (например, "2024-01")
 */
export const getMonthKey = (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  } catch {
    return 'unknown';
  }
};

/**
 * Форматирует сумму в валюту (с символом рубля и разделителями тысяч)
 * @param {number} amount - Сумма
 * @param {boolean} showSign - Показывать знак +/- (по умолчанию false)
 * @returns {string} Отформатированная сумма (например, "1 234 ₽" или "+1 234 ₽")
 */
export const formatCurrency = (amount, showSign = false) => {
  const value = amount ?? 0;
  const formatted = Math.abs(value).toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  if (showSign) {
    const sign = value >= 0 ? '+' : '-';
    return `${sign}${formatted} ₽`;
  }

  return `${formatted} ₽`;
};

/**
 * Форматирует сумму для отображения в карточках баланса
 * @param {number} amount - Сумма
 * @param {string} type - Тип операции ('income' или 'expense')
 * @returns {string} Отформатированная сумма со знаком
 */
export const formatBalanceAmount = (amount, type) => {
  const value = amount ?? 0;
  const formatted = Math.abs(value).toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  if (type === 'expense') {
    return `-${formatted} ₽`;
  }

  return `+${formatted} ₽`;
};

/**
 * Возвращает текущую дату в формате ISO для input type="date"
 * @returns {string} Дата в формате ГГГГ-ММ-ДД
 */
export const getCurrentDateISO = () => {
  return new Date().toISOString().split('T')[0];
};