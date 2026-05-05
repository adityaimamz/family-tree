import type { FamilyMember } from "../../types/family";
import type { TreeLayoutUnit } from "../../types/tree";
import { TREE_NODE_WIDTH } from "../../constants/treeLayout";
import { TreeMemberCard } from "./TreeMemberCard";

export const TreeUnit = ({
  unit,
  focusIds,
  pulseMemberId,
  onSelect,
}: {
  unit: TreeLayoutUnit;
  focusIds: Set<string> | null;
  pulseMemberId: string | null;
  onSelect: (member: FamilyMember) => void;
}) => {
  const isLineMuted = focusIds ? unit.members.some(m => !focusIds.has(m.id)) : false;
  return (
  <div
    className="absolute z-[2] grid grid-flow-col auto-cols-max gap-3"
    style={{ left: unit.x, top: unit.y, width: unit.width, height: unit.height }}
  >
    {unit.members.length > 1 && (
      <span
        aria-hidden="true"
        className={`absolute top-1/2 z-[-1] h-[2.5px] -translate-y-1/2 bg-warm-brown/80 transition-all duration-300 ${isLineMuted ? "opacity-30 saturate-0" : "opacity-100"}`}
        style={{ left: TREE_NODE_WIDTH / 2, right: TREE_NODE_WIDTH / 2 }}
      />
    )}
    {unit.members.map((member) => (
      <TreeMemberCard
        key={member.id}
        member={member}
        muted={focusIds ? !focusIds.has(member.id) : false}
        pulse={pulseMemberId === member.id}
        onClick={onSelect}
      />
    ))}
  </div>
  );
};
