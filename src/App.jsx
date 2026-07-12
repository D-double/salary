import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import History from "./pages/History/History";
import Analytics from "./pages/Analytics/Analytics";
import styles from "./App.module.css";

function App() {
  return (
    <BrowserRouter>
      <div className={styles.appContainer}>
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />
          <Route
            path="/history"
            element={
              <Layout>
                <History />
              </Layout>
            }
          />
          <Route
            path="/analytics"
            element={
              <Layout>
                <Analytics />
              </Layout>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
