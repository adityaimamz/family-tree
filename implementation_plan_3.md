# Sprint 3: Multi-Tenant FamilySpace Architecture

Redesain database dan API WarisanAI dari single-family menjadi SaaS-lite multi-tenant private family archive dengan FamilySpace sebagai tenant boundary.

## Implementation Status — 2026-05-08

Status: **Implemented through Phase 7**.

- Phase 1: Prisma schema redesign implemented and `npx prisma validate` passes.
- Phase 2: Fresh Sprint 3 migration and demo seed implemented.
- Phase 3: Backend authorization helpers implemented in `server/authorization.ts`.
- Phase 4: Scoped API routes implemented, platform routes reserved, old global API routes return `410 Gone`.
- Phase 5: Frontend types/API helper implemented.
- Phase 6: `/app` and `/app/:spaceSlug/*` routing implemented with `SpaceProvider`, scoped data loading, role-aware create/edit UI for members, timeline, and gallery.
- Phase 7: README and `.env.example` updated for FamilySpace, two-tier roles, seed setup, and scoped API.

Verified:

```bash
npx prisma validate
npm run build
```

Not run automatically in this pass because it resets or depends on the active database:

```bash
npx prisma migrate reset --force
npm run db:seed
npm run start
```

## Hasil Riset Codebase Saat Ini

| Komponen | State Saat Ini | Masalah |
|---|---|---|
| `schema.prisma` | 5 model (FamilyMember, FamilyBranch, NuclearFamily, TimelineEvent, GalleryItem) | Semua global, slugId `@unique` global, tidak ada tenant scoping |
| `server/app.ts` | 439 baris, semua route `/api/*` langsung | Read route publik, write route pakai `requireAdmin` global |
| `server/neonAuth.ts` | JWT verify + role dari email list | Role global (admin/member), bukan per-space |
| `useFamilyStore.tsx` | Context Provider, fetch dari `/api/members` dll | Fetch global tanpa auth, tanpa spaceSlug |
| `src/App.tsx` | Routes: `/`, `/silsilah`, `/anggota`, `/admin/*` | Tidak ada `/app/:spaceSlug` pattern |
| `prisma/seed.ts` | Empty stub | Tidak ada demo data |
| Frontend types | `family.ts` — FamilyMember, FamilyBranch, dll | Tidak ada FamilySpace/Membership types |

## User Review Required

> [!IMPORTANT]
> **Database Reset**: Sprint ini akan me-reset database development sepenuhnya. Old data disimpan di database terpisah dan tidak perlu di-preserve. Migration baru akan dibuat dari scratch.

> [!IMPORTANT]
> **Routing Change**: Frontend routing berubah dari `/silsilah`, `/anggota`, `/galeri`, `/linimasa` menjadi `/app/:spaceSlug/tree`, `/app/:spaceSlug/members/:id`, dll. URL menggunakan bahasa Inggris. Route `/` sekarang menjadi LandingPage (public).

> [!IMPORTANT]
> **Admin Panel**: Panel admin saat ini di `/admin/*` akan digantikan oleh routing `/app/:spaceSlug/*` dengan role-based UI (owner/admin dapat mutate, member hanya read). Panel admin terpisah dihapus karena role-based access sudah built-in ke FamilySpace.

## Resolved Decisions

> [!NOTE]
> **Bahasa URL** — ✅ Dikonfirmasi: menggunakan bahasa Inggris (`/tree`, `/members`, `/gallery`, `/timeline`). Route lama (`/silsilah`, `/anggota`, dll) dihapus.

> [!NOTE]
> **Landing Page** — ✅ Dikonfirmasi: `/` menjadi LandingPage (public). `HomePage` lama dihapus atau di-merge ke SpaceDashboard. Authenticated user yang ingin akses data keluarga harus ke `/app`.

> [!NOTE]
> **Two-Tier Role System** — ✅ Dikonfirmasi: Pemisahan tegas antara platform-level role dan family-space-level role.
> - **Platform-level**: `PlatformRole` enum (`user`, `platform_admin`) pada `AppUser.platformRole`. `platform_admin` = pemilik platform WarisanAI, BUKAN pemilik family space.
> - **Family-space-level**: `FamilyRole` enum (`owner`, `admin`, `member`) pada `FamilyMembership.role`. Kontrol akses di dalam satu FamilySpace.
> - `platform_admin` TIDAK bypass FamilySpace membership untuk akses data keluarga.
> - `FamilyMembership.owner` BUKAN platform owner.
> - Old `/admin/*` dihapus. `/platform/*` reserved untuk future platform owner tools.
> - Platform admin UI minimal/documented-only sprint ini.

