import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { EmptyState, FilterSelect, LoadingState, MemberCard, PageShell, SearchBar, SectionHeader, pageTransition } from "../components/ui";
import { familyConfig } from "../config";
import { useFamilyStore } from "../hooks/useFamilyStore";
import { memberById } from "../utils/family";

const generationOptions = [familyConfig.labels.allGenerations, "Generasi 0", "Generasi 1", "Generasi 2", "Generasi 3", "Generasi 4", "Generasi 5"];

export const MembersPage = () => {
  const { members } = useFamilyStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(familyConfig.labels.allMembers);
  const [generation, setGeneration] = useState(familyConfig.labels.allGenerations);
  const [branch, setBranch] = useState(familyConfig.labels.allBranches);
  const [loading] = useState(false);

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
        {loading ? (
          <LoadingState />
        ) : filtered.length ? (
          <motion.div layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </motion.div>
        ) : (
          <EmptyState 
            title="Nama tidak ditemukan." 
            description="Coba ketik nama lain atau pilih keluarga yang berbeda." 
          />
        )}
      </PageShell>
    </motion.div>
  );
};
