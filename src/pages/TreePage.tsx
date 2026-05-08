import { motion } from "framer-motion";
import { GitBranch, Lock, Network, Sparkles } from "lucide-react";
import { useState } from "react";
import { FamilyTreeCanvas } from "../components/FamilyTree";
import { MemberDetailModal } from "../components/MemberDetail";
import { PageShell, SectionHeader, iconStroke, pageTransition } from "../components/ui";
import { familyConfig } from "../config";
import { useSpaceStore } from "../hooks/useSpaceStore";
import type { FamilyMember } from "../types/family";

export const TreePage = () => {
  const { members } = useSpaceStore();
  const [selected, setSelected] = useState<FamilyMember | null>(null);

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader
          eyebrow="Family tree"
          title={familyConfig.site.treeTitle}
          description="Search members, filter by branch, explore family paths, and prepare relationship questions for the AI explainer."
        />

        <section className="mb-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-[1.7rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sage-green/12 text-dark-green">
                <GitBranch className="h-5 w-5" strokeWidth={iconStroke} />
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold text-text-primary">Browse relationships with context.</h2>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-text-muted">
                  Use member search to jump to a person, branch filter to narrow the archive, and focus controls to show descendants, ancestors, or close family.
                </p>
              </div>
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-[1.7rem] border border-dark-green/15 bg-[linear-gradient(145deg,hsl(var(--dark-green))_0%,hsl(var(--warm-brown))_120%)] p-5 text-white shadow-[0_24px_70px_-42px_rgba(45,68,43,0.82)]">
            <div className="pointer-events-none absolute inset-0 archive-grid opacity-[0.08]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-white/70">AI Relationship Explainer</p>
                  <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">Ask how two family members are related.</h2>
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20">
                  <Sparkles className="h-5 w-5" strokeWidth={iconStroke} />
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/58">Person A</span>
                  <select
                    disabled
                    className="min-h-11 w-full cursor-not-allowed rounded-2xl border border-white/15 bg-white/10 px-3 text-sm font-bold text-white/70"
                    value=""
                    onChange={() => undefined}
                  >
                    <option value="">Select after AI endpoint is active</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/58">Person B</span>
                  <select
                    disabled
                    className="min-h-11 w-full cursor-not-allowed rounded-2xl border border-white/15 bg-white/10 px-3 text-sm font-bold text-white/70"
                    value=""
                    onChange={() => undefined}
                  >
                    <option value="">Choose a comparison person later</option>
                  </select>
                </label>
                <button
                  type="button"
                  disabled
                  className="flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-extrabold text-white/72 opacity-90"
                  title="Available after the Sprint 6 relationship endpoint is connected."
                >
                  <Network className="h-4 w-4" strokeWidth={iconStroke} />
                  Explain relationship
                  <Lock className="h-4 w-4" strokeWidth={iconStroke} />
                </button>
              </div>

              <p className="mt-4 text-sm font-semibold leading-6 text-white/70">
                Disabled until protected AI endpoints are available. Relationship data stays scoped to this FamilySpace.
              </p>
            </div>
          </aside>
        </section>

        <FamilyTreeCanvas members={members} onSelectMember={setSelected} />
        <MemberDetailModal member={selected} members={members} onClose={() => setSelected(null)} />
      </PageShell>
    </motion.div>
  );
};
