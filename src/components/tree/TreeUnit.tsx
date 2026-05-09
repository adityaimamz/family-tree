import type { FamilyMember } from "../../types/family";
import type { TreeLayoutUnit } from "../../types/tree";
import { TREE_NODE_WIDTH } from "../../constants/treeLayout";
import { TreeMemberCard } from "./TreeMemberCard";

export const TreeUnit = ({
  unit,
  focusIds,
  highlightIds,
  pathOrderByMemberId,
  endpointIds,
  pulseMemberId,
  onSelect,
}: {
  unit: TreeLayoutUnit;
  focusIds: Set<string> | null;
  highlightIds?: Set<string>;
  pathOrderByMemberId?: Map<string, number>;
  endpointIds?: { startId?: string; targetId?: string };
  pulseMemberId: string | null;
  onSelect: (member: FamilyMember) => void;
}) => {
  const relationshipMode = Boolean(highlightIds?.size);
  const highlightedMemberCount = unit.members.filter((member) => highlightIds?.has(member.id)).length;
  const isLineMuted = relationshipMode
    ? highlightedMemberCount < 2
    : focusIds
      ? unit.members.some((member) => !focusIds.has(member.id))
      : false;
  return (
  <div
    className="absolute z-[2] grid grid-flow-col auto-cols-max gap-3"
    style={{ left: unit.x, top: unit.y, width: unit.width, height: unit.height }}
  >
    {unit.members.length > 1 && (
      <span
        aria-hidden="true"
        className={`absolute top-1/2 z-[-1] h-[2.5px] -translate-y-1/2 transition-all duration-300 ${
          relationshipMode && highlightedMemberCount >= 2
            ? "bg-soft-gold opacity-100 shadow-[0_0_10px_rgba(183,138,53,0.34)]"
            : `bg-warm-brown/80 ${isLineMuted ? "opacity-25 saturate-0" : "opacity-100"}`
        }`}
        style={{ left: TREE_NODE_WIDTH / 2, right: TREE_NODE_WIDTH / 2 }}
      />
    )}
    {unit.members.map((member) => (
      <TreeMemberCard
        key={member.id}
        member={member}
        muted={relationshipMode ? !highlightIds?.has(member.id) : focusIds ? !focusIds.has(member.id) : false}
        pulse={pulseMemberId === member.id}
        highlighted={highlightIds?.has(member.id)}
        pathOrder={pathOrderByMemberId?.get(member.id)}
        pathRole={
          endpointIds?.startId === member.id
            ? "start"
            : endpointIds?.targetId === member.id
              ? "target"
              : highlightIds?.has(member.id)
                ? "path"
                : "none"
        }
        onClick={onSelect}
      />
    ))}
  </div>
  );
};
