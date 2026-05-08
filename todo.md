# WarisanAI — Final Status & Todo

> Diperbarui pada 2026-05-08 berdasarkan kondisi aktual codebase, landing page WarisanAI, dan final breakdown produk untuk scope #JuaraVibeCoding.

---

## Product North Star

WarisanAI adalah:

```txt
A private AI-powered family archive for every family.
```

Tagline utama:

```txt
Preserve your family stories, not just your family tree.
```

WarisanAI bukan hanya aplikasi silsilah keluarga, tetapi ruang arsip privat untuk keluarga yang menyimpan:

```txt
FamilySpace
↓
Family tree
↓
Member profiles
↓
Photos
↓
Timeline
↓
Stories
↓
AI-assisted family memory preservation
```

---

## Final Goal untuk #JuaraVibeCoding

Final demo harus membuktikan 3 hal:

1. **Problem jelas**

   * Cerita keluarga sering hilang karena tersebar di ingatan, chat, foto, dan dokumen.

2. **App benar-benar functional**

   * Login.
   * FamilySpace.
   * Dashboard.
   * Family tree.
   * Members.
   * Member profile.
   * Timeline.
   * Gallery.
   * Stories.
   * Role-based access.
   * Cloud Run live app.

3. **AI memberi pembeda**

   * AI Relationship Explainer.
   * AI Biography Generator.
   * AI Timeline Story jika sempat.

---

## Final Demo Flow

Flow ideal untuk video 2–3 menit:

```txt
1. Buka landing page
2. Jelaskan problem: family stories scattered across chats, photos, and memories
3. Sign in / masuk demo account
4. Buka FamilySpace selector
5. Buka Rahman Archive
6. Tunjukkan dashboard archive overview
7. Buka family tree
8. Jalankan AI Relationship Explainer
9. Buka member profile
10. Jalankan AI Biography Generator
11. Buka timeline dan gallery
12. Tunjukkan stories sebagai arsip naratif
13. Tutup dengan privacy-first positioning dan Cloud Run live app
```

---

# Sprint 1 — Cloud Run Readiness

* [x] Production server yang serve frontend build + API Express (`server/app.ts` + `server/index.ts`)
* [x] Cloud Run listen ke `process.env.PORT` dengan fallback 8080 production / 3001 dev
* [x] Dockerfile ada dan berfungsi
* [x] `.dockerignore` ada
* [x] Script start production (`npm start` → `node build/server/index.js`)
* [x] `/api/health` endpoint jalan
* [x] Frontend production di-serve dari Express static `dist`
* [x] Sudah deploy ke Cloud Run:

  * `https://warisan-ai-558467708906.asia-southeast2.run.app`

**Status: ✅ SELESAI**

---

# Sprint 2 — Security & Auth Backend

* [x] Hapus logging token rahasia
* [x] Hapus `VITE_ADMIN_PASSWORD` dari frontend
* [x] Auth dipindahkan ke backend
* [x] Neon Auth JWT verification via JWKS menggunakan `jose`
* [x] Middleware `requireAuth`
* [x] Middleware `loadAppUser`
* [x] Middleware `requireSpaceMembership`
* [x] Middleware `requireSpaceRole`
* [x] Protect mutation endpoints:

  * members
  * branches
  * timeline
  * gallery
  * stories
  * source notes
  * upload
* [x] CORS whitelist untuk production domain + localhost
* [x] Rate limiting
* [x] Security headers
* [x] Frontend route guard
* [x] Token expiry check di client-side
* [x] Robust sign-out flow dengan cleanup
* [x] PII masking di auth logs
* [x] Conditional update di `loadAppUser`

Catatan:

```txt
Auth menggunakan Neon Auth sebagai identity provider.
Jangan tambah bcrypt custom auth, localStorage JWT, atau frontend admin password gate.
```

**Status: ✅ SELESAI**

---

# Sprint 3 — Schema SaaS-lite: AppUser + FamilySpace

* [x] Model `AppUser`
* [x] Model `FamilySpace`
* [x] Model `FamilyMembership`
* [x] Enum `PlatformRole`

  * `user`
  * `platform_admin`
