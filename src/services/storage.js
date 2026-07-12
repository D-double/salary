/**
 * Получает данные из localStorage
 * @param {string} key - Ключ хранилища
 * @param {any} defaultValue - Значение по умолчанию, если ключ не найден
 * @returns {any} Распарсенные данные или defaultValue
 */
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Ошибка чтения из localStorage (ключ: ${key}):`, error);
    return defaultValue;
  }
};

/**
 * Сохраняет данные в localStorage
 * @param {string} key - Ключ хранилища
 * @param {any} value - Данные для сохранения
 * @returns {boolean} true, если сохранение успешно
 */
export const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Ошибка записи в localStorage (ключ: ${key}):`, error);
    return false;
  }
};

/**
 * Удаляет данные из localStorage
 * @param {string} key - Ключ хранилища
 * @returns {boolean} true, если удаление успешно
 */
export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Ошибка удаления из localStorage (ключ: ${key}):`, error);
    return false;
  }
};

/**
 * Генерирует уникальный идентификатор
 * @returns {string} UUID
 */
export const generateId = () => {
  // Используем встроенный метод браузера, если доступен
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: генерация UUID v4 вручную
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Очищает всё хранилище (используется для отладки)
 * @returns {boolean} true, если очистка успешна
 */
export const clearStorage = () => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Ошибка очистки localStorage:', error);
    return false;
  }
};