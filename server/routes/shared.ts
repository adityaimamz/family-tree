import { prisma } from "../db.js";

export const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export const asNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

export const asNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

export const asRouteParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export const safeFilename = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replace(/\.[^.]+$/, "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "")
    .slice(0, 72) || "photo";

export interface SpaceSummary {
  membersCount: number;
  generationsCount: number;
  branchesCount: number;
  nuclearFamiliesCount: number;
  timelineCount: number;
  galleryCount: number;
  storiesCount: number;
}

export const computeSpaceSummary = async (familySpaceId: string): Promise<SpaceSummary> => {
  const [
    membersCount,
    generationRows,
    branchesCount,
    nuclearFamiliesCount,
    timelineCount,
    galleryCount,
    storiesCount,
  ] = await prisma.$transaction([
    prisma.familyMember.count({ where: { familySpaceId } }),
    prisma.familyMember.findMany({
      where: { familySpaceId },
      select: { generation: true },
      distinct: ["generation"],
    }),
    prisma.familyBranch.count({ where: { familySpaceId } }),
    prisma.nuclearFamily.count({ where: { familySpaceId } }),
    prisma.timelineEvent.count({ where: { familySpaceId } }),
    prisma.galleryItem.count({ where: { familySpaceId } }),
    prisma.story.count({ where: { familySpaceId } }),
  ]);

  return {
    membersCount,
    generationsCount: generationRows.length,
    branchesCount,
    nuclearFamiliesCount,
    timelineCount,
    galleryCount,
    storiesCount,
  };
};

// Prisma select shape for fetching tree members with all required fields
export const treeMemberSelect = {
  slugId: true,
  fullName: true,
  displayName: true,
  gender: true,
  generation: true,
  familyBranchId: true,
  fatherId: true,
  motherId: true,
  spouseIds: true,
  formerSpouseIds: true,
  childrenIds: true,
  siblingIds: true,
  parentFamilyId: true,
  nuclearFamilyIds: true,
  birthDate: true,
  marriageDate: true,
  deathDate: true,
  isDeceased: true,
  deceasedLabel: true,
  photo: true,
  statusLabel: true,
  relationshipToRoot: true,
} as const;

// Maps a treeMemberSelect-shaped row to the Tree_Data_Endpoint member response
export const mapTreeMember = (member: any) => ({
  id: member.slugId,
  fullName: member.fullName,
  displayName: member.displayName,
  gender: member.gender,
  generation: member.generation,
  familyBranch: member.familyBranchId,
  fatherId: member.fatherId,
  motherId: member.motherId,
  spouseIds: member.spouseIds ?? [],
  formerSpouseIds: member.formerSpouseIds ?? [],
  childrenIds: member.childrenIds ?? [],
  siblingIds: member.siblingIds ?? [],
  parentFamilyId: member.parentFamilyId,
  nuclearFamilyIds: member.nuclearFamilyIds ?? [],
  birthDate: member.birthDate,
  marriageDate: member.marriageDate,
  deathDate: member.deathDate,
  isDeceased: member.isDeceased,
  deceasedLabel: member.deceasedLabel,
  photo: member.photo,
  statusLabel: member.statusLabel,
  relationshipToRoot: member.relationshipToRoot,
});

// Map branch slug to human-readable name
const mapBranchToName = (slug: string | null): string => {
  if (!slug) return "Not recorded";
  if (slug === "garis-utama") return "Main Line";
  if (slug === "cabang-kedua") return "Second Branch";
  if (slug === "cabang-ketiga") return "Third Branch";
  return slug;
};

// Legacy mapMember for Bootstrap_Endpoint (includes birthPlace, biography, notes)
export const mapMember = (member: any) => ({
  id: member.slugId,
  fullName: member.fullName,
  displayName: member.displayName,
  gender: member.gender,
  generation: member.generation,
  familyBranch: mapBranchToName(member.familyBranchId),
  fatherId: member.fatherId,
  motherId: member.motherId,
  spouseIds: member.spouseIds ?? [],
  formerSpouseIds: member.formerSpouseIds ?? [],
  childrenIds: member.childrenIds ?? [],
  siblingIds: member.siblingIds ?? [],
  parentFamilyId: member.parentFamilyId,
  nuclearFamilyIds: member.nuclearFamilyIds ?? [],
  birthDate: member.birthDate,
  marriageDate: member.marriageDate,
  deathDate: member.deathDate,
  isDeceased: member.isDeceased,
  deceasedLabel: member.deceasedLabel,
  birthPlace: member.birthPlace,
  biography: member.biography,
  notes: member.notes,
  photo: member.photo,
  statusLabel: member.statusLabel,
  relationshipToRoot: member.relationshipToRoot,
});

export const mapBranch = (branch: any) => ({
  id: branch.slugId,
  name: branch.name,
  headMemberIds: branch.headMemberIds ?? [],
  spouseId: branch.spouseId,
  description: branch.description,
  summary: branch.summary,
  memberIds: branch.memberIds ?? [],
  color: branch.color,
});

export const mapNuclearFamily = (family: any) => ({
  id: family.slugId,
  name: family.name,
  parentIds: family.parentIds ?? [],
  childrenIds: family.childrenIds ?? [],
  branchId: family.branchId,
  summary: family.summary,
});

export const mapTimelineEvent = (event: any) => ({
  id: event.slugId,
  year: event.year,
  type: event.type,
  title: event.title,
  description: event.description,
  relatedMemberIds: event.relatedMemberIds ?? [],
  memberIds: event.memberIds ?? [],
  photo: event.photo,
  isAutomatic: event.isAutomatic,
});

export const mapGalleryItem = (item: any) => ({
  id: item.slugId,
  title: item.title,
  date: item.date,
  year: item.year,
  event: item.event,
  familyGroup: item.familyGroup,
  description: item.description,
  image: item.image,
});

export const mapStory = (story: any) => ({
  id: story.slugId,
  title: story.title,
  content: story.content,
  status: story.status,
  relatedMemberIds: (story.members ?? []).map((link: any) => link.member?.slugId).filter(Boolean),
  sourceNoteIds: (story.sourceNotes ?? []).map((link: any) => link.sourceNote?.slugId).filter(Boolean),
  createdAt: story.createdAt,
  updatedAt: story.updatedAt,
});

export const mapSourceNote = (note: any) => ({
  id: note.slugId,
  title: note.title,
  content: note.content,
  type: note.type,
  relatedMemberIds: (note.memberLinks ?? []).map((link: any) => link.member?.slugId).filter(Boolean),
  storyIds: (note.storyLinks ?? []).map((link: any) => link.story?.slugId).filter(Boolean),
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});

export const timelineDataFromBody = (event: any, fallbackId?: string) => ({
  slugId: event.id || fallbackId,
  year: event.year ?? "",
  type: event.type ?? "Peristiwa Penting",
  title: event.title ?? "",
  description: event.description ?? "",
  relatedMemberIds: asStringArray(event.relatedMemberIds),
  memberIds: asStringArray(event.memberIds),
  photo: asNullableString(event.photo),
  isAutomatic: Boolean(event.isAutomatic),
});

export const galleryDataFromBody = (item: any, fallbackId?: string) => ({
  slugId: item.id || fallbackId,
  title: item.title ?? "",
  date: item.date ?? "",
  year: item.year ?? "",
  event: asNullableString(item.event),
  familyGroup: item.familyGroup ?? "",
  description: item.description ?? "",
  image: item.image ?? "",
});

export const memberDataFromBody = (member: any) => ({
  slugId: member.id,
  fullName: member.fullName ?? "",
  displayName: member.displayName ?? member.fullName ?? "",
  gender: member.gender ?? "unknown",
  generation: Number(member.generation ?? 0),
  familyBranchId: member.familyBranch,
  fatherId: asNullableString(member.fatherId),
  motherId: asNullableString(member.motherId),
  spouseIds: asStringArray(member.spouseIds),
  formerSpouseIds: asStringArray(member.formerSpouseIds),
  childrenIds: asStringArray(member.childrenIds),
  siblingIds: asStringArray(member.siblingIds),
  parentFamilyId: asNullableString(member.parentFamilyId),
  nuclearFamilyIds: asStringArray(member.nuclearFamilyIds),
  birthDate: asNullableString(member.birthDate),
  marriageDate: asNullableString(member.marriageDate),
  deathDate: asNullableString(member.deathDate),
  isDeceased: Boolean(member.isDeceased),
  deceasedLabel: asNullableString(member.deceasedLabel),
  birthPlace: asNullableString(member.birthPlace),
  biography: member.biography ?? "",
  notes: member.notes ?? "",
  photo: asNullableString(member.photo),
  statusLabel: member.statusLabel ?? "",
  relationshipToRoot: member.relationshipToRoot ?? "",
});

export const branchDataFromBody = (branch: any, fallbackId?: string) => ({
  slugId: branch.id || fallbackId,
  name: branch.name ?? "",
  headMemberIds: asStringArray(branch.headMemberIds),
  spouseId: asNullableString(branch.spouseId),
  description: branch.description ?? "",
  summary: asNullableString(branch.summary),
  memberIds: asStringArray(branch.memberIds),
  color: asNullableString(branch.color),
});

export const storyDataFromBody = (story: any, fallbackId?: string) => ({
  slugId: story.id || fallbackId,
  title: story.title ?? "",
  content: story.content ?? "",
  status: story.status ?? "draft",
  relatedMemberIds: asStringArray(story.relatedMemberIds),
  sourceNoteIds: asStringArray(story.sourceNoteIds),
});

export const sourceNoteDataFromBody = (note: any, fallbackId?: string) => ({
  slugId: note.id || fallbackId,
  title: note.title ?? "",
  content: note.content ?? "",
  type: note.type ?? "note",
  relatedMemberIds: asStringArray(note.relatedMemberIds),
  storyIds: asStringArray(note.storyIds),
});

export const mapFamilySpace = (space: any) => ({
  id: space.id,
  slug: space.slug,
  name: space.name,
  description: space.description ?? null,
});

export const mapSpaceRecordCounts = (space: any) => ({
  members: space._count?.members ?? 0,
  timeline: space._count?.timelineEvents ?? 0,
  photos: space._count?.galleryItems ?? 0,
  stories: space._count?.stories ?? 0,
});

export const mapFamilySpaceWithCounts = (space: any) => ({
  ...mapFamilySpace(space),
  recordCounts: mapSpaceRecordCounts(space),
});

export const mapMembership = (membership: any) => ({
  role: membership.role,
  space: mapFamilySpaceWithCounts(membership.familySpace),
});

export const mapCurrentMembership = (membership: any, familySpace: any) => ({
  role: membership.role,
  space: mapFamilySpace(membership.familySpace ?? familySpace),
});

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "")
    .slice(0, 72);