* [x] Enum `FamilyRole`

  * `owner`
  * `admin`
  * `member`
* [x] Semua model data keluarga punya `familySpaceId`
* [x] Unique slug data keluarga menggunakan compound key:

```prisma
@@unique([familySpaceId, slugId])
```

* [x] Model `Story`
* [x] Model `SourceNote`
* [x] Relasi pendukung:

  * `StoryMember`
  * `SourceNoteMember`
  * `StorySourceNote`
* [x] Prisma migrations sudah applied

Aturan penting:

```txt
Semua private family data harus selalu berada di dalam FamilySpace.
Tidak boleh ada family data global yang terbaca publik.
```

**Status: ✅ SELESAI**

---

# Sprint 4 — API Scope by FamilySpace

* [x] Semua endpoint private di-scope ke `/api/spaces/:spaceSlug/*`
* [x] Middleware chain:

```txt
requireAuth
↓
loadAppUser
↓
requireSpaceMembership
↓
requireSpaceRole
```

* [x] CRUD Members:

  * `GET /api/spaces/:spaceSlug/members`
  * `POST /api/spaces/:spaceSlug/members`
  * `PUT /api/spaces/:spaceSlug/members/:id`
  * `DELETE /api/spaces/:spaceSlug/members/:id`

* [x] CRUD Branches:

  * `GET /api/spaces/:spaceSlug/branches`
  * `POST /api/spaces/:spaceSlug/branches`
  * `PUT /api/spaces/:spaceSlug/branches/:id`
  * `DELETE /api/spaces/:spaceSlug/branches/:id`

* [x] GET Nuclear Families:

  * `GET /api/spaces/:spaceSlug/nuclear-families`

* [x] CRUD Timeline:

  * `GET /api/spaces/:spaceSlug/timeline`
  * `POST /api/spaces/:spaceSlug/timeline`
  * `PUT /api/spaces/:spaceSlug/timeline/:id`
  * `DELETE /api/spaces/:spaceSlug/timeline/:id`

* [x] CRUD Gallery:

  * `GET /api/spaces/:spaceSlug/gallery`
  * `POST /api/spaces/:spaceSlug/gallery`
  * `PUT /api/spaces/:spaceSlug/gallery/:id`
  * `DELETE /api/spaces/:spaceSlug/gallery/:id`

* [x] Stories:

  * `GET /api/spaces/:spaceSlug/stories`
  * `POST /api/spaces/:spaceSlug/stories`

* [x] Source Notes:

  * `GET /api/spaces/:spaceSlug/source-notes`
  * `POST /api/spaces/:spaceSlug/source-notes`

* [x] Upload photos scoped:

  * `/api/uploads/photos?spaceSlug=:slug`

* [x] Spaces:

  * `GET /api/spaces`
  * `POST /api/spaces`
  * `PATCH /api/spaces/:spaceSlug`

* [x] Old global endpoints return `410 Gone`

* [x] Platform admin endpoints:

  * `/api/platform/health`
  * `/api/platform/stats`
  * `/api/platform/spaces`
  * `/api/platform/users`
  * `/api/platform/system`

**Status: ✅ SELESAI**

---

# Sprint 5 — Frontend Product Flow Foundation

* [x] Landing page public `/`
* [x] Auth page `/auth/*`
* [x] Space list & create flow `/app`
* [x] Private dashboard `/app/:spaceSlug`
* [x] Family tree view `/app/:spaceSlug/tree`
* [x] Members directory + CRUD `/app/:spaceSlug/members`
* [x] Member profile `/app/:spaceSlug/members/:memberId`
* [x] Timeline + CRUD `/app/:spaceSlug/timeline`
* [x] Gallery + CRUD `/app/:spaceSlug/gallery`
* [x] Stories + Source Notes `/app/:spaceSlug/stories`
* [x] Space settings `/app/:spaceSlug/settings`
* [x] Platform admin console `/platform/*`
* [x] Layout dengan sidebar navigation
* [x] Dashboard menampilkan:

  * total members
  * generations
  * timeline events
  * gallery items
  * stories
  * quick actions
  * recent activity dasar

Catatan:

