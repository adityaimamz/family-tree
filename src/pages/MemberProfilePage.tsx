import { motion } from "framer-motion";
import { ArrowLeft, Edit3, Network, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge, InitialsAvatar, PageShell, PrimaryButton, SecondaryButton, SectionHeader, pageTransition } from "../components/ui";
import { useFamilyStore } from "../hooks/useFamilyStore";
import { displayStatus, generationLabel, getParents, relationDetails, relationNames } from "../utils/family";

const emptyLabel = "Belum tercatat";

const hasValue = (value: any) => {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return !!(value.id || value.name);
  return typeof value === "string" && value.trim().length > 0 && value !== emptyLabel && value !== "Tidak tercatat wafat";
};

const InfoCard = ({ label, value }: { label: string; value: string | { id: string; name: string } | (string | { id: string; name: string })[] | null | undefined }) => {
  if (!hasValue(value)) return null;
  const items = Array.isArray(value) ? value : [value as any];
  return (
    <div className="rounded-[1.6rem] border border-border-soft bg-surface p-5 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sage-green">{label}</p>
      <div className="mt-3 space-y-1 text-sm font-semibold leading-6 text-text-primary">
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

export const MemberProfilePage = () => {
  const { id } = useParams();
  const { members } = useFamilyStore();
  const member = members.find((item) => item.id === id);

  if (!member) {
    return (
      <PageShell>
        <SectionHeader 
          title="Data keluarga tidak ditemukan" 
          description="Data anggota yang dibuka belum tersedia di arsip lokal." 
        />
        <SecondaryButton to="/anggota">Kembali ke Anggota</SecondaryButton>
      </PageShell>
    );
  }

  const parents = getParents(member, members);
  const spouses = relationDetails(member.spouseIds, members);
  const formerSpouses = relationDetails(member.formerSpouseIds, members);
  const children = relationDetails(member.childrenIds, members);
  const siblings = relationDetails(member.siblingIds, members);

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <Link 
          className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-text-muted hover:bg-surface-soft" 
          to="/anggota"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          Kembali ke Anggota
        </Link>
        <section className="rounded-[2.4rem] border border-border-soft bg-surface p-6 shadow-warm md:p-8">
          <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
            <InitialsAvatar member={member} size="lg" />
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="gold">{generationLabel(member.generation)}</Badge>
                <Badge tone={member.isDeceased ? "muted" : "sage"}>{displayStatus(member)}</Badge>
                <Badge tone="brown">{member.familyBranch}</Badge>
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-text-primary md:text-5xl">
                {member.fullName}
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-text-muted">
                {member.relationshipToRoot}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <PrimaryButton to="/silsilah">
                  <Network className="h-4 w-4" strokeWidth={1.8} />
                  Lihat di Pohon
                </PrimaryButton>
                <SecondaryButton to="/silsilah">
                  <Users className="h-4 w-4" strokeWidth={1.8} />
                  Lihat Keluarga Dekat
                </SecondaryButton>
                <SecondaryButton to="/admin/members">
                  <Edit3 className="h-4 w-4" strokeWidth={1.8} />
                  Edit Data
                </SecondaryButton>
              </div>
            </div>
          </div>
        </section>
        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard label="Ayah" value={parents.father ? { id: parents.father.id, name: parents.father.fullName } : null} />
          <InfoCard label="Ibu" value={parents.mother ? { id: parents.mother.id, name: parents.mother.fullName } : null} />
          <InfoCard label="Pasangan" value={spouses} />
          <InfoCard label="Mantan Pasangan" value={formerSpouses} />
          <InfoCard label="Anak" value={children} />
          <InfoCard label="Saudara Kandung" value={siblings} />
          <InfoCard label="Generasi" value={generationLabel(member.generation)} />
          <InfoCard label="Lahir" value={member.birthDate} />
          <InfoCard label="Tanggal Menikah" value={member.marriageDate} />
          <InfoCard label="Wafat" value={member.deathDate ?? (member.isDeceased ? member.deceasedLabel ?? "Wafat" : null)} />
          <InfoCard label="Tempat Lahir" value={member.birthPlace} />
          <InfoCard label="Cabang Keluarga" value={member.familyBranch} />
        </section>
        <section className="mt-6 rounded-[2rem] border border-border-soft bg-surface p-6 shadow-soft md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-sage-green">Biografi</p>
          <div className="mt-4 max-w-4xl text-base leading-8 text-text-muted">
            <p>{member.biography}</p>
            {member.notes && <p className="mt-4 font-semibold text-warm-brown">{member.notes}</p>}
          </div>
        </section>
      </PageShell>
    </motion.div>
  );
};
