# Requirements Document

## Introduction

This feature improves API query performance across the WarisanAI (FamilySpace) server without altering product behavior. The work targets three areas: (1) reducing the number of HTTP round-trips the client must make during app shell and Family Tree load, (2) reducing payload size by replacing broad Prisma `include` with narrow `select` shapes, and (3) making heavy list endpoints pageable so large FamilySpaces stay responsive.

All changes MUST preserve existing route contracts so current clients keep working without modification, MUST preserve `familySpaceId` scoping on every query, and MUST preserve existing authentication and role checks. The build (`npm run build`) and Prisma schema validation (`npx prisma validate`) MUST continue to pass after every change.

## Glossary

- **API_Server**: The Express application defined in `server/app.ts` that registers all routes under `server/routes/`.
- **FamilySpace**: A tenant isolation boundary. Every domain row (member, branch, nuclear family, timeline, gallery, story, source note, relationship history) is scoped by `familySpaceId`.
- **FamilySpace_Member**: A user who holds a `FamilyMembership` row for the FamilySpace identified by `spaceSlug` and therefore passes `requireSpaceMembership`.
- **Platform_Admin**: A user whose `AppUser.platformRole` is `platform_admin` and who therefore passes `requirePlatformAdmin`.
- **Bootstrap_Endpoint**: The new route `GET /api/spaces/:spaceSlug/bootstrap` that returns app-shell data in a single response.
- **Tree_Data_Endpoint**: The new route `GET /api/spaces/:spaceSlug/tree-data` that returns only the data needed to render the Family Tree view.
- **Stories_List_Endpoint**: `GET /api/spaces/:spaceSlug/stories`.
- **Source_Notes_List_Endpoint**: `GET /api/spaces/:spaceSlug/source-notes`.
- **Gallery_List_Endpoint**: `GET /api/spaces/:spaceSlug/gallery`.
- **Timeline_List_Endpoint**: `GET /api/spaces/:spaceSlug/timeline`.
- **Platform_Users_Endpoint**: `GET /api/platform/users`.
- **Platform_Spaces_Endpoint**: `GET /api/platform/spaces`.
- **Heavy_List_Endpoint**: Any of Stories_List_Endpoint, Source_Notes_List_Endpoint, Gallery_List_Endpoint, Timeline_List_Endpoint, Platform_Users_Endpoint, Platform_Spaces_Endpoint.
- **Minimal_Reference_Shape**: A Prisma `select` projection that returns only `{ slugId }` (plus any existing id-like field the current response already exposes) of a related record — never biography, notes, content, or other large columns.
- **Response_Shape**: The JSON body structure returned by an endpoint, including field names, nesting, and types. Changing the Response_Shape is considered a breaking change.
- **Relationship_Cache**: The `RelationshipExplanationHistory` table plus the upsert logic in `server/routes/aiRoutes.ts` that stores previously computed relationship explanations.
- **Backward_Compatible_Default**: Behavior where an endpoint, when called with no pagination query parameters, returns a response whose shape and contents are indistinguishable from the current response for existing callers.
- **Acceptance_Check**: The pair of commands `npm run build` and `npx prisma validate`, both of which MUST exit with status 0.

## Requirements

### Requirement 1: Space Bootstrap Endpoint

**User Story:** As an authenticated FamilySpace member, I want a single bootstrap request that returns the data needed to hydrate the app shell, so that opening a space does not trigger multiple parallel requests for space, membership, and summary data.

#### Acceptance Criteria

