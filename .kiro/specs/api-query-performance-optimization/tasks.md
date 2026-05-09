# Implementation Plan: API Query Performance Optimization

## Overview

Convert the design in `design.md` into a series of incremental coding steps against the existing TypeScript/Express/Prisma server under `server/`. Each step builds on the previous one and ends with wiring things together — no hanging or orphaned code. Work progresses from shared helpers, to the two new read-only endpoints (Bootstrap, Tree_Data), to narrowed `select` shapes on Stories/Source Notes, to opt-in pagination on the six heavy-list endpoints, to the relationship-cache consistency check, finishing with cross-cutting property-based tests. Every change preserves existing route contracts and `familySpaceId` scoping; `npm run build` and `npx prisma validate` must stay green throughout.

All code is TypeScript (matching the existing stack). Property-based tests use `fast-check` with `vitest` and `supertest`, running at minimum 100 iterations each, tagged per the Testing Strategy section of the design.

## Tasks

- [x] 1. Set up testing infrastructure for PBT and integration tests
  - [x] 1.1 Install and configure vitest, fast-check, and supertest
    - Add `vitest`, `fast-check`, `supertest`, `@types/supertest` as devDependencies
    - Add `vitest.config.ts` with node environment and isolated test database connection
    - Add `test` and `test:run` scripts to `package.json`
    - Create `test/setup.ts` that builds the Express app (via `createApp()` in `server/app.ts`) without listening, provides a seeded Prisma fixture helper, and a `cleanupDatabase()` utility that truncates all tables scoped by `familySpaceId`
    - Create `test/fixtures/arbFamilySpaceFixture.ts` stub exporting `arbFamilySpaceFixture`, `arbTwoDisjointSpaces`, `arbPaginationParams`, `arbGraphEdit` (implementation filled in as tests are added)
    - _Design: Testing Strategy — Tooling_
    - _Requirements: 8.1, 8.2_

- [x] 2. Add shared helpers for response composition and pagination in `server/routes/shared.ts`
  - [x] 2.1 Add tree member select/mapper and space summary helper
    - Export `treeMemberSelect` (the 22-key frozen Prisma `select` shape defined in design §Components and Interfaces / Tree_Data_Endpoint)
    - Export `mapTreeMember(member)` that converts a `treeMemberSelect`-shaped row to the Tree_Data_Endpoint member response (defaults empty arrays for `spouseIds`/`formerSpouseIds`/`childrenIds`/`siblingIds`/`nuclearFamilyIds`)
    - Export `computeSpaceSummary(familySpaceId: string)` that runs the same `prisma.$transaction([...])` as the existing `/api/spaces/:spaceSlug/summary` handler and returns `{ membersCount, generationsCount, branchesCount, nuclearFamiliesCount, timelineCount, galleryCount, storiesCount }`
    - Refactor `/api/spaces/:spaceSlug/summary` in `spaceRoutes.ts` to call `computeSpaceSummary` so the helper and the legacy endpoint remain byte-compatible
    - _Design: Shared Helpers Summary; Components and Interfaces — Bootstrap_Endpoint, Tree_Data_Endpoint_
    - _Requirements: 1.5, 1.6, 1.7, 2.5, 2.6, 2.7, 2.8_

  - [x] 2.2 Add pagination parser and narrowed-include frozen shapes
    - Export `PaginationParams` union type and `parsePagination(query)` as specified in design §Pagination On Heavy List Endpoints (legacy when both params absent; paged when either present; clamps `pageSize` to `[1, 100]`; defaults `page=1` / `pageSize=20`; returns `{ error }` for invalid input)
    - Export frozen constants `storyListInclude` and `sourceNoteListInclude` with the narrowed nested-`select` shapes (`{ select: { member: { select: { slugId: true } } } }` etc.) defined in design §Narrowed `select` for Stories and Source Notes
    - _Design: Shared Helpers Summary; Narrowed `select` for Stories and Source Notes; Pagination On Heavy List Endpoints_
    - _Requirements: 5.1, 5.4, 5.5, 5.6, 5.7, 7.1, 7.2_

