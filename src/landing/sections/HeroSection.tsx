import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Camera,
  Check,
  Clock3,
  GitBranch,
  LockKeyhole,
  Search,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { fadeUp, staggerContainer } from "../lib/animationVariants";

const archiveRows = [
  { label: "Family tree records", value: "148 profiles", icon: GitBranch },
  { label: "Biographies in review", value: "37 drafts", icon: BookOpen },
  { label: "Photos with context", value: "624 preserved", icon: Camera },
];

const activityRows = [
  "Rina named five relatives in a 1987 reunion photo",
  "Aditya approved Ibu Lina's biography draft",
  "Siti attached source notes to the Noor branch",
];

const photoTiles = [
  { seed: "warisan-family-album-01", alt: "Old family album on a table" },
  {
    seed: "warisan-family-portrait-02",
    alt: "Family portrait in warm daylight",
  },
  {
    seed: "warisan-archive-notes-03",
    alt: "Handwritten family notes beside photographs",
  },
];

export default function HeroSection() {
  return (
    <section className="relative isolate flex min-h-[100dvh] w-full items-center overflow-hidden bg-bg pt-28 sm:pt-32 lg:pt-36">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,hsl(var(--background))_0%,hsl(var(--surface-soft))_52%,hsl(var(--background))_100%)]" />
      <div className="absolute inset-0 -z-10 bg-archive-texture opacity-50 [mask-image:linear-gradient(90deg,rgba(0,0,0,0.82),transparent_78%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-[linear-gradient(180deg,transparent,hsl(var(--background)))]" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-14 px-4 pb-24 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)] lg:gap-10 lg:pb-32 xl:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-[820px] text-left"
        >
          <motion.p
            variants={fadeUp}
            className="max-w-[54ch] text-sm font-semibold leading-6 text-primary"
          >
            A private family archive for stories, photos, timelines,
            biographies, and family tree records.
          </motion.p>
          <motion.h1
            variants={fadeUp}
             className="mt-6 max-w-[880px] font-body text-5xl font-semibold leading-[0.98] text-ink sm:text-6xl lg:text-7xl"
          >
            <span className="block">Save the family stories</span>
            <span className="block text-primary">before they disappear.</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-7 max-w-[62ch] text-lg leading-8 text-ink-secondary"
          >
            WarisanAI helps relatives gather scattered memories into one calm, invite-only archive where every photo,
            life story, date, and relationship can keep its context.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              to="/auth/sign-up"
              className="group inline-flex min-h-14 items-center justify-center gap-4 rounded-full bg-primary py-2 pl-6 pr-2 text-base font-semibold text-surface shadow-[0_22px_42px_-30px_rgba(44,80,22,0.95)] outline-none transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-warm-brown active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-sage-light"
            >
              Create your family archive
              <span className="grid h-10 w-10 place-items-center rounded-full bg-surface/12 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:scale-105">
                <ArrowRight className="h-5 w-5" strokeWidth={1.8} />
              </span>
            </Link>
            <a
              href="#demo"
              className="group inline-flex min-h-14 items-center justify-center gap-4 rounded-full border border-stroke bg-surface/88 py-2 pl-6 pr-2 text-base font-semibold text-ink outline-none transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-sage-light"
            >
              See how it works
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-muted text-primary transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:scale-105">
                <ArrowRight className="h-5 w-5" strokeWidth={1.8} />
              </span>
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-8 grid gap-3 text-sm font-medium text-ink-secondary sm:grid-cols-3"
          >
            {[
              "Private by default",
              "Built for family review",
              "Context stays attached",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-muted text-primary">
                  <Check className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                {item}
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
          className="relative mx-auto w-full max-w-[690px] lg:mx-0"
        >
          <div className="rounded-[2.25rem] border border-white/80 bg-white/35 p-1.5 shadow-[0_34px_90px_-58px_rgba(80,54,30,0.94)] ring-1 ring-stroke/50">
            <div className="relative overflow-hidden rounded-[calc(2.25rem-0.375rem)] border border-white/80 bg-surface/92 shadow-[inset_0_1px_1px_rgba(255,255,255,0.78)]">
              <div className="flex items-center justify-between border-b border-stroke bg-surface/80 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-terracotta/80" />
                  <span className="h-3 w-3 rounded-full bg-accent" />
                  <span className="h-3 w-3 rounded-full bg-sage" />
                </div>
                <div className="hidden min-h-9 w-full max-w-[280px] items-center gap-2 rounded-2xl border border-stroke bg-bg-alt px-3 text-sm text-ink-muted sm:flex">
                  <Search className="h-4 w-4" strokeWidth={1.8} />
                  Search relatives and archive records
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-primary-muted px-3 py-2 text-xs font-semibold text-primary">
                  <LockKeyhole className="h-3.5 w-3.5" strokeWidth={2} />
                  Private
                </div>
              </div>

              <div className="grid gap-0 lg:grid-cols-[210px_minmax(0,1fr)]">
                <aside className="border-b border-stroke bg-bg-alt/72 p-4 lg:border-b-0 lg:border-r">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-sm font-semibold text-surface">
                      RA
                    </div>
                    <div>
                  <p className="font-semibold text-ink">Rahman Archive</p>
                  <p className="text-xs font-medium text-ink-muted">
                        Invite-only family workspace
                  </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3">
                    {archiveRows.map((row, index) => {
                      const Icon = row.icon;
                      return (
                        <motion.div
                          key={row.label}
                          animate={{ y: [0, index === 1 ? -4 : -2, 0] }}
                          transition={{
                            duration: 4 + index,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="rounded-2xl border border-stroke/80 bg-surface/76 p-3"
                        >
                          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-primary-muted text-primary">
                            <Icon className="h-4 w-4" strokeWidth={1.8} />
                          </div>
                          <p className="text-sm font-semibold text-ink">
                            {row.value}
                          </p>
                          <p className="text-xs font-medium text-ink-muted">
                            {row.label}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </aside>

                <div className="p-4 sm:p-5">
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_190px]">
                    <div className="rounded-[1.5rem] border border-stroke bg-bg-alt/56 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            Relationship map
                          </p>
                          <p className="text-xs font-medium text-ink-muted">
                            Three generations connected
                          </p>
                        </div>
                        <GitBranch
                          className="h-5 w-5 text-primary"
                          strokeWidth={1.8}
                        />
                      </div>
                      <div className="mt-5">
                        <svg
                          viewBox="0 0 260 154"
                          className="h-auto w-full overflow-visible"
                          aria-hidden="true"
                        >
                          <motion.path
                            d="M130 24 L68 82 M130 24 L192 82 M68 82 L38 132 M68 82 L104 132 M192 82 L156 132 M192 82 L222 132"
                            stroke="hsl(var(--sage-green) / 0.58)"
                            strokeWidth="2"
                            fill="none"
                            initial={{ pathLength: 0 }}
                            whileInView={{ pathLength: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                          />
                          {[
                            { x: 130, y: 24, label: "TR", r: 20 },
                            { x: 68, y: 82, label: "SR", r: 18 },
                            { x: 192, y: 82, label: "MR", r: 18 },
                            { x: 38, y: 132, label: "RN", r: 16 },
                            { x: 104, y: 132, label: "AD", r: 20, ring: true },
                            { x: 156, y: 132, label: "LA", r: 16 },
                            { x: 222, y: 132, label: "DR", r: 16 },
                          ].map((node, index) => (
                            <g key={node.label}>
                              {node.ring && (
                                <motion.circle
                                  cx={node.x}
                                  cy={node.y}
                                  r={node.r + 7}
                                  stroke="hsl(var(--soft-gold))"
                                  strokeWidth="2"
                                  fill="none"
                                  initial={{ scale: 0.82, opacity: 0.3 }}
                                  animate={{
                                    scale: [0.88, 1, 0.88],
                                    opacity: [0.42, 0.9, 0.42],
                                  }}
                                  transition={{
                                    duration: 3.2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }}
                                />
                              )}
                              <motion.circle
                                cx={node.x}
                                cy={node.y}
                                r={node.r}
                                fill={
                                  node.ring
                                    ? "hsl(var(--dark-green))"
                                    : "hsl(var(--sage-green))"
                                }
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{
                                  delay: index * 0.08,
                                  type: "spring",
                                  stiffness: 180,
                                  damping: 16,
                                }}
                              />
                              <text
                                x={node.x}
                                y={node.y + 4}
                                fill={
                                  node.ring ? "white" : "hsl(var(--surface))"
                                }
                                fontSize="10"
                                textAnchor="middle"
                                fontWeight="700"
                              >
                                {node.label}
                              </text>
                            </g>
                          ))}
                        </svg>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {photoTiles.map((photo, index) => (
                        <motion.div
                          key={photo.seed}
                          whileHover={{ y: -4, scale: 1.02 }}
                          transition={{
                            type: "spring",
                            stiffness: 180,
                            damping: 18,
                          }}
                          className="group overflow-hidden rounded-[1.35rem] border border-white/70 bg-surface shadow-[0_16px_36px_-30px_rgba(80,54,30,0.78)]"
                        >
                          <img
                            src={`https://picsum.photos/seed/${photo.seed}/420/260`}
                            alt={photo.alt}
                            className="h-24 w-full object-cover grayscale-[18%] contrast-110 transition duration-700 group-hover:scale-105"
                            loading={index === 0 ? "eager" : "lazy"}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.5rem] border border-stroke bg-surface/78 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-ink">
                        Family collaboration preview
                      </p>
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <Clock3 className="h-4 w-4" strokeWidth={1.8} />
                        Updated today
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {activityRows.map((item, index) => (
                        <motion.div
                          key={item}
                          initial={{ opacity: 0, x: 12 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{
                            delay: 0.3 + index * 0.12,
                            duration: 0.45,
                          }}
                          className="flex items-center gap-3 rounded-2xl bg-bg-alt/76 px-3 py-2.5 text-sm font-medium text-ink-secondary"
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary-muted text-primary">
                            <Users className="h-4 w-4" strokeWidth={1.8} />
                          </span>
                          {item}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
