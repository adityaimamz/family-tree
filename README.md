# WarisanAI FamilySpace Archive

WarisanAI is a full-stack, privacy-first family archive for preserving relationships, stories, photos, timelines, and family memories inside private `FamilySpace` workspaces.

The project started from a family tree application and has evolved into a SaaS-lite prototype: a public landing page, authenticated FamilySpace app, role-based editing, invite-based onboarding, platform operator console, PostgreSQL-backed family records, uploads, and AI-assisted archive drafting.

> Public visitors see the landing page at `/`. Authenticated users manage private family archives inside `/app/:spaceSlug/*`.

## Product Positioning

Families often keep important history across scattered WhatsApp chats, old albums, oral stories, and personal notes. WarisanAI gives a family one private space to preserve that context before it disappears.

Core idea:

- **Problem**: family memories, relationship context, and old stories are easily lost between generations.
- **Solution**: a measurable private archive containing members, tree structure, timeline events, photos, stories, and source notes.
- **Uniqueness**: AI helps draft biographies, explain relationships, and turn milestones into readable family stories while keeping drafts reviewable by the family.

WarisanAI does **not** claim end-to-end encryption. The current privacy promise is scoped access: private FamilySpace data is available only to authenticated invited members according to role-based access rules.

## Current Feature Set

### Public experience

- Public WarisanAI landing page with animated sections: Hero, Problem, FamilySpace, FamilyTree, Timeline, Memory, Biography, Relationship, Privacy, and CTA.
- `/landing` alias for the public page.
- Neon Auth sign-in/sign-up screens under `/auth/*`.

### FamilySpace app

- Authenticated FamilySpace list and create-space flow at `/app`.
- Space-scoped dashboard overview with archive stats, archive health, suggested next steps, archive signals, AI entry points, and privacy/read-only notices.
- Interactive family tree view with pan/zoom canvas, minimap, branch filtering, focus search, and auto-generation tree.
- Member directory with owner/admin editing.
- Member profile pages with biography, relationships, and source notes.
- Timeline page with owner/admin event editing.
- Gallery page with owner/admin photo-memory editing.
- Stories page for narrative drafts (manual, AI biography, AI timeline origins).
- Space settings page with sections: Space Profile, Account Profile, Members & Access management, Invites panel, and Danger Zone.

### Invite system

- Invite-based onboarding: owners/admins generate invite codes to add new members.
- Join flow at `/join` and `/join/:code` for authenticated users.
- Invite preview (shows space name, validity, and whether user is already a member).
- One active invite per space at a time; revoke before creating a new one.
- Optional `maxUses` limit per invite code.
- Soft-revoke via `revokedAt` timestamp.

### Access and roles

- Member-only read access for private family data.
- Owner/admin mutation access inside a FamilySpace.
- Membership management: list members, change roles (owner only), remove members, transfer ownership.
- Separate platform operator role for `/platform/*` routes.
- Platform admins do **not** automatically bypass FamilySpace membership for private archive data.

### AI-assisted features

AI routes are implemented with deterministic fallbacks so the app can still produce safe structured output when an AI provider key is missing or unavailable.

Current AI-assisted backend capabilities:

- Generate biography drafts from member records and submitted notes (with tone selection).
- Generate timeline story drafts from stored family milestones (with tone selection).
- Explain relationships between two family members (with path visualization).
- Cache relationship explanations in `RelationshipExplanationHistory` (AI results cached, deterministic results always re-attempted).
- Relationship history listing and deletion.
- Confidence labels, review checklists, facts-used metadata, and missing-context suggestions in all AI responses.
- Use privacy-oriented copy such as: AI drafts stay inside this FamilySpace until reviewed.

The AI implementation is intentionally conservative: prompts instruct the model not to invent dates, places, achievements, occupations, names, or events beyond the supplied archive data.

### Platform operations

- `/platform` operator dashboard.
- Platform stats overview.
- Platform users list.
- Platform spaces list.
- Platform system health page.
- `/api/platform/*` protected by `platform_admin`.

### Uploads

