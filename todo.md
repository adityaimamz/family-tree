# WarisanAI — Status & Todo

> Diverifikasi pada 2026-05-08 berdasarkan `oldtodo.md` dan keadaan aktual codebase.

---

## Sprint 1 — Cloud Run Readiness

- [x] Production server yang serve frontend build + API Express (`server/app.ts` + `server/index.ts`)
- [x] Cloud Run listen ke `process.env.PORT` dengan fallback 8080 (production) / 3001 (dev)
- [x] Dockerfile ada dan berfungsi (`Dockerfile` — `node:22-slim`, expose 8080)
- [x] `.dockerignore` ada
- [x] Script start production (`npm start` → `node build/server/index.js`)
- [x] `/api/health` endpoint jalan
- [x] Frontend production di-serve dari Express (static `dist`)
- [x] **Sudah deploy ke Cloud Run**: `https://warisan-ai-558467708906.asia-southeast2.run.app`

**Status: ✅ SELESAI**

---

## Sprint 2 — Security & Auth Backend

- [x] Hapus semua logging token rahasia (tidak ada lagi `tokenPrefix` atau `BLOB_READ_WRITE_TOKEN` logging)
- [x] Hapus `VITE_ADMIN_PASSWORD` dari frontend (tidak ditemukan di codebase)
- [x] Auth dipindahkan ke backend (Neon Auth JWT → JWKS verification via `jose`)
- [x] Middleware `requireAuth` (`server/neonAuth.ts`)
- [x] Middleware `requireRole` / `requireSpaceRole` (`server/authorization.ts`)
- [x] Protect mutation endpoints: members, timeline, gallery, upload
- [x] CORS di-whitelist ke production domain + localhost (baru diimplementasikan)
- [x] Rate limiting (`express-rate-limit` — 60 req/min global, 20 req/min auth)
- [x] Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- [x] Frontend route guard — `ProtectedRoute` component (baru diimplementasikan)
- [x] Token expiry check di client-side (baru diimplementasikan)
- [x] Robust sign-out flow dengan cleanup (`performSignOut` — baru)
- [x] PII masking di auth logs (baru diimplementasikan)
- [x] Conditional update di `loadAppUser` — skip DB write jika data tidak berubah (baru)

> **Catatan**: Auth menggunakan Neon Auth (IdP external) bukan bcrypt+JWT custom seperti di oldtodo.
> Ini keputusan arsitektur yang lebih baik — tidak perlu manage password hashing sendiri.

**Status: ✅ SELESAI**

---

## Sprint 3 — Schema SaaS-lite: User + FamilySpace

- [x] Model `AppUser` (pengganti `User` di oldtodo, dengan `authUserId`, `platformRole`)
- [x] Model `FamilySpace` (tenant boundary, `slug` unique)
- [x] Model `FamilyMembership` (many-to-many user↔space, `FamilyRole` enum: owner/admin/member)
- [x] Semua model data keluarga punya `familySpaceId` foreign key
- [x] Unique slug diganti ke `@@unique([familySpaceId, slugId])` — compound key
- [x] Enum `PlatformRole` (user, platform_admin)
- [x] Enum `FamilyRole` (owner, admin, member)
- [x] Model `Story` & `SourceNote` dengan relasi (StoryMember, SourceNoteMember, StorySourceNote)
- [x] Prisma migrations sudah applied

**Status: ✅ SELESAI**

---

## Sprint 4 — API Scope by Family Space

- [x] Semua endpoint di-scope ke `/api/spaces/:spaceSlug/*`
- [x] Middleware chain: `requireAuth → loadAppUser → requireSpaceMembership → requireSpaceRole`
- [x] CRUD Members: GET/POST/PUT/DELETE `/api/spaces/:spaceSlug/members`
- [x] CRUD Branches: GET/POST/PUT/DELETE `/api/spaces/:spaceSlug/branches`
- [x] GET Nuclear Families: `/api/spaces/:spaceSlug/nuclear-families`
- [x] CRUD Timeline: GET/POST/PUT/DELETE `/api/spaces/:spaceSlug/timeline`
- [x] CRUD Gallery: GET/POST/PUT/DELETE `/api/spaces/:spaceSlug/gallery`
- [x] CRUD Stories: GET/POST `/api/spaces/:spaceSlug/stories`
- [x] CRUD Source Notes: GET/POST `/api/spaces/:spaceSlug/source-notes`
- [x] Upload photos scoped: `/api/uploads/photos?spaceSlug=:slug`
- [x] GET/POST/PATCH spaces: `/api/spaces`, `/api/spaces/:spaceSlug`
- [x] Old global endpoints return `410 Gone`
- [x] Platform admin endpoints: `/api/platform/{health,stats,spaces,users,system}`

**Status: ✅ SELESAI**

---

## Sprint 5 — Frontend Product Flow

