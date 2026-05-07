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

const problemLayouts = [
  "lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-7",
];

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
          className="mt-8 grid grid-flow-dense grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12"
        >
          {problems.map((problem, index) => {
            const Icon = problemIcons[problem.icon] ?? FileText;
            return (
              <motion.article
                key={problem.title}
                custom={index}
                variants={fadeUp}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 170, damping: 20 }}
                className={`group rounded-[2rem] border border-white/80 bg-white/35 p-1.5 shadow-[0_24px_58px_-48px_rgba(80,54,30,0.76)] ring-1 ring-stroke/50 ${problemLayouts[index]}`}
              >
                <div className="relative min-h-[204px] overflow-hidden rounded-[calc(2rem-0.375rem)] border border-white/80 bg-surface/90 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.72)] sm:p-7">
                  <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,hsl(var(--dark-green)),hsl(var(--soft-gold)),hsl(var(--sage-green)))] opacity-75" />
                  <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-primary-muted opacity-70 transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-125" />
                  <div className="absolute bottom-5 right-5 text-[72px] font-semibold leading-none text-primary/[0.04] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:text-primary/[0.07]">
                    0{index + 1}
                  </div>
                  <div className="relative flex min-h-[152px] flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-muted text-primary transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-primary group-hover:text-surface">
                        <Icon className="h-6 w-6" strokeWidth={1.8} />
                      </span>
                      <span className="rounded-xl border border-stroke bg-bg-alt px-3 py-1.5 text-xs font-semibold text-ink-muted">
                        {problemMeta[index]}
                      </span>
                    </div>
                    <div className="mt-auto pt-8">
                      <h3 className="text-2xl font-semibold leading-tight text-ink">{problem.title}</h3>
                      <p className="mt-3 max-w-[48ch] text-base leading-7 text-ink-secondary">{problem.desc}</p>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
