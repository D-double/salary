import React, { useState, useEffect } from "react";
import styles from "./History.module.css";
import TransactionList from "../../components/TransactionList/TransactionList";
import Modal from "../../components/Modal/Modal";
import TransactionForm from "../../components/TransactionForm/TransactionForm";
import {
  addIncome,
  updateIncome,
  deleteIncome,
} from "../../services/incomeService";
import {
  addExpense,
  updateExpense,
  deleteExpense,
} from "../../services/expenseService";
import { getTransactions } from "../../services/transactionService";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "../../utils/constants";

function History() {
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({
    type: "",
    category: "",
    dateFrom: "",
    dateTo: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const loadTransactions = async () => {
    const result = await getTransactions(filters);
    setTransactions(result || []);
  };

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "type") next.category = "";
      return next;
    });
  };

  const handleReset = () => {
    setFilters({ type: "", category: "", dateFrom: "", dateTo: "" });
  };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleAddTransaction = async (transactionData) => {
    if (transactionData.type === "income") {
      await addIncome(transactionData);
    } else {
      await addExpense(transactionData);
    }

    await loadTransactions();
    handleCloseModal();
  };

  const handleUpdateTransaction = async (transactionData) => {
    if (transactionData.type === "income") {
      await updateIncome(transactionData.id, transactionData);
    } else {
      await updateExpense(transactionData.id, transactionData);
    }

    await loadTransactions();
    handleCloseModal();
  };

  const handleSubmitTransaction = (transactionData) => {
    if (editingTransaction) {
      handleUpdateTransaction(transactionData);
    } else {
      handleAddTransaction(transactionData);
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (id) => {
    const transaction = transactions.find((t) => t.id === id);
    if (!transaction) return;

    if (window.confirm("Вы уверены, что хотите удалить эту операцию?")) {
      try {
        if (transaction.type === "income") {
          await deleteIncome(id);
        } else {
          await deleteExpense(id);
        }

        await loadTransactions();
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

  const transactionsWithLabels = (transactions || []).map((t) => ({
    ...t,
    categoryLabel: getCategoryLabel(t.category, t.type),
  }));

  const categoryOptions =
    filters.type === "income"
      ? INCOME_CATEGORIES
      : filters.type === "expense"
        ? EXPENSE_CATEGORIES
        : [];

  return (
    <div className={styles.history}>
      <h1 className={styles.title}>История операций</h1>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="filter-type">
            Тип
          </label>
          <select
            id="filter-type"
            className={styles.filterSelect}
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
          >
            <option value="">Все</option>
            <option value="income">Доход</option>
            <option value="expense">Расход</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="filter-category">
            Категория
          </label>
          <select
            id="filter-category"
            className={styles.filterSelect}
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            disabled={!filters.type}
          >
            <option value="">Все категории</option>
            {(categoryOptions || []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="filter-date-from">
            Дата от
          </label>
          <input
            id="filter-date-from"
            type="date"
            className={styles.filterSelect}
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="filter-date-to">
            Дата до
          </label>
          <input
            id="filter-date-to"
            type="date"
            className={styles.filterSelect}
            value={filters.dateTo}
            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
          />
        </div>

        <button
          className={styles.resetButton}
          onClick={handleReset}
          type="button"
        >
          Сбросить
        </button>
      </div>

      <div className={styles.listContainer}>
        <TransactionList
          transactions={transactionsWithLabels}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
        />
      </div>

      <button
        className={styles.addButton}
        onClick={handleOpenAddModal}
        title="Добавить операцию"
        type="button"
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

export default History;
