import type { FamilyMember, NuclearFamily } from "../types/family";

export const memberById = (members: FamilyMember[]) =>
  members.reduce<Record<string, FamilyMember>>((acc, member) => {
    acc[member.id] = member;
    return acc;
  }, {});

export const getInitials = (name: string) => {
  const cleaned = name
    .replace(/\b(Hj?|Ir|Ns|bin|binti|S\.T|S\.Kom|S\.Pd|S\.Hum|S\.KM|M\.KM|SH|MM|SE|Amd\.Kom|Amd\.Kep|Amd\.T|S\.Tr\.Pel|S\.tr\.Kes|A\.Md|S\.AP|A\.Amd)\b/gi, "")
    .replace(/[.,]/g, " ")
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "K") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "L");
};

export const generationLabel = (generation: number) => `Generasi ${generation}`;

export const displayStatus = (member: FamilyMember) =>
  member.isDeceased && member.deceasedLabel ? member.deceasedLabel : member.statusLabel;

export const relationNames = (ids: string[], members: FamilyMember[]) => {
  const map = memberById(members);
  return ids.map((id) => map[id]?.fullName).filter(Boolean);
};

export const relationDetails = (ids: string[], members: FamilyMember[]) => {
  const map = memberById(members);
  return ids
    .map((id) => (map[id] ? { id, name: map[id].fullName } : null))
    .filter((item): item is { id: string; name: string } => item !== null);
};

export const getParents = (member: FamilyMember, members: FamilyMember[]) => {
  const map = memberById(members);
  return {
    father: member.fatherId ? map[member.fatherId] : null,
    mother: member.motherId ? map[member.motherId] : null,
  };
};

export const getDescendantIds = (memberId: string, members: FamilyMember[]) => {
  const map = memberById(members);
  const result = new Set<string>();
  const visit = (id: string) => {
    const member = map[id];
    if (!member) return;
    member.childrenIds.forEach((childId) => {
      if (!result.has(childId)) {
        result.add(childId);
        visit(childId);
      }
    });
  };
  visit(memberId);
  return [...result];
};

export const getAncestorIds = (memberId: string, members: FamilyMember[]) => {
  const map = memberById(members);
  const result = new Set<string>();
  const visit = (id: string) => {
    const member = map[id];
    if (!member) return;
    [member.fatherId, member.motherId].forEach((parentId) => {
      if (parentId && !result.has(parentId)) {
        result.add(parentId);
        visit(parentId);
      }
    });
  };
  visit(memberId);
  return [...result];
};

export const validateMember = (member: FamilyMember) => {
  const errors: string[] = [];
  const related = [
    member.fatherId,
    member.motherId,
    ...member.childrenIds,
    ...member.spouseIds,
    ...member.formerSpouseIds,
  ].filter(Boolean);
  if (related.includes(member.id)) errors.push("Seseorang tidak dapat menjadi orang tua, anak, atau pasangan bagi dirinya sendiri.");
  if (new Set(member.spouseIds).size !== member.spouseIds.length) errors.push("Data pasangan tidak boleh duplikat.");
  if (new Set(member.childrenIds).size !== member.childrenIds.length) errors.push("Data anak tidak boleh duplikat.");
  if (!member.fatherId && !member.motherId && member.generation > 1 && member.statusLabel !== "Menantu") {
    errors.push("Peringatan: anggota generasi lanjutan belum memiliki orang tua terpilih.");
  }
  return errors;
};

export const connectMemberRelations = (members: FamilyMember[], changed: FamilyMember) => {
  const withoutChanged = members.filter((member) => member.id !== changed.id);
  const next = [...withoutChanged, changed].map((member) => ({ ...member }));
  const map = memberById(next);
  const append = (targetId: string | null, field: "childrenIds" | "spouseIds" | "formerSpouseIds", value: string) => {
    if (!targetId || !map[targetId]) return;
    if (!map[targetId][field].includes(value)) map[targetId][field] = [...map[targetId][field], value];
  };
  append(changed.fatherId, "childrenIds", changed.id);
  append(changed.motherId, "childrenIds", changed.id);
  changed.spouseIds.forEach((id) => append(id, "spouseIds", changed.id));
  changed.formerSpouseIds.forEach((id) => append(id, "formerSpouseIds", changed.id));
  changed.childrenIds.forEach((id) => {
    const child = map[id];
    if (!child) return;
    if (changed.gender === "male" && !child.fatherId) child.fatherId = changed.id;
    if (changed.gender === "female" && !child.motherId) child.motherId = changed.id;
  });
  return Object.values(map).sort((a, b) => a.generation - b.generation || a.fullName.localeCompare(b.fullName));
};

export const familyMembersForBranch = (branchId: string, members: FamilyMember[], nuclearFamilies: NuclearFamily[]) => {
  if (branchId === "semua") return members;
  const familyIds = nuclearFamilies.filter((family) => family.branchId === branchId);
  const ids = new Set(familyIds.flatMap((family) => [...family.parentIds, ...(family.childIds ?? family.childrenIds ?? [])]));
  return members.filter((member) => ids.has(member.id) || member.familyBranch === branchId);
};
