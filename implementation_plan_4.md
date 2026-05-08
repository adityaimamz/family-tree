# Sprint 4: Admin Refactor — FamilySpace App Shell + Platform Admin Console

Refactor arsitektur admin lama menjadi dua area dashboard terpisah:

| Area | Untuk siapa | Route | Isi |
|---|---|---|---|
| **FamilySpace** | User keluarga (owner/admin/member) | `/app/:spaceSlug/*` | Data arsip keluarga privat |
| **Platform Admin** | Owner/operator WarisanAI | `/platform/*` | Metadata platform dan operational stats |

**Contoh perbedaan akses:**
- Budi sebagai `owner` Rahman Archive → bisa buka `/app/rahman-archive`, TIDAK bisa buka `/platform`
- Aditya sebagai `platform_admin` → bisa buka `/platform`, TIDAK otomatis anggota semua FamilySpace

---

## Hasil Riset Codebase Setelah Sprint 3

### Sudah beres ✅

| Komponen | Status |
|---|---|
| `schema.prisma` | 13 model, multi-tenant, `PlatformRole` enum, `Story`, `SourceNote` |
| `server/authorization.ts` | `loadAppUser`, `requireSpaceMembership`, `requireSpaceRole`, `requirePlatformAdmin` |
| `server/app.ts` | 1031 baris, scoped routes, platform stubs (501) |
| `SpaceLayout.tsx` | Sidebar + header + role badge, fungsional |
| `useSpaceStore.tsx` | Context provider, space-scoped CRUD |
| Space pages | SpaceDashboard, MembersPage, GalleryPage, TimelinePage — semua pakai `useSpaceStore` |

### Masih bermasalah ❌

| Komponen | Masalah |
|---|---|
| `src/admin/*` | Seluruh folder masih ada, space pages import modal dari sini |
| `AdminModal` / `Admin*FormModal` | Nama "Admin", copy masih bahasa Indonesia lama |
| `SpaceLayout.tsx` | Kurang polished vs AdminLayout (tidak ada warm gradient, AnimatePresence drawer, sidebar shadow) |
| Platform admin | Backend stubs return 501, tidak ada frontend `/platform/*` |
| FamilySpace sidebar | Hanya 5 item tanpa grouping, belum ada Stories/Settings |
| Stories/SourceNotes page | Belum ada UI, hanya backend routes |

---

## User Review Required

> [!IMPORTANT]
> **Folder admin dihapus**: Setelah sprint ini, seluruh `src/admin/` akan dihapus. Komponen bernilai dipindahkan, sisanya dibuang.

> [!IMPORTANT]
> **SpaceLayout upgrade**: Visual premium dari AdminLayout (warm gradient, AnimatePresence drawer, sticky header shadow, footer info card) + grouped sidebar navigation.

> [!IMPORTANT]
> **2 halaman baru di FamilySpace**: Stories page (MVP sederhana) dan Settings page (placeholder profesional). Source Notes digabung di dalam Stories.

> [!IMPORTANT]
> **Platform Admin lengkap**: 5 halaman (Overview, Users, Spaces, Stats, System) dengan backend API.

## Resolved Decisions

> [!NOTE]
> **Reuse UI patterns, not old admin architecture** — confirmed

> [!NOTE]
> **FamilySpace sidebar final**: Overview, Family Tree, Members, Timeline, Gallery, Stories, Settings — dengan visual grouping (Archive / Memory / Control)

> [!NOTE]
> **Platform Admin sidebar final**: Overview, Stats, Users, Family Spaces, System — dengan visual grouping (Platform / Management / Operations)

> [!NOTE]
> **Source Notes**: Digabung di dalam Stories page untuk sprint ini, bukan menu sidebar terpisah

---

## Menu Structure

### FamilySpace Sidebar — `/app/:spaceSlug/*`

