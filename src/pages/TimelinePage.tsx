import { motion } from "framer-motion";
import { Baby, Camera, Check, Copy, Edit3, FileText, Flower2, Heart, Loader2, Lock, Plus, Route, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { TimelineFormModal } from "../components/forms/TimelineFormModal";
import { TimelineItem } from "../components/GalleryTimeline";
import { EmptyState, PageShell, iconStroke, pageTransition } from "../components/ui";
import { useSpaceStore } from "../hooks/useSpaceStore";
import { apiErrorMessage, spaceFetch } from "../lib/api";
import type { TimelineEvent, TimelineStoryGenerationResult } from "../types/family";
import { memberById } from "../utils/family";
import { spaceLabels } from "../utils/spaceDisplay";
import { deriveTimelineEvents, sortTimelineEvents } from "../utils/timeline";

const filterOptions = ["All", "Birth", "Marriage", "Deceased", "Important Event"] as const;

type TimelineFilter = (typeof filterOptions)[number];

type TimelineCardEvent = TimelineEvent & {
  source: "automatic" | "default";
};

const timelineStoryToneOptions = [
  { value: "warm", label: "Warm" },
  { value: "concise", label: "Concise" },
  { value: "legacy", label: "Legacy" },
] as const;

type TimelineStoryTone = (typeof timelineStoryToneOptions)[number]["value"];

const eventMatchesFilter = (event: TimelineEvent, filter: TimelineFilter) => {
  if (filter === "All") return true;
  if (filter === "Important Event") return ["Important Event", "Reunion", "Other"].includes(event.type);
  return event.type === filter;
};

const slugFrom = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72);

