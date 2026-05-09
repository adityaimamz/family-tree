import { RelationshipMember, RelationshipResult, memberName } from "./types.js";

const genderedParentLabel = (member: RelationshipMember) => {
  if (member.gender === "male") return "father";
  if (member.gender === "female") return "mother";
  return "parent";
};

const genderedChildLabel = (member: RelationshipMember) => {
  if (member.gender === "male") return "son";
  if (member.gender === "female") return "daughter";
  return "child";
};

const genderedSiblingLabel = (member: RelationshipMember) => {
  if (member.gender === "male") return "brother";
  if (member.gender === "female") return "sister";
  return "sibling";
};

const genderedAuntUncleLabel = (member: RelationshipMember) => {
  if (member.gender === "male") return "uncle";
  if (member.gender === "female") return "aunt";
  return "aunt or uncle";
};

const possessiveName = (name: string) => (name.endsWith("s") ? `${name}'` : `${name}'s`);

const memberParentNames = (member: RelationshipMember, memberMap: Map<string, RelationshipMember>) =>
  [member.fatherId, member.motherId]
    .map((id) => (id ? memberMap.get(id) : null))
    .filter((item): item is RelationshipMember => Boolean(item))
    .map(memberName);

const explainRelationshipFromPath = (
  label: string,
  pathIds: string[],
  memberMap: Map<string, RelationshipMember>,
  from: RelationshipMember,
  to: RelationshipMember,
) => {
  const fromName = memberName(from);
  const toName = memberName(to);

  if (from.id === to.id) return `${fromName} and ${toName} are the same person in this FamilySpace.`;
  if (from.fatherId === to.id || from.motherId === to.id) {
    return `${fromName} is ${possessiveName(toName)} ${genderedChildLabel(from)}. ${toName} is listed as one of ${possessiveName(fromName)} parents in this FamilySpace.`;
  }
  if (to.fatherId === from.id || to.motherId === from.id) {
    return `${fromName} is ${possessiveName(toName)} ${genderedParentLabel(from)}. ${toName} is listed as ${possessiveName(fromName)} child in this FamilySpace.`;
  }
  if (from.spouseIds.includes(to.id) || to.spouseIds.includes(from.id)) {
    return `${fromName} is ${possessiveName(toName)} spouse. The FamilySpace records connect both people through a spouse link.`;
  }
  if (from.siblingIds.includes(to.id) || to.siblingIds.includes(from.id)) {
    const sharedParents = memberParentNames(from, memberMap).filter((name) => memberParentNames(to, memberMap).includes(name));
    const sharedParentText = sharedParents.length ? ` They share ${sharedParents.join(" and ")} as parent data.` : "";
    return `${fromName} is ${possessiveName(toName)} ${genderedSiblingLabel(from)} because the records connect them as siblings.${sharedParentText}`;
  }

  if (label === "grandchild") {
    const middle = memberMap.get(pathIds[1]);
    return middle
      ? `${fromName} is ${possessiveName(toName)} grandchild. ${fromName} is connected as ${possessiveName(memberName(middle))} child, and ${middle.displayName || middle.fullName} is connected as ${possessiveName(toName)} child.`
      : `${fromName} is ${possessiveName(toName)} grandchild based on the parent-child chain in this FamilySpace.`;
  }

  if (label === "grandparent") {
    const middle = memberMap.get(pathIds[1]);
    return middle
      ? `${fromName} is ${possessiveName(toName)} grandparent. ${middle.displayName || middle.fullName} is ${possessiveName(fromName)} child, and ${toName} is connected as ${possessiveName(memberName(middle))} child.`
      : `${fromName} is ${possessiveName(toName)} grandparent based on the parent-child chain in this FamilySpace.`;
  }

  if ((label === "aunt" || label === "uncle" || label === "aunt or uncle") && pathIds.length >= 3) {
    const parent = memberMap.get(pathIds[1]);
    if (parent) {
      const parentName = memberName(parent);
      return `${fromName} is ${possessiveName(toName)} ${label}. ${fromName} and ${parentName} are connected as siblings, and ${toName} is connected as ${possessiveName(parentName)} child.`;
    }
  }

  if (label === "cousin" && pathIds.length >= 4) {
    const fromParent = memberMap.get(pathIds[1]);
    const toParent = memberMap.get(pathIds[2]);
    if (fromParent && toParent) {
      const fromParentName = memberName(fromParent);
      const toParentName = memberName(toParent);
      return `${fromName} is ${possessiveName(toName)} cousin. ${fromName} is ${possessiveName(fromParentName)} child, while ${toName} is ${possessiveName(toParentName)} child. ${fromParentName} and ${toParentName} are siblings, so ${fromName} and ${toName} are cousins.`;
    }
  }

  if ((label === "aunt by marriage" || label === "uncle by marriage" || label === "aunt or uncle by marriage") && pathIds.length >= 4) {
    const spouse = memberMap.get(pathIds[1]);
    const parent = memberMap.get(pathIds[2]);
    if (spouse && parent) {
      const spouseName = memberName(spouse);
      const parentName = memberName(parent);
      return `${fromName} is connected to ${toName} through ${spouseName} and ${parentName}. ${fromName} is ${possessiveName(spouseName)} spouse. ${spouseName} and ${parentName} are siblings, and ${parentName} is ${possessiveName(toName)} ${genderedParentLabel(parent)}. This makes ${fromName} part of ${possessiveName(toName)} close extended family.`;
    }
  }

  const names = pathIds.map((id) => memberMap.get(id)).filter(Boolean).map((member) => memberName(member as RelationshipMember));
  return `${fromName} and ${toName} are connected as ${label}. The relationship follows this FamilySpace path: ${names.join(" -> ")}.`;
};

