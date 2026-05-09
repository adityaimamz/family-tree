import type { FamilyBranch, FamilyMember, FamilySpace } from "../types/family";

export const spaceLabels = {
  allMembers: "All members",
  allGenerations: "All generations",
  allBranches: "All branches",
  deceased: "Deceased",
  membersFound: "members found",
  memberBiographyFallback: "does not have a biography yet.",
  importMembersHelp: "Paste an array of member records to import into this FamilySpace.",
  emptyGalleryTitle: "No photo memories yet.",
  emptyGalleryDescription: "Add the first family photo with a date, event, and remembered context.",
  emptyTimelineTitle: "No timeline events yet.",
  relationshipPlaceholder: "Example: Grandchild, spouse, cousin, or family founder",
  statusOptions: [
    "Family Founder",
    "Main Line",
    "Extended Family",
    "In-Law",
    "Child",
    "Grandchild",
    "Great-grandchild",
    "Relative",
  ],
} as const;

export const displaySpaceName = (space?: FamilySpace | null) => space?.name?.trim() || "FamilySpace";

export const displayFamilyName = (space?: FamilySpace | null) => {
  const name = displaySpaceName(space);
  return name.replace(/\s+Archive$/i, "").replace(/\s+FamilySpace$/i, "").trim() || name;
};

export const galleryHeroImageForSpace = (space?: FamilySpace | null) =>
  `https://picsum.photos/seed/${encodeURIComponent(displaySpaceName(space).toLowerCase())}-gallery-hero/900/620`;

export const firstBranchId = (branches: FamilyBranch[]) => branches[0]?.id || branches[0]?.name || "main-line";

export const rootMemberIdFromData = (members: FamilyMember[], branches: FamilyBranch[] = []) => {
  const branchHeadId = branches.flatMap((branch) => branch.headMemberIds ?? (branch.headMemberId ? [branch.headMemberId] : [])).find((id) =>
    members.some((member) => member.id === id),
  );
  if (branchHeadId) return branchHeadId;

  return [...members].sort((a, b) => a.generation - b.generation || a.fullName.localeCompare(b.fullName))[0]?.id ?? "";
};
