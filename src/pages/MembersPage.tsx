import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Edit3, GitBranch, Network, Plus, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MemberFormModal } from "../components/forms/MemberFormModal";
import { Badge, EmptyState, FilterSelect, InitialsAvatar, LoadingState, PageShell, SearchBar, SectionHeader, iconStroke, pageTransition } from "../components/ui";
import { useSpaceStore } from "../hooks/useSpaceStore";
import type { FamilyMember } from "../types/family";
import { displayStatus, generationLabel, memberById } from "../utils/family";
import { spaceLabels } from "../utils/spaceDisplay";

const generationOptions = [spaceLabels.allGenerations, "Generasi 0", "Generasi 1", "Generasi 2", "Generasi 3", "Generasi 4", "Generasi 5"];

const hasBiographyDraft = (member: FamilyMember) => member.biography.trim().length > 0;

const DirectoryMemberCard = ({
  member,
  canEdit,
  onEdit,
}: {
  member: FamilyMember;
  canEdit: boolean;
  onEdit: () => void;
}) => {
  const biographyReady = hasBiographyDraft(member);

  return (
    <motion.article
      layout
      whileHover={{ y: -5, scale: 1.012 }}
      transition={{ type: "spring", stiffness: 170, damping: 18 }}
      className="group relative min-w-0 overflow-hidden rounded-[1.55rem] border border-white/70 bg-[linear-gradient(135deg,hsl(var(--surface))_0%,hsl(var(--surface))_58%,hsl(var(--surface-soft)_/_0.62)_100%)] p-4 shadow-[0_20px_48px_-34px_rgba(80,54,30,0.72)] ring-1 ring-border-soft/60 sm:p-5"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,hsl(var(--soft-gold)),hsl(var(--sage-green)),hsl(var(--warm-brown)))] opacity-80" />

      <div className="flex items-start gap-4">
        <InitialsAvatar member={member} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <Badge tone="gold">{generationLabel(member.generation)}</Badge>
            <Badge tone={member.isDeceased ? "muted" : "sage"}>{displayStatus(member)}</Badge>
          </div>
          <h3 className="mt-3 break-words text-lg font-extrabold leading-snug text-text-primary">
            {member.fullName}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-text-muted">
            {member.relationshipToRoot || "Relationship not recorded"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        <div className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3 rounded-[1rem] border border-border-soft bg-background/82 px-3 py-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-sage-green/12 text-dark-green">
            <Network className="h-4 w-4" strokeWidth={iconStroke} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">Relationship</p>
            <p className="truncate text-sm font-bold text-text-primary">{member.relationshipToRoot || "Not recorded"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[1rem] border border-border-soft bg-background/82 px-3 py-2.5">
            <div className="flex items-center gap-2 text-dark-green">
              <UserRound className="h-4 w-4" strokeWidth={iconStroke} />
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">Generation</p>
            </div>
            <p className="mt-1 truncate text-sm font-bold text-text-primary">{generationLabel(member.generation)}</p>
          </div>
          <div className="rounded-[1rem] border border-border-soft bg-background/82 px-3 py-2.5">
            <div className="flex items-center gap-2 text-dark-green">
              <GitBranch className="h-4 w-4" strokeWidth={iconStroke} />
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">Branch</p>
            </div>
            <p className="mt-1 truncate text-sm font-bold text-text-primary">{member.familyBranch || "Not recorded"}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft/80 pt-4">
        {biographyReady ? (
          <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-sage-green/20 bg-sage-green/10 px-3 text-xs font-bold text-dark-green">
            <BookOpen className="h-3.5 w-3.5" strokeWidth={iconStroke} />
            Biography drafted
          </span>
        ) : (
          <Link
            to={member.id}
            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-soft-gold/25 bg-soft-gold/12 px-3 text-xs font-bold text-warm-brown transition hover:-translate-y-0.5 hover:border-warm-brown/25 hover:bg-soft-gold/20 active:translate-y-[1px]"
          >
            <BookOpen className="h-3.5 w-3.5" strokeWidth={iconStroke} />
            <span>Needs biography · Open Profile →</span>
          </Link>
        )}
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-surface px-3 py-2 text-sm font-bold text-text-primary shadow-soft transition hover:bg-surface-soft active:translate-y-[1px]"
              type="button"
              onClick={onEdit}
            >
              <Edit3 className="h-4 w-4" strokeWidth={iconStroke} />
              Edit
            </button>
          )}
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-dark-green px-3 py-2 text-sm font-bold text-white shadow-soft transition hover:bg-warm-brown active:translate-y-[1px]"
            to={member.id}
          >
            Profile
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" strokeWidth={iconStroke} />
          </Link>
        </div>
      </div>
    </motion.article>
  );
};