---

## Proposed Changes

### Phase 1: Prisma Schema Redesign

#### [MODIFY] [schema.prisma](file:///d:/GitHub/family-tree/prisma/schema.prisma)

Rewrite seluruh schema dengan model baru:

**Model baru yang ditambahkan:**
- `AppUser` — mapping Neon Auth user ke app-level record, termasuk `platformRole` field (`PlatformRole` enum, default `user`)
- `FamilySpace` — tenant boundary, slug unique global
- `FamilyMembership` — user ↔ space join dengan `FamilyRole` enum
- `Story` — narrative content per space, dengan `StoryStatus` enum
- `SourceNote` — source context/evidence per space, dengan `SourceType` enum
- `StoryMember` — join table Story ↔ FamilyMember
- `SourceNoteMember` — join table SourceNote ↔ FamilyMember
- `StorySourceNote` — join table Story ↔ SourceNote

**Model yang di-refactor:**
- `FamilyMember` — tambah `familySpaceId`, `@@unique([familySpaceId, slugId])`, hapus global `@unique` pada slugId, tambah relasi ke `GalleryItem`, `StoryMember`, `SourceNoteMember`
- `FamilyBranch` — tambah `familySpaceId`, `@@unique([familySpaceId, slugId])`
- `NuclearFamily` — tambah `familySpaceId`, `@@unique([familySpaceId, slugId])`, composite FK ke branch
- `TimelineEvent` — tambah `familySpaceId`, `@@unique([familySpaceId, slugId])`, `createdAt`/`updatedAt`
- `GalleryItem` — tambah `familySpaceId`, `memberId`, `timelineEventId`, `uploadedById`, `createdAt`/`updatedAt`

**Enum baru (4 total):**
- `PlatformRole` (user, platform_admin) — platform-level, pada `AppUser.platformRole`
- `FamilyRole` (owner, admin, member) — family-space-level, pada `FamilyMembership.role`
- `StoryStatus` (draft, in_review, approved)
- `SourceType` (note, photo_context, interview, document, chat)

**AppUser schema detail:**
```prisma
model AppUser {
  id           String       @id @default(uuid())
  authUserId   String       @unique
  email        String       @unique
  name         String?
  avatarUrl    String?
  platformRole PlatformRole @default(user)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  // ... relations
}
```

**Role separation rules (enforced in backend):**
- `platform_admin` = pemilik/operator platform WarisanAI. Dapat akses `/api/platform/*` endpoint.
- `platform_admin` TIDAK otomatis punya akses ke family data. Harus punya `FamilyMembership` untuk akses space.
- `FamilyRole.owner` = pemilik satu FamilySpace. BUKAN platform owner.
- Jika nanti dibutuhkan support/debug access, buat route eksplisit di `/api/platform/*`, bukan bypass membership.

**Relasi kunci:**
- `FamilyMember.branch` → composite FK `[familySpaceId, familyBranchId]` → `[familySpaceId, slugId]`
- `NuclearFamily.branch` → composite FK `[familySpaceId, branchId]` → `[familySpaceId, slugId]`
- `GalleryItem.member` → akan disimpan sebagai nullable string tanpa Prisma relation jika composite optional bermasalah
- Semua self-reference (fatherId, motherId, spouseIds, dll) tetap slug string untuk kompatibilitas tree UI

---

### Phase 2: Migration & Seed

#### [NEW] [prisma/migrations/YYYYMMDD_sprint3_multitenancy/](file:///d:/GitHub/family-tree/prisma/migrations/)

Fresh migration dari schema baru. Akan menghapus semua tabel lama dan membuat ulang.

#### [MODIFY] [seed.ts](file:///d:/GitHub/family-tree/prisma/seed.ts)

