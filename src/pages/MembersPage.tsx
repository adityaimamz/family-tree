import { motion } from "framer-motion";
import { Edit3, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { MemberFormModal } from "../components/forms/MemberFormModal";
import { EmptyState, FilterSelect, LoadingState, MemberCard, PageShell, SearchBar, SectionHeader, pageTransition } from "../components/ui";
import { familyConfig } from "../config";
import { useSpaceStore } from "../hooks/useSpaceStore";
import type { FamilyMember } from "../types/family";
import { memberById } from "../utils/family";

const generationOptions = [familyConfig.labels.allGenerations, "Generasi 0", "Generasi 1", "Generasi 2", "Generasi 3", "Generasi 4", "Generasi 5"];

export const MembersPage = () => {
  const { members, isLoading, canEdit } = useSpaceStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(familyConfig.labels.allMembers);
  const [generation, setGeneration] = useState(familyConfig.labels.allGenerations);
  const [branch, setBranch] = useState(familyConfig.labels.allBranches);
  const [createOpen, setCreateOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<FamilyMember | null>(null);

  const map = useMemo(() => memberById(members), [members]);
  const statusOptions = useMemo(
    () => [
      familyConfig.labels.allMembers,
      ...Array.from(new Set([...familyConfig.labels.statusOptions, ...members.map((member) => member.statusLabel).filter(Boolean)])),
      familyConfig.labels.deceased,
    ],
    [members],
  );
  const branchOptions = useMemo(
    () => [familyConfig.labels.allBranches, ...Array.from(new Set(members.map((member) => member.familyBranch)))],
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
      
      const matchesStatus = status === familyConfig.labels.allMembers || member.statusLabel === status || (status === familyConfig.labels.deceased && member.isDeceased);
      const matchesGeneration = generation === familyConfig.labels.allGenerations || `Generasi ${member.generation}` === generation;
      const matchesBranch = branch === familyConfig.labels.allBranches || member.familyBranch === branch;
      
      return (!term || searchable.includes(term)) && matchesStatus && matchesGeneration && matchesBranch;
    });
  }, [branch, generation, map, members, query, status]);

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader 
          eyebrow="Direktori" 
          title="Anggota Keluarga" 
          description="Cari anggota keluarga berdasarkan nama, gelar, pasangan, orang tua, atau cabang keluarga." 
          action={
            canEdit() ? (
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
                type="button"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" strokeWidth={1.8} />
                Tambah Anggota
              </button>
            ) : null
          }
        />
        <div className="mb-7 rounded-[2rem] border border-white/75 bg-surface/92 p-3 shadow-[0_24px_54px_-38px_rgba(80,54,30,0.75)] ring-1 ring-border-soft/60 sm:p-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_220px_220px_240px]">
            <div className="lg:pt-7">
              <SearchBar value={query} onChange={setQuery} />
            </div>
            <FilterSelect label="Generasi" value={generation} options={generationOptions} onChange={setGeneration} />
            <FilterSelect label="Status" value={status} options={statusOptions} onChange={setStatus} />
            <FilterSelect label="Keluarga" value={branch} options={branchOptions} onChange={setBranch} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-soft/80 pt-4 text-sm font-semibold text-text-muted">
            <span className="rounded-full bg-sage-green/12 px-3 py-1.5 text-dark-green">
              {filtered.length} {familyConfig.labels.membersFound}
            </span>
            {query && <span className="rounded-full bg-soft-gold/14 px-3 py-1.5 text-warm-brown">Kata kunci: {query}</span>}
          </div>
        </div>
        {isLoading ? (
          <LoadingState />
        ) : filtered.length ? (
          <motion.div layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((member) => (
              <div key={member.id} className="grid gap-2">
                <MemberCard member={member} />
                {canEdit() && (
                  <button
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary shadow-soft transition hover:bg-surface-soft"
                    type="button"
                    onClick={() => setMemberToEdit(member)}
                  >
                    <Edit3 className="h-4 w-4" strokeWidth={1.8} />
                    Edit
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        ) : (
          <EmptyState 
            title="Nama tidak ditemukan." 
            description="Coba ketik nama lain atau pilih keluarga yang berbeda." 
          />
        )}
        <MemberFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
        <MemberFormModal open={Boolean(memberToEdit)} member={memberToEdit} onClose={() => setMemberToEdit(null)} />
      </PageShell>
    </motion.div>
  );
};
