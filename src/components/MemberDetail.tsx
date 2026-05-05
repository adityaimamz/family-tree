import { AnimatePresence, motion } from "framer-motion";
import { Edit3, Eye, Network, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { FamilyMember } from "../types/family";
import { displayStatus, generationLabel, getParents, relationDetails, relationNames } from "../utils/family";
import { Badge, InitialsAvatar, PrimaryButton, SecondaryButton } from "./ui";

const emptyLabel = "Belum tercatat";

const hasDetailValue = (value: any) => {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return !!(value.id || value.name);
  return typeof value === "string" && value.trim().length > 0 && value !== emptyLabel;
};

const Field = ({ label, value }: { label: string; value: string | { id: string; name: string } | (string | { id: string; name: string })[] | null | undefined }) => {
  if (!hasDetailValue(value)) return null;

  const items = Array.isArray(value) ? value : [value as any];

  return (
    <div className="rounded-2xl border border-border-soft bg-background/65 p-4 shadow-soft">
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <div className="mt-2 space-y-1 text-sm font-semibold leading-6 text-text-primary">
        {items.map((item, index) => {
          if (typeof item === "string") return <p key={index}>{item}</p>;
          if (item && item.id) {
            return (
              <Link key={item.id} to={`/anggota/${item.id}`} className="block text-dark-green transition hover:text-sage-green hover:underline">
                {item.name}
              </Link>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

const DetailContent = ({ member, members, onClose }: { member: FamilyMember; members: FamilyMember[]; onClose: () => void }) => {
  const parents = getParents(member, members);
  const spouses = relationDetails(member.spouseIds, members);
  const formerSpouses = relationDetails(member.formerSpouseIds, members);
  const children = relationDetails(member.childrenIds, members);
  const siblings = relationDetails(member.siblingIds, members);

  return (
    <>
      <header className="sticky top-0 z-[1] border-b border-border-soft/70 bg-surface/96 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <InitialsAvatar member={member} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Badge tone="gold">{generationLabel(member.generation)}</Badge>
                <Badge tone={member.isDeceased ? "muted" : "sage"}>{displayStatus(member)}</Badge>
              </div>
              <h2 className="mt-3 break-words text-xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-2xl">
                {member.fullName}
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-muted">{member.relationshipToRoot || emptyLabel}</p>
            </div>
          </div>
          <button
            aria-label="Tutup detail anggota"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-2xl border border-border-soft bg-background text-text-primary shadow-soft transition hover:bg-surface-soft active:translate-y-[1px]"
            type="button"
            onClick={onClose}
          >
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <div className="px-4 py-5 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama Tampilan" value={member.displayName} />
          {/* <Field label="Jenis Kelamin" value={member.gender} /> */}
          <Field label="Generasi" value={generationLabel(member.generation)} />
          {/* <Field label="Cabang Keluarga" value={member.familyBranch} /> */}
          <Field label="Tanggal Lahir" value={member.birthDate} />
          <Field label="Tempat Lahir" value={member.birthPlace} />
          <Field label="Tanggal Menikah" value={member.marriageDate} />
          <Field label="Tanggal Wafat" value={member.deathDate ?? (member.isDeceased ? member.deceasedLabel : null)} />
          <Field label="Ayah" value={parents.father ? { id: parents.father.id, name: parents.father.fullName } : null} />
          <Field label="Ibu" value={parents.mother ? { id: parents.mother.id, name: parents.mother.fullName } : null} />
          <Field label="Pasangan" value={spouses} />
          <Field label="Mantan Pasangan" value={formerSpouses} />
          <Field label="Anak" value={children} />
          <Field label="Saudara Kandung" value={siblings} />
        </div>

        {(member.biography || member.notes) && (
          <section className="mt-5 rounded-[1.5rem] border border-border-soft bg-background/65 p-4 shadow-soft">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-text-muted">Biografi</p>
            {member.biography && <p className="mt-3 text-sm leading-7 text-text-muted">{member.biography}</p>}
            {member.notes && <p className="mt-3 text-sm font-semibold leading-6 text-warm-brown">{member.notes}</p>}
          </section>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {/* <SecondaryButton>
            <Network className="h-4 w-4" strokeWidth={1.8} />
            Fokuskan di Pohon
          </SecondaryButton>
          <SecondaryButton>
            <Users className="h-4 w-4" strokeWidth={1.8} />
            Lihat Keluarga Inti
          </SecondaryButton> */}
          <PrimaryButton to="/admin/members">
            <Edit3 className="h-4 w-4" strokeWidth={1.8} />
            Edit Data
          </PrimaryButton>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-dark-green transition hover:bg-sage-green/12 active:translate-y-[1px]"
            to={`/anggota/${member.id}`}
          >
            <Eye className="h-4 w-4" strokeWidth={1.8} />
            Lihat Profil Lengkap
          </Link>
        </div>
      </div>
    </>
  );
};

export const MemberDetailModal = ({
  member,
  members,
  onClose,
}: {
  member: FamilyMember | null;
  members: FamilyMember[];
  onClose: () => void;
}) => (
  <AnimatePresence>
    {member && (
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-text-primary/35 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Detail ${member.fullName}`}
          className="surface-grain relative flex max-h-[94dvh] w-full flex-col overflow-y-auto rounded-t-[1.75rem] border border-border-soft bg-surface shadow-warm sm:max-w-4xl sm:rounded-[2rem]"
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 150, damping: 23 }}
          onClick={(event) => event.stopPropagation()}
        >
          <DetailContent member={member} members={members} onClose={onClose} />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const MemberDetailPanel = MemberDetailModal;
export const MemberBottomSheet = MemberDetailModal;
