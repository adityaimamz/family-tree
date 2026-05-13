import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Camera,
  Edit3,
  FileText,
  Network,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MemberFormModal } from "../components/forms/MemberFormModal";
import { AIBiographyStudio } from "../components/ai";
import { Badge, EmptyState, InitialsAvatar, PageShell, PrimaryButton, SecondaryButton, SectionHeader, iconStroke, pageTransition } from "../components/ui";
import { useSpaceStore } from "../hooks/useSpaceStore";
import type { FamilyMember, GalleryItem, TimelineEvent } from "../types/family";
import { displayStatus, generationLabel, getParents, getRelationshipLabel, relationDetails } from "../utils/family";
import { deriveTimelineEvents, sortTimelineEvents } from "../utils/timeline";

const emptyLabel = "Belum tercatat";

type LinkedValue = string | { id: string; name: string };

const hasValue = (value: LinkedValue | LinkedValue[] | null | undefined) => {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Boolean(value.id || value.name);
  return value.trim().length > 0 && value !== emptyLabel && value !== "Death not recorded";
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
          if (typeof item === "string") return <p key={item}>{item}</p>;
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
  const { members, timeline, gallery, canEdit, saveMember, addToast, membership } = useSpaceStore();
  const member = members.find((item) => item.id === memberId);
  const [editOpen, setEditOpen] = useState(false);

  if (!member) {
    return (
      <PageShell>
        <SectionHeader
          title="Family data not found"
          description="The member data you opened is not available in the local archive."
        />
        <SecondaryButton to={`/app/${spaceSlug}/members`}>Back to Members</SecondaryButton>
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
  const relationshipLabel = getRelationshipLabel(member.relationshipToRoot);
  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <Link
          className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-text-muted hover:bg-surface-soft"
          to={`/app/${spaceSlug}/members`}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={iconStroke} />
          Back to Members
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
                {relationshipLabel}
              </p>
              {/* Archive Summary */}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-text-muted">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-sage-green" strokeWidth={iconStroke} />
                  {spouses.length} spouse{spouses.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-sage-green" strokeWidth={iconStroke} />
                  {children.length} child{children.length !== 1 ? "ren" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-sage-green" strokeWidth={iconStroke} />
                  {relatedTimeline.length} milestone{relatedTimeline.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-sage-green" strokeWidth={iconStroke} />
                  {relatedPhotos.length} photo{relatedPhotos.length !== 1 ? "s" : ""}
                </span>
                <span className={`flex items-center gap-1.5 ${biography ? "text-soft-gold" : "text-text-muted/60"}`}>
                  <FileText className="h-4 w-4" strokeWidth={iconStroke} />
                  {biography ? "Biography saved" : "No biography yet"}
                </span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <PrimaryButton to={`/app/${spaceSlug}/tree`}>
                  <Network className="h-4 w-4" strokeWidth={iconStroke} />
                  View in Tree
                </PrimaryButton>
                <SecondaryButton to={`/app/${spaceSlug}/tree`}>
                  <Users className="h-4 w-4" strokeWidth={iconStroke} />
                  View Close Family
                </SecondaryButton>
                {canEdit() && (
                  <SecondaryButton onClick={() => setEditOpen(true)}>
                    <Edit3 className="h-4 w-4" strokeWidth={iconStroke} />
                    Edit Data
                  </SecondaryButton>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard label="Father" value={parents.father ? { id: parents.father.id, name: parents.father.fullName } : null} />
          <InfoCard label="Mother" value={parents.mother ? { id: parents.mother.id, name: parents.mother.fullName } : null} />
          <InfoCard label="Spouse" value={spouses} />
          <InfoCard label="Former Spouse" value={formerSpouses} />
          <InfoCard label="Children" value={children} />
          <InfoCard label="Siblings" value={siblings} />
          <InfoCard label="Generation" value={generationLabel(member.generation)} />
          <InfoCard label="Birth Year" value={member.birthDate ? member.birthDate : null} />
          <InfoCard label="Marriage Year" value={member.marriageDate ? member.marriageDate : null} />
          <InfoCard label="Death" value={member.deathDate ?? (member.isDeceased ? member.deceasedLabel ?? "Deceased" : null)} />
          <InfoCard label="Birth Place" value={member.birthPlace} />
          <InfoCard label="Family Branch" value={member.familyBranch} />
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-white/75 bg-surface/95 p-6 shadow-soft ring-1 ring-border-soft/60 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-sage-green">Biography</p>
                <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-text-primary">Family Biography</h2>
              </div>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sage-green/12 text-dark-green">
                <BookOpen className="h-5 w-5" strokeWidth={iconStroke} />
              </span>
            </div>
            {biography ? (
              <div className="mt-5 max-w-4xl text-base leading-8 text-text-muted">
                <p>{biography}</p>
                {notes && <p className="mt-4 text-sm leading-7 text-warm-brown italic border-l-2 border-warm-brown/30 pl-4">{notes}</p>}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="No biography saved yet"
                  description="Edit Biography or add short notes to generate an AI draft to start preserving this family member's story."
                />
              </div>
            )}
          </div>

          <AIBiographyStudio
            member={member}
            spaceSlug={spaceSlug || ""}
            role={membership?.role ?? null}
            panelId="ai-studio-biography"
            onSaveMember={saveMember}
            addToast={addToast}
          />
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-white/75 bg-surface/95 p-6 shadow-soft ring-1 ring-border-soft/60">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-sage-green">Timeline</p>
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
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-sage-green">Photo Memories</p>
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
                description="Connect this person to a gallery photo so their visual memories appear here."
              />
            )}
          </div>
        </section>
        <MemberFormModal open={editOpen} member={member} onClose={() => setEditOpen(false)} />
      </PageShell>
    </motion.div>
  );
};
