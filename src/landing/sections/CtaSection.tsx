import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, GitBranch, LockKeyhole, PenLine, ShieldCheck, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { values } from "../lib/data/sections";

const valueIcons: Record<string, LucideIcon> = {
  lock: LockKeyhole,
  pen: PenLine,
  branch: GitBranch,
};

const inviteRows = [
  "148 relatives connected across 4 branches",
  "37 biographies drafted and family-reviewed",
  "624 photos named with source context",
];

export default function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-primary py-24 text-surface lg:py-32">
      <div className="absolute inset-0 bg-archive-texture opacity-15 [mask-image:linear-gradient(90deg,rgba(0,0,0,0.78),transparent_82%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,hsl(var(--dark-green)),transparent)]" />
      <div className="relative mx-auto grid w-full max-w-[1320px] gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.96fr)_minmax(460px,0.9fr)] lg:items-center lg:gap-16 xl:px-8">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        >
          <p className="max-w-[42ch] text-sm font-semibold leading-6 text-surface/76">
            Close the loop between family stories, relationships, biographies, photos, and timelines.
          </p>
          <h2 className="mt-5 max-w-[780px] font-body text-4xl font-semibold leading-[1.02] text-surface sm:text-5xl lg:text-6xl">
            Create a private home for your family history.
          </h2>
          <p className="mt-6 max-w-[58ch] text-base leading-8 text-surface/74">
            Create your FamilySpace, preserve the first records, then invite relatives to help complete the archive.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/auth/sign-up"
              className="group inline-flex min-h-14 items-center justify-center gap-4 rounded-full bg-accent py-2 pl-6 pr-2 text-base font-semibold text-ink shadow-[0_24px_48px_-32px_rgba(210,181,110,0.92)] outline-none transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-surface active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-surface/25"
            >
              Create your family archive
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-surface transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:scale-105">
                <ArrowRight className="h-5 w-5" strokeWidth={1.8} />
              </span>
            </Link>
            <a
              href="#demo"
              className="group inline-flex min-h-14 items-center justify-center gap-4 rounded-full border border-surface/28 bg-surface/[0.06] py-2 pl-6 pr-2 text-base font-semibold text-surface outline-none transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-surface/[0.12] active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-surface/25"
            >
              See how it works
              <span className="grid h-10 w-10 place-items-center rounded-full bg-surface/12 text-surface transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:scale-105">
                <ArrowRight className="h-5 w-5" strokeWidth={1.8} />
              </span>
            </a>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {values.map((value, index) => {
              const Icon = valueIcons[value.icon] ?? ShieldCheck;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: index * 0.08, duration: 0.42 }}
                  className="rounded-[1.35rem] border border-surface/12 bg-surface/[0.07] p-4 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-surface/[0.1]"
                >
                  <span className="mb-4 grid h-10 w-10 place-items-center rounded-2xl bg-surface/12 text-accent">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <p className="text-sm font-semibold text-surface">{value.title}</p>
                  <p className="mt-2 text-sm leading-6 text-surface/66">{value.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 34, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
          className="rounded-[2.25rem] border border-surface/18 bg-surface/[0.08] p-1.5 shadow-[0_34px_90px_-62px_rgba(0,0,0,0.72)]"
        >
          <div className="overflow-hidden rounded-[calc(2.25rem-0.375rem)] border border-white/80 bg-surface text-ink shadow-[inset_0_1px_1px_rgba(255,255,255,0.78)]">
            <div className="flex flex-col gap-4 border-b border-stroke bg-bg-alt/72 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-ink">Rahman family archive</p>
                <p className="mt-1 text-sm font-medium text-ink-muted">Private archive with reviewed stories</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-surface">
                <LockKeyhole className="h-4 w-4" strokeWidth={1.8} />
                Private
              </span>
            </div>

            <div className="p-5">
              <div className="rounded-[1.55rem] border border-stroke bg-bg-alt/58 p-5">
                <div className="mb-5 flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-sm font-semibold text-surface">
                    WA
                  </span>
                  <div>
                    <p className="font-semibold text-ink">WarisanAI Family Archive</p>
                    <p className="text-sm font-medium text-ink-muted">Stories, photos, timelines, and relationships connected</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  {inviteRows.map((row, index) => (
                    <motion.div
                      key={row}
                      initial={{ opacity: 0, x: 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + index * 0.08, duration: 0.42 }}
                      className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-2.5 text-sm font-semibold text-ink-secondary"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-muted text-primary">
                        <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      {row}
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[1.45rem] bg-primary p-4 text-surface">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">Sample result</p>
                    <p className="mt-1 text-sm text-surface/72">
                      A relative can open one profile and see the tree position, biography, photos, timeline moments,
                      and source notes together.
                    </p>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface/12">
                    <ArrowRight className="h-5 w-5" strokeWidth={1.8} />
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
