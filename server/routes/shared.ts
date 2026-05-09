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

export const mapMember = (member: any) => ({
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