Seed data demo lengkap:
- 1 `AppUser` (demo@warisan.ai, authUserId dari env atau placeholder, `platformRole: platform_admin`)
- 1 `FamilySpace` (Rahman Archive, slug: rahman-archive)
- 1 `FamilyMembership` (demo user = family space **owner**)
- 10 `FamilyMember` (3 generasi, 2 cabang)
- 2 `FamilyBranch`
- 2 `NuclearFamily`
- 4 `TimelineEvent`
- 3 `GalleryItem`
- 2 `Story` (1 draft, 1 approved)
- 2 `SourceNote`
- Join records di StoryMember, SourceNoteMember, StorySourceNote

> [!NOTE]
> Demo user sengaja punya **dua role berbeda**: `platform_admin` (platform-level) dan family space `owner` (space-level). Ini menunjukkan bahwa kedua role independen dan tidak saling menggantikan.

Seed akan idempotent: upsert AppUser & FamilySpace, deleteMany + create untuk scoped data.

---

### Phase 3: Backend Authorization Helpers

#### [MODIFY] [neonAuth.ts](file:///d:/GitHub/family-tree/server/neonAuth.ts)

Perubahan:
- Pertahankan `getUserFromRequest()` — JWT verify dari Neon Auth
- Pertahankan `requireAuth` — base auth check, set `req.user` dari JWT
- **Hapus** `requireAdmin` — diganti oleh `requirePlatformAdmin` dan `requireSpaceRole`
- **Hapus** `adminEmails()` / `roleFrom()` — role sekarang dari database, bukan email list

#### [NEW] [server/authorization.ts](file:///d:/GitHub/family-tree/server/authorization.ts)

File baru untuk semua authorization middleware (platform + space):

**Express.Request type extensions:**
```ts
req.user        // dari neonAuth.ts JWT verify (Neon Auth identity)
req.appUser     // AppUser record dari database
req.familySpace // FamilySpace record (saat di space routes)
req.membership  // FamilyMembership record (saat di space routes)
```

**Platform-level middleware:**
- `loadAppUser` — middleware yang map Neon Auth JWT → AppUser (upsert on first seen). Set `req.appUser`.
- `requirePlatformAdmin` — cek `req.appUser.platformRole === 'platform_admin'`. Return 403 jika bukan.

**Family-space-level middleware:**
- `requireSpaceMembership` — load FamilySpace dari `req.params.spaceSlug`, cek user punya membership. Set `req.familySpace` dan `req.membership`.
- `requireSpaceRole(["owner", "admin"])` — middleware factory, cek `req.membership.role` ada di list yang diberikan.

**Helper functions:**
- `getFamilySpaceBySlug(slug, userId)` — query space + membership

**Middleware chain contoh:**
```
// Space data read:  requireAuth → loadAppUser → requireSpaceMembership
// Space data write: requireAuth → loadAppUser → requireSpaceMembership → requireSpaceRole(["owner", "admin"])
// Platform admin:   requireAuth → loadAppUser → requirePlatformAdmin
```

> [!WARNING]
> `requirePlatformAdmin` TIDAK memberikan akses ke family data. Platform admin harus tetap punya FamilyMembership untuk akses data keluarga di space manapun.

---

### Phase 4: Scoped API Routes

#### [MODIFY] [app.ts](file:///d:/GitHub/family-tree/server/app.ts)

**Route baru:**

```
GET    /api/spaces                           → list user's spaces
POST   /api/spaces                           → create space (user = owner)
GET    /api/spaces/:spaceSlug                → get space (member+)
PATCH  /api/spaces/:spaceSlug                → update space (admin+)
GET    /api/spaces/:spaceSlug/membership     → get user's role

GET    /api/spaces/:spaceSlug/members        → list members
POST   /api/spaces/:spaceSlug/members        → create member (admin+)
PUT    /api/spaces/:spaceSlug/members/:id    → update member (admin+)
DELETE /api/spaces/:spaceSlug/members/:id    → delete member (admin+)

GET    /api/spaces/:spaceSlug/branches       → list branches
POST   /api/spaces/:spaceSlug/branches       → create branch (admin+)
PUT    /api/spaces/:spaceSlug/branches/:id   → update branch (admin+)
DELETE /api/spaces/:spaceSlug/branches/:id   → delete branch (admin+)

GET    /api/spaces/:spaceSlug/nuclear-families → list nuclear families

GET    /api/spaces/:spaceSlug/timeline       → list timeline
POST   /api/spaces/:spaceSlug/timeline       → create event (admin+)
PUT    /api/spaces/:spaceSlug/timeline/:id   → update event (admin+)
DELETE /api/spaces/:spaceSlug/timeline/:id   → delete event (admin+)

GET    /api/spaces/:spaceSlug/gallery        → list gallery
POST   /api/spaces/:spaceSlug/gallery        → create item (admin+)
PUT    /api/spaces/:spaceSlug/gallery/:id    → update item (admin+)
DELETE /api/spaces/:spaceSlug/gallery/:id    → delete item (admin+)

GET    /api/spaces/:spaceSlug/stories        → list stories (simple)
POST   /api/spaces/:spaceSlug/stories        → create story (admin+)

GET    /api/spaces/:spaceSlug/source-notes   → list source notes (simple)
POST   /api/spaces/:spaceSlug/source-notes   → create source note (admin+)
```