const buildRelationshipGraph = (members: RelationshipMember[]) => {
  const graph = new Map<string, { to: string; label: string }[]>();
  const addEdge = (from: string | null | undefined, to: string | null | undefined, label: string) => {
    if (!from || !to || from === to) return;
    graph.set(from, [...(graph.get(from) ?? []), { to, label }]);
  };

  members.forEach((member) => {
    addEdge(member.id, member.fatherId, "child -> father");
    addEdge(member.fatherId, member.id, "father -> child");
    addEdge(member.id, member.motherId, "child -> mother");
    addEdge(member.motherId, member.id, "mother -> child");
    member.spouseIds.forEach((id) => {
      addEdge(member.id, id, "spouse");
      addEdge(id, member.id, "spouse");
    });
    member.formerSpouseIds.forEach((id) => {
      addEdge(member.id, id, "former spouse");
      addEdge(id, member.id, "former spouse");
    });
    member.siblingIds.forEach((id) => {
      addEdge(member.id, id, "sibling");
      addEdge(id, member.id, "sibling");
    });
  });

  return graph;
};

const findRelationshipPath = (members: RelationshipMember[], fromMemberId: string, toMemberId: string) => {
  const memberIds = new Set(members.map((member) => member.id));
  if (!memberIds.has(fromMemberId) || !memberIds.has(toMemberId)) return null;
  if (fromMemberId === toMemberId) return [fromMemberId];

  const graph = buildRelationshipGraph(members);
  const queue = [fromMemberId];
  const previous = new Map<string, string | null>([[fromMemberId, null]]);

  while (queue.length) {
    const current = queue.shift()!;
    for (const edge of graph.get(current) ?? []) {
      if (previous.has(edge.to)) continue;
      previous.set(edge.to, current);
      if (edge.to === toMemberId) {
        const path = [toMemberId];
        let cursor = current;
        while (cursor) {
          path.push(cursor);
          cursor = previous.get(cursor) ?? "";
        }
        return path.reverse();
      }
      queue.push(edge.to);
    }
  }

  return null;
};

export const deterministicRelationship = (
  members: RelationshipMember[],
  fromMemberId: string,
  toMemberId: string,
): RelationshipResult | null => {
  const memberMap = new Map(members.map((member) => [member.id, member]));
  const from = memberMap.get(fromMemberId);
  const to = memberMap.get(toMemberId);
  if (!from || !to) return null;

  const ids = findRelationshipPath(members, fromMemberId, toMemberId);
  if (!ids) {
    return {
      relationshipLabel: "Relationship not found",
      explanation: `${memberName(from)} and ${memberName(to)} are both in this FamilySpace, but the current records do not contain enough linked parent, child, spouse, or sibling data to explain their relationship.`,
      path: [{ id: from.id, name: memberName(from) }, { id: to.id, name: memberName(to) }],
      confidence: "low",
      fallbackNote: "Add parent, child, spouse, or sibling links to improve the relationship explanation.",
      source: "deterministic",
    };
  }

  let label = "related family member";
  let confidence: RelationshipResult["confidence"] = "medium";

  if (from.id === to.id) {
    label = "same person";
    confidence = "high";
  } else if (from.fatherId === to.id || from.motherId === to.id) {
    label = genderedChildLabel(from);
    confidence = "high";
  } else if (to.fatherId === from.id || to.motherId === from.id) {
    label = genderedParentLabel(from);
    confidence = "high";
  } else if (from.spouseIds.includes(to.id) || to.spouseIds.includes(from.id)) {
    label = "spouse";
    confidence = "high";
  } else if (from.siblingIds.includes(to.id) || to.siblingIds.includes(from.id)) {
    label = genderedSiblingLabel(from);
    confidence = "high";
  } else if (ids.length === 3) {
    const middle = memberMap.get(ids[1]);
    const fromSiblingToParent =
      middle &&
      (from.siblingIds.includes(middle.id) || middle.siblingIds.includes(from.id)) &&
      (to.fatherId === middle.id || to.motherId === middle.id);
    if (fromSiblingToParent) {
      label = genderedAuntUncleLabel(from);
      confidence = "medium";
    } else if (middle && (middle.fatherId === to.id || middle.motherId === to.id)) {
      label = "grandchild";
      confidence = "medium";
    } else if (middle && (to.fatherId === middle.id || to.motherId === middle.id)) {
      label = "grandparent";
      confidence = "medium";
    }
  } else if (ids.length === 4) {
    const middleA = memberMap.get(ids[1]);
    const middleB = memberMap.get(ids[2]);
    const fromParentToSibling =
      middleA &&
      middleB &&
      (from.fatherId === middleA.id || from.motherId === middleA.id) &&
      (middleA.siblingIds.includes(middleB.id) || middleB.siblingIds.includes(middleA.id)) &&
      (to.fatherId === middleB.id || to.motherId === middleB.id);
    const fromSpouseToSiblingParent =
      middleA &&
      middleB &&
      (from.spouseIds.includes(middleA.id) || middleA.spouseIds.includes(from.id)) &&
      (middleA.siblingIds.includes(middleB.id) || middleB.siblingIds.includes(middleA.id)) &&
      (to.fatherId === middleB.id || to.motherId === middleB.id);
    if (fromSpouseToSiblingParent) {
      label = `${genderedAuntUncleLabel(from)} by marriage`;
      confidence = "medium";
    } else if (fromParentToSibling) {
      label = "cousin";
      confidence = "medium";
    }
  }

  return {
    relationshipLabel: label,
    explanation: explainRelationshipFromPath(label, ids, memberMap, from, to),
    path: ids.map((id) => ({ id, name: memberName(memberMap.get(id)!) })),
    confidence,
    fallbackNote: "This explanation only uses data inside this FamilySpace.",
    source: "deterministic",
  };
};