```
┌─────────────────────────┐
│  [Space Logo/Icon]      │
│  Rahman Archive         │
│  Owner                  │
├─────────────────────────┤
│                         │
│  ARCHIVE                │
│  · Overview       /     │
│  · Family Tree    /tree │
│  · Members     /members │
│                         │
│  MEMORY                 │
│  · Timeline  /timeline  │
│  · Gallery   /gallery   │
│  · Stories   /stories   │
│                         │
│  CONTROL                │
│  · Settings  /settings  │
│                         │
├─────────────────────────┤
│  Role: Owner            │
│  Read-only notice       │
│  (if member role)       │
└─────────────────────────┘
```

### Platform Admin Sidebar — `/platform/*`

```
┌─────────────────────────┐
│  [WarisanAI Logo]       │
│  Platform Console       │
│  platform_admin         │
├─────────────────────────┤
│                         │
│  PLATFORM               │
│  · Overview       /     │
│  · Stats      /stats    │
│                         │
│  MANAGEMENT             │
│  · Users      /users    │
│  · Family Spaces /spaces│
│                         │
│  OPERATIONS             │
│  · System     /system   │
│                         │
├─────────────────────────┤
│  Platform Admin         │
│  Operational Console    │
└─────────────────────────┘
```

---

## Proposed Changes

### Phase 1: Extract Reusable Components dari Admin

Pindahkan komponen bernilai keluar dari `src/admin/`, rename, bersihkan.

#### [NEW] [src/components/ui/AppModal.tsx](file:///d:/GitHub/family-tree/src/components/ui/AppModal.tsx)

Copy dari `AdminModal.tsx`:
- Rename `AdminModal` → `AppModal`, `AdminModalProps` → `AppModalProps`
- Tidak ada perubahan logic

#### [NEW] [src/components/dashboard/StatsCard.tsx](file:///d:/GitHub/family-tree/src/components/dashboard/StatsCard.tsx)

Copy dari `admin/components/StatsCard.tsx`:
- Pindahkan ke lokasi reusable, dipakai oleh SpaceDashboard dan PlatformDashboard

#### [NEW] [src/components/ui/PhotoUploadField.tsx](file:///d:/GitHub/family-tree/src/components/ui/PhotoUploadField.tsx)

Copy dari `admin/components/PhotoUploadField.tsx`:
- Sudah pakai `useSpaceStore` + `spaceSlug` correctly

#### [NEW] [src/components/forms/MemberFormModal.tsx](file:///d:/GitHub/family-tree/src/components/forms/MemberFormModal.tsx)

Refactor dari `AdminMemberFormModal.tsx`:
- Rename `AdminMemberFormModal` → `MemberFormModal`
- Import `AppModal` dari lokasi baru
- Update copy: "Tambah Anggota" → "Add Member", "Perubahan disimpan ke database." → "Fill in member details and family relations."

#### [NEW] [src/components/forms/GalleryFormModal.tsx](file:///d:/GitHub/family-tree/src/components/forms/GalleryFormModal.tsx)

Refactor dari `AdminGalleryFormModal.tsx`:
- Rename → `GalleryFormModal`
- Import `AppModal` baru
- Update copy: hapus "publik"

#### [NEW] [src/components/forms/TimelineFormModal.tsx](file:///d:/GitHub/family-tree/src/components/forms/TimelineFormModal.tsx)

Refactor dari `AdminTimelineFormModal.tsx`:
- Rename → `TimelineFormModal`
- Import `AppModal` baru
- Update copy: "linimasa publik" → "family timeline"

---

### Phase 2: Upgrade SpaceLayout + Add New Pages

#### [MODIFY] [SpaceLayout.tsx](file:///d:/GitHub/family-tree/src/layouts/SpaceLayout.tsx)

**Visual upgrades dari AdminLayout:**
- Warm gradient background: `bg-[radial-gradient(circle_at_14%_0%,...)]`
- Sticky header: `sticky top-0 z-30` + header shadow
- AnimatePresence mobile drawer (bukan dropdown)
- Sidebar: w-72, shadow, border style dari AdminSidebar
- Footer info card di sidebar
- User badge di header (nama user, avatar initial)
- "Back to spaces" link

**Grouped navigation dengan `ShellNavItem` type:**

