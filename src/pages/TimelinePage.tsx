import { motion } from "framer-motion";
import { Baby, Edit3, Flower2, Heart, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { TimelineFormModal } from "../components/forms/TimelineFormModal";
import { TimelineItem } from "../components/GalleryTimeline";
import { EmptyState, PageShell, iconStroke, pageTransition } from "../components/ui";
import { familyConfig } from "../config";
import { useSpaceStore } from "../hooks/useSpaceStore";
import type { TimelineEvent } from "../types/family";
import { memberById } from "../utils/family";
import { deriveTimelineEvents, sortTimelineEvents } from "../utils/timeline";

const filterOptions = ["Semua", "Kelahiran", "Pernikahan", "Wafat", "Peristiwa Penting"] as const;

type TimelineFilter = (typeof filterOptions)[number];

type TimelineCardEvent = TimelineEvent & {
  source: "automatic" | "default";
};

const eventMatchesFilter = (event: TimelineEvent, filter: TimelineFilter) => {
  if (filter === "Semua") return true;
  if (filter === "Peristiwa Penting") return ["Peristiwa Penting", "Reuni", "Lainnya"].includes(event.type);
  return event.type === filter;
};

export const TimelinePage = () => {
  const { members, timeline, canEdit } = useSpaceStore();
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>("Semua");
  const [createOpen, setCreateOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<TimelineEvent | null>(null);
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
      kelahiran: allEvents.filter((e) => e.type === "Kelahiran").length,
      pernikahan: allEvents.filter((e) => e.type === "Pernikahan").length,
      wafat: allEvents.filter((e) => e.type === "Wafat").length,
    }),
    [allEvents],
  );

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <section className="surface-grain relative mb-8 overflow-hidden rounded-[2rem] border border-white/75 bg-[linear-gradient(135deg,hsl(var(--surface))_0%,hsl(var(--background))_58%,hsl(var(--surface-soft))_100%)] p-5 shadow-[0_30px_80px_-50px_rgba(80,54,30,0.85)] ring-1 ring-border-soft/70 sm:p-8 lg:p-10">
          <div className="relative grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)] lg:items-end">
            <div>
              <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.18em] text-sage-green">Cerita keluarga</p>
              <h1 className="max-w-6xl font-display text-5xl font-bold leading-[0.96] text-text-primary sm:text-6xl lg:text-7xl">
                {familyConfig.site.timelineTitle}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-text-muted sm:text-lg">
                {familyConfig.site.timelineDescription}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { Icon: Baby, value: stats.kelahiran, label: "Kelahiran" },
                { Icon: Heart, value: stats.pernikahan, label: "Pernikahan" },
                { Icon: Flower2, value: stats.wafat, label: "Wafat" },
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

        <div className="mb-7 flex flex-col gap-3 rounded-[1.6rem] border border-white/75 bg-surface/92 p-2 shadow-soft ring-1 ring-border-soft/60 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm font-bold transition active:translate-y-[1px] ${
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
              Tambah Event
            </button>
          )}
        </div>

        {filteredEvents.length ? (
          <div className="relative grid gap-8 before:absolute before:left-[170px] before:top-2 before:hidden before:h-full before:w-px before:bg-border-soft md:before:block">
            {filteredEvents.map((event) => {
              const relatedIds = event.relatedMemberIds ?? event.memberIds ?? [];
              const relatedMembers = relatedIds.map((id) => map[id]).filter(Boolean);

              return (
                <div key={`${event.source}-${event.id}`}>
                  <TimelineItem
                    event={event}
                    memberNames={relatedMembers.map((member) => member.displayName ?? member.fullName)}
                    relatedMembers={relatedMembers}
                    sourceLabel={event.source === "default" ? "Admin" : "Otomatis"}
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
          <EmptyState title={familyConfig.labels.emptyTimelineTitle} description={familyConfig.labels.emptyTimelineDescription} />
        )}
        <TimelineFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
        <TimelineFormModal open={Boolean(eventToEdit)} event={eventToEdit} onClose={() => setEventToEdit(null)} />
      </PageShell>
    </motion.div>
  );
};
