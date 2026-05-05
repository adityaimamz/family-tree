import type { FamilyMember } from "../../types/family";
import type { TreeLayout } from "../../types/tree";
import { TreeUnit } from "./TreeUnit";

export const AutoGenerationTree = ({
  layout,
  focusIds,
  pulseMemberId,
  onSelect,
}: {
  layout: TreeLayout;
  focusIds: Set<string> | null;
  pulseMemberId: string | null;
  onSelect: (member: FamilyMember) => void;
}) => (
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
          stroke={line.color}
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>

    {layout.units.map((unit) => (
      <TreeUnit
        key={unit.id}
        unit={unit}
        focusIds={focusIds}
        pulseMemberId={pulseMemberId}
        onSelect={onSelect}
      />
    ))}
  </div>
);