- UploadThing integration.
- Direct optimized image upload endpoint for member and gallery photos.
- Avatar upload endpoint (no space membership required, just authentication).
- JPEG, PNG, and WebP image support.
- Server-side image optimization with Sharp.

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 6, React Router 6 |
| Styling | Tailwind CSS 3, PostCSS, CSS variables |
| Animation | Framer Motion |
| Icons | Lucide React |
| Backend | Express 5, TypeScript |
| Runtime | Node.js 22 |
| Database | PostgreSQL with Prisma 7 |
| Database hosting target | Neon PostgreSQL (serverless driver) |
| Auth | Neon Auth JWT + `@neondatabase/neon-js` Auth UI |
| JWT verification | `jose` remote JWKS verification |
| Uploads | UploadThing + Sharp |
| Security middleware | CORS allowlist, security headers, rate limiting (`express-rate-limit`) |
| Tests | Vitest, fast-check (property-based), Supertest |
| Deployment | Docker (Node 22 slim) + Google Cloud Run |
| CI/CD | Cloud Build trigger + Artifact Registry + Cloud Run deploy |

## Routes

### Public routes

| Route | Purpose |
|---|---|
| `/` | Public landing page |
| `/landing` | Landing page alias |
| `/auth/*` | Neon Auth screen |

### Authenticated FamilySpace routes

| Route | Purpose |
|---|---|
| `/app` | User's FamilySpaces and create-space form |
| `/join` | Join a FamilySpace via invite code |
| `/join/:code` | Join a FamilySpace with pre-filled invite code |
| `/app/:spaceSlug` | Space dashboard overview |
| `/app/:spaceSlug/tree` | Family tree |
| `/app/:spaceSlug/members` | Member directory and owner/admin member editing |
| `/app/:spaceSlug/members/:memberId` | Member profile |
| `/app/:spaceSlug/timeline` | Timeline and owner/admin event editing |
| `/app/:spaceSlug/gallery` | Gallery and owner/admin item editing |
| `/app/:spaceSlug/stories` | Story drafts and narrative archive |
| `/app/:spaceSlug/settings` | FamilySpace settings (profile, access, invites, danger zone) |

### Platform routes

| Route | Purpose |
|---|---|
| `/platform` | Platform operator dashboard |
| `/platform/stats` | Platform counters |
| `/platform/users` | Registered user metadata |
| `/platform/spaces` | FamilySpace metadata |
| `/platform/system` | API/database/upload/auth configuration health |

Old Indonesian public archive routes such as `/silsilah`, `/anggota`, `/galeri`, and `/linimasa` are no longer first-class app routes. Old `/admin/*` routes are removed from the router; editing is role-based inside FamilySpace pages.

## Role Model

WarisanAI uses two separate role layers:

| Layer | Stored In | Values | Meaning |
|---|---|---|---|
| Platform | `AppUser.platformRole` | `user`, `platform_admin` | WarisanAI operator access for `/api/platform/*` |
| FamilySpace | `FamilyMembership.role` | `owner`, `admin`, `member` | Access inside one FamilySpace |

Important rule: `platform_admin` does not bypass FamilySpace membership. A platform admin still needs a `FamilyMembership` to read or mutate family data inside a private FamilySpace.

## Data Model Overview

Main tenant and identity models:

| Model | Purpose |
|---|---|
| `AppUser` | App-level user mapped from Neon Auth (email, name, avatar, platformRole) |
| `FamilySpace` | Tenant boundary for one family archive |
| `FamilyMembership` | User-to-space membership, family role, display name, and avatar |
| `FamilyInvite` | Invite codes for onboarding new members into a FamilySpace |

Space-scoped family resources:

| Model | Purpose |
|---|---|
| `FamilyMember` | People in a FamilySpace (full genealogical data) |
| `FamilyBranch` | Branch/group definitions with color and summary |
| `NuclearFamily` | Parent-child family units used by the tree |
| `TimelineEvent` | Manual and automatic timeline entries |
| `GalleryItem` | Gallery photos with metadata |
| `Story` | Narrative content with origin tracking (manual, ai_biography, ai_timeline) |
| `SourceNote` | Source/evidence notes (note, photo_context, interview, document, chat) |
| `RelationshipExplanationHistory` | Cached relationship explanation result, path, and view count |

Join tables:

| Model | Purpose |
|---|---|
| `StoryMember` | Links stories to related family members |
| `SourceNoteMember` | Links source notes to related family members |
| `StorySourceNote` | Links stories to their source notes |

