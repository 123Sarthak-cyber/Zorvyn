# Finance Data Processing and Access Control Backend

Backend assignment submission for a finance dashboard system with role-based access control, record management, and summary analytics.

## Tech Stack

- Node.js + Express
- SQLite (via better-sqlite3)
- Zod for validation
- Morgan for request logging

## Features Implemented

- User and role management (admin-only)
- User status support (active/inactive)
- Role-based access control at middleware layer
- Financial record CRUD (admin create/update/delete, all roles read)
- Filtering and pagination for records
- Dashboard summary endpoint with:
  - Total income
  - Total expense
  - Net balance
  - Category-wise totals
  - Recent activity
  - Monthly trends
- Input validation with meaningful error responses
- Persistent storage using local SQLite file

## Role Model

- viewer: read records and summary
- analyst: read records and summary
- admin: full access to users and records

## Mock Authentication

This project uses a mock auth model through request header:

- Header: `x-user-id`
- The user is loaded from the database and must be active

Seeded users on first startup:

1. id 1, admin@finance.local, role admin
2. id 2, analyst@finance.local, role analyst
3. id 3, viewer@finance.local, role viewer

## API Endpoints

Base URL: `http://localhost:4000`

### API Docs

- `GET /docs`
- `GET /openapi.json`

### Health

- `GET /health`

### Users (admin only)

- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id`

### Financial Records

- `GET /api/records`
- `POST /api/records` (admin)
- `PATCH /api/records/:id` (admin)
- `DELETE /api/records/:id` (admin)

#### Record Query Params

- `type`: income | expense
- `category`: string
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD
- `page`: positive integer (default 1)
- `pageSize`: positive integer up to 100 (default 20)

### Summary

- `GET /api/summary`
- Supports same filters as records except pagination

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the server:

   ```bash
   npm run start
   ```

3. Use `x-user-id` in every `/api/*` request.

## Example Requests

### Create a record (admin)

```bash
curl -X POST http://localhost:4000/api/records \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d "{\"amount\": 1250.5, \"type\": \"income\", \"category\": \"salary\", \"date\": \"2026-03-30\", \"notes\": \"March payroll\"}"
```

### List records (viewer)

```bash
curl "http://localhost:4000/api/records?page=1&pageSize=10" \
  -H "x-user-id: 3"
```

### Fetch dashboard summary (analyst)

```bash
curl "http://localhost:4000/api/summary?startDate=2026-01-01&endDate=2026-12-31" \
  -H "x-user-id: 2"
```

## Assumptions and Tradeoffs

- Mock auth is used instead of full JWT/session auth to focus on backend design and business logic.
- SQLite is selected for easy local persistence and setup simplicity.
- Analyst role is read-only in this implementation (same data access as viewer for records and summary).
- No soft delete was added to keep the solution concise.

## Project Structure

```text
src/
  app.js
  server.js
  constants/
  db/
  errors/
  middleware/
  routes/
  schemas/
```

## Notes

Database file is generated at `data/finance.db` at runtime.