// ============================================
// Pagination Types and Parser
// ============================================

export type PaginationParams =
  | { mode: "legacy" } // no page, no pageSize
  | { mode: "paged"; page: number; pageSize: number }; // at least one of them provided

type PaginationResult = PaginationParams | { error: string };

/**
 * Parse pagination query parameters from Express req.query
 * - Returns { mode: "legacy" } when both page and pageSize are absent (undefined)
 * - Returns { mode: "paged", page, pageSize } when at least one is present
 * - Validates that page and pageSize are positive integers if provided
 * - Clamps pageSize to [1, 100] range
 * - Defaults to page=1 if not provided, pageSize=20 if not provided
 * - Returns { error: string } for invalid input
 */
export const parsePagination = (query: Record<string, unknown>): PaginationResult => {
  const page = query.page;
  const pageSize = query.pageSize;

  const hasPage = page !== undefined;
  const hasPageSize = pageSize !== undefined;

  // If neither is present, return legacy mode
  if (!hasPage && !hasPageSize) {
    return { mode: "legacy" };
  }

  // At least one is present - paged mode
  let parsedPage: number;
  let parsedPageSize: number;

  // Parse and validate page
  if (hasPage) {
    if (typeof page === "string") {
      const parsed = Number(page);
      if (!Number.isInteger(parsed)) {
        return { error: "page must be an integer" };
      }
      if (parsed <= 0) {
        return { error: "page must be a positive integer" };
      }
      parsedPage = parsed;
    } else {
      return { error: "page must be a string" };
    }
  } else {
    parsedPage = 1; // default
  }

  // Parse and validate pageSize
  if (hasPageSize) {
    if (typeof pageSize === "string") {
      const parsed = Number(pageSize);
      if (!Number.isInteger(parsed)) {
        return { error: "pageSize must be an integer" };
      }
      if (parsed <= 0) {
        return { error: "pageSize must be a positive integer" };
      }
      parsedPageSize = Math.min(100, Math.max(1, parsed)); // clamp to [1, 100]
    } else {
      return { error: "pageSize must be a string" };
    }
  } else {
    parsedPageSize = 20; // default
  }

  return { mode: "paged", page: parsedPage, pageSize: parsedPageSize };
};

// ============================================
// Narrowed Include Shapes for List Endpoints
// ============================================

/**
 * Frozen constant with narrowed nested-select shape for Stories list endpoint.
 * Only fetches the slugId from related members and source notes.
 */
export const storyListInclude = {
  members: { select: { member: { select: { slugId: true } } } },
  sourceNotes: { select: { sourceNote: { select: { slugId: true } } } },
} as const;

/**
 * Frozen constant with narrowed nested-select shape for Source Notes list endpoint.
 * Only fetches the slugId from related members and stories.
 */
export const sourceNoteListInclude = {
  memberLinks: { select: { member: { select: { slugId: true } } } },
  storyLinks: { select: { story: { select: { slugId: true } } } },
} as const;