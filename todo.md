# WarisanAI TODO — Current Project Roadmap

WarisanAI is now a SaaS-lite private family archive built from the original `family-tree` repository.

The project has moved past the landing-page phase. The current focus is product completion for a functional Cloud Run demo: authentication, FamilySpace tenancy, private archive flows, AI features, seed/demo data, and final submission assets.

---

## Current Repository State

### Completed / Current foundation

- Public WarisanAI landing page is available at `/`.
- Vite React frontend is kept.
- Express backend is kept.
- Express serves both `/api/*` and the Vite production `dist` build.
- Project is Cloud Run compatible as a single-container service.
- Production server uses `process.env.PORT` with `8080` fallback.
- Dockerfile exists for Cloud Run build/deploy.
- Vercel Blob has been replaced by UploadThing.
- UploadThing is used for uploaded image files.
- Neon/PostgreSQL stores relational data and image metadata only.
- Neon Auth JWT verification exists in the Express backend.
- Prisma schema has been redesigned around FamilySpace tenancy.
- Routes now use `/app/:spaceSlug/*` for authenticated private archive areas.

### Current stack

| Area | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router |
| Styling | TailwindCSS, CSS variables |
| Animation | Framer Motion |
| Backend | Express |
| Database | Neon/PostgreSQL, Prisma, Prisma Neon adapter |
| Auth | Neon Auth JWT verification with `jose` |
| File storage | UploadThing |
| Image processing | Sharp |
| Deployment | Google Cloud Run |

---

## Active Product Direction

WarisanAI is:

```text
A private AI-powered family archive for every family.
```

It is designed for users to:

- sign in
- create or select a FamilySpace
- manage a private family tree
- add family members, branches, and nuclear families
- store timeline events and gallery items
- upload photos through UploadThing
- preserve stories and source notes
- later use AI for biography generation, relationship explanation, and timeline storytelling

WarisanAI is not currently:

- a public genealogy database
- a single-family static archive only
- a full SaaS with payment/pricing/invoice/enterprise features

---

## Important Architecture Rules

### 1. Do not migrate to Next.js

Keep:

```text
Vite React + Express + Prisma + Neon + UploadThing + Cloud Run
```

### 2. Do not use Neon as object storage

Use:

```text
UploadThing = uploaded files
Neon/PostgreSQL = metadata and relational data
```

### 3. Do not put secrets in `VITE_*`

Only frontend-safe values may use `VITE_*`.

Server-only secrets must stay server-side:

- `DATABASE_URL`
- `UPLOADTHING_TOKEN`
- future AI/Vertex secrets
- JWT/provider secrets, if any

### 4. Do not reintroduce manual password auth

Current direction is Neon Auth identity.

Do not add:

- bcrypt password auth
- custom password tables
- localStorage JWT auth
- frontend admin password gates

### 5. Keep privacy claims accurate

Allowed copy:

- private by default
- invite-only access
- role-based access
- your family controls who can view and contribute
- private family archive

Avoid unless technically implemented:

- end-to-end encrypted
- 100% private
- never stored
- impossible to access

---

## Role Model

WarisanAI uses two separate role layers.

### Platform role

Stored in:

```text
AppUser.platformRole
```

Values:

```prisma
enum PlatformRole {
  user
  platform_admin
}
```

Meaning:

- `platform_admin` is the WarisanAI website/platform operator role.
- It is for platform-level tools such as stats, users, spaces, diagnostics, and future support operations.
- It must not be confused with FamilySpace ownership.

### FamilySpace role

Stored in:

```text
FamilyMembership.role
```

Values:

```prisma
enum FamilyRole {
  owner
  admin
  member
}
```

Meaning:

- `owner`: full access inside one FamilySpace
- `admin`: can mutate family records inside one FamilySpace
- `member`: can read private family data inside one FamilySpace

Important:

```text
platform_admin does not automatically bypass FamilySpace membership.
Family data access should still be based on FamilySpace membership.
```

---

## Current Core Data Model

### Identity / tenancy

- `AppUser`
- `FamilySpace`
- `FamilyMembership`

### Family archive data

