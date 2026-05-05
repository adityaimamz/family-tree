import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { FamilyMember } from "../../types/family";
import { getInitials } from "../../utils/family";

export const memberMatchesTerm = (member: FamilyMember, term: string) =>
  [member.fullName, member.displayName, member.familyBranch, member.relationshipToRoot, member.notes]
    .join(" ")
    .toLowerCase()
    .includes(term);

export const FocusSearchCombobox = ({
  members,
  query,
  selectedId,
  onQueryChange,
  onSelect,
}: {
  members: FamilyMember[];
  query: string;
  selectedId: string;
  onQueryChange: (query: string) => void;
  onSelect: (memberId: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const term = query.trim().toLowerCase();
  const selectedMember = members.find((member) => member.id === selectedId) ?? members[0];
  const filteredMembers = useMemo(
    () => (term ? members.filter((member) => memberMatchesTerm(member, term)) : members),
    [members, term],
  );
  const visibleMembers = filteredMembers.slice(0, 18);

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label className="block">
        <span className="sr-only">Cari dan pilih anggota keluarga</span>
        <span className="relative block">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sage-green"
            strokeWidth={1.8}
          />
          <input
            className="min-h-14 w-full rounded-2xl border border-border-soft bg-surface py-3 pl-12 pr-24 text-base font-semibold text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/70 focus:border-dark-green focus:ring-2 focus:ring-sage-green/20"
            placeholder="Ketik nama anggota keluarga"




            value={query}
            onChange={(event) => {
              onQueryChange(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {query && (
              <button
                aria-label="Hapus pencarian"
                className="grid h-9 w-9 place-items-center rounded-xl text-text-muted transition hover:bg-surface-soft hover:text-text-primary"
                type="button"
                onClick={() => {
                  onQueryChange("");
                  setOpen(true);
                }}
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            )}
            <button
              aria-label="Buka daftar anggota"
              className="grid h-9 w-9 place-items-center rounded-xl bg-surface-soft text-text-primary transition hover:bg-soft-gold/20"
              type="button"
              onClick={() => setOpen((value) => !value)}
            >
              <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} strokeWidth={1.8} />
            </button>
          </div>
        </span>
      </label>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-[12] overflow-hidden rounded-[1.35rem] border border-border-soft bg-surface shadow-warm"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border-soft bg-surface-soft/70 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
                {filteredMembers.length ? `${filteredMembers.length} hasil` : "Tidak ada hasil"}
              </p>
              {selectedMember && (
                <span className="max-w-[12rem] truncate rounded-full bg-background px-3 py-1 text-xs font-bold text-warm-brown">
                  {selectedMember.displayName || selectedMember.fullName}
                </span>
              )}
            </div>
            <div className="max-h-[19rem] overflow-y-auto p-2">
              {visibleMembers.length ? (
                visibleMembers.map((member) => {
                  const selected = member.id === selectedId;
                  return (
                    <button
                      key={member.id}
                      className={`group grid w-full grid-cols-[40px_minmax(0,1fr)_24px] items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                        selected ? "bg-dark-green text-white" : "text-text-primary hover:bg-surface-soft"
                      }`}
                      type="button"
                      onClick={() => {
                        onSelect(member.id);
                        setOpen(false);
                      }}
                    >
                      <span
                        className={`grid h-10 w-10 place-items-center rounded-full text-xs font-extrabold ${
                          selected ? "bg-white text-dark-green" : "bg-sage-green/12 text-dark-green"
                        }`}
                      >
                        {getInitials(member.displayName || member.fullName)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">
                          {member.displayName || member.fullName}
                        </span>
                        <span
                          className={`mt-0.5 block truncate text-xs font-semibold ${
                            selected ? "text-white/75" : "text-text-muted"
                          }`}
                        >
                          Generasi {member.generation} - {member.statusLabel}
                        </span>
                      </span>
                      {selected && <Check className="h-5 w-5" strokeWidth={2} />}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-7 text-center">
                  <p className="text-sm font-bold text-text-primary">Nama tidak ditemukan</p>
                  <p className="mt-1 text-xs leading-5 text-text-muted">
                    Coba ketik nama lain atau pilih keluarga yang berbeda.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