export const TimelinePage = () => {
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const { members, timeline, canEdit, addToast } = useSpaceStore();
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<TimelineEvent | null>(null);
  const [timelineStoryTone, setTimelineStoryTone] = useState<TimelineStoryTone>("warm");
  const [timelineStory, setTimelineStory] = useState<TimelineStoryGenerationResult | null>(null);
  const [timelineStoryError, setTimelineStoryError] = useState("");
  const [isGeneratingTimelineStory, setIsGeneratingTimelineStory] = useState(false);
  const [isSavingTimelineStory, setIsSavingTimelineStory] = useState(false);
  const [hasCopiedTimelineStory, setHasCopiedTimelineStory] = useState(false);
  const map = memberById(members);

  const automaticEvents = useMemo<TimelineCardEvent[]>(
    () => deriveTimelineEvents(members).map((event) => ({ ...event, source: "automatic" })),
    [members],
  );

  const defaultEvents = useMemo<TimelineCardEvent[]>(
    () => timeline.map((event) => ({ ...event, isAutomatic: false, source: "default" })),
    [timeline],
  );

  const allEvents = useMemo<TimelineCardEvent[]>(
    () => sortTimelineEvents([...automaticEvents, ...defaultEvents]),
    [automaticEvents, defaultEvents],
  );

  const filteredEvents = useMemo(
    () => allEvents.filter((event) => eventMatchesFilter(event, activeFilter)),
    [activeFilter, allEvents],
  );

  const stats = useMemo(
    () => ({
      kelahiran: allEvents.filter((e) => e.type === "Birth").length,
      pernikahan: allEvents.filter((e) => e.type === "Marriage").length,
      wafat: allEvents.filter((e) => e.type === "Deceased").length,
      photoContext: allEvents.filter((e) => Boolean(e.photo)).length,
    }),
    [allEvents],
  );
  const generatedTimelineStory = timelineStory?.timelineStoryDraft.trim() ?? "";
  const canSaveTimelineStory = canEdit();
  const generateTimelineStory = async () => {
    if (!spaceSlug) return;

    setIsGeneratingTimelineStory(true);
    setTimelineStoryError("");
    setTimelineStory(null);
    setHasCopiedTimelineStory(false);
    try {
      const response = await spaceFetch(spaceSlug, "/ai/generate-timeline-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone: timelineStoryTone }),
      });

      if (!response.ok) throw new Error(await apiErrorMessage(response, "Failed to generate timeline story."));
      const result = (await response.json()) as TimelineStoryGenerationResult;
      setTimelineStory(result);
      addToast(
        result.source === "ai" ? "Timeline story generated" : "Timeline fallback story generated",
        "info",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate timeline story.";
      setTimelineStoryError(message);
      addToast(message, "error");
    } finally {
      setIsGeneratingTimelineStory(false);
    }
  };
  const copyTimelineStory = async () => {
    if (!generatedTimelineStory) return;
    try {
      await navigator.clipboard.writeText(generatedTimelineStory);
      setHasCopiedTimelineStory(true);
      addToast("Timeline story copied", "success");
      globalThis.setTimeout(() => setHasCopiedTimelineStory(false), 2200);
    } catch {
      setTimelineStoryError("Clipboard access was blocked by the browser.");
      addToast("Clipboard access was blocked", "error");
    }
  };
  const saveTimelineStoryDraft = async () => {
    if (!spaceSlug || !generatedTimelineStory || !canSaveTimelineStory) return;
    setIsSavingTimelineStory(true);
    setTimelineStoryError("");
    try {
      const storyId = slugFrom(`timeline-story-${Date.now()}`) || `timeline-story-${Date.now()}`;
      const response = await spaceFetch(spaceSlug, "/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: storyId,
          title: "Family timeline story draft",
          content: generatedTimelineStory,
          status: "draft",
          relatedMemberIds: timelineStory?.memberIds ?? [],
          sourceNoteIds: [],
        }),
      });

      if (!response.ok) throw new Error(await apiErrorMessage(response, "Failed to save story draft."));
      addToast("Timeline story draft saved", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save story draft.";
      setTimelineStoryError(message);
      addToast(message, "error");
    } finally {
      setIsSavingTimelineStory(false);
    }
  };

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <section className="surface-grain relative mb-8 overflow-hidden rounded-[2rem] border border-white/75 bg-[linear-gradient(135deg,hsl(var(--surface))_0%,hsl(var(--background))_58%,hsl(var(--surface-soft))_100%)] p-5 shadow-[0_30px_80px_-50px_rgba(80,54,30,0.85)] ring-1 ring-border-soft/70 sm:p-8 lg:p-10">
          <div className="relative grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)] lg:items-end">
            <div>
              <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.18em] text-sage-green">Living family history</p>
              <h1 className="max-w-6xl font-display text-5xl font-bold leading-[0.96] text-text-primary sm:text-6xl lg:text-7xl">
                Family Timeline
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-text-muted sm:text-lg">
                Connect milestones, photos, biographies, and memories into a timeline that tells the story of your family across generations.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                { Icon: Baby, value: stats.kelahiran, label: "Births" },
                { Icon: Heart, value: stats.pernikahan, label: "Marriages" },
                { Icon: Flower2, value: stats.wafat, label: "Deceased" },
                { Icon: Camera, value: stats.photoContext, label: "Photo context" },
              ].map(({ Icon, value, label }) => (
                <div key={label} className="rounded-[1.35rem] border border-white/75 bg-surface/92 p-4 shadow-soft ring-1 ring-border-soft/60">
                  <Icon className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
                  <p className="mt-4 font-display text-3xl font-bold text-text-primary">{value}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-text-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mb-7 overflow-hidden rounded-[2rem] border border-dark-green/15 bg-[linear-gradient(145deg,hsl(var(--dark-green))_0%,hsl(85_20%_31%)_62%,hsl(var(--warm-brown))_132%)] p-5 text-white shadow-[0_28px_88px_-48px_rgba(45,68,43,0.9)] sm:p-6 lg:p-7">
          <div className="pointer-events-none absolute inset-0 archive-grid opacity-[0.08]" />
          <div className="relative grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(360px,1fr)] xl:items-start">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-white/68">AI Timeline Story</p>
                  <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                    Turn milestones into a readable family journey.
                  </h2>
                </div>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20">
                  <Sparkles className="h-5 w-5" strokeWidth={iconStroke} />
                </span>
              </div>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/76">
                The draft uses timeline records and member milestones from this FamilySpace. Review it before saving as a family story.
              </p>

              <div className="mt-5 grid gap-3 rounded-[1.35rem] border border-white/14 bg-white/8 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <div>
                  <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-white/68">
                    Story tone
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {timelineStoryToneOptions.map((option) => {
                      const selected = timelineStoryTone === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`min-h-10 rounded-2xl border px-3 text-xs font-extrabold transition active:translate-y-[1px] ${
                            selected
                              ? "border-white bg-white text-dark-green"
                              : "border-white/16 bg-white/8 text-white/78 hover:bg-white/12 hover:text-white"
                          }`}
                          onClick={() => setTimelineStoryTone(option.value)}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isGeneratingTimelineStory}
                  className="group flex min-h-13 w-full items-center justify-center gap-3 rounded-[1.15rem] border border-white/35 bg-white px-4 py-3 text-sm font-extrabold text-dark-green shadow-[0_20px_42px_-28px_rgba(255,255,255,0.86)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-soft-gold active:translate-y-[1px] disabled:cursor-wait disabled:border-white/22 disabled:bg-white/75 disabled:text-dark-green/70 disabled:shadow-none"
                  onClick={() => void generateTimelineStory()}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-dark-green/10 text-dark-green">
                    {isGeneratingTimelineStory ? (
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={iconStroke} />
                    ) : (
                      <Route className="h-4 w-4" strokeWidth={iconStroke} />
                    )}
                  </span>
                  {isGeneratingTimelineStory ? "Generating journey" : "Generate timeline story"}
                </button>

                <p className="flex items-start gap-2 text-xs font-bold leading-5 text-white/62">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-soft-gold" strokeWidth={iconStroke} />
                  AI timeline stories stay inside this family space until reviewed.
                </p>
              </div>
            </div>

            <div className="min-w-0">
              {timelineStoryError && (
                <div className="mb-4 rounded-[1.15rem] border border-warning/30 bg-warning/18 p-4 text-sm font-bold leading-6 text-white">
                  {timelineStoryError}
                </div>
              )}

              {timelineStory ? (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 24 }}
                  className="rounded-[1.35rem] border border-white/16 bg-white/10 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.14)] sm:p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-soft-gold/35 bg-soft-gold/18 px-3 py-1 text-xs font-extrabold text-soft-gold">
                      {timelineStory.source === "ai" ? "AI draft" : "Fallback draft"}
                    </span>
                    <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-extrabold text-white/78">
                      {timelineStory.eventCount} events used
                    </span>
                  </div>
                  <p className="dropdown-scroll mt-4 max-h-80 overflow-y-auto pr-2 text-sm font-semibold leading-7 text-white/90">
                    {timelineStory.timelineStoryDraft}
                  </p>
                  <p className="mt-4 flex items-start gap-2 rounded-[1rem] border border-white/12 bg-white/8 p-3 text-xs font-bold leading-5 text-white/76">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-soft-gold" strokeWidth={iconStroke} />
                    {timelineStory.privacyReminder}
                  </p>
                  <p className="mt-3 text-xs font-semibold leading-5 text-white/56">{timelineStory.fallbackNote}</p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/18 bg-white/10 px-3 text-xs font-extrabold text-white transition hover:bg-white/16 active:translate-y-[1px]"
                      onClick={() => void copyTimelineStory()}
                    >
                      {hasCopiedTimelineStory ? (
                        <Check className="h-4 w-4 text-soft-gold" strokeWidth={iconStroke} />
                      ) : (
                        <Copy className="h-4 w-4" strokeWidth={iconStroke} />
                      )}
                      {hasCopiedTimelineStory ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      disabled={!canSaveTimelineStory || isSavingTimelineStory}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/18 bg-white/10 px-3 text-xs font-extrabold text-white transition hover:bg-white/16 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-55"
                      onClick={() => void saveTimelineStoryDraft()}
                    >
                      {isSavingTimelineStory ? (
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={iconStroke} />
                      ) : canSaveTimelineStory ? (
                        <FileText className="h-4 w-4" strokeWidth={iconStroke} />
                      ) : (
                        <Lock className="h-4 w-4" strokeWidth={iconStroke} />
                      )}
                      Save story draft
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="rounded-[1.35rem] border border-white/14 bg-white/8 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-white/58">Draft workspace</p>
                  <p className="mt-3 text-sm font-semibold leading-7 text-white/76">
                    Generate a narrative from recorded milestones, then copy it or save it as a draft in Stories.
                  </p>
                  {!canSaveTimelineStory && (
                    <p className="mt-4 flex items-start gap-2 text-xs font-bold leading-5 text-white/64">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={iconStroke} />
                      Only owners and admins can save generated stories.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mb-7 flex flex-col gap-3 rounded-[1.6rem] border border-white/75 bg-surface/92 p-2 shadow-soft ring-1 ring-border-soft/60 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm font-bold transition active:translate-y-[1px] \${
                  activeFilter === filter
                    ? "border-dark-green bg-dark-green text-white shadow-warm"
                    : "border-transparent bg-transparent text-text-muted hover:bg-surface-soft hover:text-text-primary"
                }`}
                type="button"
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          {canEdit() && (
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
              type="button"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" strokeWidth={iconStroke} />
              Add memory event
            </button>
          )}
        </div>

        {filteredEvents.length ? (
          <div className="relative grid gap-8 before:absolute before:left-[170px] before:top-2 before:hidden before:h-full before:w-px before:bg-border-soft md:before:block">
            {filteredEvents.map((event) => {
              const relatedIds = event.relatedMemberIds ?? event.memberIds ?? [];
              const relatedMembers = relatedIds.map((id) => map[id]).filter(Boolean);

              return (
                <div key={`\${event.source}-\${event.id}`}>
                  <TimelineItem
                    event={event}
                    memberNames={relatedMembers.map((member) => member.displayName ?? member.fullName)}
                    relatedMembers={relatedMembers}
                    sourceLabel={event.source === "default" ? "Admin" : "Automatic"}
                  />
                  {canEdit() && event.source === "default" && (
                    <button
                      className="ml-0 mt-3 inline-flex min-h-10 items-center gap-2 rounded-2xl border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary shadow-soft transition hover:bg-surface-soft md:ml-[190px]"
                      type="button"
                      onClick={() => setEventToEdit(event)}
                    >
                      <Edit3 className="h-4 w-4 text-sage-green" strokeWidth={iconStroke} />
                      Edit Event
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={spaceLabels.emptyTimelineTitle}
            description="Add births, weddings, moves, reunions, and photo-backed milestones so the archive can tell a family journey."
          />
        )}
        <TimelineFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
        <TimelineFormModal open={Boolean(eventToEdit)} event={eventToEdit} onClose={() => setEventToEdit(null)} />
      </PageShell>
    </motion.div>
  );
};