```txt
Fondasi frontend sudah ada.
Yang perlu ditingkatkan sekarang adalah membuat area /app terasa seperti private family archive workspace, bukan hanya admin panel family tree.
```

**Status: ✅ FONDASI SELESAI — PRODUCT MATURITY MASIH PERLU**

---

# Sprint 5A — Mature FamilySpace Experience

Goal:

```txt
Membuat /app dan /app/:spaceSlug terasa seperti workspace arsip keluarga privat sesuai janji landing page.
```

---

## 5A.1 — `/app` FamilySpace Selector

* [x] Ubah copy agar lebih sesuai positioning WarisanAI
* [x] Tampilkan FamilySpace sebagai private archive card
* [x] Card menampilkan:

  * nama FamilySpace
  * deskripsi
  * role badge
  * jumlah members
  * jumlah timeline events
  * jumlah photo memories
  * jumlah stories
  * last updated
* [x] Tambahkan CTA jelas:

  * `Open Archive`
  * atau `Buka Arsip`
* [x] Perbaiki empty state untuk user yang belum punya FamilySpace
* [x] Form create space memakai copy yang lebih archive-oriented
* [x] Optional field di create form: root family name / archive purpose

Contoh copy:

```txt
Pilih ruang keluarga untuk mengelola silsilah, cerita, foto, dan arsip memori secara privat.
```

Contoh card:

```txt
Rahman Archive
Demo private family archive for preserving stories, relationships, and memories.

Owner
10 members · 4 timeline events · 3 photo memories · 2 stories

[Buka Arsip]
```

---

## 5A.2 — Dashboard as Archive Overview

* [x] Refine label stats:

  * `Family Members`
  * `Generations Preserved`
  * `Timeline Events`
  * `Photo Memories`
  * `Story Drafts`

* [x] Tambahkan `Archive Health` / completion panel

* [x] Tambahkan checklist progres archive:

  * Family tree started
  * Members added
  * Timeline has events
  * Stories drafted
  * Photos connected
  * AI draft generated

* [x] Tambahkan `AI Family Assistant` panel

* [x] Ubah `Quick Actions` menjadi lebih task-oriented

* [x] Tambahkan `Suggested Next Steps`

* [x] Jadikan `Recent Activity` terasa seperti aktivitas arsip, bukan hanya static counts

* [ ] Tambahkan featured memory/member jika data tersedia

Contoh dashboard copy:

```txt
Rahman Archive

A private family archive for preserving relationships, stories, photos, and memories across generations.
```

Contoh Quick Actions (task-oriented):

```txt
Continue Building Your Archive

- Add Family Member
- Open Family Tree
- Write a Story
- Upload Photo
- Generate Biography
- Explain Relationship
```

Contoh Archive Health:

```txt
Archive Health

Your archive is 45% complete.

Completed:
✓ Family tree started
✓ 10 members added
✓ Timeline has 4 events

Next:
○ Add biography to 6 members
○ Connect 3 photos to family members
○ Generate first AI family story
```

Contoh Suggested Next Steps:

```txt
Suggested Next Steps

1. Add birth places to older generation members
2. Write short notes for each grandparent
3. Upload photos and connect them to timeline events
4. Use AI Biography Generator to create readable stories
```

Contoh Recent Activity (event-based, bukan static counts):

```txt
Recently updated

- Nadia Rahman profile was edited
- Family reunion photo added to Gallery
- "Grandmother's Kitchen Story" drafted
- Timeline event "Moved to Bandung" added
```

Catatan: Jika belum punya activity log table, bisa fallback ke data terakhir dari members/timeline/gallery/stories.

---

## 5A.3 — AI Family Assistant Panel

Tambahkan panel di dashboard:

```txt
AI Family Assistant

Turn scattered notes into meaningful family history.

[Explain Relationship]
Ask how two family members are related.

[Generate Biography]
Create a warm biography from short notes.

[Create Timeline Story]
Turn milestones into a readable family journey.
```

Rules:

* [x] Jangan tampilkan dead button (Disabled dengan pesan jelas)
* [x] Jika endpoint AI belum ada, gunakan disabled state atau demo fallback yang jelas
* [x] Jangan klaim AI menyimpan data dengan E2EE jika belum diimplementasikan
* [x] Tampilkan privacy cue:

