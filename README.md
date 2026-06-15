# Airflow RPA Orchestrator Frontend

A Next.js 16 frontend for managing and monitoring Apache Airflow DAGs, with role-based access control and a per-user permissions system.

---

## Setup

### Prerequisites

- Node.js 20.9+
- A running Apache Airflow instance (REST API v2 enabled)

### Install dependencies

```bash
npm install
```

### Configure environment variables

Copy `.env.local` and fill in your values:

```bash
cp .env.local .env.local
```

| Variable            | Description                                                  |
|---------------------|--------------------------------------------------------------|
| `AIRFLOW_BASE_URL`  | Base URL of your Airflow instance (e.g. `http://192.168.0.114:8081`) |
| `AIRFLOW_USERNAME`  | Airflow API username                                         |
| `AIRFLOW_PASSWORD`  | Airflow API password                                         |
| `NEXTAUTH_URL`      | The URL where this app is hosted (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET`   | A long random string used to sign JWTs — generate with `openssl rand -base64 32` |

### Run the development server

```bash
npm run dev
```

Visit `http://localhost:3000`. You will be redirected to `/login`.

---

## Default test accounts

| Email               | Password      | Role  |
|---------------------|---------------|-------|
| `admin@company.com` | `password123` | admin |
| `user@company.com`  | `password123` | user  |

---

## Adding real users / connecting a database

Users are currently stored in [`data/users.json`](data/users.json). Each entry has:

```json
{
  "email": "alice@company.com",
  "password": "plaintext-password",
  "role": "user",
  "name": "Alice"
}
```

To connect a real database:

1. Replace the `authorize` function in [`lib/auth.ts`](lib/auth.ts) with a database query (Prisma, Drizzle, etc.).
2. Hash passwords at rest — never store plaintext in production. Use `bcryptjs` to compare.
3. Update `data/permissions.json` reads in [`lib/permissions.ts`](lib/permissions.ts) with database reads/writes.

---

## Enabling Microsoft SSO (AzureADProvider)

The placeholder is already marked in [`lib/auth.ts`](lib/auth.ts).

1. Register an app in [Azure Active Directory](https://portal.azure.com).
2. Add the following redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`
3. Add credentials to `.env.local`:

```
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
```

4. In [`lib/auth.ts`](lib/auth.ts), replace `CredentialsProvider` with:

```ts
import AzureADProvider from "next-auth/providers/azure-ad";

AzureADProvider({
  clientId: process.env.AZURE_AD_CLIENT_ID!,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
  tenantId: process.env.AZURE_AD_TENANT_ID!,
}),
```

5. Map the `profile` to extract the user's role from their Azure AD groups or app roles.

---

## Project structure

```
app/
  (auth)/login/          # Login page
  (app)/
    dashboard/           # DAG list → run history → log viewer
    admin/               # User permissions backoffice (admin only)
  api/
    auth/[...nextauth]/  # NextAuth route
    airflow/             # Proxy routes to Airflow API
    permissions/         # Per-user DAG permission CRUD
  layout.tsx
proxy.ts                 # Route protection (Next.js 16 proxy — was middleware)

lib/
  airflow.ts             # Axios-based Airflow API client (server-only)
  auth.ts                # NextAuth options
  permissions.ts         # Read/write permissions.json
  session.ts             # Typed getServerSession helper

components/
  DAGCard.tsx            # Trigger button + status badge per DAG
  RunsTable.tsx          # Run history table with log links
  LogViewer.tsx          # Per-task log display with auto-scroll
  Sidebar.tsx            # Dark sidebar navigation
  StatusBadge.tsx        # Colored badge by run state
  SessionProvider.tsx    # Client-side NextAuth session wrapper

data/
  users.json             # Dummy users (replace with DB)
  permissions.json       # email → dag_ids mapping (replace with DB)

types/
  index.ts               # DAG, DAGRun, TaskLog, User, Permission types
```

---

## API routes

| Method | Route                                              | Purpose                    |
|--------|----------------------------------------------------|----------------------------|
| GET    | `/api/airflow/dags`                                | List DAGs (filtered by role/permissions) |
| GET    | `/api/airflow/dags/[dagId]/runs`                   | List runs for a DAG        |
| POST   | `/api/airflow/dags/[dagId]/trigger`                | Trigger a DAG run          |
| GET    | `/api/airflow/dags/[dagId]/runs/[runId]/logs`      | Fetch per-task logs        |
| GET    | `/api/permissions/[email]`                         | Get DAG permissions for a user |
| PUT    | `/api/permissions/[email]`                         | Update DAG permissions (admin only) |