1. THE API_Server SHALL expose a route `GET /api/spaces/:spaceSlug/bootstrap`.
2. WHEN an unauthenticated request is made to the Bootstrap_Endpoint, THE API_Server SHALL reject the request with the same 401 behavior used by other space-scoped read routes.
3. IF the caller is authenticated but is not a FamilySpace_Member of `spaceSlug`, THEN THE API_Server SHALL respond with HTTP 403 and a JSON error body consistent with `requireSpaceMembership`.
4. IF `spaceSlug` does not resolve to an existing FamilySpace, THEN THE API_Server SHALL respond with HTTP 404 and a JSON error body consistent with `requireSpaceMembership`.
5. WHEN the Bootstrap_Endpoint is called by a FamilySpace_Member, THE API_Server SHALL return a single JSON object containing the current space, the caller's membership, and the same counts currently returned by `GET /api/spaces/:spaceSlug/summary`.
6. THE Bootstrap_Endpoint response SHALL include the `space` field using the shape produced by `mapFamilySpace` and the `membership` field using the shape produced by `mapCurrentMembership`, matching the shapes already returned by `GET /api/spaces/:spaceSlug`.
7. THE Bootstrap_Endpoint response SHALL include a `summary` field whose keys and types match the existing `GET /api/spaces/:spaceSlug/summary` response.
8. THE Bootstrap_Endpoint SHALL scope every underlying Prisma query by the resolved `familySpaceId`.
9. THE Bootstrap_Endpoint SHALL NOT include biography, notes, story content, source-note content, timeline description, or gallery image binaries in its response.
10. WHEN the Bootstrap_Endpoint is requested with the query parameter `include=coreData`, THE API_Server SHALL additionally include `members`, `branches`, and `nuclearFamilies` arrays using the same shapes returned by the Tree_Data_Endpoint.
11. WHEN the Bootstrap_Endpoint is requested without `include=coreData`, THE API_Server SHALL NOT return any `members`, `branches`, or `nuclearFamilies` array in the response body.

### Requirement 2: Tree Data Endpoint

**User Story:** As an authenticated FamilySpace member, I want a single tree-data request that returns only the records needed to render the Family Tree, so that the initial tree render does not download biographies, notes, timelines, galleries, or stories.

#### Acceptance Criteria

1. THE API_Server SHALL expose a route `GET /api/spaces/:spaceSlug/tree-data`.
2. THE Tree_Data_Endpoint SHALL apply the same authentication and membership middleware chain used by `GET /api/spaces/:spaceSlug/members`.
3. IF the caller is authenticated but is not a FamilySpace_Member of `spaceSlug`, THEN THE API_Server SHALL respond with HTTP 403.
4. WHEN the Tree_Data_Endpoint is called by a FamilySpace_Member, THE API_Server SHALL return a JSON object with keys `members`, `branches`, and `nuclearFamilies`.
5. THE Tree_Data_Endpoint SHALL return each member using only the fields required by the Family Tree view: `id`, `fullName`, `displayName`, `gender`, `generation`, `familyBranch`, `fatherId`, `motherId`, `spouseIds`, `formerSpouseIds`, `childrenIds`, `siblingIds`, `parentFamilyId`, `nuclearFamilyIds`, `birthDate`, `marriageDate`, `deathDate`, `isDeceased`, `deceasedLabel`, `photo`, `statusLabel`, and `relationshipToRoot`.
6. THE Tree_Data_Endpoint SHALL NOT include `biography`, `notes`, or `birthPlace` for any member.
7. THE Tree_Data_Endpoint SHALL return each branch using the same shape produced by `mapBranch`.
8. THE Tree_Data_Endpoint SHALL return each nuclear family using the same shape produced by `mapNuclearFamily`.
9. THE Tree_Data_Endpoint SHALL scope every underlying Prisma query by the resolved `familySpaceId`.
10. THE Tree_Data_Endpoint SHALL order members by `generation` ascending then `fullName` ascending, matching the existing `GET /api/spaces/:spaceSlug/members` ordering.

### Requirement 3: Optimize Stories List Query

**User Story:** As a FamilySpace member browsing stories, I want the stories list response to avoid transferring full related member and source-note rows, so that the list loads faster and uses less bandwidth.

#### Acceptance Criteria

1. WHEN Stories_List_Endpoint is called, THE API_Server SHALL use Prisma `select` (or `include` with nested `select`) so that each related `StoryMember` returns only the member's `slugId` and each related `StorySourceNote` returns only the source note's `slugId`.
2. THE Stories_List_Endpoint SHALL NOT include `biography`, `notes`, `content`, or any other non-`slugId` column from joined `FamilyMember` rows.
3. THE Stories_List_Endpoint SHALL NOT include `content` or any other non-`slugId` column from joined `SourceNote` rows.
4. THE Stories_List_Endpoint Response_Shape SHALL remain identical to the current shape produced by `mapStory`, including the `relatedMemberIds` and `sourceNoteIds` arrays of slug strings.
5. THE Stories_List_Endpoint SHALL continue to scope every underlying Prisma query by `familySpaceId`.
6. WHERE a story has no related members, THE Stories_List_Endpoint SHALL return `relatedMemberIds: []`.
7. WHERE a story has no related source notes, THE Stories_List_Endpoint SHALL return `sourceNoteIds: []`.

