import React from "react";
import styles from "./BalanceCard.module.css";

function BalanceCard({ title = "Баланс", amount, color, type }) {
  // Fallback для суммы
  const displayAmount = amount ?? 0;

  // Форматирование суммы с разделителями тысяч
  const formattedAmount = new Intl.NumberFormat("ru-RU").format(displayAmount);

  // Определяем класс для цвета: либо type (income/expense/balance), либо кастомный color
  const cardClass = type ? `${styles.card} ${styles[type]}` : styles.card;

  // Если передан кастомный color — используем inline-стиль
  const style = color ? { "--accent-color": color } : {};

  return (
    <div className={cardClass} style={style}>
      <div className={styles.title}>{title}</div>
      <div className={styles.amount}>
        {displayAmount >= 0 ? "" : "-"}
        {Math.abs(displayAmount).toLocaleString("ru-RU")} ₽
      </div>
    </div>
  );
}

export default BalanceCard;
