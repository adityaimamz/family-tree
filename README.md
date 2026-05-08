# WarisanAI FamilySpace Archive

WarisanAI is a full-stack private family archive built around `FamilySpace`, a tenant boundary for SaaS-lite multi-family usage. The public landing page lives at `/`; authenticated users work inside `/app/:spaceSlug/*`.

## Features

- Public landing page for WarisanAI.
- Authenticated FamilySpace list and create flow at `/app`.
- Space-scoped dashboard, tree, members, timeline, and gallery routes.
- Owner/admin mutation UI for members, timeline events, gallery items, and uploads.
- Member-only read access for private family data.
- Two-tier roles: platform roles for WarisanAI operations, and family roles for one FamilySpace.
- PostgreSQL schema managed by Prisma with demo seed data.

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router |
| Styling | TailwindCSS, CSS variables |
| Animation | Framer Motion |
| Icons | Lucide React |
| Backend | Express |
| Database | PostgreSQL with Prisma |
| Auth | Neon Auth JWT |
| File storage | UploadThing |
| Deployment | Google Cloud Run single-container service |

## Routes

Public:

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/landing` | Landing page alias |
| `/auth/*` | Neon Auth screen |

Authenticated:

| Route | Purpose |
|---|---|
| `/app` | User's FamilySpaces and create-space form |
| `/app/:spaceSlug` | Space dashboard |
| `/app/:spaceSlug/tree` | Family tree |
| `/app/:spaceSlug/members` | Member directory and owner/admin member editing |
| `/app/:spaceSlug/members/:memberId` | Member profile |
| `/app/:spaceSlug/timeline` | Timeline and owner/admin event editing |
| `/app/:spaceSlug/gallery` | Gallery and owner/admin item editing |

Old Indonesian public archive routes such as `/silsilah`, `/anggota`, `/galeri`, and `/linimasa` are no longer first-class app routes. Old `/admin/*` routes are removed from the router; editing is role-based inside FamilySpace pages.

## Role Model

WarisanAI uses two separate role layers:

| Layer | Stored In | Values | Meaning |
|---|---|---|---|
| Platform | `AppUser.platformRole` | `user`, `platform_admin` | WarisanAI operator access for `/api/platform/*` |
| FamilySpace | `FamilyMembership.role` | `owner`, `admin`, `member` | Access inside one FamilySpace |

Important rule: `platform_admin` does not bypass FamilySpace membership. A platform admin still needs a `FamilyMembership` to read or mutate family data.

## Environment Variables

Create `.env` in the project root:

```env
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
NODE_ENV="production"
APP_BASE_URL="http://localhost:8080"
VITE_NEON_AUTH_URL="https://your-neon-auth-host/neondb/auth"
DEMO_AUTH_USER_ID="neon-auth-user-id-for-demo"
UPLOADTHING_TOKEN="your-uploadthing-token"
```

Required:

- `DATABASE_URL`: PostgreSQL connection string.
- `VITE_NEON_AUTH_URL`: Neon Auth URL used by the Vite client and Express JWT verifier.
- `UPLOADTHING_TOKEN`: UploadThing token for image uploads.

Optional:

- `NODE_ENV`: use `production` for production services.
- `APP_BASE_URL`: public app URL used when configuring auth redirects.
- `DEMO_AUTH_USER_ID`: auth user id used by the demo seed. If omitted, the seed uses a placeholder.

Do not put secrets in `VITE_*` variables.

## Database Setup

This sprint assumes a fresh development database reset.

```bash
npx prisma generate
npx prisma migrate reset --force
npm run db:seed
```

The seed creates:

- demo `AppUser` with `platformRole: platform_admin`
- `FamilySpace` with slug `rahman-archive`
- owner membership for the demo user
- demo members, branches, nuclear families, timeline events, gallery items, stories, and source notes

## Data Model

Main tenant and identity models:

| Model | Purpose |
|---|---|
| `AppUser` | App-level user mapped from Neon Auth |
| `FamilySpace` | Tenant boundary |
| `FamilyMembership` | User-to-space membership and family role |

Space-scoped family resources:

| Model | Purpose |
|---|---|
| `FamilyMember` | People in a FamilySpace |
| `FamilyBranch` | Branch/group definitions |
| `NuclearFamily` | Parent-child family units used by the tree |
| `TimelineEvent` | Manual timeline entries |
| `GalleryItem` | Gallery albums/photos |
| `Story` | Narrative content |
| `SourceNote` | Source/evidence notes |

Most human-facing ids use `slugId`, unique only inside one `familySpaceId`.

## API

Public:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Public health check |

Auth:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/auth/me` | Current `AppUser` |

Spaces:

| Method | Endpoint | Role |
|---|---|---|
| `GET` | `/api/spaces` | authenticated |
| `POST` | `/api/spaces` | authenticated, creates owner membership |
| `GET` | `/api/spaces/:spaceSlug` | member+ |
| `PATCH` | `/api/spaces/:spaceSlug` | owner/admin |
| `GET` | `/api/spaces/:spaceSlug/membership` | member+ |

Space-scoped resources:

| Resource | Read | Write |
|---|---|---|
| Members | `GET /api/spaces/:spaceSlug/members` | `POST`, `PUT`, `DELETE` owner/admin |
| Branches | `GET /api/spaces/:spaceSlug/branches` | `POST`, `PUT`, `DELETE` owner/admin |
| Nuclear families | `GET /api/spaces/:spaceSlug/nuclear-families` | read-only this sprint |
| Timeline | `GET /api/spaces/:spaceSlug/timeline` | `POST`, `PUT`, `DELETE` owner/admin |
| Gallery | `GET /api/spaces/:spaceSlug/gallery` | `POST`, `PUT`, `DELETE` owner/admin |
| Stories | `GET /api/spaces/:spaceSlug/stories` | `POST` owner/admin |
| Source notes | `GET /api/spaces/:spaceSlug/source-notes` | `POST` owner/admin |

Uploads:

| Method | Endpoint | Role |
|---|---|---|
| `POST` | `/api/uploads/photos?spaceSlug=:spaceSlug&folder=members&filename=name` | member+ |
| `POST` | `/api/uploads/photos?spaceSlug=:spaceSlug&folder=gallery&filename=name` | member+ |

Platform:

| Method | Endpoint | Role |
|---|---|---|
| `GET` | `/api/platform/health` | platform_admin |
| `GET` | `/api/platform/spaces` | platform_admin, returns 501 this sprint |
| `GET` | `/api/platform/users` | platform_admin, returns 501 this sprint |

Old global endpoints (`/api/members`, `/api/branches`, `/api/nuclear-families`, `/api/timeline`, `/api/gallery`) return `410 Gone`.

## Project Structure

```text
prisma/
  schema.prisma
  seed.ts
  migrations/

server/
  app.ts
  authorization.ts
  db.ts
  neonAuth.ts
  uploadthing.ts

src/
  App.tsx
  hooks/useSpaceStore.tsx
  layouts/SpaceLayout.tsx
  pages/SpaceListPage.tsx
  pages/SpaceDashboard.tsx
  pages/TreePage.tsx
  pages/MembersPage.tsx
  pages/MemberProfilePage.tsx
  pages/TimelinePage.tsx
  pages/GalleryPage.tsx
  types/family.ts
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Run frontend and backend together |
| `npm run dev:frontend` | Run Vite only |
| `npm run dev:backend` | Run Express only |
| `npm run build` | Generate Prisma Client, type-check, and build production assets |
| `npm run start` | Run the production Express server on `process.env.PORT` or `8080` |
| `npm run preview` | Preview the production build |
| `npm run db:seed` | Seed demo FamilySpace data |

## Verification

```bash
npx prisma validate
npm run build
```

For full local database verification:

```bash
npx prisma migrate reset --force
npm run db:seed
npm run build
npm run start
```

Then verify `/api/health`, `/app`, `/app/rahman-archive`, `/app/rahman-archive/tree`, and old API endpoints returning `410`.