### Requirement 4: Optimize Source Notes List Query

**User Story:** As a FamilySpace member viewing source notes, I want the source-notes list response to avoid transferring full related member and story rows, so that the list loads faster and uses less bandwidth.

#### Acceptance Criteria

1. WHEN Source_Notes_List_Endpoint is called, THE API_Server SHALL use Prisma `select` (or `include` with nested `select`) so that each related `SourceNoteMember` returns only the member's `slugId` and each related `StorySourceNote` returns only the story's `slugId`.
2. THE Source_Notes_List_Endpoint SHALL NOT include `biography`, `notes`, or any other non-`slugId` column from joined `FamilyMember` rows.
3. THE Source_Notes_List_Endpoint SHALL NOT include `content` or any other non-`slugId` column from joined `Story` rows.
4. THE Source_Notes_List_Endpoint Response_Shape SHALL remain identical to the current shape produced by `mapSourceNote`, including the `relatedMemberIds` and `storyIds` arrays of slug strings.
5. THE Source_Notes_List_Endpoint SHALL continue to scope every underlying Prisma query by `familySpaceId`.
6. WHERE a source note has no related members, THE Source_Notes_List_Endpoint SHALL return `relatedMemberIds: []`.
7. WHERE a source note has no related stories, THE Source_Notes_List_Endpoint SHALL return `storyIds: []`.

### Requirement 5: Pagination For Heavy List Endpoints

**User Story:** As a FamilySpace member of a large space, I want heavy list endpoints to support paging so that a single request does not load every gallery item, timeline event, story, or source note at once.

#### Acceptance Criteria

1. THE API_Server SHALL accept the query parameters `page` and `pageSize` on each Heavy_List_Endpoint.
2. WHEN a Heavy_List_Endpoint is called without any pagination query parameters, THE API_Server SHALL return a Backward_Compatible_Default response whose body is byte-for-byte identical to the pre-change response (a bare JSON array in the same order with the same fields).
3. WHEN a Heavy_List_Endpoint is called with `page` or `pageSize`, THE API_Server SHALL return a JSON object with keys `items`, `page`, `pageSize`, `total`, and `hasMore`, where `items` is the page slice using the same per-item shape as the Backward_Compatible_Default.
4. WHEN `page` is provided, THE API_Server SHALL treat it as a 1-based page index and SHALL default `pageSize` to 20 if `pageSize` is not provided.
5. WHEN `pageSize` is provided, THE API_Server SHALL clamp it to the inclusive range [1, 100] and SHALL default `page` to 1 if `page` is not provided.
6. IF `page` or `pageSize` is present but not a positive integer, THEN THE API_Server SHALL respond with HTTP 400 and a JSON error body describing the invalid parameter.
7. THE API_Server SHALL apply pagination using Prisma `skip` and `take` derived from `page` and `pageSize`, and SHALL compute `total` using a `count` with the same `where` clause as the list query.
8. THE API_Server SHALL preserve the existing sort order of each Heavy_List_Endpoint when pagination is applied.
9. THE API_Server SHALL scope every paginated Heavy_List_Endpoint query by the appropriate tenant boundary: Stories, Source Notes, Gallery, and Timeline endpoints by `familySpaceId`; Platform_Users_Endpoint and Platform_Spaces_Endpoint by `requirePlatformAdmin`.

### Requirement 6: Relationship Explanation Cache Safety

**User Story:** As a FamilySpace member viewing an AI relationship explanation, I want the cached response to reflect the current family graph, so that I never see a stale explanation after relationship links change.

#### Acceptance Criteria