**Platform admin routes (reserved, minimal sprint ini):**
```
GET  /api/platform/health       → platform_admin only, system health
GET  /api/platform/spaces       → platform_admin only, list ALL spaces (future)
GET  /api/platform/users        → platform_admin only, list ALL users (future)
```

> [!NOTE]
> Sprint ini hanya implement `/api/platform/health` sebagai proof-of-concept. Route `/api/platform/spaces` dan `/api/platform/users` di-reserve dan return 501 Not Implemented. Platform admin dashboard UI TIDAK dibangun sprint ini.

**Route lama — return 410 Gone:**
```
GET /api/members         → 410
GET /api/branches        → 410
GET /api/nuclear-families → 410
GET /api/timeline        → 410
GET /api/gallery         → 410
POST/PUT/DELETE variants → 410
```

**Old `/admin/*` routes — dihapus sepenuhnya dari frontend dan backend.**

**Route yang dipertahankan:**
```
GET  /api/health         → public
GET  /api/auth/me        → auth check (updated to return AppUser + platformRole)
POST /api/uploads/photos → auth + space validation
```

**Prinsip mutation scoping:**
- `familySpaceId` SELALU dari server-loaded space, BUKAN dari request body
- Update/delete query pakai `familySpaceId` + `slugId` compound
- Relationship cleanup hanya dalam space yang sama
- `platform_admin` TIDAK bypass scoping ini kecuali melalui `/api/platform/*` endpoint eksplisit

---

### Phase 5: Frontend Types & API Layer

#### [MODIFY] [family.ts](file:///d:/GitHub/family-tree/src/types/family.ts)

Tambah types:
```ts
export interface FamilySpace {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface FamilyMembership {
  role: "owner" | "admin" | "member";
  space: FamilySpace;
}

export type PlatformRole = "user" | "platform_admin";

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  platformRole: PlatformRole;
}
```

#### [MODIFY] [api.ts](file:///d:/GitHub/family-tree/src/lib/api.ts)

Tambah scoped fetch helpers:
```ts
export const spaceFetch = (spaceSlug: string, path: string, init?) => 
  authFetch(`/api/spaces/${spaceSlug}${path}`, init);
```

---

### Phase 6: Frontend Routing & Data Loading

#### [MODIFY] [App.tsx](file:///d:/GitHub/family-tree/src/App.tsx)

Routing baru:
```tsx
// Public
<Route path="/" element={<LandingPage />} />
<Route path="/landing" element={<LandingPage />} />
<Route path="/auth/*" element={<AuthPage />} />

// Private (auth required)
<Route path="/app" element={<SpaceListPage />} />
<Route path="/app/:spaceSlug" element={<SpaceLayout />}>
  <Route index element={<SpaceDashboard />} />
  <Route path="tree" element={<TreePage />} />
  <Route path="members" element={<MembersPage />} />
  <Route path="members/:memberId" element={<MemberProfilePage />} />
  <Route path="timeline" element={<TimelinePage />} />
  <Route path="gallery" element={<GalleryPage />} />
</Route>
```

#### [NEW] [src/hooks/useSpaceStore.tsx](file:///d:/GitHub/family-tree/src/hooks/useSpaceStore.tsx)

Baru — Context provider yang menggantikan `useFamilyStore` untuk space-scoped data:
- `SpaceProvider` wraps semua `/app/:spaceSlug/*` routes
- Fetch data dari `/api/spaces/:spaceSlug/members`, dll
- Menyimpan `currentSpace`, `membership`, `members`, `branches`, dll
- CRUD methods include `spaceSlug` dalam URL
- Expose role untuk conditional UI

