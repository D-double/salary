# Agent Instructions

## Project: Salary Tracker

Personal finance tracker with React frontend + Express/sql.js backend. UI is in Russian.

## Running

Two separate processes required:

```bash
# Frontend (Vite dev server, port 5173)
npm run dev

# Backend (Express, port 3001)
cd server && npm run dev
```

Vite proxies `/api` to `localhost:3001` (configured in `vite.config.js`).

## Linting

```bash
npm run lint  # runs oxlint, NOT ESLint
```

No TypeScript, no test suite, no type checking.

## Architecture

```
src/
  App.jsx          → 3 routes: /, /history, /analytics
  services/        → API client functions (fetch to /api/*)
  pages/           → Dashboard, History, Analytics
  components/      → BalanceCard, BarChart, PieChart, TransactionForm, etc.
  utils/           → constants.js (categories), formatters.js (currency/date)

server/
  index.js         → Express server entry
  db.js            → sql.js init + file persistence (salary-tracker.db)
  routes/transactions.js → CRUD + summary endpoints
```

## Key Details

- **Database**: sql.js (in-memory SQLite synced to `server/salary-tracker.db`). Must call `saveDb()` after writes.
- **Data model**: Single `transactions` table. Type field is `income` or `expense`.
- **API pattern**: Services in `src/services/` use fetch with `API_BASE = '/api'`. Backend routes handle validation.
- **No auth**: All endpoints public.
- **Categories**: Defined in `src/utils/constants.js` as `INCOME_CATEGORIES` and `EXPENSE_CATEGORIES`.