```ts
type NavGroup = {
  label: string;
  items: ShellNavItem[];
};

type ShellNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
};

const spaceNavGroups: NavGroup[] = [
  {
    label: "Archive",
    items: [
      { label: "Overview", to: "", icon: LayoutDashboard, end: true },
      { label: "Family Tree", to: "/tree", icon: GitBranch },
      { label: "Members", to: "/members", icon: Users },
    ],
  },
  {
    label: "Memory",
    items: [
      { label: "Timeline", to: "/timeline", icon: Calendar },
      { label: "Gallery", to: "/gallery", icon: Images },
      { label: "Stories", to: "/stories", icon: BookOpen },
    ],
  },
  {
    label: "Control",
    items: [
      { label: "Settings", to: "/settings", icon: Settings },
    ],
  },
];
```

#### [NEW] [src/pages/StoriesPage.tsx](file:///d:/GitHub/family-tree/src/pages/StoriesPage.tsx)

Route: `/app/:spaceSlug/stories`

MVP sederhana:
- Fetch `/api/spaces/:spaceSlug/stories` (sudah ada backend route)
- List stories dengan status badge (draft / in_review / approved)
- Create story form untuk owner/admin (title, content, status)
- Related members selector
- Source Notes section inline (bukan menu terpisah) — tampilkan list source notes yang terkait
- Empty state profesional untuk state kosong
- Read-only untuk member role

#### [NEW] [src/pages/SpaceSettingsPage.tsx](file:///d:/GitHub/family-tree/src/pages/SpaceSettingsPage.tsx)

Route: `/app/:spaceSlug/settings`

Placeholder profesional:
- Space name (editable untuk owner/admin via PATCH `/api/spaces/:spaceSlug`)
- Description (editable)
- Privacy status badge ("Private Family Archive")
- Current role display
- Members/invite section — placeholder card "Invite & role management coming soon"
- Danger zone placeholder — "Transfer ownership" dan "Delete space" (disabled, coming soon)

#### [MODIFY] [SpaceDashboard.tsx](file:///d:/GitHub/family-tree/src/pages/SpaceDashboard.tsx)

Update stats untuk include stories count:
- Tambah stat card: Stories count
- Recent activity section placeholder
- Quick actions yang link ke semua 7 menu items

#### [MODIFY] [App.tsx](file:///d:/GitHub/family-tree/src/App.tsx)

Tambah routes baru di space:
```tsx
<Route path="stories" element={<StoriesPage />} />
<Route path="settings" element={<SpaceSettingsPage />} />
```

---

### Phase 3: Update Space Pages Imports

#### [MODIFY] [MembersPage.tsx](file:///d:/GitHub/family-tree/src/pages/MembersPage.tsx)

- `AdminMemberFormModal` → `MemberFormModal` dari `../components/forms/MemberFormModal`

#### [MODIFY] [GalleryPage.tsx](file:///d:/GitHub/family-tree/src/pages/GalleryPage.tsx)

- `AdminGalleryFormModal` → `GalleryFormModal` dari `../components/forms/GalleryFormModal`

#### [MODIFY] [TimelinePage.tsx](file:///d:/GitHub/family-tree/src/pages/TimelinePage.tsx)

- `AdminTimelineFormModal` → `TimelineFormModal` dari `../components/forms/TimelineFormModal`

---

### Phase 4: Platform Admin — Backend

#### [MODIFY] [app.ts](file:///d:/GitHub/family-tree/server/app.ts)

Implement platform admin API routes (saat ini return 501):

**GET `/api/platform/stats`** (requirePlatformAdmin)
```json
{
  "totalUsers": 42,
  "totalSpaces": 8,
  "totalMembers": 156,
  "totalGalleryItems": 89,
  "totalTimelineEvents": 34,
  "totalStories": 12,
  "totalSourceNotes": 7
}
```

**GET `/api/platform/users`** (requirePlatformAdmin)
```json
[{
  "id": "...",
  "email": "demo@warisan.ai",
  "name": "Demo User",
  "platformRole": "user",
  "spacesCount": 2,
  "createdAt": "2026-05-01T..."
}]
```
Jangan tampilkan data keluarga detail.