```txt
AI drafts stay inside this family space until reviewed.
```

---

## 5A.4 — Sidebar Navigation Maturity

Ubah grouping sidebar menjadi:

```txt
ARCHIVE
- Overview
- Family Tree
- Members

MEMORIES
- Timeline
- Gallery
- Stories

CONTROL
- Settings
```

Checklist:

* [x] Group sidebar menjadi lebih jelas (Archive/Memory/Control sudah ada di SpaceLayout.tsx)
* [x] Jangan tambah link AI baru jika belum ada halaman/fitur yang benar-benar jalan
* [x] AI entry point lebih aman dimasukkan sebagai panel di dashboard dan halaman terkait

---

## 5A.5 — Members Directory Maturity

* [x] Buat Members page terasa seperti directory family records
* [x] Tambahkan indikator biography status jika memungkinkan
* [x] Tambahkan filter/search (sudah ada di MembersPage.tsx):

  * branch ✅
  * generation ✅
  * status ✅
* [x] Card member menampilkan:

  * relationship to root ✅ (sudah ada di MemberCard)
  * generation ✅ (badge generasi sudah ada)
  * branch ✅ (badge branch sudah ada)
  * biography status ✅
* [x] Tambahkan indikator completeness per member:

  * `Story missing`
  * `Biography ready` ✅
  * `Photo connected`

Contoh card:

```txt
Siti Rahman
Mother · Generation 2
Rahman Branch

Biography: Drafted
3 photos · 2 timeline events

Indicator:
✓ Biography ready
○ Story missing
✓ Photo connected
```

---

## 5A.6 — Member Profile Maturity

Struktur final member profile:

```txt
1. Profile header
2. Family relationships
3. Biography
4. AI Biography Generator
5. Timeline appearances
6. Photo memories
7. Related stories / source notes
```

Checklist:

* [x] Profile header lebih emosional dan informatif
* [x] Tampilkan family relationships dengan jelas (InfoCard: Ayah, Ibu, Pasangan, Anak, Saudara sudah ada)
* [x] Biography menjadi section utama (section biografi sudah ada di bawah)
* [x] Tambahkan AI Biography panel (Disabled placeholder)
* [x] Tampilkan related timeline events
* [x] Tampilkan related photo memories
* [x] Tambahkan empty state yang mendorong user menulis notes/biography

Contoh relationship display:

```txt
Siti Rahman
Generation 2 · Mother · Rahman Branch

Relationship:
- Daughter of Ahmad Rahman and Laila Rahman
- Mother of Aditya Rahman
- Spouse of Budi Rahman
```

Contoh AI Biography Generator input/output:

```txt
AI Biography Assistant

Short notes:
"Born in 1968. Loved cooking. Raised three children. Known for patience."

[Generate Biography]

Output:
Siti Rahman is remembered as a warm and patient figure in the family...

Actions:
- [Copy to clipboard]
- [Save as biography]
- [Save as story draft]
```

---

## 5A.7 — Family Tree Maturity

Final fitur yang diharapkan:

```txt
Family Tree
- Search member
- Filter by branch
- Zoom / pan
- Select member
- Open profile preview
- Highlight relationship path
- Ask AI relationship question
```

Checklist:

* [x] Pastikan search member jelas (FocusSearchCombobox sudah ada)
* [x] Pastikan branch filter mudah dipakai (select dropdown branch sudah ada)
* [x] Tambahkan selected member preview jika belum optimal (MemberDetailModal sudah ada)
* [x] Tambahkan AI Relationship Explainer panel (disabled state sudah ada di TreePage.tsx)
* [ ] Tampilkan relationship path
* [ ] Highlight path jika feasible

---

## 5A.8 — Timeline as Living Family History

* [x] Timeline tidak hanya daftar event, tapi living family history
* [x] Event card menampilkan (sudah ada di TimelinePage.tsx):

  * year/date ✅
  * event type ✅
  * related members ✅
  * photo context ✅
* [x] Tambahkan filter event type jika memungkinkan (Semua/Kelahiran/Pernikahan/Wafat/Peristiwa Penting sudah ada)
* [ ] Tambahkan AI Timeline Story panel
* [ ] AI Timeline Story bisa copy atau save sebagai story draft