- [x] 3. Implement the Tree_Data_Endpoint in `server/routes/memberRoutes.ts`
  - [x] 3.1 Register `GET /api/spaces/:spaceSlug/tree-data` handler
    - Use the middleware chain `requireAuth, loadAppUser, requireSpaceMembership` (identical to `/api/spaces/:spaceSlug/members`)
    - Run three parallel queries (via `prisma.$transaction([...])`) all scoped by `familySpaceId: req.familySpace.id`:
      - `prisma.familyMember.findMany({ where, orderBy: [{ generation: "asc" }, { fullName: "asc" }], select: treeMemberSelect })`
      - `prisma.familyBranch.findMany({ where, orderBy: ... })` mapped through existing `mapBranch`
      - `prisma.nuclearFamily.findMany({ where, orderBy: ... })` mapped through existing `mapNuclearFamily`
    - Respond with `{ members: members.map(mapTreeMember), branches: branches.map(mapBranch), nuclearFamilies: nuclearFamilies.map(mapNuclearFamily) }`
    - Route errors through `handleError(res, error, "Failed to load tree data.")`
    - _Design: Components and Interfaces — Tree_Data_Endpoint; FamilySpace Isolation Invariant_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [x] 3.2 Write property test for tree-data member shape invariant
    - **Property 5: Tree-data member shape invariant**
    - **Validates: Requirements 2.4, 2.5, 2.6**
    - Using `arbFamilySpaceFixture`, seed the DB and call `GET /api/spaces/:spaceSlug/tree-data`; for every returned member assert `Object.keys(member).sort()` deep-equals the 22-key whitelist from design §Tree member shape
    - Tag with `// Feature: api-query-performance-optimization, Property 5: Tree-data member shape invariant`; run ≥100 fast-check iterations

  - [x] 3.3 Write property test for tree-data sort invariant
    - **Property 6: Tree-data sort invariant**
    - **Validates: Requirements 2.10**
    - For every adjacent pair `(m_i, m_{i+1})` in `members`, assert `m_i.generation < m_{i+1}.generation` OR (`m_i.generation === m_{i+1}.generation` AND `m_i.fullName <= m_{i+1}.fullName`)
    - Tag with `// Feature: api-query-performance-optimization, Property 6: Tree-data sort invariant`; run ≥100 fast-check iterations

- [x] 4. Implement the Bootstrap_Endpoint in `server/routes/spaceRoutes.ts`
  - [x] 4.1 Register `GET /api/spaces/:spaceSlug/bootstrap` handler
    - Use the middleware chain `requireAuth, loadAppUser, requireSpaceMembership`
    - Always produce `{ space: mapFamilySpace(req.familySpace), membership: mapCurrentMembership(req.membership, req.familySpace), summary: await computeSpaceSummary(req.familySpace.id) }`
    - When `req.query.include === "coreData"`, additionally run the same three `findMany`s used by the Tree_Data_Endpoint (calling the shared helpers `treeMemberSelect` / `mapTreeMember` / `mapBranch` / `mapNuclearFamily`) and attach `members`, `branches`, `nuclearFamilies` to the response
    - When `include` is anything other than `"coreData"` (including absent), omit the `members`/`branches`/`nuclearFamilies` keys entirely
    - Route errors through `handleError(res, error, "Failed to load bootstrap data.")`
    - _Design: Components and Interfaces — Bootstrap_Endpoint; Backward Compatibility Strategy_
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11_

  - [x] 4.2 Write property test for bootstrap composition equivalence
    - **Property 4: Bootstrap composition equivalence**
    - **Validates: Requirements 1.5, 1.6, 1.7, 1.10, 1.11**
    - For a random fixture and a random authenticated member, call `GET /api/spaces/:spaceSlug/bootstrap`, `GET /api/spaces/:spaceSlug`, and `GET /api/spaces/:spaceSlug/summary`; deep-equal `bootstrap.space === spaceEndpoint.space`, `bootstrap.membership === spaceEndpoint.membership`, `bootstrap.summary === summaryEndpoint`; assert `members`/`branches`/`nuclearFamilies` keys are absent
    - Then call `GET /api/spaces/:spaceSlug/bootstrap?include=coreData` and `GET /api/spaces/:spaceSlug/tree-data`; deep-equal the three core-data arrays
    - Tag with `// Feature: api-query-performance-optimization, Property 4: Bootstrap composition equivalence`; run ≥100 fast-check iterations

