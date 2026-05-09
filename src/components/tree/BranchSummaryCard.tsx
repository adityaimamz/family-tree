import { Users } from "lucide-react";
import { familyConfig } from "../../config";
import { useSpaceStore } from "../../hooks/useSpaceStore";
import type { FamilyMember } from "../../types/family";

export const BranchSummaryCard = ({
  branchName,
  members,
}: {
  branchName: string;
  members: FamilyMember[];
}) => {
  const { branches } = useSpaceStore();
  const branch = branches.find((item) => item.name === branchName);
  const descendants = members.filter((member) => member.generation >= 3).length;
  const description =
    branchName === "All branches"
      ? "Every visible member in this FamilySpace is available for search, focus, and relationship path discovery."
      : branch?.description ?? familyConfig.labels.branchSummaryFallback;

  return (
    <div className="rounded-[1.6rem] border border-white/75 bg-[linear-gradient(135deg,hsl(var(--surface))_0%,hsl(var(--surface-soft)_/_0.58)_100%)] p-5 shadow-[0_20px_44px_-34px_rgba(80,54,30,0.72)] ring-1 ring-border-soft/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-sage-green">Archive Summary</p>
          <h2 className="mt-2 text-xl font-bold text-text-primary">{branchName}</h2>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            {description}
          </p>
        </div>
        <Users className="h-6 w-6 shrink-0 text-soft-gold" strokeWidth={1.8} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/70 bg-surface/78 p-4">
          <p className="text-2xl font-bold text-text-primary">{members.length}</p>
          <p className="text-xs font-semibold text-text-muted">Members</p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-surface/78 p-4">
          <p className="text-2xl font-bold text-text-primary">{descendants}</p>
          <p className="text-xs font-semibold text-text-muted">Descendants</p>
        </div>
      </div>
    </div>
  );
};