Contoh framing:

```txt
Family Timeline

Connect milestones, photos, biographies, and memories into a timeline that tells the story of your family across generations.
```

---

## 5A.9 — Gallery as Photo Memories

* [x] Ubah framing Gallery menjadi `Photo Memories`
* [x] Photo card menampilkan:

  * title ✅ (sudah ada di GalleryGrid)
  * year/date ✅
  * event context ✅ (field `event` ada di schema tapi belum prominent di UI)
  * related members ✅
  * related timeline event
* [x] Upload flow tetap scoped ke FamilySpace (POST /api/uploads/photos?spaceSlug= sudah ada)
* [x] Pastikan image URL tidak bocor ke data space lain (middleware requireSpaceMembership melindungi)

Contoh card:

```txt
Family Reunion 2008
Connected to: Siti Rahman, Aditya Rahman
Timeline: Eid Gathering 2008
Context: First reunion after moving to Jakarta.
```

---

## 5A.10 — Stories & Memory Inbox

Stories adalah pembeda penting WarisanAI dari family tree biasa.

* [ ] Stories page dibuat lebih narrative-oriented
* [x] Tampilkan status story (sudah ada di StoriesPage.tsx dengan Badge):

  * draft ✅
  * in review ✅
  * approved ✅
* [ ] Source Notes diframing sebagai `Memory Inbox`
* [x] Memory Inbox menyimpan (noteTypeOptions sudah ada di StoriesPage.tsx):

  * interview notes ✅ (type: interview)
  * photo context ✅ (type: photo_context)
  * document notes ✅ (type: document)
  * chat snippets ✅ (type: chat)
  * raw memories ✅ (type: note)
* [ ] Flow ideal:

```txt
Raw memory note
↓
Connect to member
↓
Turn into story with AI
```

* [ ] Jangan buat page baru kalau waktu terbatas
* [ ] Cukup matangkan Source Notes di Stories page sebagai Memory Inbox

---

## Acceptance Criteria Sprint 5A

```txt
- npm run build passes
- /app terasa seperti FamilySpace selector untuk private archive
- /app/:spaceSlug dashboard terasa seperti archive overview, bukan generic admin
- Tidak ada broken navigation
- Tidak ada public family data leakage
- Existing role-based access tetap jalan
- Flow cocok untuk demo video 2–3 menit
```

**Status: ✅ SELESAI**

---

# Sprint 6 — AI Features

Goal:

```txt
Membuat WarisanAI berbeda dari family tree biasa melalui AI yang benar-benar bisa didemokan.
```

---

## 6.1 — AI Relationship Explainer

Priority: **P1 / paling demo-friendly**

* [ ] Backend endpoint:

```txt
POST /api/spaces/:spaceSlug/ai/explain-relationship
```

* [ ] Endpoint wajib require auth + FamilySpace membership
* [ ] Hanya boleh menggunakan data dari FamilySpace aktif
* [ ] Input:

  * `fromMemberId`
  * `toMemberId`
* [ ] Backend cari relationship path dari data family tree
* [ ] Output minimal:

  * relationship label
  * plain-language explanation
  * path array
  * confidence/fallback note jika relasi tidak ditemukan
* [ ] Frontend panel di Family Tree page
* [ ] User bisa pilih Person A dan Person B
* [ ] Tampilkan explanation dan relationship path
* [ ] Highlight path di UI jika feasible
* [ ] Sediakan deterministic fallback jika AI env belum tersedia

Contoh output:

```txt
Rina is Aditya's cousin.
Rina's father and Aditya's mother are siblings.

Path:
Rina → Arman Rahman → Siti Rahman → Aditya Rahman
```

---

## 6.2 — AI Biography Generator

Priority: **P1 / paling mudah dimatangkan**

* [ ] Backend endpoint:

```txt
POST /api/spaces/:spaceSlug/ai/generate-biography
```

* [ ] Endpoint wajib require auth + FamilySpace membership
* [ ] Role minimum untuk save: owner/admin
* [ ] Input:

  * memberId optional
  * short notes
  * tone/style optional