- [x] 5. Narrow the Prisma `select` shape for Stories list in `server/routes/storyRoutes.ts`
  - [x] 5.1 Apply `storyListInclude` to `GET /api/spaces/:spaceSlug/stories` and the post-create re-fetch
    - Replace the current `include: { members: { include: { member: true } }, sourceNotes: { include: { sourceNote: true } } }` on the `findMany` for the list handler with `storyListInclude`
    - Replace the same include on the `findUniqueOrThrow` inside `POST /api/spaces/:spaceSlug/stories` (and any other story re-fetch that feeds into `mapStory`) with `storyListInclude`
    - Verify `mapStory` still reads only `link.member?.slugId` / `link.sourceNote?.slugId` (it already does) so the output shape is byte-identical
    - _Design: Narrowed `select` for Stories and Source Notes_
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 7.1, 7.2, 7.3_

  - [x] 5.2 Write unit test verifying the Prisma include shape for the stories list query
    - Use `vi.spyOn(prisma.story, 'findMany')` to intercept the call inside `GET /api/spaces/:spaceSlug/stories` and assert the `include` argument deep-equals `storyListInclude`
    - Assert no top-level `biography`, `notes`, or related-`content` key appears in the Prisma call
    - _Requirements: 3.1, 7.2_

- [x] 6. Narrow the Prisma `select` shape for Source Notes list in `server/routes/sourceNoteRoutes.ts`
  - [x] 6.1 Apply `sourceNoteListInclude` to `GET /api/spaces/:spaceSlug/source-notes` and post-create/update re-fetch queries
    - Replace the current `include` on the `findMany` with `sourceNoteListInclude`
    - Replace the same include on `findUniqueOrThrow` used by create and update handlers to produce the response
    - Verify `mapSourceNote` still reads only `link.member?.slugId` / `link.story?.slugId` (it already does)
    - _Design: Narrowed `select` for Stories and Source Notes_
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 7.1, 7.2, 7.3_

  - [x] 6.2 Write unit test verifying the Prisma include shape for the source-notes list query
    - Use `vi.spyOn(prisma.sourceNote, 'findMany')` to intercept the call and assert the `include` argument deep-equals `sourceNoteListInclude`
    - _Requirements: 4.1, 7.2_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Apply opt-in pagination to the six heavy-list endpoints
  - [x] 8.1 Paginate Stories list in `server/routes/storyRoutes.ts`
    - In `GET /api/spaces/:spaceSlug/stories`, call `parsePagination(req.query)`; on `{ error }` respond `400 { error }`; on `{ mode: "legacy" }` run the existing `findMany` (now with `storyListInclude`) and respond with the bare array mapped by `mapStory`; on `{ mode: "paged" }` run `prisma.$transaction([findMany({ where, orderBy: { updatedAt: "desc" }, skip, take, include: storyListInclude }), count({ where })])` and respond `{ items: items.map(mapStory), page, pageSize, total, hasMore: page * pageSize < total }`
    - Keep `where: { familySpaceId: req.familySpace.id }` in both branches
    - _Design: Pagination On Heavy List Endpoints; Per-endpoint application table_
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 8.3, 8.7, 8.8_

  - [x] 8.2 Paginate Source Notes list in `server/routes/sourceNoteRoutes.ts`
    - Same template as 8.1, using `sourceNote` model, `orderBy: { updatedAt: "desc" }`, `mapSourceNote`, and `sourceNoteListInclude`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 8.3, 8.7, 8.8_

  - [x] 8.3 Paginate Gallery list in `server/routes/galleryRoutes.ts`
    - Same template, using `galleryItem` model, `orderBy: { year: "asc" }`, `mapGalleryItem`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 8.3, 8.7, 8.8_

  - [x] 8.4 Paginate Timeline list in `server/routes/timelineRoutes.ts`
    - Same template, using `timelineEvent` model, `orderBy: { year: "asc" }`, `mapTimelineEvent`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 8.3, 8.7, 8.8_

  - [x] 8.5 Paginate platform users and platform spaces in `server/routes/platformRoutes.ts`
    - Apply the same pagination template to `GET /api/platform/users` (`appUser` model, `orderBy: { createdAt: "desc" }`) and `GET /api/platform/spaces` (`familySpace` model, `orderBy: { createdAt: "desc" }`) using the existing inline mappers
    - Keep `requirePlatformAdmin` on both routes; do not add `familySpaceId` scoping (platform routes are global)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [x] 8.6 Write property test for pagination slicing model
    - **Property 8: Pagination slicing model**
    - **Validates: Requirements 5.1, 5.3, 5.4, 5.5, 5.7, 5.8**
    - For each heavy-list endpoint, fetch the legacy array; using `arbPaginationParams` pick random valid `(page, pageSize)`; call the paged endpoint and assert `response.items` deep-equals `legacyItems.slice(skip, skip + take)`, `response.page === effectivePage`, `response.pageSize === clamp(pageSize ?? 20, 1, 100)`, `response.total === legacyItems.length`, `response.hasMore === (effectivePage * effectivePageSize < legacyItems.length)`
    - Tag with `// Feature: api-query-performance-optimization, Property 8: Pagination slicing model`; run ≥100 fast-check iterations

  - [x] 8.7 Write property test for pagination rejects invalid input
    - **Property 9: Pagination rejects invalid input**
    - **Validates: Requirements 5.6**
    - Generate random strings that are not positive-integer encodings (empty string, `"0"`, negatives, decimals, letters, whitespace, arrays via repeated query keys) and supply them as `page` or `pageSize`; assert every response is HTTP 400 with a JSON body whose `error` field names the invalid parameter
    - Tag with `// Feature: api-query-performance-optimization, Property 9: Pagination rejects invalid input`; run ≥100 fast-check iterations

  - [x] 8.8 Write property test for backward-compatible response equivalence
    - **Property 3: Backward-compatible response equivalence**
    - **Validates: Requirements 3.4, 4.4, 5.2, 7.4, 8.3, 8.7, 8.8**
    - For each pre-existing endpoint (stories, source-notes, gallery, timeline, platform-users, platform-spaces, members, branches, nuclear-families, space, summary, membership), call with no new query params against a random fixture; deep-equal the response against a reference implementation (pre-change mapper applied to raw Prisma rows for the same fixture)
    - Tag with `// Feature: api-query-performance-optimization, Property 3: Backward-compatible response equivalence`; run ≥100 fast-check iterations

  - [x] 8.9 Write property test for narrowed-select absence invariant
    - **Property 7: Narrowed-select absence invariant for Stories and Source Notes lists**
    - **Validates: Requirements 3.2, 3.3, 4.2, 4.3, 7.3**
    - Call both `GET /api/spaces/:spaceSlug/stories` and `GET /api/spaces/:spaceSlug/source-notes` in both legacy and paged modes; recursively walk every object below the top-level item shape and assert no nested object contains a key in `{ biography, notes, content }` that originated from a joined related record
    - Tag with `// Feature: api-query-performance-optimization, Property 7: Narrowed-select absence invariant`; run ≥100 fast-check iterations

