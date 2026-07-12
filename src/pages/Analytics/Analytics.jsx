import React, { useState, useEffect } from "react";
import styles from "./Analytics.module.css";
import PieChart from "../../components/PieChart/PieChart";
import BarChart from "../../components/BarChart/BarChart";
import EmptyState from "../../components/EmptyState/EmptyState";
import {
  getByCategory,
  getMonthlySummary,
} from "../../services/summaryService";

function Analytics() {
  const [pieChartData, setPieChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);
  const [hasData, setHasData] = useState(false);

  const loadAnalyticsData = async () => {
    const [pieData, barData] = await Promise.all([
      getByCategory("expense"),
      getMonthlySummary(6),
    ]);

    setPieChartData(pieData || []);
    setBarChartData(barData || []);

    const hasTransactions =
      (pieData || []).length > 0 ||
      (barData || []).some((item) => (item.income || 0) > 0 || (item.expense || 0) > 0);
    setHasData(hasTransactions);
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  return (
    <div className={styles.analytics}>
      <h1 className={styles.title}>Аналитика</h1>

      {!hasData && (
        <EmptyState
          title="Нет данных для анализа"
          description="Добавьте несколько операций, чтобы увидеть графики и статистику"
          icon="📊"
        />
      )}

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Расходы по категориям</h2>
          <div className={styles.chartContainer}>
            <PieChart data={pieChartData} title="Расходы по категориям" />
          </div>
        </div>

        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Доходы и расходы по месяцам</h2>
          <div className={styles.chartContainer}>
            <BarChart data={barChartData} title="Доходы и расходы по месяцам" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
