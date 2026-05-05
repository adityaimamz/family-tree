import {
  TREE_CANVAS_PADDING,
  TREE_CONNECTOR_PALETTE,
  TREE_NODE_HEIGHT,
  TREE_NODE_WIDTH,
  TREE_ROW_GAP,
  TREE_SPOUSE_GAP,
  TREE_UNIT_GAP,
} from "../constants/treeLayout";
import type { FamilyMember, NuclearFamily } from "../types/family";
import type { ConnectorLine, FamilyConnector, FamilyLayoutNode, TreeLayout, TreeLayoutUnit } from "../types/tree";

const connectorColorForFamily = (familyId: string) => {
  const hash = [...familyId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return TREE_CONNECTOR_PALETTE[hash % TREE_CONNECTOR_PALETTE.length];
};

export const buildTreeLayout = (
  visibleMembers: FamilyMember[],
  allMembers: Record<string, FamilyMember>,
  nuclearFamilies: NuclearFamily[],
): TreeLayout => {
  const visibleIds = new Set(visibleMembers.map((m) => m.id));
  const familyChildIds = (family: NuclearFamily) => family.childrenIds ?? [];
  const familyHasVisibleMember = (family: NuclearFamily) =>
    family.parentIds.some((id) => visibleIds.has(id)) || familyChildIds(family).some((id) => visibleIds.has(id));

  const visibleFamilies = nuclearFamilies.filter(familyHasVisibleMember);
  const familyById = new Map(visibleFamilies.map((family) => [family.id, family]));
  const memberOriginFamilies = new Map<string, string[]>();
  const memberParentFamilies = new Map<string, string[]>();

  visibleFamilies.forEach((family) => {
    familyChildIds(family).forEach((childId) => {
      if (!visibleIds.has(childId)) return;
      memberOriginFamilies.set(childId, [...(memberOriginFamilies.get(childId) ?? []), family.id]);
    });
    family.parentIds.forEach((parentId) => {
      if (!visibleIds.has(parentId)) return;
      memberParentFamilies.set(parentId, [...(memberParentFamilies.get(parentId) ?? []), family.id]);
    });
  });

  const nodes = new Map<string, FamilyLayoutNode>();
  visibleFamilies.forEach((family) => {
    const parentIds = family.parentIds.filter((id) => visibleIds.has(id) && allMembers[id]);
    const childMemberIds = familyChildIds(family).filter((id) => visibleIds.has(id) && allMembers[id]);
    const sourceFamilyIds = Array.from(
      new Set(parentIds.flatMap((parentId) => memberOriginFamilies.get(parentId) ?? []).filter((id) => familyById.has(id))),
    );

    nodes.set(family.id, {
      family,
      parentIds,
      childMemberIds,
      childFamilyNodes: [],
      sourceFamilyIds,
      width: 0,
      x: 0,
      y: 0,
      depth: 0,
    });
  });

  const isConvergingFamily = (node: FamilyLayoutNode) => node.sourceFamilyIds.length > 1;

  nodes.forEach((node) => {
    node.childMemberIds.forEach((childId) => {
      (memberParentFamilies.get(childId) ?? []).forEach((childFamilyId) => {
        const childFamilyNode = nodes.get(childFamilyId);
        if (childFamilyNode && childFamilyNode.family.id !== node.family.id && !isConvergingFamily(childFamilyNode)) {
          node.childFamilyNodes.push(childFamilyNode);
        }
      });
    });
  });

  const depthMemo = new Map<string, number>();
  const getDepth = (node: FamilyLayoutNode, seen = new Set<string>()): number => {
    if (depthMemo.has(node.family.id)) return depthMemo.get(node.family.id)!;
    if (seen.has(node.family.id)) return 0;
    seen.add(node.family.id);

    const parentDepths = node.sourceFamilyIds.map((id) => {
      const source = nodes.get(id);
      return source ? getDepth(source, new Set(seen)) + 1 : 0;
    });
    const depth = parentDepths.length ? Math.max(...parentDepths) : 0;
    depthMemo.set(node.family.id, depth);
    return depth;
  };

  nodes.forEach((node) => {
    node.depth = getDepth(node);
  });

  const unitWidthForCount = (count: number) => Math.max(TREE_NODE_WIDTH, count * TREE_NODE_WIDTH + Math.max(0, count - 1) * TREE_SPOUSE_GAP);
  const familyParentUnitWidth = (node: FamilyLayoutNode) => unitWidthForCount(node.parentIds.length);
  const memberUnitId = (familyId: string, memberId: string) => `${familyId}:child:${memberId}`;
  const hasVisibleNuclearFamilyForPair = (memberId: string, partnerId: string) =>
    visibleFamilies.some((family) => family.parentIds.includes(memberId) && family.parentIds.includes(partnerId));
  const standalonePartnerIdsByMemberId = new Map<string, string[]>();

  visibleMembers.forEach((member) => {
    const partnerIds = Array.from(new Set([...member.spouseIds, ...member.formerSpouseIds])).filter(
      (partnerId) =>
        visibleIds.has(partnerId) &&
        Boolean(allMembers[partnerId]) &&
        !memberParentFamilies.has(partnerId) &&
        !memberOriginFamilies.has(partnerId) &&
        !hasVisibleNuclearFamilyForPair(member.id, partnerId),
    );

    if (partnerIds.length > 0) standalonePartnerIdsByMemberId.set(member.id, partnerIds);
  });

  const renderMemberIdsForChild = (childId: string) => [childId, ...(standalonePartnerIdsByMemberId.get(childId) ?? [])];
  const childBaseWidth = (childId: string) => unitWidthForCount(renderMemberIdsForChild(childId).length);
  const childSlotWidth = (node: FamilyLayoutNode, childId: string) => {
    const childFamilies = node.childFamilyNodes.filter((childFamily) => childFamily.parentIds.includes(childId));
    const childFamilyWidth =
      childFamilies.reduce((sum, childFamily, idx) => sum + childFamily.width + (idx > 0 ? TREE_UNIT_GAP : 0), 0) || 0;
    return Math.max(childBaseWidth(childId), childFamilyWidth);
  };

  const measureFamily = (node: FamilyLayoutNode, seen = new Set<string>()) => {
    if (seen.has(node.family.id)) return node.width;
    seen.add(node.family.id);

    node.childFamilyNodes.forEach((childFamily) => measureFamily(childFamily, new Set(seen)));
    const childrenWidth = node.childMemberIds.reduce((sum, childId, idx) => sum + childSlotWidth(node, childId) + (idx > 0 ? TREE_UNIT_GAP : 0), 0);
    node.width = Math.max(familyParentUnitWidth(node), childrenWidth || TREE_NODE_WIDTH);
    return node.width;
  };

  nodes.forEach((node) => measureFamily(node));

  const unitMap = new Map<string, TreeLayoutUnit>();
  const memberPrimaryUnitId = new Map<string, string>();
  const memberPrimaryPosition = new Map<string, TreeLayoutUnit>();
  const familyParentUnitId = new Map<string, string>();
  const lines: ConnectorLine[] = [];
  const positionedFamilies = new Set<string>();

  const membersByIds = (ids: string[]) => ids.map((id) => allMembers[id]).filter(Boolean);

  const memberCenterInUnit = (unit: TreeLayoutUnit, memberId: string) => {
    const idx = unit.members.findIndex((member) => member.id === memberId);
    return idx === -1 ? unit.x + unit.width / 2 : unit.x + idx * (TREE_NODE_WIDTH + TREE_SPOUSE_GAP) + TREE_NODE_WIDTH / 2;
  };

  const registerPrimaryMembers = (unit: TreeLayoutUnit) => {
    unit.members.forEach((member) => {
      memberPrimaryUnitId.set(member.id, unit.id);
      memberPrimaryPosition.set(member.id, unit);
    });
  };

  const addUnit = (unit: TreeLayoutUnit) => {
    unitMap.set(unit.id, unit);
    registerPrimaryMembers(unit);
  };

  const syncUnitMembers = (unit: TreeLayoutUnit, memberIds: string[]) => {
    const nextIds = [...unit.members.map((member) => member.id)];
    memberIds.forEach((memberId) => {
      if (allMembers[memberId] && !nextIds.includes(memberId)) nextIds.push(memberId);
    });

    unit.members = membersByIds(nextIds);
    unit.generation = unit.members.length ? Math.min(...unit.members.map((member) => member.generation)) : unit.generation;
    unit.width = unitWidthForCount(unit.members.length);
    registerPrimaryMembers(unit);
  };

  const mergeParentUnits = (anchorUnit: TreeLayoutUnit, parentIds: string[]) => {
    const extraUnitIds = Array.from(
      new Set(
        parentIds
          .map((parentId) => memberPrimaryUnitId.get(parentId))
          .filter((unitId): unitId is string => Boolean(unitId && unitId !== anchorUnit.id)),
      ),
    );

    extraUnitIds.forEach((unitId) => {
      const extraUnit = unitMap.get(unitId);
      if (!extraUnit) return;

      syncUnitMembers(
        anchorUnit,
        extraUnit.members.map((member) => member.id),
      );
      unitMap.delete(unitId);
    });

    syncUnitMembers(anchorUnit, parentIds);
  };

  const ensureParentUnit = (node: FamilyLayoutNode, x: number, preferredCenter?: number) => {
    const existingUnitId = node.parentIds.map((parentId) => memberPrimaryUnitId.get(parentId)).find((unitId) => unitId && unitMap.has(unitId));

    if (existingUnitId) {
      const existingUnit = unitMap.get(existingUnitId)!;
      mergeParentUnits(existingUnit, node.parentIds);
      if (preferredCenter !== undefined) existingUnit.x = preferredCenter - existingUnit.width / 2;
      familyParentUnitId.set(node.family.id, existingUnit.id);
      return existingUnit;
    }

    const members = membersByIds(node.parentIds);
    const width = unitWidthForCount(members.length);
    const unit: TreeLayoutUnit = {
      id: `${node.family.id}:parents`,
      generation: members.length ? Math.min(...members.map((member) => member.generation)) : node.depth,
      members,
      width,
      height: TREE_NODE_HEIGHT,
      x: preferredCenter !== undefined ? preferredCenter - width / 2 : x + (node.width - width) / 2,
      y: TREE_CANVAS_PADDING + node.depth * (TREE_NODE_HEIGHT + TREE_ROW_GAP),
      parentUnitIds: [],
    };

    addUnit(unit);
    familyParentUnitId.set(node.family.id, unit.id);
    return unit;
  };

  const ensureChildUnit = (familyId: string, childId: string, x: number, y: number) => {
    const existingUnitId = memberPrimaryUnitId.get(childId);
    if (existingUnitId) return unitMap.get(existingUnitId) ?? null;

    const memberIds = renderMemberIdsForChild(childId).filter((memberId) => memberId === childId || !memberPrimaryUnitId.has(memberId));
    const members = membersByIds(memberIds);
    if (members.length === 0) return null;
    const width = unitWidthForCount(members.length);

    const unit: TreeLayoutUnit = {
      id: memberUnitId(familyId, childId),
      generation: Math.min(...members.map((member) => member.generation)),
      members,
      width,
      height: TREE_NODE_HEIGHT,
      x,
      y,
      parentUnitIds: [],
    };

    addUnit(unit);
    return unit;
  };

  const positionFamily = (node: FamilyLayoutNode, x: number, preferredParentCenter?: number) => {
    if (positionedFamilies.has(node.family.id)) return;
    positionedFamilies.add(node.family.id);
    const parentUnit = ensureParentUnit(node, x, preferredParentCenter);
    node.x = parentUnit.x + parentUnit.width / 2 - node.width / 2;
    node.y = parentUnit.y;

    const childRowWidth = node.childMemberIds.reduce((sum, childId, idx) => sum + childSlotWidth(node, childId) + (idx > 0 ? TREE_UNIT_GAP : 0), 0);
    let childX = node.x + (node.width - childRowWidth) / 2;
    const childY = parentUnit.y + TREE_NODE_HEIGHT + TREE_ROW_GAP;

    node.childMemberIds.forEach((childId) => {
      const slotWidth = childSlotWidth(node, childId);
      const expectedChildWidth = childBaseWidth(childId);
      const childUnit = ensureChildUnit(node.family.id, childId, childX + (slotWidth - expectedChildWidth) / 2, childY);
      if (childUnit) childUnit.x = childX + (slotWidth - childUnit.width) / 2;
      const childCenter = childUnit ? memberCenterInUnit(childUnit, childId) : childX + slotWidth / 2;

      const childFamilies = node.childFamilyNodes.filter((childFamily) => childFamily.parentIds.includes(childId));
      const childFamiliesWidth = childFamilies.reduce((sum, childFamily, idx) => sum + childFamily.width + (idx > 0 ? TREE_UNIT_GAP : 0), 0);
      let childFamilyX = childX + (slotWidth - childFamiliesWidth) / 2;
      childFamilies.forEach((childFamily) => {
        positionFamily(childFamily, childFamilyX, childCenter);
        childFamilyX += childFamily.width + TREE_UNIT_GAP;
      });

      childX += slotWidth + TREE_UNIT_GAP;
    });
  };

  const roots = Array.from(nodes.values())
    .filter((node) => node.sourceFamilyIds.length === 0)
    .sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.family.id.localeCompare(b.family.id);
    });

  let currentX = TREE_CANVAS_PADDING;
  roots.forEach((root) => {
    positionFamily(root, currentX);
    currentX += root.width + TREE_UNIT_GAP;
  });

  const convergingFamilies = Array.from(nodes.values())
    .filter((node) => isConvergingFamily(node))
    .sort((a, b) => a.depth - b.depth || a.family.id.localeCompare(b.family.id));

  convergingFamilies.forEach((node) => {
    const sourceCenters = node.parentIds
      .map((parentId) => {
        const unit = memberPrimaryPosition.get(parentId);
        return unit ? memberCenterInUnit(unit, parentId) : null;
      })
      .filter((value): value is number => value !== null);
    const center = sourceCenters.length ? sourceCenters.reduce((sum, value) => sum + value, 0) / sourceCenters.length : currentX + node.width / 2;
    positionFamily(node, center - node.width / 2, center);
    currentX = Math.max(currentX, node.x + node.width + TREE_UNIT_GAP);
  });

  const units = Array.from(unitMap.values());
  const minX = Math.min(...units.map((unit) => unit.x), TREE_CANVAS_PADDING);
  if (minX < TREE_CANVAS_PADDING) {
    const shift = TREE_CANVAS_PADDING - minX;
    units.forEach((unit) => {
      unit.x += shift;
    });
    nodes.forEach((node) => {
      node.x += shift;
    });
  }

  const familyIdsForParentUnit = (unitId: string) =>
    Array.from(nodes.values())
      .filter((node) => familyParentUnitId.get(node.family.id) === unitId)
      .map((node) => node.family.id);

  const shiftUnitWithDescendants = (unit: TreeLayoutUnit, dx: number, shiftedUnitIds = new Set<string>()) => {
    if (dx === 0 || shiftedUnitIds.has(unit.id)) return;

    unit.x += dx;
    shiftedUnitIds.add(unit.id);

    familyIdsForParentUnit(unit.id).forEach((familyId) => {
      const familyNode = nodes.get(familyId);
      if (!familyNode) return;

      familyNode.childMemberIds.forEach((childId) => {
        const childUnit = memberPrimaryPosition.get(childId);
        if (childUnit) shiftUnitWithDescendants(childUnit, dx, shiftedUnitIds);
      });
    });
  };

  const resolveRowCollisions = () => {
    const rows = new Map<number, TreeLayoutUnit[]>();
    units.forEach((unit) => {
      const rowKey = Math.round(unit.y);
      rows.set(rowKey, [...(rows.get(rowKey) ?? []), unit]);
    });

    Array.from(rows.entries())
      .sort(([rowA], [rowB]) => rowA - rowB)
      .forEach(([, rowUnits]) => {
        let nextX = TREE_CANVAS_PADDING;
        rowUnits
          .sort((a, b) => a.x - b.x || a.id.localeCompare(b.id))
          .forEach((unit) => {
            if (unit.x < nextX) shiftUnitWithDescendants(unit, nextX - unit.x);
            nextX = unit.x + unit.width + TREE_UNIT_GAP;
          });
      });
  };

  const centerRootParentsOverChildren = () => {
    nodes.forEach((node) => {
      if (node.sourceFamilyIds.length > 0) return;

      const parentUnitId = familyParentUnitId.get(node.family.id);
      const parentUnit = parentUnitId ? unitMap.get(parentUnitId) : null;
      const childCenters = node.childMemberIds
        .map((childId) => {
          const unit = memberPrimaryPosition.get(childId);
          return unit ? memberCenterInUnit(unit, childId) : null;
        })
        .filter((value): value is number => value !== null);

      if (!parentUnit || childCenters.length === 0) return;

      const left = Math.min(...childCenters);
      const right = Math.max(...childCenters);
      parentUnit.x = (left + right) / 2 - parentUnit.width / 2;
    });
  };

  resolveRowCollisions();
  centerRootParentsOverChildren();
  resolveRowCollisions();

  const familyConnectors: FamilyConnector[] = [];

  nodes.forEach((node) => {
    const parentUnitId = familyParentUnitId.get(node.family.id);
    const parentUnit = parentUnitId ? unitMap.get(parentUnitId) : null;
    if (!parentUnit) return;

    const childAnchors = node.childMemberIds
      .map((childId) => {
        const unit = memberPrimaryPosition.get(childId);
        return unit
          ? {
              childId,
              centerX: memberCenterInUnit(unit, childId),
              topY: unit.y,
            }
          : null;
      })
      .filter(Boolean) as FamilyConnector["childAnchors"];

    if (childAnchors.length > 0) {
      const parentBottom = parentUnit.y + parentUnit.height;
      const parentCenterX = parentUnit.x + parentUnit.width / 2;
      const childCenters = childAnchors.map((child) => child.centerX);

      familyConnectors.push({
        familyId: node.family.id,
        color: connectorColorForFamily(node.family.id),
        parentBottom,
        parentCenterX,
        leftChildX: Math.min(...childCenters),
        rightChildX: Math.max(...childCenters),
        midY: parentBottom + 32,
        childAnchors,
      });
    }
  });

  const laneRows = new Map<number, number[]>();
  familyConnectors
    .sort((a, b) => a.parentBottom - b.parentBottom || a.leftChildX - b.leftChildX || a.familyId.localeCompare(b.familyId))
    .forEach((connector) => {
      const rowKey = Math.round(connector.parentBottom);
      const lanes = laneRows.get(rowKey) ?? [];
      let laneIndex = lanes.findIndex((rightEdge) => connector.leftChildX > rightEdge + 10);
      if (laneIndex === -1) laneIndex = lanes.length;

      lanes[laneIndex] = Math.max(lanes[laneIndex] ?? Number.NEGATIVE_INFINITY, connector.rightChildX);
      laneRows.set(rowKey, lanes);
      connector.midY = connector.parentBottom + 28 + laneIndex * 16;
    });

  familyConnectors.forEach((connector) => {
    lines.push({
      id: `${connector.familyId}-stem`,
      path: `M ${connector.parentCenterX} ${connector.parentBottom} V ${connector.midY}`,
      color: connector.color,
    });

    lines.push({
      id: `${connector.familyId}-horizontal`,
      path: `M ${connector.leftChildX} ${connector.midY} H ${connector.rightChildX}`,
      color: connector.color,
    });

    connector.childAnchors.forEach((child) => {
      lines.push({
        id: `${connector.familyId}-child-${child.childId}`,
        path: `M ${child.centerX} ${connector.midY} V ${child.topY}`,
        color: connector.color,
      });
    });
  });

  return {
    units,
    lines,
    width: Math.max(...units.map((unit) => unit.x + unit.width), 960) + TREE_CANVAS_PADDING,
    height: Math.max(...units.map((unit) => unit.y + unit.height), 520) + TREE_CANVAS_PADDING,
  };
};
