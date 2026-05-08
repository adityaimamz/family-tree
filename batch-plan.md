# Rencana Bertahap: Sprint 5A → Sprint 9

> Berdasarkan analisis kondisi codebase saat ini dan todo.md.

---

## Prinsip Batching

Setiap batch dirancang untuk:
- **1 sesi kerja** (~30-60 menit eksekusi AI)
- **2-3 file utama** yang diubah per batch
- **Bisa di-test langsung** setelah selesai (npm run build + visual check)
- **Tidak saling blocking** — batch berikutnya bisa dikerjakan terpisah

---

## Batch 1 — Dashboard & Sidebar Polish
**Scope: Sprint 5A.2 + 5A.4**

File yang diubah:
- `src/layouts/SpaceLayout.tsx` — Sidebar sudah punya grouping Archive/Memory/Control ✅, tapi perlu copy refinement
- `src/pages/SpaceDashboard.tsx` — Refine stats labels, tambah Archive Health panel, tambah AI Family Assistant panel (placeholder), tambah Suggested Next Steps

Yang dikerjakan:
- [x] Sidebar grouping sudah benar (Archive/Memory/Control) — hanya review
- [ ] Refine dashboard stats labels → "Family Members", "Generations Preserved", "Photo Memories", "Story Drafts"
- [ ] Tambah Archive Health / completion panel dengan checklist progres
- [ ] Tambah AI Family Assistant panel (disabled state, bukan dead button)
- [ ] Tambah Suggested Next Steps berdasarkan data yang ada
- [ ] Jadikan Recent Activity lebih informatif

**Estimasi: ~1 file utama (SpaceDashboard.tsx), minor touch di SpaceLayout.tsx**

---

## Batch 2 — SpaceListPage & Members Directory
**Scope: Sprint 5A.1 + 5A.5**

File yang diubah:
- `src/pages/SpaceListPage.tsx` — Ubah card jadi private archive card, tambah stats (members, timeline, photos, stories count)
- `src/pages/MembersPage.tsx` — Tambah indikator relationship, generation, branch di card member

Yang dikerjakan:
- [ ] SpaceListPage: Ubah copy menjadi archive-oriented
- [ ] SpaceListPage: Card tampilkan stats (members count, timeline, photos, stories)
- [ ] SpaceListPage: Perbaiki empty state
- [ ] MembersPage: Card member tampilkan relationship to root, generation, branch
- [ ] MembersPage: Tambah biography status indicator jika tersedia

**Estimasi: 2 file utama**

> [!IMPORTANT]
> Batch 2 memerlukan API endpoint baru atau modifikasi existing endpoint untuk mengirim count data per space di `GET /api/spaces`. Perlu cek `server/app.ts` apakah sudah return counts atau belum.

---

## Batch 3 — Member Profile & Family Tree
**Scope: Sprint 5A.6 + 5A.7**

File yang diubah:
- `src/pages/MemberProfilePage.tsx` — Tambah section biography, related timeline, photo memories, AI Biography panel
- `src/pages/TreePage.tsx` + komponen tree — Tambah AI Relationship Explainer panel (UI only, disabled state)

Yang dikerjakan:
- [ ] MemberProfile: Profile header lebih emosional
- [ ] MemberProfile: Biography jadi section utama
- [ ] MemberProfile: Tambah AI Biography panel (disabled/placeholder)
- [ ] MemberProfile: Tampilkan related timeline events
- [ ] MemberProfile: Tampilkan related photo memories
- [ ] FamilyTree: Tambah AI Relationship Explainer panel (UI only, disabled)
- [ ] FamilyTree: Pastikan search dan branch filter jelas

**Estimasi: 2-3 file**

---

## Batch 4 — Timeline, Gallery, Stories Polish
**Scope: Sprint 5A.8 + 5A.9 + 5A.10**

File yang diubah:
- `src/pages/TimelinePage.tsx` — Minor copy refinement, event card enhancement
- `src/pages/GalleryPage.tsx` — Reframing ke "Photo Memories"
- `src/pages/StoriesPage.tsx` — Tambah status display, framing Source Notes sebagai Memory Inbox

Yang dikerjakan:
- [ ] Timeline: Copy refinement, event card tampilkan related members & photo context
- [ ] Gallery: Reframe ke "Photo Memories"
- [ ] Stories: Tampilkan status (draft/in review/approved)
- [ ] Stories: Source Notes diframing sebagai Memory Inbox

**Estimasi: 3 file, perubahan relatif ringan**

---

## Batch 5 — AI Features Backend + Frontend
**Scope: Sprint 6 (6.1 + 6.2 + 6.3 + 6.4)**

> [!WARNING]
> Ini batch terberat. Bisa dipecah lagi menjadi 5A (backend) dan 5B (frontend) jika terlalu besar.

File yang diubah:
- `server/app.ts` — Tambah 3 AI endpoints
- `src/pages/TreePage.tsx` atau komponen baru — AI Relationship Explainer UI
- `src/pages/MemberProfilePage.tsx` — AI Biography Generator UI
- `src/pages/TimelinePage.tsx` — AI Timeline Story UI

Yang dikerjakan:
- [ ] Backend: AI Relationship Explainer endpoint + deterministic fallback
- [ ] Backend: AI Biography Generator endpoint + deterministic fallback
- [ ] Backend: AI Timeline Story endpoint + deterministic fallback
- [ ] Frontend: AI Relationship Explainer panel di Family Tree
- [ ] Frontend: AI Biography Generator panel di Member Profile
- [ ] Frontend: AI Timeline Story panel di Timeline

**Estimasi: 4+ file, kemungkinan dipecah 2 sesi**

---

## Batch 6 — Demo QA & Submission
**Scope: Sprint 7 (sisa) + Sprint 8 + Sprint 9**

Yang dikerjakan:
- [ ] Verifikasi demo login flow
- [ ] Verifikasi seed data cukup untuk demo AI
- [ ] Build production & test
- [ ] Verifikasi Cloud Run deployment
- [ ] README tambah submission section
- [ ] Persiapan video demo script

**Estimasi: Bukan coding-heavy, lebih ke QA & verification**

---

## Ringkasan Urutan Eksekusi

| Batch | Fokus | File Utama | Berat |
|-------|-------|-----------|-------|
| **1** | Dashboard + Sidebar | SpaceDashboard.tsx | 🟢 Ringan |
| **2** | SpaceList + Members | SpaceListPage.tsx, MembersPage.tsx | 🟡 Sedang |
| **3** | MemberProfile + Tree | MemberProfilePage.tsx, TreePage.tsx | 🟡 Sedang |
| **4** | Timeline/Gallery/Stories | 3 page files | 🟢 Ringan |
| **5** | AI Features | server/app.ts + 3 pages | 🔴 Berat |
| **6** | Demo QA + Submission | README, verification | 🟢 Ringan |

---

## Pertanyaan untuk User

> [!IMPORTANT]
> 1. **Mau mulai dari Batch 1 (Dashboard)?** Ini yang paling safe dan impactful untuk pertama kali.
> 2. **Untuk AI Features (Batch 5)**, apakah sudah punya API key Gemini/Vertex AI, atau kita pakai deterministic fallback saja dulu untuk demo?
> 3. **Bahasa UI**: Saat ini campuran Bahasa Indonesia dan Inggris. Mau distandarkan ke salah satu, atau tetap campuran?