- [x] Landing page public (`/`)
- [x] Auth page (`/auth/*` — Neon Auth UI)
- [x] Space list & create flow (`/app` — `SpaceListPage`)
- [x] Private dashboard (`/app/:spaceSlug` — `SpaceDashboard`)
- [x] Family tree view (`/app/:spaceSlug/tree`)
- [x] Members directory + CRUD (`/app/:spaceSlug/members`)
- [x] Member profile (`/app/:spaceSlug/members/:memberId`)
- [x] Timeline + CRUD (`/app/:spaceSlug/timeline`)
- [x] Gallery + CRUD (`/app/:spaceSlug/gallery`)
- [x] Stories + Source Notes (`/app/:spaceSlug/stories` — `StoriesPage`)
- [x] Space settings (`/app/:spaceSlug/settings`)
- [x] Platform admin console (`/platform/*` — Dashboard, Stats, Users, Spaces, System)
- [x] Layout dengan sidebar navigation (`SpaceLayout`, `PlatformLayout`)
- [x] Dashboard menampilkan: total members, timeline events, gallery items, quick actions

> **Catatan**: Fitur yang melampaui target oldtodo: Stories, Source Notes, Space Settings, Platform Admin Console.

**Status: ✅ SELESAI**

---

## Sprint 6 — AI Features ⚠️

- [ ] AI Relationship Explainer (`POST /api/spaces/:spaceSlug/ai/explain-relationship`)
- [ ] AI Biography Generator (`POST /api/spaces/:spaceSlug/ai/generate-biography`)
- [ ] AI Timeline Story (`POST /api/spaces/:spaceSlug/ai/generate-timeline-story`)
- [ ] Frontend UI untuk AI features
- [ ] Dual mode: real Gemini/Vertex + fallback deterministic
- [ ] Privacy cue di UI: "AI drafts stay inside this family space until reviewed."

> **Tidak ada endpoint AI**, **tidak ada halaman AI**, **tidak ada dependency AI SDK** (Gemini/Vertex) di project saat ini.
> Ini adalah **gap terbesar** dari roadmap oldtodo.

**Status: ❌ BELUM DIMULAI**

---

## Sprint 7 — Demo Account + Seed Data

- [x] Demo account: `demo@warisan.ai` (platform_admin)
- [x] Demo FamilySpace: `rahman-archive`
- [x] Owner membership untuk demo user
- [x] 10 family members (3 generasi, sesuai target 8-12)
- [x] 2 branches (Garis Utama, Cabang Kedua — sesuai target 2-3)
- [x] 4 timeline events (pernikahan, kelahiran, reuni — sesuai target)
- [x] 3 gallery items (sesuai target)
- [x] 2 stories (1 draft, 1 approved — sesuai "biography drafts")
- [x] 2 source notes (interview, document)
- [x] Relationship links antar anggota keluarga
- [ ] Demo password flow (tidak relevan — auth via Neon Auth, bukan email+password)

> **Catatan**: Seed data sangat lengkap dan selaras dengan narasi demo. Demo login via Neon Auth, bukan manual email/password.

**Status: ✅ SELESAI** (kecuali demo credential flow yang berubah karena Neon Auth)

---

## Bonus — Sudah Ada tapi Tidak di Oldtodo

Fitur-fitur berikut sudah diimplementasikan melebihi target oldtodo:

- [x] **Platform Admin Console** — Dashboard, stats, user list, space list, system health
- [x] **Stories & Source Notes** — CRUD lengkap dengan relasi ke members
- [x] **Space Settings** — Edit nama & deskripsi space
- [x] **promote-admin script** — CLI tool untuk promosi user ke platform_admin
- [x] **Auth error bus** — Klasifikasi & display error auth (user vs backend)
- [x] **UploadThing integration** — Image upload dengan optimisasi Sharp
- [x] **Vercel deployment** — Dual deployment: Cloud Run + Vercel (serverless)

---

## Submission Assets

- [x] README.md komprehensif (tech stack, routes, role model, API docs, setup guide)
- [ ] Demo video LinkedIn 2-3 menit
- [ ] Hashtag `#JuaraVibeCoding` pada demo video
- [ ] Submit official completion form

---

## Ringkasan Progress

| Sprint | Topik | Status |
|--------|-------|--------|
| 1 | Cloud Run Readiness | ✅ Selesai |
| 2 | Security & Auth | ✅ Selesai |
| 3 | Schema Multi-Tenant | ✅ Selesai |
| 4 | API Scoped | ✅ Selesai |
| 5 | Frontend Flow | ✅ Selesai |
| 6 | AI Features | ❌ Belum dimulai |
| 7 | Demo Seed Data | ✅ Selesai |

---

## Prioritas Selanjutnya

```
1. [KRITIKAL] AI Features — ini gap terbesar dan requirement lomba
   - Tambah Gemini SDK / Vertex AI dependency
   - Buat 3 endpoint AI di server/app.ts
   - Buat halaman UI AI di frontend
   - Implementasi fallback deterministic response

2. [PENTING] Submission Assets
   - Rekam demo video 2-3 menit
   - Post di LinkedIn dengan #JuaraVibeCoding
   - Submit completion form

3. [NICE-TO-HAVE] Polish
   - Membership management API (invite, change role, remove member)
   - Audit logging
   - PUT/DELETE untuk Stories & Source Notes
   - Nuclear Family CRUD endpoints
```
