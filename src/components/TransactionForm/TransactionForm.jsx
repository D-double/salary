import React, { useState, useEffect } from "react";
import styles from "./TransactionForm.module.css";

// Fallback категории (будут заменены на импорт из constants.js)
const INCOME_CATEGORIES_FALLBACK = [
  { id: "salary", label: "Зарплата" },
  { id: "freelance", label: "Подработка" },
  { id: "bonus", label: "Премия" },
  { id: "debt_return", label: "Возврат долга" },
  { id: "deposit_interest", label: "Проценты по вкладу" },
  { id: "gift", label: "Подарок" },
  { id: "other", label: "Прочее" },
];

const EXPENSE_CATEGORIES_FALLBACK = [
  { id: "groceries", label: "Продукты" },
  { id: "utilities", label: "Коммуналка" },
  { id: "rent", label: "Аренда" },
  { id: "subscriptions", label: "Подписки" },
  { id: "transport", label: "Транспорт" },
  { id: "health", label: "Здоровье" },
  { id: "clothing", label: "Одежда" },
  { id: "entertainment", label: "Развлечения" },
  { id: "communication", label: "Связь" },
  { id: "other", label: "Прочее" },
];

function TransactionForm({ onSubmit, onCancel, editData }) {
  // Состояние типа операции
  const [type, setType] = useState(editData?.type || "income");

  // Состояние полей формы
  const [category, setCategory] = useState(editData?.category || "");
  const [amount, setAmount] = useState(editData?.amount || "");
  const [date, setDate] = useState(
    editData?.date || new Date().toISOString().split("T")[0],
  );
  const [comment, setComment] = useState(editData?.comment || "");

  // Состояние ошибок валидации
  const [errors, setErrors] = useState({});

  // При смене типа операции сбрасываем категорию
  useEffect(() => {
    setCategory("");
  }, [type]);

  // Получаем список категорий в зависимости от типа
  const categories =
    type === "income"
      ? INCOME_CATEGORIES_FALLBACK
      : EXPENSE_CATEGORIES_FALLBACK;

  // Обработчик отправки формы
  const handleSubmit = (e) => {
    e.preventDefault();

    // Валидация
    const newErrors = {};
    if (!category) newErrors.category = "Выберите категорию";
    if (!amount || parseFloat(amount) <= 0)
      newErrors.amount = "Введите корректную сумму";
    if (!date) newErrors.date = "Выберите дату";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Отправляем данные
    const transactionData = {
      type,
      category,
      amount: parseFloat(amount),
      date,
      comment: comment.trim(),
    };

    // Если это редактирование — добавляем id
    if (editData?.id) {
      transactionData.id = editData.id;
    }

    onSubmit(transactionData);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* Переключатель типа операции */}
      <div className={styles.typeToggle}>
        <button
          type="button"
          className={`${styles.typeButton} ${type === "income" ? styles.typeButtonIncomeActive : ""}`}
          onClick={() => setType("income")}
        >
          Доход
        </button>
        <button
          type="button"
          className={`${styles.typeButton} ${type === "expense" ? styles.typeButtonExpenseActive : ""}`}
          onClick={() => setType("expense")}
        >
          Расход
        </button>
      </div>

      {/* Категория */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="category">
          Категория
        </label>
        <select
          id="category"
          className={`${styles.fieldSelect} ${errors.category ? styles.fieldError : ""}`}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setErrors((prev) => ({ ...prev, category: "" }));
          }}
        >
          <option value="">Выберите категорию</option>
          {(categories || []).map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className={styles.errorText}>{errors.category}</p>
        )}
      </div>

      {/* Сумма и дата в одной строке */}
      <div className={styles.rowFields}>
        {/* Сумма */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="amount">
            Сумма (₽)
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            className={`${styles.fieldInput} ${errors.amount ? styles.fieldError : ""}`}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setErrors((prev) => ({ ...prev, amount: "" }));
            }}
            placeholder="0.00"
          />
          {errors.amount && <p className={styles.errorText}>{errors.amount}</p>}
        </div>

        {/* Дата */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="date">
            Дата
          </label>
          <input
            id="date"
            type="date"
            className={`${styles.fieldInput} ${errors.date ? styles.fieldError : ""}`}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setErrors((prev) => ({ ...prev, date: "" }));
            }}
          />
          {errors.date && <p className={styles.errorText}>{errors.date}</p>}
        </div>
      </div>

      {/* Комментарий */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="comment">
          Комментарий (необязательно)
        </label>
        <textarea
          id="comment"
          className={styles.fieldTextarea}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Добавьте заметку к операции"
          rows="3"
        />
      </div>

      {/* Кнопки действий */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
        >
          Отмена
        </button>
        <button type="submit" className={styles.submitButton}>
          {editData ? "Сохранить" : "Добавить"}
        </button>
      </div>
    </form>
  );
}

export default TransactionForm;
