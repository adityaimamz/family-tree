import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Camera,
  Check,
  Copy,
  Edit3,
  FileText,
  Loader2,
  Lock,
  Network,
  Save,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MemberFormModal } from "../components/forms/MemberFormModal";
import { Badge, EmptyState, InitialsAvatar, PageShell, PrimaryButton, SecondaryButton, SectionHeader, iconStroke, pageTransition } from "../components/ui";
import { useSpaceStore } from "../hooks/useSpaceStore";
import { apiErrorMessage, spaceFetch } from "../lib/api";
import type { BiographyGenerationResult, FamilyMember, GalleryItem, TimelineEvent } from "../types/family";
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

const biographyToneOptions = [
  { value: "warm", label: "Warm Story", description: "Emotional and family-friendly narrative" },
  { value: "concise", label: "Short Bio", description: "Concise archive summary" },
  { value: "legacy", label: "Legacy Style", description: "Formal heritage-style biography" },
] as const;

type BiographyTone = (typeof biographyToneOptions)[number]["value"];

// Format notes for AI biography generation - clean and user-friendly
const formatMemberContext = (member: FamilyMember) => {
  const parts: string[] = [];
  
  // Use existing notes if meaningful
  if (member.notes && member.notes.trim().length > 10) {
    parts.push(member.notes.trim());
  }
  
  // Add key facts in user-friendly format
  const facts: string[] = [];
  if (member.birthDate) facts.push(`Born: ${member.birthDate}`);
  if (member.birthPlace) facts.push(`Birthplace: ${member.birthPlace}`);
  if (member.relationshipToRoot && member.relationshipToRoot !== "root") {
    facts.push(`Family role: ${member.relationshipToRoot}`);
  }
  if (member.statusLabel) facts.push(`Status: ${member.statusLabel}`);
  
  if (facts.length > 0) {
    parts.push(facts.join(" | "));
  }
  
  // Use existing biography as additional context if available
  if (member.biography && member.biography.trim().length > 20 && !member.biography.includes("Seed Sprint")) {
    parts.push(`Existing biography: ${member.biography.trim()}`);
  }
  
  return parts.join("\n\n");
};

const defaultBiographyNotes = (member: FamilyMember) => formatMemberContext(member);

