export type RelationshipMember = {
  id: string;
  fullName: string;
  displayName: string | null;
  gender: string;
  fatherId: string | null;
  motherId: string | null;
  spouseIds: string[];
  formerSpouseIds: string[];
  childrenIds: string[];
  siblingIds: string[];
};

export type RelationshipResult = {
  relationshipLabel: string;
  explanation: string;
  path: { id: string; name: string }[];
  confidence: "high" | "medium" | "low";
  fallbackNote: string;
  source: "ai" | "deterministic";
};

export const memberName = (member: RelationshipMember) => member.displayName || member.fullName;

const unknownMemberLabel = "Unknown member";

export const pathFromStoredIds = (pathMemberIds: string[], relationshipMembers: RelationshipMember[]) => {
  const map = new Map(relationshipMembers.map((m) => [m.id, m]));
  return pathMemberIds.map((id) => {
    const member = map.get(id);
    return { id, name: member ? memberName(member) : unknownMemberLabel };
  });
};

export const asStoredConfidence = (value: string): RelationshipResult["confidence"] =>
  value === "high" || value === "medium" || value === "low" ? value : "medium";

export const asStoredSource = (value: string): RelationshipResult["source"] =>
  value === "ai" || value === "deterministic" ? value : "deterministic";