* [ ] Output:

  * biography draft
  * privacy reminder
* [ ] Frontend panel di Member Profile atau Stories page
* [ ] Bisa generate dari notes sederhana
* [ ] Bisa copy atau save ke biography/story draft
* [ ] Sediakan deterministic fallback jika AI env belum tersedia

Privacy cue:

```txt
AI drafts stay inside this family space until reviewed.
```

---

## 6.3 — AI Timeline Story

Priority: **P2 / bagus untuk closing demo**

* [ ] Backend endpoint:

```txt
POST /api/spaces/:spaceSlug/ai/generate-timeline-story
```

* [ ] Endpoint wajib require auth + FamilySpace membership
* [ ] Ambil timeline events dari FamilySpace aktif
* [ ] Output family journey summary
* [ ] Frontend panel di Timeline page
* [ ] Bisa copy atau save sebagai Story draft
* [ ] Sediakan deterministic fallback jika AI env belum tersedia

---

## 6.4 — AI Technical Integration

* [ ] Tambah dependency AI yang dipilih:

  * Gemini SDK
  * atau Vertex AI SDK
* [ ] AI call hanya dari backend, bukan React langsung
* [ ] Env backend:

```env
GOOGLE_CLOUD_PROJECT=""
GOOGLE_CLOUD_LOCATION="asia-southeast2"
VERTEX_MODEL="gemini-1.5-flash"
```

* [ ] Jika env tidak tersedia, pakai deterministic fallback untuk demo
* [ ] Jangan taruh API key/secret di frontend
* [ ] Jangan klaim end-to-end encrypted
* [ ] Logging AI request tidak boleh menyimpan data sensitif berlebihan

---

## Acceptance Criteria Sprint 6

```txt
- Minimal Relationship Explainer dan Biography Generator bisa didemokan
- Endpoint AI protected by auth + membership
- AI hanya membaca data FamilySpace aktif
- Fallback response tersedia agar demo tidak gagal jika Vertex/Gemini belum aktif
- UI tidak punya dead button
```

**Status: 🔴 GAP TERBESAR / PRIORITAS KRITIKAL**

---

# Sprint 7 — Demo Account + Seed Data

* [x] Demo account: `demo@warisan.ai`
* [x] Demo FamilySpace: `rahman-archive`
* [x] Owner membership untuk demo user
* [x] 10 family members
* [x] 3 generasi
* [x] 2 branches
* [x] 4 timeline events
* [x] 3 gallery items
* [x] 2 stories
* [x] 2 source notes
* [x] Relationship links antar anggota keluarga

Catatan:

```txt
Seed data sudah kuat, tapi perlu dicek dari perspektif juri:
login → buka Rahman Archive → demo fitur tanpa setup tambahan.
```

**Status: ✅ SELESAI (Perlu cek di Cloud Run)**

---

# Sprint 8 — Production Verification

* [ ] Verifikasi Cloud Run landing page terbuka
* [ ] Verifikasi `/api/health` di Cloud Run
* [ ] Verifikasi login/auth redirect di Cloud Run
* [ ] Verifikasi `/app` setelah login
* [ ] Verifikasi `/app/rahman-archive` setelah login
* [ ] Verifikasi tree, members, member profile, timeline, gallery, stories
* [ ] Verifikasi create FamilySpace
* [ ] Verifikasi owner/admin bisa mutate data
* [ ] Verifikasi member tidak bisa mutate data
* [ ] Verifikasi upload image di Cloud Run
* [ ] Verifikasi Cloud Run logs tidak leak secret
* [ ] Verifikasi AI endpoints di Cloud Run setelah Sprint 6

Final local checks:

```bash
npx prisma validate
npm run build
npm run start
```

**Status: 🟡 PERLU FINAL QA**

---

# Sprint 9 — Submission Assets

* [x] README.md komprehensif
* [x] Live app Cloud Run URL tersedia
* [ ] README tambahkan section final `#JuaraVibeCoding Submission`
* [ ] Demo video LinkedIn public durasi 2–3 menit
* [ ] Hashtag `#JuaraVibeCoding` pada post LinkedIn
* [ ] Submit official completion form

---

## Script Video Demo Singkat

