import { motion } from "framer-motion";
import { ArrowRight, Check, Clock3, FileText, LockKeyhole, PenLine, ShieldCheck } from "lucide-react";

const noteFragments = [
  "Known as Ibu Lina by the cousins",
  "Kept handwritten recipes in a blue notebook",
  "Hosted Eid lunch every year until 2008",
];

const reviewItems = ["Source notes: 3", "Draft voice: warm", "Family approval: pending"];

export default function BiographySection() {
  return (
    <section id="biography" className="relative overflow-hidden bg-bg py-24 lg:py-32">
      <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,hsl(var(--surface-soft)_/_0.72),transparent)]" />
      <div className="relative mx-auto grid w-full max-w-[1320px] gap-14 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(540px,1.08fr)] lg:items-center lg:gap-16 xl:px-8">
        <motion.div
          initial={{ opacity: 0, y: 34, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
          className="order-2 rounded-[2.25rem] border border-white/80 bg-white/35 p-1.5 shadow-[0_32px_86px_-56px_rgba(80,54,30,0.92)] ring-1 ring-stroke/50"
        >
          <div className="overflow-hidden rounded-[calc(2.25rem-0.375rem)] border border-white/80 bg-surface/92 shadow-[inset_0_1px_1px_rgba(255,255,255,0.78)]">
            <div className="flex flex-col gap-4 border-b border-stroke bg-bg-alt/72 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-ink">Biography studio</p>
                <p className="mt-1 text-sm font-medium text-ink-muted">Source fragments to draft to family review.</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-muted px-3 py-2 text-xs font-semibold text-primary">
                <LockKeyhole className="h-4 w-4" strokeWidth={1.8} />
                Family-only draft
              </span>
            </div>

            <div className="grid gap-0 lg:grid-cols-[0.78fr_1fr]">
              <div className="border-b border-stroke bg-bg-alt/56 p-5 lg:border-b-0 lg:border-r">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">1. Source fragments</p>
                  <FileText className="h-5 w-5 text-primary" strokeWidth={1.8} />
                </div>
                <div className="grid gap-3">
                  {noteFragments.map((note, index) => (
                    <motion.div
                      key={note}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, duration: 0.42 }}
                      className="rounded-[1.25rem] border border-stroke bg-surface p-4 text-sm leading-6 text-ink-secondary"
                    >
                      {note}
                    </motion.div>
                  ))}
                </div>

                <button
                  type="button"
                  className="group mt-5 inline-flex min-h-14 w-full items-center justify-center gap-4 rounded-full bg-primary py-2 pl-5 pr-2 text-sm font-semibold text-surface shadow-[0_18px_34px_-26px_rgba(44,80,22,0.95)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-warm-brown active:scale-[0.98]"
                >
                  Draft biography
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-surface/12 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:scale-105">
                    <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                </button>
              </div>

              <div className="p-5">
                <div className="rounded-[1.55rem] border border-stroke bg-bg-alt/58 p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">2. AI-assisted draft</p>
                      <p className="mt-1 text-xs font-medium text-ink-muted">Version 02, waiting for family voice review</p>
                    </div>
                    <PenLine className="h-5 w-5 text-primary" strokeWidth={1.8} />
                  </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.7, delay: 0.25 }}
                    className="text-lg font-medium leading-8 text-ink"
                  >
                    Lina Rahman, known to the younger cousins as Ibu Lina, kept a blue notebook filled with recipes and
                    family notes. Relatives remember her Eid lunches as the place where distant branches came back into
                    the same room.
                  </motion.p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {reviewItems.map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.35 + index * 0.08, duration: 0.4 }}
                      className="rounded-2xl border border-stroke bg-surface p-3 text-xs font-semibold text-ink-secondary"
                    >
                      {item}
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-3 rounded-[1.45rem] bg-primary p-4 text-surface sm:flex-row sm:items-center">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface/12">
                    <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="font-semibold">3. Family approves the final voice</p>
                    <p className="mt-1 text-sm text-surface/74">
                      AI helps shape the first draft. Invited relatives decide what feels accurate enough to keep.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="order-1"
        >
          <p className="max-w-[42ch] text-sm font-semibold leading-6 text-primary">
            AI helps turn fragments into readable memory while the family keeps control of the final voice.
          </p>
          <h2 className="mt-5 max-w-[680px] font-body text-4xl font-semibold leading-[1.04] text-ink sm:text-5xl lg:text-6xl">
            Turn scattered notes into biographies with a human tone.
          </h2>
          <p className="mt-6 max-w-[58ch] text-base leading-8 text-ink-secondary">
            Start with a few remembered details, review the generated draft, and keep every biography tied to source
            notes, relatives who reviewed it, and the family voice that should carry forward.
          </p>

          <div className="mt-10 grid gap-4">
            {["Draft from fragments", "Family approves the voice", "Keep source context"].map((item, index) => (
              <div key={item} className="flex items-center gap-3 text-sm font-semibold text-ink-secondary">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-muted text-primary">
                  {index === 0 ? <FileText className="h-4 w-4" strokeWidth={1.8} /> : index === 1 ? <Check className="h-4 w-4" strokeWidth={1.8} /> : <Clock3 className="h-4 w-4" strokeWidth={1.8} />}
                </span>
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
