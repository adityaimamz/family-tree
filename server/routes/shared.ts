import { randomInt } from "node:crypto";
import { prisma } from "../db.js";
import { HttpError } from "../http/error.js";
import { clampString, isHttpsUrl, limitedStringArray } from "../security.js";

export const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export const asNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

export const asNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

export const asRouteParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

const badRequest = (message: string): never => {
  throw new HttpError(400, message);
};

const boundedString = (value: unknown, maxLength: number, field: string, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "string") return fallback;
  if (value.length > maxLength) badRequest(`${field} must be ${maxLength} characters or fewer.`);
  return value;
};

const boundedNullableString = (value: unknown, maxLength: number, field: string) => {
  if (value === undefined || value === null || value === "") return null;
  const text = clampString(value, maxLength);
  if (text === null) badRequest(`${field} must be ${maxLength} characters or fewer.`);
  return text;
};

const httpsUrlOrNull = (value: unknown, field: string) => {
  const text = boundedNullableString(value, 2048, field);
  if (text === null) return null;
  if (!isHttpsUrl(text)) badRequest(`${field} must be a valid HTTPS URL.`);
  return text;
};

const safeIdArray = (value: unknown, field: string) => {
  if (!Array.isArray(value)) return [];
  if (value.length > 200) badRequest(`${field} can contain at most 200 items.`);
  return limitedStringArray(value, 200, 128);
};

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
  // Feature: ai-studio-experience (additive).
  // slugId of the first member (ordered by full name) whose `notes`
  // field is non-empty, or `null` when no member has notes. Used by
  // the Dashboard AI Readiness Block to deep-link into the right
  // member profile without loading the full members list.
  memberWithNotesId?: string | null;
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
    memberWithNotes,
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
    prisma.familyMember.findFirst({
      where: { familySpaceId, notes: { not: "" } },
      select: { slugId: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  return {
    membersCount,
    generationsCount: generationRows.length,
    branchesCount,
    nuclearFamiliesCount,
    timelineCount,
    galleryCount,
    storiesCount,
    memberWithNotesId: memberWithNotes?.slugId ?? null,
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
  origin: story.origin,
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
  slugId: boundedString(event.id || fallbackId, 128, "Timeline event id"),
  year: boundedString(event.year, 64, "Timeline year"),
  type: boundedString(event.type, 80, "Timeline type", "Peristiwa Penting"),
  title: boundedString(event.title, 200, "Timeline title"),
  description: boundedString(event.description, 4000, "Timeline description"),
  relatedMemberIds: safeIdArray(event.relatedMemberIds, "relatedMemberIds"),
  memberIds: safeIdArray(event.memberIds, "memberIds"),
  photo: httpsUrlOrNull(event.photo, "Timeline photo"),
  isAutomatic: Boolean(event.isAutomatic),
});

export const galleryDataFromBody = (item: any, fallbackId?: string) => ({
  slugId: boundedString(item.id || fallbackId, 128, "Gallery item id"),
  title: boundedString(item.title, 200, "Gallery title"),
  date: boundedString(item.date, 80, "Gallery date"),
  year: boundedString(item.year, 64, "Gallery year"),
  event: boundedNullableString(item.event, 200, "Gallery event"),
  familyGroup: boundedString(item.familyGroup, 200, "Gallery family group"),
  description: boundedString(item.description, 4000, "Gallery description"),
  image: httpsUrlOrNull(item.image, "Gallery image") ?? "",
});

export const memberDataFromBody = (member: any) => ({
  slugId: boundedString(member.id, 128, "Member id"),
  fullName: boundedString(member.fullName, 200, "Full name"),
  displayName: boundedString(member.displayName ?? member.fullName, 200, "Display name"),
  gender: boundedString(member.gender, 40, "Gender", "unknown"),
  generation: Number(member.generation ?? 0),
  familyBranchId: boundedString(member.familyBranch, 128, "Family branch"),
  fatherId: boundedNullableString(member.fatherId, 128, "fatherId"),
  motherId: boundedNullableString(member.motherId, 128, "motherId"),
  spouseIds: safeIdArray(member.spouseIds, "spouseIds"),
  formerSpouseIds: safeIdArray(member.formerSpouseIds, "formerSpouseIds"),
  childrenIds: safeIdArray(member.childrenIds, "childrenIds"),
  siblingIds: safeIdArray(member.siblingIds, "siblingIds"),
  parentFamilyId: boundedNullableString(member.parentFamilyId, 128, "parentFamilyId"),
  nuclearFamilyIds: safeIdArray(member.nuclearFamilyIds, "nuclearFamilyIds"),
  birthDate: boundedNullableString(member.birthDate, 80, "Birth date"),
  marriageDate: boundedNullableString(member.marriageDate, 80, "Marriage date"),
  deathDate: boundedNullableString(member.deathDate, 80, "Death date"),
  isDeceased: Boolean(member.isDeceased),
  deceasedLabel: boundedNullableString(member.deceasedLabel, 80, "Deceased label"),
  birthPlace: boundedNullableString(member.birthPlace, 200, "Birth place"),
  biography: boundedString(member.biography, 8000, "Biography"),
  notes: boundedString(member.notes, 8000, "Notes"),
  photo: httpsUrlOrNull(member.photo, "Member photo"),
  statusLabel: boundedString(member.statusLabel, 80, "Status label"),
  relationshipToRoot: boundedString(member.relationshipToRoot, 160, "Relationship to root"),
});

export const branchDataFromBody = (branch: any, fallbackId?: string) => ({
  slugId: boundedString(branch.id || fallbackId, 128, "Branch id"),
  name: boundedString(branch.name, 200, "Branch name"),
  headMemberIds: safeIdArray(branch.headMemberIds, "headMemberIds"),
  spouseId: boundedNullableString(branch.spouseId, 128, "spouseId"),
  description: boundedString(branch.description, 4000, "Branch description"),
  summary: boundedNullableString(branch.summary, 4000, "Branch summary"),
  memberIds: safeIdArray(branch.memberIds, "memberIds"),
  color: boundedNullableString(branch.color, 80, "Branch color"),
});

export const storyDataFromBody = (story: any, fallbackId?: string) => ({
  slugId: boundedString(story.id || fallbackId, 128, "Story id"),
  title: boundedString(story.title, 200, "Story title"),
  content: boundedString(story.content, 12000, "Story content"),
  origin:
    story.origin === "manual" || story.origin === "ai_biography" || story.origin === "ai_timeline"
      ? story.origin
      : "manual",
  relatedMemberIds: safeIdArray(story.relatedMemberIds, "relatedMemberIds"),
  sourceNoteIds: safeIdArray(story.sourceNoteIds, "sourceNoteIds"),
});

export const sourceNoteDataFromBody = (note: any, fallbackId?: string) => ({
  slugId: boundedString(note.id || fallbackId, 128, "Source note id"),
  title: boundedString(note.title, 200, "Source note title"),
  content: boundedString(note.content, 12000, "Source note content"),
  type:
    note.type === "note" ||
    note.type === "photo_context" ||
    note.type === "interview" ||
    note.type === "document" ||
    note.type === "chat"
      ? note.type
      : "note",
  relatedMemberIds: safeIdArray(note.relatedMemberIds, "relatedMemberIds"),
  storyIds: safeIdArray(note.storyIds, "storyIds"),
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
  displayName: membership.displayName ?? null,
  avatarUrl: membership.avatarUrl ?? null,
  space: mapFamilySpaceWithCounts(membership.familySpace),
});

export const mapCurrentMembership = (membership: any, familySpace: any) => ({
  role: membership.role,
  displayName: membership.displayName ?? null,
  avatarUrl: membership.avatarUrl ?? null,
  space: mapFamilySpace(membership.familySpace ?? familySpace),
});

// Feature: invite-family
// Charset excludes I, O, 0, 1 to avoid visual ambiguity when typing codes manually.
const INVITE_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_CODE_HALF_LENGTH = 4;

const randomInviteHalf = () => {
  let out = "";
  for (let index = 0; index < INVITE_CODE_HALF_LENGTH; index += 1) {
    const charIndex = randomInt(0, INVITE_CODE_CHARSET.length);
    out += INVITE_CODE_CHARSET[charIndex];
  }
  return out;
};

/** Generate a random human-friendly invite code in the form `XXXX-XXXX`. */
export const generateInviteCode = () => `${randomInviteHalf()}-${randomInviteHalf()}`;

export const mapInvite = (invite: any) => ({
  id: invite.id,
  code: invite.code,
  role: invite.role,
  maxUses: invite.maxUses ?? null,
  usedCount: invite.usedCount ?? 0,
  expiresAt: invite.expiresAt ?? null,
  revokedAt: invite.revokedAt ?? null,
  createdAt: invite.createdAt,
  updatedAt: invite.updatedAt,
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