```txt
1. Landing page:
   WarisanAI preserves family stories, not just family trees.

2. Problem:
   Memories are scattered across chats, photos, and documents.

3. Open demo FamilySpace:
   Rahman Archive.

4. Dashboard:
   Archive overview, stats, archive health.

5. Family Tree:
   Show private relationship map.

6. AI Relationship Explainer:
   Ask how two people are related.

7. Member Profile:
   Show biography and generate AI biography draft.

8. Timeline/Gallery:
   Show memories with context.

9. Stories:
   Show narrative drafts from family memory.

10. Closing:
   Deployed on Google Cloud Run for #JuaraVibeCoding.
```

**Status: 🔴 BELUM SELESAI**

---

# Bonus — Sudah Ada tapi Bukan Scope Wajib

Fitur berikut sudah ada atau sebagian ada, tetapi jangan sampai mengalihkan fokus dari demo utama:

* [x] Platform Admin Console
* [x] Stories & Source Notes
* [x] Space Settings
* [x] Promote-admin script
* [x] Auth error bus
* [x] UploadThing integration
* [x] Vercel deployment tambahan

Jangan prioritaskan dulu:

```txt
payment/pricing
enterprise dashboard
advanced analytics
full invite system yang kompleks
audit logging detail
public genealogy database
end-to-end encryption claims
```

---

# Ringkasan Progress Final

| Area                    | Status               | Catatan                                       |
| ----------------------- | -------------------- | --------------------------------------------- |
| Cloud Run readiness     | ✅ Selesai            | Live URL sudah ada                            |
| Security & Auth         | ✅ Selesai            | Neon Auth + backend JWT verification          |
| Multi-tenant schema     | ✅ Selesai            | FamilySpace sudah jadi tenant boundary        |
| Space-scoped API        | ✅ Selesai            | Private data scoped by space                  |
| Frontend foundation     | ✅ Selesai            | Semua halaman inti sudah ada                  |
| FamilySpace UX maturity | ✅ Selesai            | Dashboard, directory, profiles sudah mature    |
| AI features             | 🔴 Belum selesai     | Gap terbesar untuk lomba                      |
| Demo seed data          | ✅ Selesai            | Seed data sudah komprehensif                  |
| Production QA           | 🟡 Perlu final check | Cloud Run + auth + upload + AI                |
| Submission assets       | 🔴 Belum selesai     | Video LinkedIn + form                         |

---

# Prioritas Selanjutnya

```txt
1. [KRITIKAL] Implement AI Relationship Explainer
   - Backend endpoint
   - Relationship path resolver
   - UI panel di Family Tree
   - Deterministic fallback

2. [KRITIKAL] Implement AI Biography Generator
   - Backend endpoint
   - UI panel di Member Profile / Stories
   - Save/copy draft
   - Privacy cue

3. [PENTING] Mature FamilySpace dashboard
   - Archive Health
   - AI Family Assistant panel
   - Suggested Next Steps
   - Better archive-oriented copy

4. [PENTING] Polish /app selector dan sidebar grouping
   - Private archive card
   - Better create space UX
   - Sidebar grouping Archive / Memories / Control

5. [PENTING] Verify Cloud Run production flow
   - Landing
   - Auth
   - /app
   - Rahman Archive
   - Upload
   - AI endpoints

6. [FINAL] Submission assets
   - README final submission section
   - Demo video LinkedIn 2–3 menit
   - Hashtag #JuaraVibeCoding
   - Completion form
```

---

# Final Scope Boundary

Final MVP yang harus dikejar:

```txt
Public:
- Landing page
- Login/register

Private:
- FamilySpace selector
- Dashboard as archive overview
- Family tree
- Members
- Member profile
- Timeline
- Gallery
- Stories / Memory Inbox
- Settings

AI:
- Relationship Explainer
- Biography Generator
- Timeline Story if time allows

Deployment:
- Cloud Run
- Demo account
- README submission section
- LinkedIn demo video
```

Yang tidak perlu dikejar sebelum submission:

```txt
payment
pricing
invoice
enterprise roles
public genealogy search
advanced invite system
advanced audit logs
complex analytics
full encryption claims
```
