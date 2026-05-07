# Family Tree Website Template

A reusable full-stack family archive and family tree website. The app provides a public family archive, an interactive tree, member profiles, gallery and timeline pages, plus an admin panel backed by a database API.

This repository is designed to be safe as a public GitHub template:

- Site identity lives in configuration.
- Private local configuration is ignored by Git.
- Runtime family data comes from the database/API.
- No real family dataset is required in tracked source files.

## Features

### Public Website

- Homepage with configurable family identity, hero copy, visual assets, and stats.
- Interactive family tree with pan, zoom, search, focus mode, branch filtering, and optional minimap.
- Member directory with search, generation filter, status filter, and branch filter.
- Member profile pages with biography, dates, notes, photos, and family relationships.
- Optional gallery page for family photos and albums.
- Optional timeline page with automatic and manually curated events.
- Responsive public layout with configurable metadata and theme tokens.

### Admin Panel

- Admin dashboard with database-backed stats.
- Member CRUD with relationship fields.
- Gallery CRUD with optional Vercel Blob photo upload.
- Timeline CRUD for manually curated events.
- Simple password-protected admin access.

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router |
| Styling | TailwindCSS, CSS variables |
| Animation | Framer Motion |
| Icons | Lucide React |
| Backend | Express |
| Database | PostgreSQL with Prisma |
| Database hosting | Neon PostgreSQL |
| File storage | Vercel Blob |
| Image processing | Sharp |
| Deployment | Google Cloud Run single-container service |

## How Configuration Works

The app imports site configuration from `src/config`.

```text
src/config/
  defaultLabels.ts
  family.config.example.ts
  family.config.ts          # local only, ignored by Git
  index.ts                  # resolver
src/types/
  config.ts
```

Resolution order:

1. If `src/config/family.config.ts` exists locally, it is used.
2. If it does not exist, `src/config/family.config.example.ts` is used.

`family.config.ts` is intentionally listed in `.gitignore`, so every user can keep their own private identity/config without committing it.

Config controls:

- app name and family name
- homepage, tree, gallery, and timeline copy
- metadata title and description
- default home/root member id
- default branch id
- gallery/timeline/minimap feature flags
- tree zoom limits
- optional theme tokens
- optional UI wording labels
- homepage and gallery visual assets

Runtime family data is not stored in config. Members, branches, nuclear families, timeline events, and gallery items are loaded from the database through the API.

## Quick Start

Install dependencies:

```bash
npm install
```

Create your local config:

```bash
cp src/config/family.config.example.ts src/config/family.config.ts
```

On Windows PowerShell:

```powershell
Copy-Item src/config/family.config.example.ts src/config/family.config.ts
```

Edit `src/config/family.config.ts` with your own identity, text, feature flags, metadata, theme values, visual assets, and tree defaults.

Run the app:

```bash
npm run dev
```

The dev command starts both:

- Vite frontend at `http://localhost:5173`
- Express backend at `http://localhost:3001`

Vite proxies `/api/*` requests to the local backend.

## Environment Variables

Create `.env` in the project root:

```env
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
VITE_ADMIN_PASSWORD="your-admin-password"
```

Required:

- `DATABASE_URL`: PostgreSQL connection string.

Optional:

- `BLOB_READ_WRITE_TOKEN`: required only if you use photo upload.
- `VITE_ADMIN_PASSWORD`: admin login password. If omitted, login will not validate against a useful password.

## Database Setup

Generate Prisma Client:

```bash
npx prisma generate
```

Push the schema to your database:

```bash
npx prisma db push
```

The bundled seed command is a safe no-op placeholder:

```bash
npm run db:seed
```

Use the admin panel, API, database tools, or your own private seed script to add real family data.

## Data Model Overview

The app uses these main database-backed resources:

| Resource | Purpose |
|---|---|
| `FamilyMember` | People in the family archive |
| `FamilyBranch` | Branch/group definitions for filtering and summaries |
| `NuclearFamily` | Parent-child family units used by the tree layout |
| `TimelineEvent` | Manual timeline entries |
| `GalleryItem` | Gallery albums/photos |

Important relationship fields on members include:

- `fatherId`
- `motherId`
- `spouseIds`
- `formerSpouseIds`
- `childrenIds`
- `siblingIds`
- `parentFamilyId`
- `nuclearFamilyIds`

The tree layout reads these relationships from API data. It does not require a tracked data file.

## Project Structure