Most human-facing ids use `slugId`, unique only inside one `familySpaceId`.

## API Overview

### Public

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Public health check |

### Auth

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/auth/me` | Current `AppUser` |

### Spaces

| Method | Endpoint | Role |
|---|---|---|
| `GET` | `/api/spaces` | authenticated |
| `POST` | `/api/spaces` | authenticated; creates owner membership |
| `GET` | `/api/spaces/:spaceSlug` | member+ |
| `PATCH` | `/api/spaces/:spaceSlug` | owner/admin |
| `GET` | `/api/spaces/:spaceSlug/summary` | member+ |
| `GET` | `/api/spaces/:spaceSlug/membership` | member+ |
| `PATCH` | `/api/spaces/:spaceSlug/membership/profile` | member+ (own profile) |
| `GET` | `/api/spaces/:spaceSlug/bootstrap` | member+ (optional `?include=coreData`) |

### Memberships

| Method | Endpoint | Role |
|---|---|---|
| `GET` | `/api/spaces/:spaceSlug/memberships` | owner/admin |
| `DELETE` | `/api/spaces/:spaceSlug/memberships/:membershipId` | owner/admin |
| `PATCH` | `/api/spaces/:spaceSlug/memberships/:membershipId/role` | owner |
| `POST` | `/api/spaces/:spaceSlug/transfer-ownership` | owner |

### Invites

| Method | Endpoint | Role |
|---|---|---|
| `GET` | `/api/spaces/:spaceSlug/invites` | owner/admin |
| `POST` | `/api/spaces/:spaceSlug/invites` | owner/admin |
| `PATCH` | `/api/spaces/:spaceSlug/invites/:inviteId/revoke` | owner/admin |
| `GET` | `/api/invites/:code/preview` | authenticated |
| `POST` | `/api/invites/join` | authenticated |

### Space-scoped resources

| Resource | Read | Write |
|---|---|---|
| Members | `GET /api/spaces/:spaceSlug/members` | `POST`, `PUT`, `DELETE` owner/admin |
| Branches | `GET /api/spaces/:spaceSlug/branches` | `POST`, `PUT`, `DELETE` owner/admin |
| Nuclear families | `GET /api/spaces/:spaceSlug/nuclear-families` | read-only in current app flow |
| Timeline | `GET /api/spaces/:spaceSlug/timeline` | `POST`, `PUT`, `DELETE` owner/admin |
| Gallery | `GET /api/spaces/:spaceSlug/gallery` | `POST`, `PUT`, `DELETE` owner/admin |
| Stories | `GET /api/spaces/:spaceSlug/stories` (paginated) | `POST`, `PUT`, `DELETE` owner/admin |
| Source notes | `GET /api/spaces/:spaceSlug/source-notes` | `POST` owner/admin |

### AI routes

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/spaces/:spaceSlug/ai/generate-biography` | Draft a biography from member data and submitted notes |
| `POST` | `/api/spaces/:spaceSlug/ai/generate-timeline-story` | Draft a timeline story from stored milestones |
| `POST` | `/api/spaces/:spaceSlug/ai/explain-relationship` | Explain how two members are related |
| `GET` | `/api/spaces/:spaceSlug/ai/relationship-history` | List cached relationship explanations (last 15) |
| `DELETE` | `/api/spaces/:spaceSlug/ai/relationship-history/:historyId` | Delete a cached relationship explanation |

### Uploads

| Method | Endpoint | Role |
|---|---|---|
| `POST` | `/api/uploads/photos?spaceSlug=:spaceSlug&folder=members&filename=name` | member+ |
| `POST` | `/api/uploads/photos?spaceSlug=:spaceSlug&folder=gallery&filename=name` | member+ |
| `POST` | `/api/uploads/avatar?filename=name` | authenticated |

### Platform

| Method | Endpoint | Role |
|---|---|---|
| `GET` | `/api/platform/health` | platform_admin |
| `GET` | `/api/platform/stats` | platform_admin |
| `GET` | `/api/platform/spaces` | platform_admin |
| `GET` | `/api/platform/users` | platform_admin |
| `GET` | `/api/platform/system` | platform_admin |

Old global endpoints (`/api/members`, `/api/branches`, `/api/nuclear-families`, `/api/timeline`, `/api/gallery`) return `410 Gone`.

