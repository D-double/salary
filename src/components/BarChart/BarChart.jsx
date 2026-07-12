import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function BarChart({ data = [], title = "Диаграмма" }) {
  // Если данных нет — показываем заглушку
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "300px",
          color: "#6c757d",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📈</div>
        <div>Нет данных для отображения</div>
      </div>
    );
  }

  // Кастомный tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "white",
            padding: "0.75rem",
            border: "1px solid #dee2e6",
            borderRadius: "6px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <p style={{ margin: 0, fontWeight: "600", marginBottom: "0.5rem" }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: "0.25rem 0", color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString("ru-RU")} ₽
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
        <XAxis
          dataKey="month"
          stroke="#6c757d"
          style={{ fontSize: "0.875rem" }}
        />
        <YAxis
          stroke="#6c757d"
          style={{ fontSize: "0.875rem" }}
          tickFormatter={(value) => `${value.toLocaleString("ru-RU")} ₽`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          height={36}
          formatter={(value) => (
            <span style={{ color: "#212529" }}>{value}</span>
          )}
        />
        <Bar
          dataKey="income"
          name="Доходы"
          fill="#28a745"
          radius={[8, 8, 0, 0]}
        />
        <Bar
          dataKey="expense"
          name="Расходы"
          fill="#dc3545"
          radius={[8, 8, 0, 0]}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

export default BarChart;