```text
api/
  [...path].ts              # Vercel serverless entrypoint

prisma/
  migrations/               # Prisma migration history
  schema.prisma             # Database schema
  seed.ts                   # Safe no-op template seed

server/
  app.ts                    # Express app and API routes
  index.ts                  # Local backend entrypoint

src/
  App.tsx                   # Routes and global app shell
  main.tsx                  # React entrypoint
  index.css                 # CSS variables and global styles

  admin/
    components/             # Admin sidebar, modals, upload field, stats
    hooks/                  # Admin auth hook
    layouts/                # Admin layout wrapper
    pages/                  # Admin dashboard, login, and CRUD pages

  components/
    FamilyTree.tsx          # Public tree wrapper
    GalleryTimeline.tsx     # Gallery and timeline shared components
    Layout.tsx              # Public layout and footer
    MemberDetail.tsx        # Member detail modal/sheet
    MemberForm.tsx          # Member CRUD form
    Navbar.tsx              # Public navigation
    tree/                   # Tree canvas, controls, minimap, cards
    ui.tsx                  # Shared UI components

  config/
    defaultLabels.ts
    family.config.example.ts
    index.ts

  constants/
    treeLayout.ts           # Tree layout constants

  hooks/
    useFamilyStore.tsx      # Data fetching, CRUD actions, auth state, toasts
    useSiteConfigEffects.ts # Runtime metadata/theme effects

  pages/
    HomePage.tsx
    TreePage.tsx
    MembersPage.tsx
    MemberProfilePage.tsx
    GalleryPage.tsx
    TimelinePage.tsx

  types/
    config.ts
    family.ts
    tree.ts

  utils/
    family.ts
    timeline.ts
    treeLayout.ts
```

## API Endpoints

All endpoints are under `/api`.

### Members

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/members` | List members |
| `POST` | `/api/members` | Create a member |
| `PUT` | `/api/members/:id` | Update a member |
| `DELETE` | `/api/members/:id` | Delete a member and clean relationship references |

### Branches and Nuclear Families

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/branches` | List family branches |
| `GET` | `/api/nuclear-families` | List nuclear families |

### Timeline

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/timeline` | List timeline events |
| `POST` | `/api/timeline` | Create a timeline event |
| `PUT` | `/api/timeline/:id` | Update a timeline event |
| `DELETE` | `/api/timeline/:id` | Delete a timeline event |

### Gallery

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/gallery` | List gallery items |
| `POST` | `/api/gallery` | Create a gallery item |
| `PUT` | `/api/gallery/:id` | Update a gallery item |
| `DELETE` | `/api/gallery/:id` | Delete a gallery item |

### Uploads and Health

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/uploads/photos?folder=members&filename=name` | Upload, resize, convert, and store a member photo |
| `POST` | `/api/uploads/photos?folder=gallery&filename=name` | Upload, resize, convert, and store a gallery image |
| `GET` | `/api/health` | Health check |

Photo uploads accept JPEG, PNG, and WebP images up to 4 MB. Uploaded images are rotated, resized to fit within 1600 x 1600, converted to WebP, and stored in Vercel Blob.

# Cloud Run Deployment

This project is prepared to run on Google Cloud Run as one container. Express serves API routes under `/api/*` and serves the built Vite frontend from `dist/` for all non-API routes.

Authenticate with Google Cloud:

```bash
gcloud auth login
```

Select your project:

```bash
gcloud config set project YOUR_PROJECT_ID
```

Enable required services:

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

Deploy from source:

```bash
gcloud run deploy warisanai --source . --region asia-southeast2 --allow-unauthenticated
```

Configure required Cloud Run environment variables:

- `DATABASE_URL`: PostgreSQL connection string.
- `BLOB_READ_WRITE_TOKEN`: required only if photo uploads are used.
- Future AI provider variables, such as API keys, should also be configured as Cloud Run environment variables.

Before deploying a family-specific website, make sure your private config strategy is ready and run the database setup against your production database.

## Local Production Verification

Build and run the single-service production app locally:

```bash
npm run build
npm run start
```

Then verify:

- Open `http://localhost:8080`.
- Open `http://localhost:8080/api/health` and confirm it returns JSON.
- Refresh a React Router page such as `http://localhost:8080/members` and confirm it still loads.

For a public template release:

- Keep `family.config.example.ts` tracked.
- Keep `family.config.ts` ignored.
- Do not commit private names, descriptions, images, or database seed data.

## Privacy Rules

Do not commit:

- `src/config/family.config.ts`
- `.env`
- private seed scripts
- exported family datasets
- private photos or private media URLs
- production database credentials

The template is intended to be public-safe, but the data you add through your own database may still be private. Review your deployment, admin password, database permissions, and access controls before sharing a live site.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Run frontend and backend together |
| `npm run dev:frontend` | Run Vite only |
| `npm run dev:backend` | Run Express only |
| `npm run build` | Generate Prisma Client, type-check, and build production assets |
| `npm run start` | Run the production Express server on `process.env.PORT` or `8080` |
| `npm run preview` | Preview the production build |
| `npm run db:seed` | Safe no-op seed placeholder |

## Public Release Checklist

Before publishing this as a GitHub template:

- Confirm `src/config/family.config.ts` is ignored.
- Run `git status --short --untracked-files=all` and make sure private config is absent.
- Search tracked files for private family names, real biographies, private photos, or production URLs.
- Confirm README and example config are generic.
- Confirm `.env` and private seed scripts are not tracked.
- Run `npm run build`.

## License

Add your preferred license before publishing the repository as a reusable template.