## Environment Variables

Create `.env` in the project root for local development. Do not commit `.env`.

```env
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
NODE_ENV="development"
APP_BASE_URL="http://localhost:8080"
CORS_ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
VITE_NEON_AUTH_URL="https://your-neon-auth-host/neondb/auth"
NEON_AUTH_ISSUER="https://your-neon-auth-issuer"
NEON_AUTH_AUDIENCE=""
DEMO_AUTH_USER_ID="neon-auth-user-id-for-demo"
UPLOADTHING_TOKEN="your-uploadthing-token"
AI_EXTERNAL_ENABLED="0"
API_KEY="your-ai-provider-api-key"
VERTEX_API_KEY="your-vertex-or-google-ai-api-key"
VERTEX_MODEL="gemini-2.5-flash"
VERTEX_AI_GENERATE_URL="https://optional-custom-generate-endpoint"
```

### Required for core app

| Variable | Required | Used by | Notes |
|---|---:|---|---|
| `DATABASE_URL` | Yes | Server/Prisma | PostgreSQL connection string. Keep secret. |
| `VITE_NEON_AUTH_URL` | Yes | Frontend build + server JWT verifier | Public frontend config; also used by server to locate Neon Auth JWKS. |
| `NEON_AUTH_ISSUER` | Yes in production | Server JWT verifier | Expected JWT issuer. Production auth rejects tokens when this is missing or mismatched. |
| `UPLOADTHING_TOKEN` | Yes for uploads | Server UploadThing | Keep secret. |

### Optional / environment-specific

| Variable | Required | Used by | Notes |
|---|---:|---|---|
| `NODE_ENV` | Optional | Server/build | Use `production` in deployed service. |
| `APP_BASE_URL` | Optional | Server CORS/auth redirect config | Public app URL such as Cloud Run URL. |
| `CORS_ALLOWED_ORIGINS` | Optional | Server CORS | Comma-separated list of allowed origins. |
| `NEON_AUTH_AUDIENCE` | Optional | Server JWT verifier | Comma-separated expected JWT audience values. Enforced when configured. |
| `DEMO_AUTH_USER_ID` | Optional | Prisma seed | If omitted, seed uses a placeholder user id. |
| `AI_EXTERNAL_ENABLED` | Optional | AI routes | Set to `1` to allow outbound AI provider calls. Defaults to deterministic fallback. |
| `API_KEY` | Optional for AI | AI routes | Used as fallback provider API key. Keep secret. |
| `VERTEX_API_KEY` | Optional for AI | AI routes | Preferred AI key when configured. Keep secret. |
| `VERTEX_MODEL` | Optional | AI routes | Defaults to `gemini-2.5-flash`. |
| `VERTEX_AI_GENERATE_URL` | Optional | AI routes | Override default Google model generate endpoint. |

### Important Vite build-time note

`VITE_NEON_AUTH_URL` is a Vite frontend variable. It must be available when `npm run build` runs. Setting it only as a Cloud Run runtime environment variable is not enough for the browser bundle.

The Dockerfile accepts it as a build argument:

```dockerfile
ARG VITE_NEON_AUTH_URL
ENV VITE_NEON_AUTH_URL=$VITE_NEON_AUTH_URL
RUN npm run build
```

For Cloud Build, pass it through a trigger substitution such as `_VITE_NEON_AUTH_URL`.

### Public repository safety

This repository is public. Do not commit real secrets.

Safe to commit:

- variable names
- placeholder values in `.env.example`
- Dockerfile `ARG` declarations
- Cloud Build substitution references such as `${_VITE_NEON_AUTH_URL}`

Do not commit:

- `DATABASE_URL`
- `API_KEY`
- `VERTEX_API_KEY`
- `UPLOADTHING_TOKEN`
- real production `.env`

`VITE_*` values are exposed to the browser after build, so they should not contain secrets.

## Neon Auth Setup Notes

For production deployment, configure the Neon Auth app with allowed origins/redirect URLs.

Common allowed origins:

```text
http://localhost:5173
http://127.0.0.1:5173
https://your-cloud-run-service-url.run.app
```

If production login returns `403 Forbidden` or `Invalid origin`, the Cloud Run origin is likely missing from the Neon Auth allowed origins configuration.

