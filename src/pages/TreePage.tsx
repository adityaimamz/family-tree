import { motion } from "framer-motion";
import { GitBranch, Route, Users } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { FamilyTreeCanvas } from "../components/FamilyTree";
import { MemberDetailModal } from "../components/MemberDetail";
import { RelationshipExplainerPanel } from "../components/ai";
import { PageShell, SectionHeader, iconStroke, pageTransition } from "../components/ui";
import { useSpaceStore } from "../hooks/useSpaceStore";
import type { FamilyMember } from "../types/family";
import { displayFamilyName } from "../utils/spaceDisplay";

export const TreePage = () => {
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const { currentSpace, members, membership, addToast } = useSpaceStore();
  const [selected, setSelected] = useState<FamilyMember | null>(null);
  const [highlightPath, setHighlightPath] = useState<string[]>([]);
  const [endpointIds, setEndpointIds] = useState<{ startId?: string; targetId?: string }>({});

  const handlePathChange = useCallback((pathIds: string[], fromId: string, toId: string) => {
    setHighlightPath(pathIds);
    setEndpointIds(fromId ? { startId: fromId, targetId: toId } : {});
  }, []);

  const memberOptions = useMemo(
    () => [...members].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [members],
  );

  const branchCount = useMemo(
    () => new Set(members.map((member) => member.familyBranch).filter(Boolean)).size,
    [members],
  );

  const role = membership?.role ?? null;

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader
          eyebrow="Family tree"
          title={`${displayFamilyName(currentSpace)} Family Tree`}
          description="Explore relationships across generations and ask AI how two relatives are connected."
        />

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <FamilyTreeCanvas
              members={members}
              highlightMemberIds={highlightPath}
              relationshipEndpointIds={endpointIds}
              onSelectMember={setSelected}
            />
          </div>

          <RelationshipExplainerPanel
            members={memberOptions}
            spaceSlug={spaceSlug || ""}
            role={role}
            panelId="ai-studio-relationship"
            addToast={addToast}
            onPathChange={handlePathChange}
          />
        </section>

        <section className="mt-5 rounded-[1.35rem] border border-white/75 bg-surface/88 p-4 shadow-[0_18px_46px_-36px_rgba(80,54,30,0.72)] ring-1 ring-border-soft/60">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sage-green/12 text-dark-green">
                <GitBranch className="h-4 w-4" strokeWidth={iconStroke} />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-text-primary">Relationship Workspace</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-text-muted">
                  Search, focus, and trace how family members are connected.
                </p>
              </div>
            </div>
            <div className="grid gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-text-muted sm:grid-cols-3 lg:min-w-[520px]">
              <span className="rounded-2xl border border-border-soft bg-background px-3 py-2">
                <Users className="mr-2 inline h-3.5 w-3.5 text-sage-green" strokeWidth={iconStroke} />
                {members.length} members indexed
              </span>
              <span className="rounded-2xl border border-border-soft bg-background px-3 py-2">
                <GitBranch className="mr-2 inline h-3.5 w-3.5 text-sage-green" strokeWidth={iconStroke} />
                {branchCount || "-"} branches
              </span>
              <span className="rounded-2xl border border-border-soft bg-background px-3 py-2">
                <Route className="mr-2 inline h-3.5 w-3.5 text-sage-green" strokeWidth={iconStroke} />
                AI path ready
              </span>
            </div>
          </div>
        </section>
        <MemberDetailModal member={selected} members={members} onClose={() => setSelected(null)} />
      </PageShell>
    </motion.div>
  );
};
