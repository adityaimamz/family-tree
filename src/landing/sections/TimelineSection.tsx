import { motion } from "framer-motion";
import { Archive, BookOpenText, CalendarDays, Camera, CheckCircle2, Clock3, FileText, MapPin, Users } from "lucide-react";
import { events } from "../lib/data/sections";

const eventIcons = [MapPin, Users, Archive, CalendarDays];

const contextItems = [
  { label: "Biography draft", value: "2 relatives reviewing", icon: BookOpenText },
  { label: "Photo context", value: "18 images attached", icon: Camera },
  { label: "Source notes", value: "6 records linked", icon: FileText },
];

const mediaTiles = [
  { seed: "warisan-timeline-family-1952", alt: "Warm archival family photo on a desk" },
  { seed: "warisan-timeline-notes-1975", alt: "Handwritten notes and old photographs" },
];

export default function TimelineSection() {
  return (
    <section id="timeline" className="relative overflow-hidden bg-bg py-24 lg:py-32">
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,hsl(var(--surface-soft)_/_0.78),transparent)]" />
      <div className="relative mx-auto grid w-full max-w-[1320px] gap-14 px-4 sm:px-6 lg:grid-cols-[minmax(560px,1.14fr)_minmax(0,0.86fr)] lg:items-center lg:gap-16 xl:px-8">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="order-1 lg:order-2"
        >
          <p className="max-w-[42ch] text-sm font-semibold leading-6 text-primary">
            A living family timeline keeps dates, photos, biographies, and source notes connected instead of scattered
            across folders.
          </p>
          <h2 className="mt-5 max-w-[720px] font-body text-4xl font-semibold leading-[1.04] text-ink sm:text-5xl lg:text-6xl">
            Turn scattered memories into a family timeline everyone can follow.
          </h2>
          <p className="mt-6 max-w-[58ch] text-base leading-8 text-ink-secondary">
            Build a chronological workspace where every milestone carries context: who was there, what changed, which
            photos belong with it, and which source notes helped the family confirm the date.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {["Source-linked", "Year-filtered", "Family-reviewed"].map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.08, duration: 0.42 }}
                className="flex items-center gap-3 rounded-[1.25rem] border border-transparent p-2 text-sm font-semibold text-ink-secondary transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-stroke hover:bg-surface/70"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary-muted text-primary">
                  <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />
                </span>
                {item}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 34, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
          className="order-2 rounded-[2.25rem] border border-white/80 bg-white/35 p-1.5 shadow-[0_32px_86px_-56px_rgba(80,54,30,0.92)] ring-1 ring-stroke/50 lg:order-1"
        >
          <div className="overflow-hidden rounded-[calc(2.25rem-0.375rem)] border border-white/80 bg-surface/92 shadow-[inset_0_1px_1px_rgba(255,255,255,0.78)]">
            <div className="flex flex-col gap-4 border-b border-stroke bg-bg-alt/72 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-ink">Family timeline workspace</p>
                <p className="mt-1 text-sm font-medium text-ink-muted">4 milestones connected to profiles, photos, and source records.</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-muted px-3 py-2 text-xs font-semibold text-primary">
                <Clock3 className="h-4 w-4" strokeWidth={1.8} />
                Updated today
              </span>
            </div>

            <div className="grid lg:grid-cols-[118px_minmax(0,1fr)_238px]">
              <aside className="flex gap-2 overflow-x-auto border-b border-stroke bg-bg-alt/56 p-4 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r">
                {events.map((event, index) => (
                  <motion.button
                    key={event.year}
                    type="button"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08, duration: 0.38 }}
                    className={`min-w-24 rounded-2xl border px-3 py-2 text-left transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98] lg:min-w-0 ${
                      index === 1
                        ? "border-primary bg-primary text-surface shadow-[0_16px_34px_-28px_rgba(44,80,22,0.95)]"
                        : "border-stroke bg-surface text-ink-secondary hover:border-primary/35"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{event.year}</span>
                    <span className={`mt-1 block text-[11px] font-medium ${index === 1 ? "text-surface/70" : "text-ink-muted"}`}>
                      Milestone
                    </span>
                  </motion.button>
                ))}
              </aside>

              <div className="bg-[linear-gradient(135deg,hsl(var(--background)),hsl(var(--surface-soft)_/_0.72))] p-5">
                <div className="rounded-[1.65rem] border border-stroke bg-surface/82 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">Milestone path</p>
                      <p className="mt-1 text-xs font-medium text-ink-muted">Events connected to source material</p>
                    </div>
                    <CalendarDays className="h-5 w-5 text-primary" strokeWidth={1.8} />
                  </div>

                  <svg viewBox="0 0 340 120" className="h-auto w-full overflow-visible" aria-hidden="true">
                    <motion.path
                      d="M20 78 C88 18 128 94 174 48 C218 8 244 78 320 36"
                      stroke="hsl(var(--sage-green) / 0.42)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 1.3, ease: "easeOut" }}
                    />
                    <motion.path
                      d="M20 78 C88 18 128 94 174 48 C218 8 244 78 320 36"
                      stroke="hsl(var(--soft-gold))"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.18 }}
                    />
                    {[
                      { x: 20, y: 78 },
                      { x: 110, y: 58 },
                      { x: 204, y: 31 },
                      { x: 320, y: 36 },
                    ].map((node, index) => (
                      <g key={`${node.x}-${node.y}`}>
                        <motion.circle
                          cx={node.x}
                          cy={node.y}
                          r={index === 1 ? 15 : 12}
                          fill={index === 1 ? "hsl(var(--dark-green))" : "hsl(var(--sage-green))"}
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.24 + index * 0.08, type: "spring", stiffness: 180, damping: 16 }}
                        />
                        {index === 1 && (
                          <motion.circle
                            cx={node.x}
                            cy={node.y}
                            r="22"
                            stroke="hsl(var(--soft-gold))"
                            strokeWidth="2"
                            fill="none"
                            animate={{ scale: [0.92, 1, 0.92], opacity: [0.4, 0.88, 0.4] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                          />
                        )}
                      </g>
                    ))}
                  </svg>
                </div>

                  <div className="mt-4 grid gap-3">
                  {events.map((event, index) => {
                    const Icon = eventIcons[index] ?? Archive;
                    return (
                      <motion.article
                        key={`${event.year}-${event.title}`}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.08, duration: 0.42 }}
                        className="group grid grid-cols-[44px_minmax(0,1fr)_auto] items-start gap-3 rounded-[1.35rem] border border-stroke bg-surface p-3 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_18px_38px_-34px_rgba(80,54,30,0.78)]"
                      >
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-muted text-primary transition duration-500 group-hover:bg-primary group-hover:text-surface">
                          <Icon className="h-5 w-5" strokeWidth={1.8} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-ink">{event.title}</span>
                          <span className="mt-1 block text-xs font-medium leading-5 text-ink-muted">{event.desc}</span>
                        </span>
                        <span className="rounded-full bg-bg-alt px-3 py-1.5 text-xs font-semibold text-primary">{event.year}</span>
                      </motion.article>
                    );
                  })}
                </div>
              </div>

              <aside className="border-t border-stroke bg-bg-alt/56 p-4 lg:border-l lg:border-t-0">
                <div className="grid gap-3">
                  {mediaTiles.map((tile, index) => (
                    <motion.div
                      key={tile.seed}
                      whileHover={{ y: -4, scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 180, damping: 18 }}
                      className="group overflow-hidden rounded-[1.35rem] border border-white/70 bg-surface shadow-[0_16px_36px_-30px_rgba(80,54,30,0.78)]"
                    >
                      <img
                        src={`https://picsum.photos/seed/${tile.seed}/420/260`}
                        alt={tile.alt}
                        className="h-28 w-full object-cover grayscale-[18%] contrast-110 transition duration-700 group-hover:scale-105"
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 rounded-[1.45rem] border border-stroke bg-surface p-4">
                  <p className="mb-4 text-sm font-semibold text-ink">Context attached</p>
                  <div className="grid gap-2.5">
                    {contextItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={item.label}
                          animate={{ opacity: [0.76, 1, 0.76] }}
                          transition={{ duration: 3.4 + index * 0.35, repeat: Infinity, ease: "easeInOut" }}
                          className="flex items-center gap-3 rounded-2xl bg-bg-alt px-3 py-2.5"
                        >
                          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-muted text-primary">
                            <Icon className="h-4 w-4" strokeWidth={1.8} />
                          </span>
                          <span>
                            <span className="block text-xs font-semibold text-ink">{item.label}</span>
                            <span className="block text-[11px] font-medium text-ink-muted">{item.value}</span>
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
