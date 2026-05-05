# Family Tree Website Template

A reusable family tree website template built with React, TypeScript, Vite, Express, Prisma, and PostgreSQL. The public repository keeps site identity configurable and keeps private family data out of tracked source files.

Family members, branches, nuclear families, timeline events, and gallery items are loaded from the API/database. Site identity, wording, feature flags, metadata, and tree defaults are configured through a local config file.

## Template Setup

Install dependencies:

```bash
npm install
```

Create your private local config:

```bash
cp src/config/family.config.example.ts src/config/family.config.ts
```

PowerShell:

```powershell
Copy-Item src/config/family.config.example.ts src/config/family.config.ts
```

Edit `src/config/family.config.ts` with your own:

- app name and family name
- homepage, tree, gallery, and timeline copy
- metadata title and description
- default tree home member id
- feature flags for gallery, timeline, and minimap
- optional theme colors and UI labels

`src/config/family.config.ts` is intentionally ignored by Git. Do not commit private family identity or local-only settings.

## Data Model

Runtime family data comes from the database through the API:

- members
- family branches
- nuclear families
- timeline events
- gallery items

This template does not ship tracked real family data. Use the admin panel, API, or your own private seed script to populate your database.

## Environment

Create `.env` with your own values:

```env
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
VITE_ADMIN_PASSWORD="your-admin-password"
```

`BLOB_READ_WRITE_TOKEN` is only needed if you use photo uploads.

## Development

Run frontend and backend together:

```bash
npm run dev
```

Run only the frontend:

```bash
npm run dev:frontend
```

Run only the backend:

```bash
npm run dev:backend
```

The Vite dev server proxies `/api/*` requests to the local Express server.

## Database Setup

Generate Prisma Client:

```bash
npx prisma generate
```

Push the schema to your database:

```bash
npx prisma db push
```

The bundled seed command is a safe no-op:

```bash
npm run db:seed
```

Use the admin panel or a private seed script for real family data.

## Configuration Files

```text
src/config/
  defaultLabels.ts
  family.config.example.ts
  family.config.ts          # local only, ignored by Git
  index.ts                  # config resolver
src/types/
  config.ts
```

The app imports config from `src/config` only. A local `family.config.ts` is used when present; otherwise the public example config is used.

## Features

- Public homepage
- Interactive family tree with pan, zoom, search, and optional minimap
- Member directory and member profile pages
- Optional gallery
- Optional timeline
- Admin dashboard
- Member, gallery, and timeline CRUD backed by the API
- Photo upload support through Vercel Blob

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Run frontend and backend together |
| `npm run dev:frontend` | Run the Vite frontend only |
| `npm run dev:backend` | Run the Express backend only |
| `npm run build` | Generate Prisma Client, type-check, and build production assets |
| `npm run preview` | Preview the production build |
| `npm run db:seed` | Safe no-op seed placeholder |

## Deployment

This project is ready for Vercel deployment:

1. Push the repository to GitHub.
2. Connect the repository in Vercel.
3. Add environment variables in the Vercel dashboard.
4. Make sure your private config strategy is in place before deploying a family-specific site.

For a public template release, keep only `family.config.example.ts` tracked and keep `family.config.ts` ignored.