**GET `/api/platform/spaces`** (requirePlatformAdmin)
```json
[{
  "id": "...",
  "slug": "rahman-archive",
  "name": "Rahman Archive",
  "ownerCount": 1,
  "memberCount": 3,
  "recordCounts": { "members": 10, "timeline": 4, "gallery": 3 },
  "createdAt": "2026-05-01T..."
}]
```
Jangan tampilkan isi private family tree.

**GET `/api/platform/system`** (requirePlatformAdmin)
```json
{
  "apiHealth": true,
  "databaseConnected": true,
  "uploadThingConfigured": true,
  "neonAuthConfigured": true,
  "environment": "development",
  "nodeVersion": "v22.x",
  "uptime": 3600
}
```
Jangan tampilkan secret/env values.

---

### Phase 5: Platform Admin — Frontend

#### [NEW] [src/layouts/PlatformLayout.tsx](file:///d:/GitHub/family-tree/src/layouts/PlatformLayout.tsx)

Layout untuk `/platform/*`:
- Visual style terinspirasi AdminLayout (warm gradient, sidebar, sticky header)
- Grouped sidebar navigation:

```ts
const platformNavGroups: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { label: "Overview", to: "/platform", icon: LayoutDashboard, end: true },
      { label: "Stats", to: "/platform/stats", icon: BarChart3 },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Users", to: "/platform/users", icon: Users },
      { label: "Family Spaces", to: "/platform/spaces", icon: Boxes },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "System", to: "/platform/system", icon: Server },
    ],
  },
];
```

- Auth check: fetch `/api/auth/me`, verify `platformRole === "platform_admin"`
- Redirect non-admin ke `/app` dengan pesan error
- Footer card: "Platform Console — WarisanAI Operations"

#### [NEW] [src/pages/platform/PlatformDashboard.tsx](file:///d:/GitHub/family-tree/src/pages/platform/PlatformDashboard.tsx)

Route: `/platform`
- Fetch `/api/platform/stats`
- Stats grid pakai `StatsCard`: total users, spaces, members, gallery, timeline, stories
- Quick links ke Users, Spaces, Stats, System

#### [NEW] [src/pages/platform/PlatformStatsPage.tsx](file:///d:/GitHub/family-tree/src/pages/platform/PlatformStatsPage.tsx)

Route: `/platform/stats`
- Fetch `/api/platform/stats`
- Detailed stats cards
- Operational metrics view (lebih detail dari dashboard overview)

#### [NEW] [src/pages/platform/PlatformUsersPage.tsx](file:///d:/GitHub/family-tree/src/pages/platform/PlatformUsersPage.tsx)

Route: `/platform/users`
- Fetch `/api/platform/users`
- Table: email, name, platformRole, spaces count, created date
- Search/filter
- Read-only untuk sprint ini

#### [NEW] [src/pages/platform/PlatformSpacesPage.tsx](file:///d:/GitHub/family-tree/src/pages/platform/PlatformSpacesPage.tsx)

Route: `/platform/spaces`
- Fetch `/api/platform/spaces`
- Table: name, slug, owner count, member count, record counts, created date
- Search/filter
- Read-only untuk sprint ini

#### [NEW] [src/pages/platform/PlatformSystemPage.tsx](file:///d:/GitHub/family-tree/src/pages/platform/PlatformSystemPage.tsx)

Route: `/platform/system`
- Fetch `/api/platform/system`
- Health indicators: API, Database, UploadThing, Neon Auth — green/red badges
- Environment info (non-secret)
- Node version, uptime
- Bagus untuk demo

#### [MODIFY] [App.tsx](file:///d:/GitHub/family-tree/src/App.tsx)

Tambah platform routes:
```tsx
<Route path="/platform" element={<PlatformLayout />}>
  <Route index element={<PlatformDashboard />} />
  <Route path="stats" element={<PlatformStatsPage />} />
  <Route path="users" element={<PlatformUsersPage />} />
  <Route path="spaces" element={<PlatformSpacesPage />} />
  <Route path="system" element={<PlatformSystemPage />} />
</Route>
```