- [x] 9. Implement the Relationship Explanation cache consistency check in `server/routes/aiRoutes.ts`
  - [x] 9.1 Add `isCacheFresh` and wire the cache-bypass path in `POST /api/spaces/:spaceSlug/ai/explain-relationship`
    - Implement `isCacheFresh(cached, currentMembers)` exactly as specified in design §Relationship Explanation Cache Safety: verify every id in `cached.pathMemberIds` exists in the current `relationshipMembers` map, recompute `deterministicRelationship(currentMembers, cached.fromMemberId, cached.toMemberId)`, and compare its `path.map(p => p.id)` array element-wise to `cached.pathMemberIds`
    - After the existing `refresh !== true` cache lookup succeeds, call `isCacheFresh`; on `true` keep the current behavior (increment `viewCount`, update `lastViewedAt`, respond with `cached: true`); on `false` fall through to the recompute-and-upsert branch and respond with `cached: false`
    - Keep `familySpaceId: req.familySpace.id` in both the cache lookup `where` and the `upsert` `where` (never widen across tenants)
    - Do not surface cache staleness as a 4xx/5xx; the only user-visible signal is `cached: false`
    - _Design: Relationship Explanation Cache Safety_
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x] 9.2 Write property test for relationship-cache freshness
    - **Property 10: Relationship-cache freshness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
    - Using `arbFamilySpaceFixture` plus `arbGraphEdit`, generate random `(graph, cacheState)` pairs; call the endpoint with `refresh !== true` and assert `response.cached === true` iff (every id in `cached.pathMemberIds` exists in current graph AND `deterministicRelationship(current, from, to).path.map(p => p.id)` deep-equals `cached.pathMemberIds`); when `cached: false` assert `response.pathMemberIds` equals the freshly recomputed path
    - Tag with `// Feature: api-query-performance-optimization, Property 10: Relationship-cache freshness`; run ≥100 fast-check iterations

  - [x] 9.3 Write property test for relationship-cache refresh bypass
    - **Property 11: Relationship-cache refresh bypass**
    - **Validates: Requirements 6.5**
    - For random cache states, call the endpoint with `refresh: true`; assert `response.cached === false` in every case
    - Tag with `// Feature: api-query-performance-optimization, Property 11: Relationship-cache refresh bypass`; run ≥100 fast-check iterations

  - [x] 9.4 Write property test for relationship-cache upsert after bypass
    - **Property 12: Relationship-cache upsert after bypass**
    - **Validates: Requirements 6.6**
    - Trigger a cache bypass (via `refresh: true` or by mutating the graph); after the call, query `RelationshipExplanationHistory` and assert exactly one row exists for `(familySpaceId, fromMemberId, toMemberId)` and its `pathMemberIds` deep-equals the response's `pathMemberIds`
    - Tag with `// Feature: api-query-performance-optimization, Property 12: Relationship-cache upsert after bypass`; run ≥100 fast-check iterations

  - [x] 9.5 Write property test for relationship-cache hit counter
    - **Property 13: Relationship-cache hit counter**
    - **Validates: Requirements 6.7**
    - Seed a stored row with `viewCount = v0`, `lastViewedAt = t0`; call the endpoint `N ∈ [1, 10]` times in a cache-hit scenario; assert the row's `viewCount === v0 + N` and `lastViewedAt >= callStartTimestamp`
    - Tag with `// Feature: api-query-performance-optimization, Property 13: Relationship-cache hit counter`; run ≥100 fast-check iterations

