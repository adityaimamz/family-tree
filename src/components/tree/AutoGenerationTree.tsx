import type { FamilyMember } from "../../types/family";
import type { TreeLayout } from "../../types/tree";
import { TREE_NODE_HEIGHT, TREE_NODE_WIDTH, TREE_SPOUSE_GAP } from "../../constants/treeLayout";
import { TreeUnit } from "./TreeUnit";

export const AutoGenerationTree = ({
  layout,
  focusIds,
  highlightIds,
  pathOrderByMemberId,
  endpointIds,
  pulseMemberId,
  onSelect,
}: {
  layout: TreeLayout;
  focusIds: Set<string> | null;
  highlightIds?: Set<string>;
  pathOrderByMemberId?: Map<string, number>;
  endpointIds?: { startId?: string; targetId?: string };
  pulseMemberId: string | null;
  onSelect: (member: FamilyMember) => void;
}) => {
  const relationshipMode = Boolean(highlightIds?.size);
  const memberPositions = new Map<string, { centerX: number; centerY: number; topY: number; bottomY: number }>();

  layout.units.forEach((unit) => {
    unit.members.forEach((member, index) => {
      const x = unit.x + index * (TREE_NODE_WIDTH + TREE_SPOUSE_GAP);
      memberPositions.set(member.id, {
        centerX: x + TREE_NODE_WIDTH / 2,
        centerY: unit.y + TREE_NODE_HEIGHT / 2,
        topY: unit.y,
        bottomY: unit.y + TREE_NODE_HEIGHT,
      });
    });
  });

  const orderedPathIds = Array.from(pathOrderByMemberId?.entries() ?? [])
    .sort(([, orderA], [, orderB]) => orderA - orderB)
    .map(([memberId]) => memberId);

  const relationshipOverlayPaths = orderedPathIds.slice(0, -1).flatMap((memberId, index) => {
    const nextMemberId = orderedPathIds[index + 1];
    const from = memberPositions.get(memberId);
    const to = memberPositions.get(nextMemberId);
    if (!from || !to) return [];

    if (Math.abs(from.centerY - to.centerY) < 12) {
      return [{
        id: `relationship-path-${memberId}-${nextMemberId}`,
        d: `M ${from.centerX} ${from.centerY} H ${to.centerX}`,
      }];
    }

    const upper = from.centerY < to.centerY ? from : to;
    const lower = from.centerY < to.centerY ? to : from;
    const midY = upper.bottomY + Math.max(28, (lower.topY - upper.bottomY) * 0.38);

    return [{
      id: `relationship-path-${memberId}-${nextMemberId}`,
      d: `M ${upper.centerX} ${upper.bottomY} V ${midY} H ${lower.centerX} V ${lower.topY}`,
    }];
  });

  return (
    <div className="relative min-w-max" style={{ width: layout.width, height: layout.height }}>
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 z-[1]"
      width={layout.width}
      height={layout.height}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
    >
      {layout.lines.map((line) => (
        <path
          key={line.id}
          d={line.path}
          fill="none"
          stroke={relationshipMode ? "hsl(var(--border) / 0.5)" : line.color}
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeWidth={relationshipMode ? "1.7" : "2.5"}
          opacity={relationshipMode ? 0.32 : 1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {relationshipOverlayPaths.map((line) => (
        <path
          key={line.id}
          d={line.d}
          fill="none"
          stroke="hsl(var(--soft-gold))"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
          opacity="0.96"
          filter="drop-shadow(0 0 7px rgba(183,138,53,0.38))"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>

    {layout.units.map((unit) => (
      <TreeUnit
        key={unit.id}
        unit={unit}
        focusIds={focusIds}
        highlightIds={highlightIds}
        pathOrderByMemberId={pathOrderByMemberId}
        endpointIds={endpointIds}
        pulseMemberId={pulseMemberId}
        onSelect={onSelect}
      />
    ))}
  </div>
  );
};
