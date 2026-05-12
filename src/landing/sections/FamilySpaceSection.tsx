import { motion } from "framer-motion";
import {
  BookOpen,
  Camera,
  FileText,
  GitBranch,
  LockKeyhole,
  Network,
  Route,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { features } from "../lib/data/sections";

const featureIcons: LucideIcon[] = [GitBranch, BookOpen, Camera, Route, FileText, Network];

const archiveConnections = [
  "Source notes help keep important context attached to family records.",
  "Invite relatives with a simple family code and share the link through WhatsApp.",
  "Branches, biographies, and relationship paths use the same family records.",
  "AI drafts help organize memory, but relatives approve what becomes final.",
];

export default function FamilySpaceSection() {
  return (
    <section id="family-space" className="relative overflow-hidden bg-bg py-24 lg:py-32">
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,hsl(var(--dark-green)_/_0.08),transparent)]" />
      <div className="relative mx-auto grid w-full max-w-[1320px] gap-14 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(560px,1.14fr)] lg:items-center lg:gap-16 xl:px-8">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.32, 0.72, 0, 1] }}
        >
          <p className="max-w-[42ch] text-sm font-semibold leading-6 text-primary">
            One protected place for the family archive to make sense.
          </p>
          <h2 className="mt-5 max-w-[720px] font-body text-4xl font-semibold leading-[1.04] text-ink sm:text-5xl lg:text-6xl">
            Keep branches, stories, photos, timelines, biographies, and relationships together.
          </h2>
          <p className="mt-6 max-w-[58ch] text-base leading-8 text-ink-secondary">
            WarisanAI turns loose memories into connected family records. A photo can lead to a person, a person can lead
            to a biography, and every biography can keep the notes relatives used to confirm it.
          </p>

          <div className="mt-10 grid gap-3">
            {archiveConnections.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="flex items-start gap-3 rounded-[1.25rem] border border-transparent p-2 text-sm font-semibold text-ink-secondary transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-stroke hover:bg-surface/70"
              >
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-muted text-primary">
                  <Sparkles className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <span className="max-w-[54ch] leading-6">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 34, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
          className="rounded-[2.25rem] border border-white/80 bg-white/35 p-1.5 shadow-[0_32px_86px_-56px_rgba(80,54,30,0.92)] ring-1 ring-stroke/50"
        >
          <div className="overflow-hidden rounded-[calc(2.25rem-0.375rem)] border border-white/80 bg-surface/92 shadow-[inset_0_1px_1px_rgba(255,255,255,0.78)]">
            <div className="flex flex-col gap-4 border-b border-stroke bg-bg-alt/72 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-ink">Protected archive map</p>
                <p className="mt-1 text-sm font-medium text-ink-muted">Rahman family records connected by context</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-surface">
                <LockKeyhole className="h-4 w-4" strokeWidth={1.8} />
                Invite-only
              </span>
            </div>

            <div className="relative p-5 sm:p-6">
              <div className="absolute inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_center,hsl(var(--sage-green)_/_0.16),transparent_68%)]" />
              <div className="relative grid gap-4 lg:grid-cols-[1fr_210px_1fr] lg:items-center">
                <div className="grid gap-4">
                  {features.slice(0, 3).map((feature, index) => {
                    const Icon = featureIcons[index];
                    return (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, x: -18 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.08, duration: 0.42 }}
                        className="rounded-[1.35rem] border border-stroke bg-bg-alt/62 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-muted text-primary">
                            <Icon className="h-5 w-5" strokeWidth={1.8} />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-ink">{feature.title}</p>
                            <p className="mt-1 text-xs font-medium leading-5 text-ink-muted">{feature.desc}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.18 }}
                  className="relative mx-auto grid h-[210px] w-[210px] place-items-center rounded-full border border-primary/20 bg-primary text-center text-surface shadow-[0_28px_58px_-44px_rgba(44,80,22,0.95)]"
                >
                  <div className="absolute inset-4 rounded-full border border-surface/14" />
                  <div className="relative px-6">
                    <Network className="mx-auto mb-3 h-8 w-8 text-accent" strokeWidth={1.7} />
                    <p className="text-lg font-semibold leading-6">WarisanAI archive</p>
                    <p className="mt-2 text-xs font-medium leading-5 text-surface/68">One record system, many family stories</p>
                  </div>
                </motion.div>

                <div className="grid gap-4">
                  {features.slice(3).map((feature, index) => {
                    const Icon = featureIcons[index + 3];
                    return (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, x: 18 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.08, duration: 0.42 }}
                        className="rounded-[1.35rem] border border-stroke bg-bg-alt/62 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-muted text-primary">
                            <Icon className="h-5 w-5" strokeWidth={1.8} />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-ink">{feature.title}</p>
                            <p className="mt-1 text-xs font-medium leading-5 text-ink-muted">{feature.desc}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="relative mt-5 rounded-[1.45rem] border border-stroke bg-surface p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">Source notes</p>
                    <p className="mt-1 text-sm leading-6 text-ink-secondary">
                      "Aunt Rina confirmed the 1990 Jakarta move from the blue notebook and reunion photo captions."
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-muted px-3 py-2 text-xs font-semibold text-primary">
                    <FileText className="h-4 w-4" strokeWidth={1.8} />
                    Attached
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