- [x] 10. Cross-cutting correctness property tests
  - [x] 10.1 Write property test for middleware parity on space-scoped read routes
    - **Property 1: Middleware parity on space-scoped read routes**
    - **Validates: Requirements 1.2, 1.3, 1.4, 2.2, 2.3, 8.4**
    - Parametrize over the list of space-scoped read routes (`/api/spaces/:spaceSlug`, `.../summary`, `.../membership`, `.../members`, `.../branches`, `.../nuclear-families`, `.../stories`, `.../source-notes`, `.../gallery`, `.../timeline`, `.../bootstrap`, `.../tree-data`); for each of `(no auth → 401)`, `(auth non-member → 403)`, `(unknown slug → 404)`, assert the response status
    - Tag with `// Feature: api-query-performance-optimization, Property 1: Middleware parity on space-scoped read routes`; run ≥100 fast-check iterations

  - [x] 10.2 Write property test for FamilySpace tenant isolation
    - **Property 2: FamilySpace tenant isolation**
    - **Validates: Requirements 1.8, 2.9, 3.5, 4.5, 5.9, 6.8, 7.5, 8.5, 8.6**
    - Using `arbTwoDisjointSpaces`, seed two spaces A and B with guaranteed-disjoint ids/slugs; for every space-scoped endpoint (including new ones), call scoped to B as a member of B; assert no id, slug, or content string from A's fixture appears anywhere in the B response tree
    - Tag with `// Feature: api-query-performance-optimization, Property 2: FamilySpace tenant isolation`; run ≥100 fast-check iterations

- [x] 11. Final checkpoint - Ensure all tests pass and acceptance checks stay green
  - Run `npm run build` and `npx prisma validate`; both must exit with status 0
  - Run the full `vitest` suite and ensure every unit, integration, and property-based test passes
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; they are all testing tasks (unit tests and fast-check property tests).
- Every implementation sub-task references specific acceptance criteria from `requirements.md` and the corresponding section of `design.md` for traceability.
- Each of the 13 correctness properties in the design maps one-to-one to a `*`-marked sub-task. Each such sub-task carries the property number, title, and the requirement clauses it validates.
- Checkpoints (tasks 7 and 11) exist so the team can pause, run the build/prisma-validate pair, and verify incremental progress without full end-to-end deployment.
- The two shared-file changes on `server/routes/shared.ts` (tasks 2.1 and 2.2) are placed in different waves because they edit the same file; this avoids merge conflicts when waves run in parallel.
- Tasks 5.1 and 8.1 both edit `storyRoutes.ts`, and tasks 6.1 and 8.2 both edit `sourceNoteRoutes.ts`; they are likewise split across waves.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["3.1", "4.1", "5.1", "6.1", "8.3", "8.4", "8.5", "9.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "4.2", "5.2", "6.2", "8.1", "8.2", "9.2", "9.3", "9.4", "9.5"] },
    { "id": 5, "tasks": ["8.6", "8.7", "8.8", "8.9", "10.1", "10.2"] }
  ]
}
```

## Workflow Complete

This requirements-first spec workflow for `api-query-performance-optimization` is complete. The three artifacts — `requirements.md`, `design.md`, and `tasks.md` — are in place under `.kiro/specs/api-query-performance-optimization/`.

To begin implementation, open `tasks.md` and click **Start task** next to the task you want to execute. Tasks are structured so you can execute them sequentially or let the dependency graph above drive parallel execution. Optional test sub-tasks (marked `*`) can be skipped for a faster MVP and revisited later.
