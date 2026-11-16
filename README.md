# QuickMart 24 — Warehouse inventory dashboard

Convenience-store warehouse + POS dashboard (7-Eleven style operations: coolers, near-date food, hot counter, vendor POs).

## Run

```bash
cd warehouse-dashboard
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## MySQL server setup

Create the dashboard env file:

```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```text
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=quickmart_warehouse
SERVER_PORT=3001
```

Start the API server and frontend together:

```bash
npm run dev:full
```

The API creates the `quickmart_warehouse` database and `app_state` table automatically. The frontend talks to the API through `/api` and reads business data from MySQL.

## Login

Users come from the `users` array stored in MySQL inside the `app_state.data` JSON document.

## What’s included

- Live dashboard (sales, stock value, reorder, expiry)
- POS till (cash/card, VAT, stock deduction)
- Inventory with locations and cycle-count adjustments
- Stock receiving (lots + expiry)
- Purchase orders
- Expiry / waste write-off (FEFO)
- Product catalog and suppliers
- Reports (margin, category mix, tender)
- Settings (store name, tax)

All business data is stored in MySQL. Use **Settings → Reset server data** to clear the current server dataset.
# 24warehouse
