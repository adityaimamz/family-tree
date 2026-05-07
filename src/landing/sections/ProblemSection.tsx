import { motion } from "framer-motion";
import { Clock3, FileText, Image, MessageSquareText, type LucideIcon } from "lucide-react";
import { fadeUp, staggerContainer } from "../lib/animationVariants";
import { problems } from "../lib/data/sections";

const problemIcons: Record<string, LucideIcon> = {
  messages: MessageSquareText,
  image: Image,
  file: FileText,
  clock: Clock3,
};

const problemMeta = [
  "Chats",
  "Albums",
  "Notes",
  "Time",
];

export default function ProblemSection() {
  return (
    <section id="features" className="relative overflow-hidden bg-bg-alt py-20 lg:py-24">
      <div className="absolute inset-0 bg-archive-texture opacity-45 [mask-image:linear-gradient(180deg,rgba(0,0,0,0.74),transparent_92%)]" />
      <div className="relative mx-auto w-full max-w-[1320px] px-4 sm:px-6 xl:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="grid gap-6 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] lg:items-end"
        >
          <div>
            <p className="text-sm font-semibold text-primary">Problem</p>
            <p className="mt-3 max-w-[42ch] text-base leading-7 text-ink-secondary">
              Family memories rarely disappear all at once. They fade through everyday tools that were never designed to
              become an archive.
            </p>
          </div>
          <h2 className="max-w-[920px] text-balance font-body text-4xl font-semibold leading-[1.03] text-ink sm:text-5xl lg:text-[62px]">
            Family stories disappear when no one writes them down.
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.58fr)]"
        >
          <motion.article
            variants={fadeUp}
            whileHover={{ y: -6, scale: 1.005 }}
            transition={{ type: "spring", stiffness: 170, damping: 20 }}
            className="group rounded-[2.25rem] border border-white/80 bg-white/35 p-1.5 shadow-[0_28px_70px_-54px_rgba(80,54,30,0.84)] ring-1 ring-stroke/50"
          >
            <div className="relative min-h-[420px] overflow-hidden rounded-[calc(2.25rem-0.375rem)] border border-white/80 bg-surface/92 p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.72)] sm:p-9">
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,hsl(var(--dark-green)),hsl(var(--soft-gold)),hsl(var(--sage-green)))] opacity-75" />
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-muted opacity-80 transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-125" />
              <div className="absolute bottom-6 right-7 text-[120px] font-semibold leading-none text-primary/[0.04] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 group-hover:text-primary/[0.07]">
                01
              </div>
              <div className="relative flex min-h-[344px] flex-col">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-16 w-16 place-items-center rounded-[1.35rem] bg-primary text-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                    <MessageSquareText className="h-7 w-7" strokeWidth={1.8} />
                  </span>
                  <span className="rounded-xl border border-stroke bg-bg-alt px-3 py-1.5 text-xs font-semibold text-ink-muted">
                    Most common failure
                  </span>
                </div>
                <div className="mt-auto max-w-[720px] pt-12">
                  <h3 className="max-w-[14ch] text-4xl font-semibold leading-[1.03] text-ink sm:text-5xl">
                    Scattered memories become missing history.
                  </h3>
                  <p className="mt-5 max-w-[60ch] text-lg leading-8 text-ink-secondary">
                    Family history usually fades in small, ordinary ways: a chat thread gets buried, a photo loses its
                    names, and the person who remembers the details assumes someone else wrote it down.
                  </p>
                </div>
              </div>
            </div>
          </motion.article>

          <div className="grid gap-4">
            {problems.slice(1).map((problem, index) => {
              const Icon = problemIcons[problem.icon] ?? FileText;
              return (
                <motion.article
                  key={problem.title}
                  custom={index}
                  variants={fadeUp}
                  whileHover={{ y: -5, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 170, damping: 20 }}
                  className="group rounded-[2rem] border border-white/80 bg-white/35 p-1.5 shadow-[0_22px_54px_-46px_rgba(80,54,30,0.76)] ring-1 ring-stroke/50"
                >
                  <div className="relative overflow-hidden rounded-[calc(2rem-0.375rem)] border border-white/80 bg-surface/90 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.72)]">
                    <div className="absolute -right-12 -top-16 h-32 w-32 rounded-full bg-primary-muted opacity-70 transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-125" />
                    <div className="relative grid grid-cols-[52px_minmax(0,1fr)] gap-4">
                      <span className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-primary-muted text-primary transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-primary group-hover:text-surface">
                        <Icon className="h-5 w-5" strokeWidth={1.8} />
                      </span>
                      <div>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h3 className="text-xl font-semibold leading-tight text-ink">{problem.title}</h3>
                          <span className="rounded-xl bg-bg-alt px-2.5 py-1 text-[11px] font-semibold text-ink-muted">
                            {problemMeta[index + 1]}
                          </span>
                        </div>
                        <p className="max-w-[44ch] text-sm leading-6 text-ink-secondary">{problem.desc}</p>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