#### [MODIFY] [useFamilyStore.tsx](file:///d:/GitHub/family-tree/src/hooks/useFamilyStore.tsx)

- Refactor untuk delegate ke `useSpaceStore` ketika di dalam space context
- Atau deprecate dan pindahkan semua consumer ke `useSpaceStore`
- Pilihan: buat thin wrapper yang forward ke space store

#### [NEW] [src/pages/SpaceListPage.tsx](file:///d:/GitHub/family-tree/src/pages/SpaceListPage.tsx)

Halaman `/app`:
- List spaces yang user ikuti
- Form create space baru (name + optional description)
- Click space → navigate ke `/app/:spaceSlug`

#### [NEW] [src/layouts/SpaceLayout.tsx](file:///d:/GitHub/family-tree/src/layouts/SpaceLayout.tsx)

Layout wrapper untuk `/app/:spaceSlug/*`:
- Load space data + membership
- Sidebar navigasi (tree, members, timeline, gallery)
- Role indicator
- 403 jika bukan member

#### [MODIFY] Halaman existing (TreePage, MembersPage, MemberProfilePage, TimelinePage, GalleryPage)

- Ambil `spaceSlug` dari `useParams()`
- Fetch data dari scoped API
- Gunakan `useSpaceStore()` sebagai pengganti `useFamilyStore()`
- Conditional render berdasarkan role

#### Admin pages cleanup

- `/admin/*` routes dihapus dari App.tsx
- `AdminLayout`, `AdminDashboardPage`, `AdminMembersPage`, `AdminGalleryPage`, `AdminTimelinePage` — deprecated/dihapus
- Fungsi admin di-merge ke role-based UI di space pages (berdasarkan `FamilyRole`)
- `/platform/*` frontend route di-reserve tapi TIDAK dibangun sprint ini (documented only)
- Tidak ada platform admin dashboard UI sprint ini

---

### Phase 7: Documentation & Cleanup

#### [MODIFY] [README.md](file:///d:/GitHub/family-tree/README.md)

Update dokumentasi:
- Database structure baru
- **Two-tier role system**: PlatformRole vs FamilyRole (clear separation)
- FamilySpace concept
- Membership roles
- Platform admin concept dan reserved routes
- Scoped API routes
- Seed/demo setup
- Fresh database assumption
- Cloud Run env vars

#### [MODIFY] [.env.example](file:///d:/GitHub/family-tree/.env.example)

Tambah:
```
DEMO_AUTH_USER_ID=
```

---

## Verification Plan

### Automated Tests

```bash
# 1. Prisma generate + migration
npx prisma generate
npx prisma migrate reset --force

# 2. Seed
npm run db:seed

# 3. Build
npm run build

# 4. Start dan verifikasi
npm run start
```

### Manual Verification

1. **`/api/health`** — harus tetap public, return `{ ok: true }`
2. **Landing page** — `/` harus menampilkan LandingPage (public), bukan HomePage lama
3. **Auth flow** — Neon Auth sign-in/sign-up masih berfungsi
4. **`/app`** — Authenticated user melihat list spaces (Rahman Archive dari seed)
5. **`/app/rahman-archive`** — Dashboard dengan navigasi
6. **`/app/rahman-archive/tree`** — Family tree dengan data seed
7. **`/app/rahman-archive/members`** — List members
8. **`/app/rahman-archive/timeline`** — Timeline events
9. **`/app/rahman-archive/gallery`** — Gallery items
10. **Old routes** — `/api/members` return 410 Gone
11. **Old admin routes** — `/admin/*` dihapus, tidak accessible
12. **Unauthorized access** — User tanpa membership ke space mendapat 403
13. **FamilyRole check** — Member role tidak bisa create/edit/delete di space
14. **PlatformRole check** — `platform_admin` bisa akses `/api/platform/health`, user biasa mendapat 403
15. **Platform ≠ Space** — `platform_admin` tanpa membership tetap tidak bisa akses data family di space
16. **Cloud Run** — `npm run build && npm run start` berjalan normal
17. **Create space** — User bisa buat space baru dari `/app`
