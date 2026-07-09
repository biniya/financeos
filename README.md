# FinanceOS

Expense classification tree with **cloud sync** via Supabase and hosting on Vercel.

## Features

- **Plan** — company financial plan tree (Br + USD)
- **Expenses** — import CSV transactions, cash-flow dashboard, searchable ledger
- Multiple saved plans per account
- Cloud sync with Supabase (auth + Postgres)
- USD calculator with synced exchange rate
- Print / PDF export
- Falls back to browser local storage if Supabase is not configured

---

## 1. Supabase setup (cloud database)

1. Create a free project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run:
   - [`supabase/schema.sql`](./supabase/schema.sql)
   - [`supabase/transactions.sql`](./supabase/transactions.sql)
3. Go to **Project Settings → API** and copy:
   - **Project URL** (no `/rest/v1/` suffix)
   - **anon public** key
4. **Authentication → Users → Add user** — create your account (enable **Auto Confirm User**)
5. **Authentication → Providers → Email** — disable **Confirm email** and **Allow new users to sign up**
6. **Authentication → URL Configuration** — set **Site URL** to your Vercel URL and add it under **Redirect URLs**

---

## 2. Local development

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key

npm install
npm run dev
```

Without `.env.local`, the app runs in **local-only mode** (data stays in the browser).

---

## 3. Deploy to Vercel

1. Push the repo to GitHub
2. Import the project in [vercel.com](https://vercel.com)
3. Add **Environment Variables**:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
4. Deploy

`vercel.json` is included for SPA routing.

---

## 4. How cloud save works

| Layer | Role |
|-------|------|
| **Vercel** | Hosts the Vue frontend |
| **Supabase Auth** | Sign in only (users created in Supabase dashboard) |
| **Supabase `plans` table** | Stores each financial plan (JSON) |
| **Supabase `transactions` table** | Stores imported expense/income rows |
| **Supabase `user_settings`** | Active plan + USD exchange rate |

- Edits **auto-sync** to the cloud (debounced ~600ms)
- On first login, existing **local browser data is uploaded** automatically
- Row Level Security ensures users only see their own data

---

## 5. Expenses CSV import

Go to **Expenses** in the app header and import a CSV with these columns:

`Date, Account, Category, Classification, Type, Currency, Amount, Reporting, Description, Reference`

- `ETB` is mapped to **Br**
- Duplicate rows (same date, amount, description, type) are skipped on re-import

---

## Tech stack

Vue 3 · Pinia · Vue Router · ECharts · Tailwind CSS · Supabase · Vercel