### Google OAuth provider

The auth UI is configured to render Neon's real Google provider button. To make it work outside email/password auth:

- Enable the Google OAuth provider in Neon Auth.
- Add the Cloud Run origin, for example `https://your-cloud-run-service-url.run.app`, to Neon Auth allowed origins.
- Add the Neon Auth callback URL shown in the Neon Console to Google OAuth authorized redirect URIs.
- Do not commit Google OAuth client secrets or provider credentials.

## Local Development

Install dependencies:

```bash
npm install
```

Generate Prisma Client:

```bash
npx prisma generate
```

Run frontend and backend together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:frontend
npm run dev:backend
```

Default development servers:

- Vite frontend: `http://127.0.0.1:5173`
- Express backend: `server/index.ts` via `tsx --env-file=.env`

## Database Setup

This project expects a PostgreSQL database and Prisma migrations.

For a fresh development database reset:

```bash
npx prisma generate
npx prisma migrate reset --force
npm run db:seed
```

The seed creates:

- demo `AppUser` with `platformRole: platform_admin`
- demo `FamilySpace`
- owner membership for the demo user
- demo members, branches, nuclear families, timeline events, gallery items, stories, and source notes

Seed data is intended for local/demo validation. Replace it with your own family data for real usage.

## Build and Start

Build production assets and server:

```bash
npm run build
```

This runs: `npx prisma generate && tsc -b && tsc -p tsconfig.server.json && vite build`

Start production server:

```bash
npm run start
```

The production Express server serves both API routes and Vite static assets from the same container. The server listens on `process.env.PORT` or `8080`.

## Deployment: Google Cloud Run

The repository includes a Dockerfile for single-container deployment using Node.js 22 slim.

### Docker build requirements

Because the frontend needs `VITE_NEON_AUTH_URL` at build time, pass it as a Docker build argument:

```bash
docker build \
  --build-arg VITE_NEON_AUTH_URL="https://your-neon-auth-host/neondb/auth" \
  -t warisanai .
```

### Cloud Build trigger requirements

Use a Cloud Build trigger with `/cloudbuild.yaml` as the configuration file and add the following substitution variables in the trigger UI:

| Substitution | Example | Notes |
|---|---|---|
| `_AR_HOSTNAME` | `asia-southeast2-docker.pkg.dev` | Artifact Registry host |
| `_AR_REPOSITORY` | `warisanai` or your repo name | Artifact Registry repository |
| `_SERVICE_NAME` | `warisan-ai` | Cloud Run service name |
| `_DEPLOY_REGION` | `asia-southeast2` | Cloud Run region |
| `_PLATFORM` | `managed` | Cloud Run platform |
| `_VITE_NEON_AUTH_URL` | `https://your-neon-auth-host/neondb/auth` | Passed into Vite build |

Do not store secret values directly in `cloudbuild.yaml`. Keep real substitution values in the Cloud Build trigger settings.

If the trigger uses a custom service account, Cloud Build may require explicit logging behavior. The current config includes:

```yaml
options:
  logging: CLOUD_LOGGING_ONLY
```

### Runtime environment variables in Cloud Run

Cloud Run still needs runtime variables for the server:

```env
DATABASE_URL="postgresql://..."
NODE_ENV="production"
APP_BASE_URL="https://your-cloud-run-service-url.run.app"
VITE_NEON_AUTH_URL="https://your-neon-auth-host/neondb/auth"
UPLOADTHING_TOKEN="..."
API_KEY="..."
VERTEX_MODEL="gemini-2.5-flash"
```

Remember: Cloud Run runtime env helps the server, but Vite frontend env must be injected at build time.

## Project Structure