- `FamilyMember`
- `FamilyBranch`
- `NuclearFamily`
- `TimelineEvent`
- `GalleryItem`
- `Story`
- `SourceNote`
- `StoryMember`
- `SourceNoteMember`
- `StorySourceNote`

### Database rules

Every private family data record must belong to a `FamilySpace`.

Most human-facing records use:

```text
slugId
```

But `slugId` is unique only inside one FamilySpace:

```prisma
@@unique([familySpaceId, slugId])
```

Relationship fields such as `fatherId`, `motherId`, `spouseIds`, `childrenIds`, and similar are still slug-based strings for frontend tree compatibility. Backend logic must ensure references stay inside the same FamilySpace.

---

## Current Routes

### Public

```text
/
/landing
/auth/*
```

### Authenticated app

```text
/app
/app/:spaceSlug
/app/:spaceSlug/tree
/app/:spaceSlug/members
/app/:spaceSlug/members/:memberId
/app/:spaceSlug/timeline
/app/:spaceSlug/gallery
```

Old routes such as:

```text
/silsilah
/anggota
/galeri
/linimasa
/admin/*
```

are no longer the main app routes. Family editing should happen through role-based UI inside `/app/:spaceSlug/*`.

---

## Current API Direction

### Public

```text
GET /api/health
```

### Auth

```text
GET /api/auth/me
```

### Spaces

```text
GET    /api/spaces
POST   /api/spaces
GET    /api/spaces/:spaceSlug
PATCH  /api/spaces/:spaceSlug
GET    /api/spaces/:spaceSlug/membership
```

### Space-scoped resources

```text
GET    /api/spaces/:spaceSlug/members
POST   /api/spaces/:spaceSlug/members
PUT    /api/spaces/:spaceSlug/members/:id
DELETE /api/spaces/:spaceSlug/members/:id

GET    /api/spaces/:spaceSlug/branches
POST   /api/spaces/:spaceSlug/branches
PUT    /api/spaces/:spaceSlug/branches/:id
DELETE /api/spaces/:spaceSlug/branches/:id

GET    /api/spaces/:spaceSlug/nuclear-families

GET    /api/spaces/:spaceSlug/timeline
POST   /api/spaces/:spaceSlug/timeline
PUT    /api/spaces/:spaceSlug/timeline/:id
DELETE /api/spaces/:spaceSlug/timeline/:id

GET    /api/spaces/:spaceSlug/gallery
POST   /api/spaces/:spaceSlug/gallery
PUT    /api/spaces/:spaceSlug/gallery/:id
DELETE /api/spaces/:spaceSlug/gallery/:id

GET    /api/spaces/:spaceSlug/stories
POST   /api/spaces/:spaceSlug/stories

GET    /api/spaces/:spaceSlug/source-notes
POST   /api/spaces/:spaceSlug/source-notes
```

### Uploads

```text
POST /api/uploads/photos?spaceSlug=:spaceSlug&folder=members&filename=name
POST /api/uploads/photos?spaceSlug=:spaceSlug&folder=gallery&filename=name
POST /api/uploadthing
```

### Platform admin

```text
GET /api/platform/health
GET /api/platform/spaces
GET /api/platform/users
```

Platform endpoints require `platform_admin`.

Old global APIs such as:

```text
/api/members
/api/branches
/api/nuclear-families
/api/timeline
/api/gallery
```

must not be used by frontend anymore. They should be removed or blocked with `410 Gone`.

---

# Remaining Roadmap

## Sprint 4 — Stabilize FamilySpace UX and API quality

Goal:
Make the current FamilySpace product flow reliable enough for demo use.

Tasks:

- Verify `/app` loads current user's FamilySpaces.
- Verify create FamilySpace flow works.
- Verify `/app/:spaceSlug` dashboard works.
- Verify tree, members, timeline, and gallery load from scoped APIs.
- Ensure all scoped API requests include auth headers/session expected by Neon Auth flow.
- Ensure member role cannot mutate records.
- Ensure owner/admin can mutate records.
- Ensure old global APIs are blocked or no longer used.
- Ensure 401 redirects to auth flow.
- Ensure 403 shows a polite no-access state.
- Ensure UploadThing photo upload works for authenticated users.
- Ensure uploaded image URLs are stored only inside the selected FamilySpace.
- Remove or clean old admin/store code that is no longer used.