const slugFrom = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72);

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
  const { members, timeline, gallery, canEdit, saveMember, addToast } = useSpaceStore();
  const member = members.find((item) => item.id === memberId);
  const [biographyNotes, setBiographyNotes] = useState("");
  const [biographyTone, setBiographyTone] = useState<BiographyTone>("warm");
  const [biographyResult, setBiographyResult] = useState<BiographyGenerationResult | null>(null);
  const [biographyError, setBiographyError] = useState("");
  const [isGeneratingBiography, setIsGeneratingBiography] = useState(false);
  const [isSavingBiography, setIsSavingBiography] = useState(false);
  const [isSavingStoryDraft, setIsSavingStoryDraft] = useState(false);
  const [hasCopiedBiography, setHasCopiedBiography] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!member) return;
    setBiographyNotes(defaultBiographyNotes(member));
    setBiographyResult(null);
    setBiographyError("");
    setHasCopiedBiography(false);
  }, [member?.id]);

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
  const canSaveAiDraft = canEdit();
  const generatedBiography = biographyResult?.biographyDraft.trim() ?? "";
  const generateBiography = async () => {
    if (!spaceSlug) return;
    const notes = biographyNotes.trim();
    if (!notes) {
      setBiographyError("Add short notes before generating a biography draft.");
      return;
    }

    setIsGeneratingBiography(true);
    setBiographyError("");
    setBiographyResult(null);
    setHasCopiedBiography(false);
    try {
      const response = await spaceFetch(spaceSlug, "/ai/generate-biography", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          notes,
          tone: biographyTone,
        }),
      });

      if (!response.ok) throw new Error(await apiErrorMessage(response, "Failed to generate biography."));
      const result = (await response.json()) as BiographyGenerationResult;
      setBiographyResult(result);
      addToast(
        result.source === "ai" ? "Biography draft generated" : "Biography fallback draft generated",
        "info",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate biography.";
      setBiographyError(message);
      addToast(message, "error");
    } finally {
      setIsGeneratingBiography(false);
    }
  };
  const copyBiography = async () => {
    if (!generatedBiography) return;
    try {
      await navigator.clipboard.writeText(generatedBiography);
      setHasCopiedBiography(true);
      addToast("Biography draft copied", "success");
      window.setTimeout(() => setHasCopiedBiography(false), 2200);
    } catch {
      setBiographyError("Clipboard access was blocked by the browser.");
      addToast("Clipboard access was blocked", "error");
    }
  };
  const saveBiographyDraft = async () => {
    if (!generatedBiography || !canSaveAiDraft) return;
    setIsSavingBiography(true);
    try {
      await saveMember({ ...member, biography: generatedBiography }, member.id);
    } finally {
      setIsSavingBiography(false);
    }
  };
  const saveStoryDraft = async () => {
    if (!spaceSlug || !generatedBiography || !canSaveAiDraft) return;
    setIsSavingStoryDraft(true);
    setBiographyError("");
    try {
      const storyId = slugFrom(`${member.fullName}-ai-biography-${Date.now()}`) || `ai-biography-${Date.now()}`;
      const response = await spaceFetch(spaceSlug, "/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: storyId,
          title: `${member.displayName || member.fullName} biography draft`,
          content: generatedBiography,
          status: "draft",
          relatedMemberIds: [member.id],
          sourceNoteIds: [],
        }),
      });

      if (!response.ok) throw new Error(await apiErrorMessage(response, "Failed to save story draft."));
      addToast("Story draft saved", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save story draft.";
      setBiographyError(message);
      addToast(message, "error");
    } finally {
      setIsSavingStoryDraft(false);
    }
  };

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
                {member.relationshipToRoot === "Tokoh Awal" ? "Family Founder · Root Person" : 
                 member.relationshipToRoot === "Pasangan" ? "Spouse · Life Partner" :
                 member.relationshipToRoot === "Anak" ? "Child · Next Generation" :
                 member.relationshipToRoot === "Cucu" ? "Grandchild · Current Generation" :
                 member.relationshipToRoot === "Menantu" ? "In-Law · Family Connector" :
                 member.relationshipToRoot || "Family Member"}
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
                  Lihat di Pohon
                </PrimaryButton>
                <SecondaryButton to={`/app/${spaceSlug}/tree`}>
                  <Users className="h-4 w-4" strokeWidth={iconStroke} />
                  Lihat Keluarga Dekat
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

        <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
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
                  description="Add short notes or generate an AI draft to start preserving this family member's story."
                />
              </div>
            )}
          </div>

          <aside className="relative overflow-hidden rounded-[2rem] border border-dark-green/15 bg-[linear-gradient(145deg,hsl(var(--dark-green))_0%,hsl(var(--warm-brown))_120%)] p-6 text-white shadow-[0_24px_70px_-42px_rgba(45,68,43,0.82)]">
            <div className="pointer-events-none absolute inset-0 archive-grid opacity-[0.08]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-white/70">AI Biography Assistant</p>
                  <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">Turn verified family notes into a warm biography draft.</h2>
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20">
                  <Sparkles className="h-5 w-5" strokeWidth={iconStroke} />
                </span>
              </div>
              <p className="mt-4 text-sm font-medium leading-6 text-white/76">
                AI only drafts from notes and archive data provided. Review before saving.
              </p>
              
              {/* Data source summary */}
              <div className="mt-4 rounded-[1rem] border border-white/12 bg-white/6 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/50 mb-2">Data used:</p>
                <div className="text-xs font-semibold text-white/70 space-y-1">
                  <p>• Name: {member.fullName}</p>
                  {member.birthDate && <p>• Birth Year: {member.birthDate}</p>}
                  {member.birthPlace && <p>• Birth Place: {member.birthPlace}</p>}
                  <p>• Role: {member.relationshipToRoot}</p>
                  <p>• Generation: {member.generation}</p>
                  <p>• Branch: {member.familyBranch}</p>
                  <p>• Timeline: {relatedTimeline.length} related milestones</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-white/70">
                    Short Notes
                  </span>
                  <textarea
                    className="min-h-36 w-full resize-y rounded-[1.15rem] border border-white/18 bg-white/10 p-4 text-sm font-semibold leading-6 text-white outline-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] transition placeholder:text-white/46 hover:border-white/30 hover:bg-white/12 focus:border-white/45 focus:ring-4 focus:ring-white/10"
                    value={biographyNotes}
                    onChange={(event) => setBiographyNotes(event.target.value)}
                    placeholder="Example: Born in Padang in 1930. Known as a calm and responsible leader. Always maintained family harmony."
                  />
                </label>

                <div>
                  <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-white/70">
                    Tone
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {biographyToneOptions.map((option) => {
                      const selected = biographyTone === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`min-h-10 rounded-2xl border px-3 text-xs font-extrabold transition active:translate-y-[1px] ${
                            selected
                              ? "border-white bg-white text-dark-green"
                              : "border-white/16 bg-white/8 text-white/78 hover:bg-white/12 hover:text-white"
                          }`}
                          onClick={() => setBiographyTone(option.value)}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isGeneratingBiography || !biographyNotes.trim()}
                  className="group flex min-h-13 w-full items-center justify-center gap-3 rounded-[1.15rem] border border-white/35 bg-white px-4 py-3 text-sm font-extrabold text-dark-green shadow-[0_20px_42px_-28px_rgba(255,255,255,0.86)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-soft-gold active:translate-y-[1px] disabled:cursor-not-allowed disabled:border-white/22 disabled:bg-white/70 disabled:text-dark-green/65 disabled:shadow-none"
                  onClick={() => void generateBiography()}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-dark-green/10 text-dark-green">
                    {isGeneratingBiography ? (
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={iconStroke} />
                    ) : (
                      <Sparkles className="h-4 w-4" strokeWidth={iconStroke} />
                    )}
                  </span>
                  {isGeneratingBiography ? "Generating..." : "Generate Biography Draft"}
                </button>
              </div>

              {biographyError && (
                <div className="mt-4 rounded-[1.15rem] border border-warning/30 bg-warning/18 p-4 text-sm font-bold leading-6 text-white">
                  {biographyError}
                </div>
              )}

              {biographyResult ? (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 24 }}
                  className="mt-5 rounded-[1.25rem] border border-white/16 bg-white/10 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.14)]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-soft-gold/35 bg-soft-gold/18 px-3 py-1 text-xs font-extrabold text-soft-gold">
                      {biographyResult.source === "ai" ? "AI Draft" : "Auto Draft"}
                    </span>
                    <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-extrabold text-white/78">
                      Review before saving
                    </span>
                  </div>
                  <p className="mt-4 whitespace-pre-line text-sm font-semibold leading-7 text-white/90">
                    {biographyResult.biographyDraft}
                  </p>
                  <p className="mt-4 flex items-start gap-2 rounded-[1rem] border border-white/12 bg-white/8 p-3 text-xs font-bold leading-5 text-white/76">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-soft-gold" strokeWidth={iconStroke} />
                    AI only drafts from notes and archive data provided. Review before saving.
                  </p>
                  <p className="mt-3 text-xs font-semibold leading-5 text-white/56">{biographyResult.fallbackNote}</p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/18 bg-white/10 px-3 text-xs font-extrabold text-white transition hover:bg-white/16 active:translate-y-[1px]"
                      onClick={() => void copyBiography()}
                    >
                      {hasCopiedBiography ? (
                        <Check className="h-4 w-4 text-soft-gold" strokeWidth={iconStroke} />
                      ) : (
                        <Copy className="h-4 w-4" strokeWidth={iconStroke} />
                      )}
                      {hasCopiedBiography ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      disabled={!canSaveAiDraft || isSavingBiography}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/18 bg-white/10 px-3 text-xs font-extrabold text-white transition hover:bg-white/16 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-55"
                      onClick={() => void saveBiographyDraft()}
                    >
                      {isSavingBiography ? (
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={iconStroke} />
                      ) : canSaveAiDraft ? (
                        <Save className="h-4 w-4" strokeWidth={iconStroke} />
                      ) : (
                        <Lock className="h-4 w-4" strokeWidth={iconStroke} />
                      )}
                      Save Biography
                    </button>
                    <button
                      type="button"
                      disabled={!canSaveAiDraft || isSavingStoryDraft}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/18 bg-white/10 px-3 text-xs font-extrabold text-white transition hover:bg-white/16 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-55"
                      onClick={() => void saveStoryDraft()}
                    >
                      {isSavingStoryDraft ? (
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={iconStroke} />
                      ) : canSaveAiDraft ? (
                        <FileText className="h-4 w-4" strokeWidth={iconStroke} />
                      ) : (
                        <Lock className="h-4 w-4" strokeWidth={iconStroke} />
                      )}
                      Save Story Draft
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="mt-5 rounded-[1.15rem] border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/58">Draft Workspace</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/76">
                    Generate a draft from verified notes, then copy or save after review.
                  </p>
                  {!canSaveAiDraft && (
                    <p className="mt-3 flex items-start gap-2 text-xs font-bold leading-5 text-white/64">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={iconStroke} />
                      Only owners and admins can save generated drafts.
                    </p>
                  )}
                </div>
              )}
            </div>
          </aside>
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