```text
prisma/
  schema.prisma          # Data model (Prisma 7)
  seed.ts                # Demo data seeder
  migrations/            # SQL migrations

server/
  index.ts               # Server entry point
  app.ts                 # Express app setup
  authorization.ts       # Auth middleware (loadAppUser, requireSpaceMembership, requireSpaceRole)
  db.ts                  # Prisma client instance
  neonAuth.ts            # Neon Auth JWT verification
  uploadthing.ts         # UploadThing + Sharp image optimization
  ai/
    aiHelpers.ts         # Shared AI utilities (confidence, facts, review checklist)
    aiJsonParsing.ts     # Safe JSON parsing for AI responses
    biographyService.ts  # Biography generation (deterministic + AI)
    timelineService.ts   # Timeline story generation (deterministic + AI)
    relationshipCache.ts # Relationship cache freshness logic
    types.ts             # AI type definitions
  http/
    error.ts             # Error handling utilities
  middlewares/
    apiLogger.ts         # Request logging
    securityHeaders.ts   # Security headers middleware
    spaceSlugFromQuery.ts # Extract spaceSlug from query params
  relationship/
    aiExplain.ts         # AI relationship explanation
    deterministic.ts     # Deterministic relationship path finding
    types.ts             # Relationship type definitions
  routes/
    index.ts             # Route registration
    aiRoutes.ts          # AI generation endpoints
    branchRoutes.ts      # Branch CRUD
    galleryRoutes.ts     # Gallery CRUD
    inviteRoutes.ts      # Invite system (create, revoke, preview, join)
    legacyRoutes.ts      # Legacy 410 Gone endpoints
    memberRoutes.ts      # Member CRUD
    membershipRoutes.ts  # Membership management (list, role change, transfer, remove)
    nuclearFamilyRoutes.ts # Nuclear family read
    platformRoutes.ts    # Platform admin endpoints
    shared.ts            # Shared route utilities (mappers, validators, pagination)
    sourceNoteRoutes.ts  # Source note CRUD
    spaceRoutes.ts       # Space CRUD + bootstrap + summary
    storyRoutes.ts       # Story CRUD (paginated)
    timelineRoutes.ts    # Timeline CRUD
    uploadRoutes.ts      # Photo and avatar upload endpoints

src/
  App.tsx                # Root component with routing
  main.tsx               # React entry point
  index.css              # Global styles
  components/
    ai/                  # AI feature components (biography studio, relationship explainer, timeline story)
    dashboard/           # Dashboard stat cards
    forms/               # Form modals (member, gallery, timeline, relationship selector)
    tree/                # Tree visualization (canvas, minimap, controls, branch filter, focus search)
    ui/                  # Shared UI components (modal, photo upload)
    FamilyTree.tsx       # Legacy tree component
    GalleryTimeline.tsx  # Gallery timeline view
    Layout.tsx           # Navbar + Footer
    MemberDetail.tsx     # Member detail view
    MemberForm.tsx       # Member form
    Navbar.tsx           # App navbar
    ProtectedRoute.tsx   # Auth guard component
  config/
    index.ts             # App configuration
    defaultLabels.ts     # Default UI labels
  constants/
    treeLayout.ts        # Tree layout constants
  hooks/
    useAIBiographyStudio.ts  # AI biography studio hook
    useAIDraft.ts            # Generic AI draft hook
    useAIStudioDeepLink.ts   # AI studio deep link navigation
    useCanvasGestures.ts     # Canvas touch/mouse gestures
    useCanvasPanZoom.ts      # Canvas pan and zoom state
    useFamilyStore.tsx       # Legacy family store
    useRoleGate.ts           # Role-based UI gating
    useSiteConfigEffects.ts  # Site config side effects
    useSpaceStore.tsx        # Space-scoped state management
    useTreeFocus.ts          # Tree focus/search state
  landing/
    lib/
      data/              # Landing page data
      animationVariants.ts # Shared animation variants
    sections/            # Landing page sections (Hero, Problem, FamilySpace, etc.)
  layouts/
    PlatformLayout.tsx   # Platform console layout
    SpaceLayout.tsx      # FamilySpace app layout
  lib/
    api.ts               # API client utilities
    auth.ts              # Auth utilities
    authErrorBus.ts      # Auth error event bus
    signOut.ts           # Sign-out logic
  pages/
    AuthPage.tsx
    GalleryPage.tsx
    HomePage.tsx
    JoinSpacePage.tsx     # Invite join flow
    LandingPage.tsx
    MemberProfilePage.tsx
    MembersPage.tsx
    SpaceDashboard.tsx
    spaceDashboard.derive.ts # Dashboard derived state
    SpaceListPage.tsx
    SpaceSettingsPage.tsx
    StoriesPage.tsx
    TimelinePage.tsx
    TreePage.tsx
    platform/            # Platform admin pages
    settings/            # Space settings sub-sections
  types/
    config.ts            # Config type definitions
    family.ts            # Family data types
    tree.ts              # Tree visualization types
  utils/
    family.ts            # Family data utilities
    spaceDisplay.ts      # Space display helpers
    timeline.ts          # Timeline utilities
    treeLayout.ts        # Tree layout calculations

scripts/
  promote-admin.ts       # CLI script to promote a user to platform_admin
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Run frontend and backend together (via concurrently) |
| `npm run dev:frontend` | Run Vite only (`--host 127.0.0.1`) |
| `npm run dev:backend` | Run Express only with `.env` via tsx |
| `npm run build` | Generate Prisma Client, type-check frontend/server, and build Vite assets |
| `npm run start` | Run the production Express server |
| `npm run preview` | Preview the production Vite build |
| `npm run db:seed` | Seed demo FamilySpace data |
| `npm run test` | Run Vitest (watch mode) |
| `npm run test:run` | Run Vitest once |

## Verification Checklist

Local checks:

```bash
npx prisma validate
npm run build
npm run test:run
```

Full local database verification:

```bash
npx prisma migrate reset --force
npm run db:seed
npm run build
npm run start
```

Manual verification targets:

- `/api/health`
- `/`
- `/auth/sign-in`
- `/app`
- `/join`
- `/app/:spaceSlug`
- `/app/:spaceSlug/tree`
- `/app/:spaceSlug/members`
- `/app/:spaceSlug/members/:memberId`
- `/app/:spaceSlug/timeline`
- `/app/:spaceSlug/gallery`
- `/app/:spaceSlug/stories`
- `/app/:spaceSlug/settings`
- `/platform`
- old global API endpoints returning `410 Gone`

Production auth checks:

- Browser console should not show `VITE_NEON_AUTH_URL is not configured`.
- Login requests should go to the configured Neon Auth host, not `localhost`.
- Neon Auth should not return `Invalid origin`; if it does, add the Cloud Run origin to Neon Auth allowed origins.

## Troubleshooting

### `VITE_NEON_AUTH_URL is not configured`

The frontend was likely built without the Vite env variable.

Fix:

- Ensure Dockerfile has `ARG VITE_NEON_AUTH_URL` before `RUN npm run build`.
- Ensure Cloud Build passes `--build-arg VITE_NEON_AUTH_URL=${_VITE_NEON_AUTH_URL}`.
- Ensure Cloud Build trigger has `_VITE_NEON_AUTH_URL` filled.
- Rebuild and redeploy a new Cloud Run revision.

### Neon Auth returns `403 Forbidden` / `Invalid origin`

The Cloud Run URL is not allowed in Neon Auth settings.

Fix:

- Add `https://your-cloud-run-service-url.run.app` to Neon Auth allowed origins.
- Add local origins for development if needed.