#### [MODIFY] [api.ts](file:///d:/GitHub/family-tree/src/lib/api.ts)

Tambah:
```ts
export const platformFetch = (path: string, init?: RequestInit) =>
  authFetch(`/api/platform${path}`, init);
```

#### [MODIFY] [family.ts](file:///d:/GitHub/family-tree/src/types/family.ts)

Tambah platform types:
```ts
export interface PlatformStats {
  totalUsers: number;
  totalSpaces: number;
  totalMembers: number;
  totalGalleryItems: number;
  totalTimelineEvents: number;
  totalStories: number;
  totalSourceNotes: number;
}

export interface PlatformUser {
  id: string;
  email: string;
  name: string | null;
  platformRole: string;
  spacesCount: number;
  createdAt: string;
}

export interface PlatformSpace {
  id: string;
  slug: string;
  name: string;
  ownerCount: number;
  memberCount: number;
  recordCounts: {
    members: number;
    timeline: number;
    gallery: number;
  };
  createdAt: string;
}

export interface PlatformSystemInfo {
  apiHealth: boolean;
  databaseConnected: boolean;
  uploadThingConfigured: boolean;
  neonAuthConfigured: boolean;
  environment: string;
  nodeVersion: string;
  uptime: number;
}
```

---

### Phase 6: Cleanup

#### [DELETE] Seluruh `src/admin/` folder

Setelah semua import di-reroute:

| File lama | Dipindah ke | Status |
|---|---|---|
| `AdminModal.tsx` | `src/components/ui/AppModal.tsx` | Dipindah + rename |
| `AdminSidebar.tsx` | — | Tidak dipakai, delete |
| `AdminMemberFormModal.tsx` | `src/components/forms/MemberFormModal.tsx` | Dipindah + rename |
| `AdminGalleryFormModal.tsx` | `src/components/forms/GalleryFormModal.tsx` | Dipindah + rename |
| `AdminTimelineFormModal.tsx` | `src/components/forms/TimelineFormModal.tsx` | Dipindah + rename |
| `StatsCard.tsx` | `src/components/dashboard/StatsCard.tsx` | Dipindah |
| `PhotoUploadField.tsx` | `src/components/ui/PhotoUploadField.tsx` | Dipindah |
| `AdminLayout.tsx` | — | Pattern dipakai di SpaceLayout/PlatformLayout, file dihapus |
| `AdminDashboardPage.tsx` | — | Diganti SpaceDashboard |
| `AdminMembersPage.tsx` | — | Diganti MembersPage |
| `AdminGalleryPage.tsx` | — | Diganti GalleryPage |
| `AdminTimelinePage.tsx` | — | Diganti TimelinePage |
| `AdminLoginPage.tsx` | — | Auth via `/auth/*` |
| `AdminNotFoundPage.tsx` | — | Tidak dipakai |
| `useAdminAuth.ts` | — | Diganti useSpaceStore/Neon Auth |

#### [DELETE/DEPRECATE] [useFamilyStore.tsx](file:///d:/GitHub/family-tree/src/hooks/useFamilyStore.tsx)

Cek consumers → jika tidak ada lagi → hapus.

#### [MODIFY] [App.tsx](file:///d:/GitHub/family-tree/src/App.tsx)

- Hapus semua import dari `src/admin/`
- Hapus `AdminLoginPage` import
- Gallery route: hapus `familyConfig.features.gallery` guard (semua space punya gallery)

---

## File Structure Setelah Sprint 4

