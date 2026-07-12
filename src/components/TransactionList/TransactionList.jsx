import React from "react";
import styles from "./TransactionList.module.css";
import EmptyState from "../EmptyState/EmptyState";

// Временные иконки для категорий (будут заменены на реальные из constants.js)
const CATEGORY_ICONS = {
  // Доходы
  salary: "💼",
  freelance: "💻",
  bonus: "🎁",
  debt_return: "🔄",
  deposit_interest: "🏦",
  gift: "🎀",
  // Расходы
  groceries: "🛒",
  utilities: "💡",
  rent: "🏠",
  subscriptions: "📱",
  transport: "🚗",
  health: "⚕️",
  clothing: "👕",
  entertainment: "🎬",
  communication: "📞",
  other: "📦",
};

function TransactionList({ transactions = [], onEdit, onDelete }) {
  // Если операций нет — показываем заглушку
  if (!transactions || transactions.length === 0) {
    return (
      <EmptyState
        title="Нет операций"
        description="Добавьте первую операцию, чтобы начать учёт финансов"
        icon="📋"
      />
    );
  }

  // Форматирование даты
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  // Форматирование суммы
  const formatAmount = (amount, type) => {
    const value = amount ?? 0;
    const formatted = value.toLocaleString("ru-RU");
    return type === "expense" ? `-${formatted} ₽` : `+${formatted} ₽`;
  };

  return (
    <div className={styles.list}>
      {/* Заголовок таблицы (виден только на десктопе) */}
      <div className={styles.header}>
        <div>Дата</div>
        <div>Категория</div>
        <div style={{ textAlign: "right" }}>Сумма</div>
        <div></div>
      </div>

      {/* Строки операций */}
      {(transactions || []).map((transaction) => {
        const categoryIcon = CATEGORY_ICONS[transaction.category] || "📦";
        const categoryName =
          transaction.categoryLabel || transaction.category || "Прочее";

        return (
          <div key={transaction.id} className={styles.row}>
            {/* Дата */}
            <div className={styles.date}>{formatDate(transaction.date)}</div>

            {/* Категория и комментарий */}
            <div className={styles.description}>
              <div className={styles.categoryIcon}>{categoryIcon}</div>
              <div className={styles.categoryInfo}>
                <div className={styles.categoryName}>{categoryName}</div>
                {transaction.comment && (
                  <div className={styles.comment}>{transaction.comment}</div>
                )}
              </div>
            </div>

            {/* Сумма */}
            <div className={`${styles.amount} ${styles[transaction.type]}`}>
              {formatAmount(transaction.amount, transaction.type)}
            </div>

            {/* Действия */}
            <div className={styles.actions}>
              {onEdit && (
                <button
                  className={styles.actionButton}
                  onClick={() => onEdit(transaction)}
                  title="Редактировать"
                  type="button"
                >
                  ✏️
                </button>
              )}
              {onDelete && (
                <button
                  className={styles.actionButton}
                  onClick={() => onDelete(transaction.id)}
                  title="Удалить"
                  type="button"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TransactionList;