### Cloud Build fails before steps run with logging error

If a custom service account is used, Cloud Build needs an explicit logging option.

Fix:

```yaml
options:
  logging: CLOUD_LOGGING_ONLY
```

### Vercel Analytics script is blocked

If the console shows `ERR_BLOCKED_BY_CLIENT` for `/_vercel/insights/script.js`, it is usually caused by a browser extension/ad blocker. It does not block WarisanAI auth or core app behavior.

## Privacy and Security Notes

- FamilySpace data is scoped by membership and role checks.
- Platform admin access is separate from FamilySpace membership.
- AI generation should use only supplied family records and notes.
- AI drafts should be treated as reviewable drafts, not final family history.
- Do not store production secrets in GitHub.
- Rotate secrets if they are exposed in screenshots, logs, or commits.
- Rate limiting is applied to API routes via `express-rate-limit`.
- Security headers are applied via custom middleware.

## Current Status

WarisanAI is a demo-ready full-stack prototype moving from a family tree into a private family archive product. The current focus is polishing the app for a judging/demo flow:

1. Public landing page explains the family memory preservation problem with animated sections.
2. Authenticated FamilySpace proves the product works with measurable archive progress.
3. Tree, members, timeline, gallery, stories, and AI-assisted routes demonstrate real product value.
4. Invite-based onboarding allows families to grow their archive collaboratively.
5. Space settings with membership management, profile customization, and invite administration.
6. Platform console shows SaaS-lite operational readiness without exposing private family archive contents.