```
src/
├── components/
│   ├── dashboard/
│   │   └── StatsCard.tsx              ← dari admin/StatsCard
│   ├── forms/
│   │   ├── MemberFormModal.tsx        ← dari AdminMemberFormModal
│   │   ├── GalleryFormModal.tsx       ← dari AdminGalleryFormModal
│   │   └── TimelineFormModal.tsx      ← dari AdminTimelineFormModal
│   ├── ui/
│   │   ├── AppModal.tsx               ← dari AdminModal
│   │   └── PhotoUploadField.tsx       ← dari admin/PhotoUploadField
│   ├── ui.tsx                         (existing)
│   ├── MemberForm.tsx                 (existing)
│   ├── MemberDetail.tsx               (existing)
│   ├── FamilyTree.tsx                 (existing)
│   ├── GalleryTimeline.tsx            (existing)
│   └── tree/                          (existing)
├── layouts/
│   ├── SpaceLayout.tsx                ← UPGRADED (warm gradient, grouped nav, drawer)
│   └── PlatformLayout.tsx             ← NEW
├── pages/
│   ├── platform/
│   │   ├── PlatformDashboard.tsx      ← NEW
│   │   ├── PlatformStatsPage.tsx      ← NEW
│   │   ├── PlatformUsersPage.tsx      ← NEW
│   │   ├── PlatformSpacesPage.tsx     ← NEW
│   │   └── PlatformSystemPage.tsx     ← NEW
│   ├── SpaceDashboard.tsx             ← UPDATED (stories count, activity)
│   ├── SpaceListPage.tsx              (existing)
│   ├── StoriesPage.tsx                ← NEW (includes source notes inline)
│   ├── SpaceSettingsPage.tsx          ← NEW (placeholder profesional)
│   ├── MembersPage.tsx                ← UPDATED imports
│   ├── MemberProfilePage.tsx          (existing)
│   ├── GalleryPage.tsx                ← UPDATED imports
│   ├── TimelinePage.tsx               ← UPDATED imports
│   ├── TreePage.tsx                   (existing)
│   └── LandingPage.tsx                (existing)
├── hooks/
│   ├── useSpaceStore.tsx              (existing, primary)
│   └── useSiteConfigEffects.ts        (existing)
├── lib/
│   ├── api.ts                         ← UPDATED (+platformFetch)
│   └── auth.ts                        (existing)
├── types/
│   ├── family.ts                      ← UPDATED (+platform types)
│   └── ...
└── (admin/ → DELETED entirely)
```

---

## Verification Plan

### Automated Tests

```bash
# 1. Build — no dead imports
npm run build

# 2. Start
npm run start
```

### Manual Verification — FamilySpace

1. **SpaceLayout visual** — warm gradient, sticky header shadow, AnimatePresence drawer on mobile
2. **Grouped sidebar** — Archive (Overview/Tree/Members), Memory (Timeline/Gallery/Stories), Control (Settings)
3. **`/app/rahman-archive`** — Dashboard dengan stats termasuk stories count
4. **`/app/rahman-archive/members`** — MemberFormModal create/edit berfungsi (owner/admin)
5. **`/app/rahman-archive/gallery`** — GalleryFormModal + PhotoUploadField berfungsi
6. **`/app/rahman-archive/timeline`** — TimelineFormModal berfungsi
7. **`/app/rahman-archive/stories`** — List stories, create story, status badges
8. **`/app/rahman-archive/settings`** — Space name/description editable, placeholder sections
9. **Member role** — tombol create/edit/delete disembunyikan, read-only notice tampil
10. **Mobile responsive** — drawer sidebar buka/tutup dengan animasi

### Manual Verification — Platform Admin

11. **`/platform`** — Hanya `platform_admin` yang bisa akses
12. **`/platform`** — Dashboard stats: total users, spaces, members, gallery, timeline, stories
13. **`/platform/stats`** — Detailed operational metrics
14. **`/platform/users`** — Table users (email, name, role, spaces count, created)
15. **`/platform/spaces`** — Table spaces (name, slug, counts, created)
16. **`/platform/system`** — Health indicators (API, DB, UploadThing, Neon Auth) + environment info
17. **Non-admin user** → `/platform` redirect ke `/app` atau access denied

### Manual Verification — Cleanup

18. **No `/admin` routes** — navigate ke `/admin` → redirect ke `/`
19. **No import errors** — tidak ada dead import dari `src/admin/`
20. **Cloud Run** — `npm run build && npm run start` berjalan normal