1. THE Relationship_Cache SHALL continue to return stored explanations only when the stored entry is consistent with the current member relationship graph for the FamilySpace.
2. WHEN a cached entry for `(familySpaceId, fromMemberId, toMemberId)` exists and the underlying `FamilyMember` rows referenced by its `pathMemberIds` still exist with unchanged `fatherId`, `motherId`, `spouseIds`, `formerSpouseIds`, `childrenIds`, and `siblingIds`, THE API_Server SHALL return the cached explanation with `cached: true`.
3. IF any member along the stored `pathMemberIds` no longer exists in the FamilySpace, THEN THE API_Server SHALL bypass the cache and recompute the explanation.
4. IF any member along the stored `pathMemberIds` has a changed `fatherId`, `motherId`, `spouseIds`, `formerSpouseIds`, `childrenIds`, or `siblingIds` relative to the stored result, THEN THE API_Server SHALL bypass the cache and recompute the explanation.
5. WHEN the client sends `refresh: true` in the request body, THE API_Server SHALL bypass the cache regardless of consistency state.
6. WHEN the Relationship_Cache is bypassed, THE API_Server SHALL upsert a new `RelationshipExplanationHistory` row for `(familySpaceId, fromMemberId, toMemberId)` with the recomputed result.
7. THE Relationship_Cache SHALL continue to increment `viewCount` and update `lastViewedAt` for the matching row whenever a cached entry is returned.
8. THE API_Server SHALL NOT widen the Relationship_Cache lookup across FamilySpace boundaries; every lookup SHALL include `familySpaceId` in the `where` clause.

### Requirement 7: Minimal `select` Projections

**User Story:** As an operator of the WarisanAI API, I want endpoints to fetch only the columns they actually serialize, so that unnecessary columns stop crossing the database boundary.

#### Acceptance Criteria

1. WHEN a route already has a `map*` function in `server/routes/shared.ts`, THE API_Server SHALL use a Prisma `select` that covers only the columns consumed by that `map*` function for each affected list query.
2. WHEN a route joins a related model only to read `slugId`, THE API_Server SHALL use `select: { slugId: true }` on that relation rather than `include` of the full related record.
3. THE Stories_List_Endpoint, Source_Notes_List_Endpoint, Platform_Users_Endpoint, and Platform_Spaces_Endpoint SHALL NOT select related rows' `content`, `biography`, `notes`, or `description` columns when those columns are not part of the Response_Shape.
4. WHERE an endpoint's existing Response_Shape requires all columns of a row (for example, `GET /api/spaces/:spaceSlug/members`), THE API_Server SHALL keep the current full-row fetch to remain backward compatible.
5. THE API_Server SHALL keep every `findMany`, `findUnique`, and `count` call scoped by `familySpaceId` (or `userId_familySpaceId` for membership lookups) after the `select` refactor.

### Requirement 8: Acceptance And Compatibility Guarantees

**User Story:** As a maintainer merging this change, I want strict guarantees that the build still passes, the schema still validates, existing routes still behave the same, and FamilySpace privacy is still enforced, so that I can ship the optimization without a regression.

#### Acceptance Criteria

1. THE Acceptance_Check `npm run build` SHALL exit with status 0 after all changes are applied.
2. THE Acceptance_Check `npx prisma validate` SHALL exit with status 0 after all changes are applied.
3. THE API_Server SHALL continue to serve every existing route listed in `server/routes/index.ts` with its current HTTP method, path, middleware chain, and Response_Shape (for default calls without the new pagination parameters).
4. THE API_Server SHALL keep `requireAuth`, `loadAppUser`, `requireSpaceMembership`, `requireSpaceRole`, and `requirePlatformAdmin` on every route that currently uses them, and SHALL apply the equivalent chain on the new Bootstrap_Endpoint and Tree_Data_Endpoint.
5. THE API_Server SHALL NOT expose any FamilySpace-scoped data (members, branches, nuclear families, timeline events, gallery items, stories, source notes, relationship history) through any route that does not pass `requireSpaceMembership` or `requirePlatformAdmin`.
6. THE API_Server SHALL NOT return data belonging to FamilySpace A in any response served for a request scoped to FamilySpace B.
7. WHERE a Heavy_List_Endpoint is called without the new query parameters, THE API_Server SHALL produce a response whose JSON body matches the pre-change response for the same database state.
8. THE API_Server SHALL NOT remove or rename any field currently present in any endpoint's Response_Shape.
