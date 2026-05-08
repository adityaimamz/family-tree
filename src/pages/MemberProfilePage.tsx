import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Camera,
  Edit3,
  Lock,
  Network,
  Sparkles,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge, EmptyState, InitialsAvatar, PageShell, PrimaryButton, SecondaryButton, SectionHeader, iconStroke, pageTransition } from "../components/ui";
import { useSpaceStore } from "../hooks/useSpaceStore";
import type { FamilyMember, GalleryItem, TimelineEvent } from "../types/family";
import { displayStatus, generationLabel, getParents, relationDetails } from "../utils/family";
import { deriveTimelineEvents, sortTimelineEvents } from "../utils/timeline";

const emptyLabel = "Belum tercatat";

type LinkedValue = string | { id: string; name: string };

const hasValue = (value: LinkedValue | LinkedValue[] | null | undefined) => {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Boolean(value.id || value.name);
  return value.trim().length > 0 && value !== emptyLabel && value !== "Tidak tercatat wafat";
};

const InfoCard = ({
  label,
  value,
}: {
  label: string;
  value: LinkedValue | LinkedValue[] | null | undefined;
}) => {
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  if (!hasValue(value)) return null;
  const items = (Array.isArray(value) ? value : [value]).filter(Boolean) as LinkedValue[];

  return (
    <div className="rounded-[1.45rem] border border-border-soft bg-surface p-5 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sage-green">{label}</p>
      <div className="mt-3 space-y-1 text-sm font-semibold leading-6 text-text-primary">
        {items.map((item, index) => {
          if (typeof item === "string") return <p key={index}>{item}</p>;
          return (
            <Link
              key={item.id}
              to={`/app/${spaceSlug}/members/${item.id}`}
              className="block text-dark-green transition hover:text-sage-green hover:underline"
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const eventIncludesMember = (event: TimelineEvent, memberId: string) => {
  const ids = event.relatedMemberIds ?? event.memberIds ?? [];
  return ids.includes(memberId);
};

const galleryMentionsMember = (item: GalleryItem, member: FamilyMember) => {
  const needles = [member.fullName, member.displayName, member.relationshipToRoot]
    .filter(Boolean)
    .map((value) => value.toLowerCase());
  const haystack = [item.title, item.event, item.familyGroup, item.description].filter(Boolean).join(" ").toLowerCase();
  return needles.some((value) => value.length > 2 && haystack.includes(value));
};

const RelatedTimelineCard = ({ event }: { event: TimelineEvent }) => (
  <article className="rounded-[1.35rem] border border-border-soft bg-background/82 p-4 shadow-soft">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-sage-green">{event.year}</p>
        <h3 className="mt-2 text-base font-extrabold leading-snug text-text-primary">{event.title}</h3>
      </div>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sage-green/12 text-dark-green">
        <Calendar className="h-4 w-4" strokeWidth={iconStroke} />
      </span>
    </div>
    <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-text-muted">{event.description}</p>
    <span className="mt-4 inline-flex rounded-full border border-border-soft bg-surface px-3 py-1 text-xs font-bold text-text-muted">
      {event.type}
    </span>
  </article>
);

const PhotoMemoryCard = ({ item }: { item: GalleryItem }) => (
  <article className="group overflow-hidden rounded-[1.35rem] border border-white/75 bg-surface shadow-soft ring-1 ring-border-soft/60">
    <div className="aspect-[4/3] overflow-hidden bg-surface-soft">
      <img
        alt={`Photo memory ${item.title}`}
        className="h-full w-full object-cover contrast-105 sepia-[0.12] transition duration-700 group-hover:scale-105"
        src={item.image}
      />
    </div>
    <div className="p-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-sage-green">{item.date || item.year}</p>
      <h3 className="mt-2 text-base font-extrabold leading-snug text-text-primary">{item.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-text-muted">{item.description}</p>
    </div>
  </article>
);

export const MemberProfilePage = () => {
  const { memberId, spaceSlug } = useParams<{ memberId: string; spaceSlug: string }>();
  const { members, timeline, gallery, canEdit } = useSpaceStore();
  const member = members.find((item) => item.id === memberId);

  if (!member) {
    return (
      <PageShell>
        <SectionHeader
          title="Data keluarga tidak ditemukan"
          description="Data anggota yang dibuka belum tersedia di arsip lokal."
        />
        <SecondaryButton to={`/app/${spaceSlug}/members`}>Kembali ke Anggota</SecondaryButton>
      </PageShell>
    );
  }

  const parents = getParents(member, members);
  const spouses = relationDetails(member.spouseIds, members);
  const formerSpouses = relationDetails(member.formerSpouseIds, members);
  const children = relationDetails(member.childrenIds, members);
  const siblings = relationDetails(member.siblingIds, members);
  const biography = member.biography.trim();
  const notes = member.notes.trim();
  const allTimelineEvents = sortTimelineEvents([...deriveTimelineEvents(members), ...timeline]);
  const relatedTimeline = allTimelineEvents.filter((event) => eventIncludesMember(event, member.id)).slice(0, 4);
  const relatedPhotos = gallery.filter((item) => galleryMentionsMember(item, member)).slice(0, 4);

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <Link
          className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-text-muted hover:bg-surface-soft"
          to={`/app/${spaceSlug}/members`}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={iconStroke} />
          Kembali ke Anggota
        </Link>

        <section className="surface-grain relative overflow-hidden rounded-[2.2rem] border border-white/75 bg-[linear-gradient(135deg,hsl(var(--surface))_0%,hsl(var(--background))_64%,hsl(var(--surface-soft))_100%)] p-6 shadow-warm ring-1 ring-border-soft/70 md:p-8">
          <div className="relative grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
            <InitialsAvatar member={member} size="lg" />
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="gold">{generationLabel(member.generation)}</Badge>
                <Badge tone={member.isDeceased ? "muted" : "sage"}>{displayStatus(member)}</Badge>
                <Badge tone="brown">{member.familyBranch}</Badge>
              </div>
              <h1 className="mt-4 max-w-5xl font-display text-4xl font-bold leading-tight text-text-primary md:text-5xl">
                {member.fullName}
              </h1>
              <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-text-muted">
                {member.relationshipToRoot || "A family record waiting for more relationship context."}
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-text-muted">
                Preserve the story, relationships, milestones, and photo context connected to this family member.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <PrimaryButton to={`/app/${spaceSlug}/tree`}>
                  <Network className="h-4 w-4" strokeWidth={iconStroke} />
                  Lihat di Pohon
                </PrimaryButton>
                <SecondaryButton to={`/app/${spaceSlug}/tree`}>
                  <Users className="h-4 w-4" strokeWidth={iconStroke} />
                  Lihat Keluarga Dekat
                </SecondaryButton>
                {canEdit() && (
                  <SecondaryButton to={`/app/${spaceSlug}/members`}>
                    <Edit3 className="h-4 w-4" strokeWidth={iconStroke} />
                    Edit Data
                  </SecondaryButton>
                )}
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

        <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[2rem] border border-white/75 bg-surface/95 p-6 shadow-soft ring-1 ring-border-soft/60 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-sage-green">Biography</p>
                <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-text-primary">Life story draft</h2>
              </div>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sage-green/12 text-dark-green">
                <BookOpen className="h-5 w-5" strokeWidth={iconStroke} />
              </span>
            </div>
            {biography || notes ? (
              <div className="mt-5 max-w-4xl text-base leading-8 text-text-muted">
                {biography && <p>{biography}</p>}
                {notes && <p className="mt-4 font-semibold text-warm-brown">{notes}</p>}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="Biography belum ditulis"
                  description="Tambahkan catatan, interview keluarga, atau source notes agar profil ini punya cerita yang bisa diwariskan."
                />
              </div>
            )}
          </div>

          <aside className="relative overflow-hidden rounded-[2rem] border border-dark-green/15 bg-[linear-gradient(145deg,hsl(var(--dark-green))_0%,hsl(var(--warm-brown))_120%)] p-6 text-white shadow-[0_24px_70px_-42px_rgba(45,68,43,0.82)]">
            <div className="pointer-events-none absolute inset-0 archive-grid opacity-[0.08]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-white/70">AI Biography Generator</p>
                  <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">Turn notes into a warm family biography.</h2>
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20">
                  <Sparkles className="h-5 w-5" strokeWidth={iconStroke} />
                </span>
              </div>
              <p className="mt-4 text-sm font-medium leading-6 text-white/76">
                AI drafts stay inside this family space until reviewed.
              </p>
              <button
                type="button"
                disabled
                className="mt-5 flex min-h-14 w-full cursor-not-allowed items-center justify-between gap-4 rounded-[1.15rem] border border-white/15 bg-white/10 px-4 py-3 text-left opacity-90"
                title="Available after the Sprint 6 AI biography endpoint is connected."
              >
                <span>
                  <span className="block text-sm font-extrabold text-white">Generate biography draft</span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-white/65">Endpoint belum aktif.</span>
                </span>
                <Lock className="h-4 w-4 shrink-0 text-white/60" strokeWidth={iconStroke} />
              </button>
              <div className="mt-5 rounded-[1.15rem] border border-white/15 bg-white/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/58">Safe placeholder</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/76">
                  Panel ini hanya entry point UI. Tidak ada fake AI action sampai backend protected endpoint tersedia.
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-white/75 bg-surface/95 p-6 shadow-soft ring-1 ring-border-soft/60">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-sage-green">Timeline appearances</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-text-primary">Milestones connected to this profile</h2>
              </div>
              <Calendar className="h-6 w-6 text-sage-green" strokeWidth={iconStroke} />
            </div>
            {relatedTimeline.length ? (
              <div className="grid gap-3">
                {relatedTimeline.map((event) => (
                  <RelatedTimelineCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No timeline events linked"
                description="Connect this person to a timeline event so the profile shows their role in family milestones."
              />
            )}
          </div>

          <div className="rounded-[2rem] border border-white/75 bg-surface/95 p-6 shadow-soft ring-1 ring-border-soft/60">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-sage-green">Photo memories</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-text-primary">Visual context from the archive</h2>
              </div>
              <Camera className="h-6 w-6 text-sage-green" strokeWidth={iconStroke} />
            </div>
            {relatedPhotos.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {relatedPhotos.map((item) => (
                  <PhotoMemoryCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No photo memories linked"
                description="Mention this member in photo context or connect a gallery item so visual memories appear here."
              />
            )}
          </div>
        </section>
      </PageShell>
    </motion.div>
  );
};
