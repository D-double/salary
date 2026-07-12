import React, { useState, useEffect } from "react";
import styles from "./Dashboard.module.css";
import BalanceCard from "../../components/BalanceCard/BalanceCard";
import EmptyState from "../../components/EmptyState/EmptyState";
import TransactionList from "../../components/TransactionList/TransactionList";
import Modal from "../../components/Modal/Modal";
import TransactionForm from "../../components/TransactionForm/TransactionForm";
import {
  getTotalIncome,
  addIncome,
  updateIncome,
  deleteIncome,
} from "../../services/incomeService";
import {
  getTotalExpense,
  addExpense,
  updateExpense,
  deleteExpense,
} from "../../services/expenseService";
import {
  getBalance,
  getRecentTransactions,
} from "../../services/summaryService";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../../utils/constants";

function Dashboard() {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const refreshData = async () => {
    const [income, expense, bal, recent] = await Promise.all([
      getTotalIncome(),
      getTotalExpense(),
      getBalance(),
      getRecentTransactions(5),
    ]);
    setTotalIncome(income);
    setTotalExpense(expense);
    setBalance(bal);
    setRecentTransactions(recent);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleSubmitTransaction = async (transactionData) => {
    try {
      if (editingTransaction) {
        if (transactionData.type === "income") {
          await updateIncome(editingTransaction.id, transactionData);
        } else {
          await updateExpense(editingTransaction.id, transactionData);
        }
      } else {
        if (transactionData.type === "income") {
          await addIncome(transactionData);
        } else {
          await addExpense(transactionData);
        }
      }

      await refreshData();
      handleCloseModal();
    } catch (error) {
      console.error("Ошибка сохранения операции:", error);
      alert("Произошла ошибка при сохранении. Попробуйте снова.");
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (id) => {
    const transaction = recentTransactions.find((t) => t.id === id);
    if (!transaction) return;

    if (window.confirm("Вы уверены, что хотите удалить эту операцию?")) {
      try {
        if (transaction.type === "income") {
          await deleteIncome(id);
        } else {
          await deleteExpense(id);
        }
        await refreshData();
      } catch (error) {
        console.error("Ошибка удаления операции:", error);
      }
    }
  };

  const getCategoryLabel = (categoryId, type) => {
    const categories =
      type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const category = (categories || []).find((cat) => cat.id === categoryId);
    return category?.label || "Прочее";
  };

  const transactionsWithLabels = (recentTransactions || []).map((t) => ({
    ...t,
    categoryLabel: getCategoryLabel(t.category, t.type),
  }));

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Обзор финансов</h1>

      <div className={styles.cardsGrid}>
        <BalanceCard title="Доходы" amount={totalIncome} type="income" />
        <BalanceCard title="Расходы" amount={totalExpense} type="expense" />
        <BalanceCard title="Баланс" amount={balance} type="balance" />
      </div>

      <div className={styles.recentSection}>
        <h2 className={styles.sectionTitle}>Последние операции</h2>
        {(recentTransactions?.length || 0) === 0 ? (
          <EmptyState
            title="Нет операций"
            description="Добавьте первую операцию, чтобы начать учёт финансов"
            actionLabel="Добавить операцию"
            onAction={handleOpenAddModal}
          />
        ) : (
          <TransactionList
            transactions={transactionsWithLabels}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
          />
        )}
      </div>

      <button
        className={styles.addButton}
        onClick={handleOpenAddModal}
        title="Добавить операцию"
      >
        +
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTransaction ? "Редактировать операцию" : "Новая операция"}
      >
        <TransactionForm
          onSubmit={handleSubmitTransaction}
          onCancel={handleCloseModal}
          editData={editingTransaction}
        />
      </Modal>
    </div>
  );
}

export default Dashboard;
