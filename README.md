# AMP CSR Portal

AMP is a membership and loyalty platform for car washes. This project implements a CSR portal to help customer service representatives support members with account questions, membership issues, vehicle transfers, purchase history, and failed subscription payments.

## Overview

This take-home assignment requires a full-stack portal with:

- a list of customers or registered users
- quick customer lookup and profile views
- editing customer account details
- viewing and editing vehicle subscriptions
- adding, removing, or transferring subscriptions
- reviewing recent purchases and payment history
- handling overdue or failed-payment states
- audit logging for CSR actions

The app is structured as a monorepo with:

- `apps/server`: Hono + Drizzle + PostgreSQL backend API
- `apps/web`: Vite + React + TypeScript frontend
- `packages/shared`: shared business logic and schema contracts, if expanded later

## Tech stack

- Frontend: React, TypeScript, Vite
- Backend: Hono, Node.js, TypeScript
- Database: PostgreSQL
- ORM: Drizzle
- Package manager: pnpm

## Full local workflow

The quickest way to get the app running locally is:

```bash
pnpm install

docker run --name amp-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  -d postgres:16

pnpm --dir apps/server db:push
pnpm --dir apps/server db:seed
pnpm --dir apps/server dev
pnpm --dir apps/web dev
```

## Local setup

### 1. Install dependencies

From the project root:

```bash
pnpm install
```

This installs the workspace dependencies for both the frontend and backend.

### 2. Start PostgreSQL locally

The backend expects PostgreSQL on `localhost:5432`.

Using Docker:

```bash
docker run --name amp-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  -d postgres:16
```

If you already have a local Postgres instance, you can reuse it as long as your connection string matches the app config.

### 3. Configure environment variables

Create a `.env` file inside `apps/server` with:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
PORT=4000
```

The Drizzle config also points to the same local Postgres database URL:

```bash
postgresql://postgres:postgres@localhost:5432/postgres
```

## Run the backend

From the project root:

```bash
pnpm --dir apps/server dev
```

The server starts at:

- `http://localhost:4000`
- health check: `http://localhost:4000/health`

### Backend scripts

From `apps/server`:

```bash
pnpm build
pnpm dev
pnpm lint
pnpm lint:fix
pnpm test
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:reset
pnpm db:seed
pnpm db:studio
```

## Linting and testing

Run these from the project root to validate the workspace after code changes:

```bash
pnpm lint
pnpm test
```

This runs the frontend and backend lint checks, then executes the server Vitest suite.

If you want to target a single app instead:

```bash
pnpm --dir apps/server lint
pnpm --dir apps/server test
pnpm --dir apps/web lint
```

For auto-fixes:

```bash
pnpm lint:fix
pnpm --dir apps/server lint:fix
```

## Database commands

Run all database commands from the server app directory:

```bash
cd apps/server
```

### Generate migrations

```bash
pnpm db:generate
```

### Push schema directly to local database

```bash
pnpm db:push
```

### Run migrations

```bash
pnpm db:migrate
```

### Reset the database

```bash
pnpm db:reset
```

### Seed the database with sample data

```bash
pnpm db:seed
```

This populates the app with sample customers, vehicles, subscriptions, purchases, notes, and audit data for local testing.

### View the database locally

```bash
pnpm db:studio
```

This opens the Drizzle Studio UI in the browser so you can inspect tables and records.

## Run the frontend

From the project root:

```bash
pnpm --dir apps/web dev
```

The frontend runs at:

- `http://localhost:5173`

### Frontend scripts

From `apps/web`:

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
```

## Project goals

This portal is designed to help CSRs quickly and confidently support customers with questions such as:

- “I want to cancel my account.”
- “I have a question about a recent purchase.”
- “I purchased a new vehicle and want my subscription transferred.”
- “I am not able to get a wash because my account is overdue.”

The primary experience is a fast customer lookup workflow with account, subscription, and purchase history surfaced in one place.

## Notes

- The backend uses Drizzle as the schema and database layer.
- The database is PostgreSQL and should be running locally before starting the API.
- For development, `db:push` is the fastest way to sync schema changes locally, while `db:generate` and `db:migrate` are useful for migrations in a more production-oriented workflow.