Acceptance checks:

```bash
npx prisma validate
npm run build
npm run start
```

Manual checks:

```text
GET /api/health
/
/app
/app/rahman-archive
/app/rahman-archive/tree
/app/rahman-archive/members
/app/rahman-archive/timeline
/app/rahman-archive/gallery
```

---

## Sprint 5 — AI demo features

Goal:
Add AI features that make WarisanAI more than a normal family tree.

Priority order:

```text
1. AI Relationship Explainer
2. AI Biography Generator
3. AI Timeline Story
```

Recommended endpoints:

```text
POST /api/spaces/:spaceSlug/ai/explain-relationship
POST /api/spaces/:spaceSlug/ai/generate-biography
POST /api/spaces/:spaceSlug/ai/generate-timeline-story
```

Rules:

- AI must be called from backend, not directly from React.
- AI requests must require auth and FamilySpace membership.
- AI must only use data from the current FamilySpace.
- AI output should be stored as draft/story/source context when appropriate.
- Do not claim end-to-end encryption or impossible privacy guarantees.

Demo-friendly fallback:

```text
Use real Gemini/Vertex if env is configured.
Use deterministic fallback responses if env is missing.
```

Suggested env later:

```env
GOOGLE_CLOUD_PROJECT=""
GOOGLE_CLOUD_LOCATION="asia-southeast2"
VERTEX_MODEL="gemini-1.5-flash"
```

---

## Sprint 6 — Demo account and seed polish

Goal:
Make the judging/demo flow smooth.

Tasks:

- Ensure demo Neon Auth user exists.
- Ensure `DEMO_AUTH_USER_ID` maps correctly to demo `AppUser`.
- Ensure demo user is owner of `Rahman Archive`.
- Seed should include:
  - 8–12 members
  - 2–3 branches
  - 2–3 nuclear families
  - 4 timeline events
  - 3 gallery items
  - 2 stories
  - 2 source notes
  - relationship example suitable for AI explainer
- Add demo instructions to README.
- Avoid hardcoding demo password in frontend code.

Recommended demo account:

```text
Email: demo@warisan.ai
FamilySpace: Rahman Archive
```

Password should be managed through Neon Auth, not stored in app DB.

---

## Sprint 7 — Cloud Run production verification

Goal:
Confirm the deployed app works reliably on Cloud Run.

Tasks:

- Verify Cloud Run service uses correct environment variables:
  - `DATABASE_URL`
  - `NODE_ENV=production`
  - `APP_BASE_URL`
  - `VITE_NEON_AUTH_URL`
  - `UPLOADTHING_TOKEN`
  - `DEMO_AUTH_USER_ID`
- Verify public URL loads landing page.
- Verify `/api/health` works.
- Verify auth redirect/trusted origin config works with Cloud Run URL.
- Verify `/app` is accessible after login.
- Verify UploadThing works in deployed environment.
- Verify Cloud Run logs do not leak secrets.
- Keep public access enabled at Cloud Run level; app privacy is handled by Neon Auth and FamilySpace membership.

---

## Sprint 8 — Final submission assets

Goal:
Prepare #JuaraVibeCoding submission.

Required assets:

- Live app URL from Google Cloud Run
- Public LinkedIn demo video, 2–3 minutes
- Hashtag: `#JuaraVibeCoding`
- Official completion form submission

Demo video flow:

```text
1. Open public landing page
2. Explain problem: family stories scattered across chats/photos/memories
3. Sign in
4. Open Rahman Archive
5. Show dashboard
6. Show family tree
7. Show member profile
8. Show timeline/gallery
9. Show upload or role-based edit flow
10. Show AI Relationship Explainer or AI Biography Generator if Sprint 5 is complete
11. Close with privacy-first positioning
```

---

## Current highest priority

Focus on this order:

```text
1. Stabilize FamilySpace flow
2. Verify auth + role-based access
3. Verify UploadThing in Cloud Run
4. Add AI demo features
5. Polish seed/demo account
6. Record demo video
7. Submit
```

Do not spend more time redesigning the landing page unless a blocking issue appears.