export const MembersPage = () => {
  const { members, isLoading, canEdit } = useSpaceStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>(spaceLabels.allMembers);
  const [generation, setGeneration] = useState<string>(spaceLabels.allGenerations);
  const [branch, setBranch] = useState<string>(spaceLabels.allBranches);
  const [createOpen, setCreateOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<FamilyMember | null>(null);

  const map = useMemo(() => memberById(members), [members]);
  const statusOptions = useMemo(
    () => [
      spaceLabels.allMembers,
      ...Array.from(new Set([...spaceLabels.statusOptions, ...members.map((member) => member.statusLabel).filter(Boolean)])),
      spaceLabels.deceased,
    ],
    [members],
  );
  const branchOptions = useMemo(
    () => [spaceLabels.allBranches, ...Array.from(new Set(members.map((member) => member.familyBranch)))],
    [members],
  );

  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    return members.filter((member) => {
      const parents = [
        member.fatherId ? map[member.fatherId]?.fullName : "", 
        member.motherId ? map[member.motherId]?.fullName : ""
      ].join(" ");
      const spouses = member.spouseIds.map((id) => map[id]?.fullName).join(" ");
      const searchable = [
        member.fullName, 
        member.displayName, 
        member.familyBranch, 
        member.relationshipToRoot, 
        parents, 
        spouses
      ].join(" ").toLowerCase();
      
      const matchesStatus = status === spaceLabels.allMembers || member.statusLabel === status || (status === spaceLabels.deceased && member.isDeceased);
      const matchesGeneration = generation === spaceLabels.allGenerations || `Generasi ${member.generation}` === generation;
      const matchesBranch = branch === spaceLabels.allBranches || member.familyBranch === branch;
      
      return (!term || searchable.includes(term)) && matchesStatus && matchesGeneration && matchesBranch;
    });
  }, [branch, generation, map, members, query, status]);

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader 
          eyebrow="Family records" 
          title="Members Directory" 
          description="Search for family members by name, relationship to root, generation, status, or family branch." 
          action={
            canEdit() ? (
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
                type="button"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" strokeWidth={iconStroke} />
                Add Member
              </button>
            ) : null
          }
        />
        <div className="mb-7 rounded-[2rem] border border-white/75 bg-surface/92 p-3 shadow-[0_24px_54px_-38px_rgba(80,54,30,0.75)] ring-1 ring-border-soft/60 sm:p-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_220px_220px_240px]">
            <div className="lg:pt-7">
              <SearchBar value={query} onChange={setQuery} />
            </div>
            <FilterSelect label="Generation" value={generation} options={generationOptions} onChange={setGeneration} />
            <FilterSelect label="Status" value={status} options={statusOptions} onChange={setStatus} />
            <FilterSelect label="Family" value={branch} options={branchOptions} onChange={setBranch} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-soft/80 pt-4 text-sm font-semibold text-text-muted">
            <span className="rounded-full bg-sage-green/12 px-3 py-1.5 text-dark-green">
              {filtered.length} {spaceLabels.membersFound}
            </span>
            {query && <span className="rounded-full bg-soft-gold/14 px-3 py-1.5 text-warm-brown">Keyword: {query}</span>}
          </div>
        </div>
        {isLoading ? (
          <LoadingState />
        ) : filtered.length ? (
          <motion.div layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((member) => (
              <DirectoryMemberCard
                key={member.id}
                member={member}
                canEdit={canEdit()}
                onEdit={() => setMemberToEdit(member)}
              />
            ))}
          </motion.div>
        ) : (
          <EmptyState 
            title="Name not found." 
            description="Try typing another name or selecting a different family." 
          />
        )}
        <MemberFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
        <MemberFormModal open={Boolean(memberToEdit)} member={memberToEdit} onClose={() => setMemberToEdit(null)} />
      </PageShell>
    </motion.div>
  );
};
