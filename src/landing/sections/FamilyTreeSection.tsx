import { motion } from "framer-motion";
import { ChevronRight, Clock3, Eye, GitBranch, Route, Search, SlidersHorizontal, UserRound, ZoomIn } from "lucide-react";
import { familyTreeChips } from "../lib/data/sections";

const controlIcons = [Search, GitBranch, ZoomIn, Route, UserRound];

const treeNodes = [
  { x: 150, y: 34, label: "TR", name: "Taufik Rahman", tone: "primary" },
  { x: 88, y: 100, label: "SR", name: "Siti Rahman", tone: "sage" },
  { x: 212, y: 100, label: "MR", name: "Musa Rahman", tone: "sage" },
  { x: 48, y: 170, label: "RN", name: "Rina Noor", tone: "muted" },
  { x: 132, y: 170, label: "AR", name: "Aditya Rahman", tone: "active" },
  { x: 212, y: 170, label: "LA", name: "Laila Rahman", tone: "muted" },
  { x: 268, y: 170, label: "DR", name: "Dimas Rahman", tone: "muted" },
];

const branches = ["Rahman core", "Noor branch", "1970-1995", "Living members"];

const nodeFill = {
  primary: "hsl(var(--dark-green))",
  sage: "hsl(var(--sage-green))",
  muted: "hsl(var(--sage-green) / 0.38)",
  active: "hsl(var(--dark-green))",
};

export default function FamilyTreeSection() {
  return (
    <section id="demo" className="relative overflow-hidden bg-bg-alt py-24 lg:py-32">
      <div className="absolute inset-0 bg-archive-texture opacity-35 [mask-image:linear-gradient(180deg,rgba(0,0,0,0.72),transparent_90%)]" />
      <div className="relative mx-auto grid w-full max-w-[1320px] gap-14 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(560px,1.14fr)] lg:items-center lg:gap-16 xl:px-8">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        >
          <p className="max-w-[42ch] text-sm font-semibold leading-6 text-primary">
            Family tree command center for browsing names, branches, stories, and profile context without opening a dozen files.
          </p>
          <h2 className="mt-5 max-w-[720px] font-body text-4xl font-semibold leading-[1.04] text-ink sm:text-5xl lg:text-6xl">
            Explore every generation with context attached.
          </h2>
          <p className="mt-6 max-w-[58ch] text-base leading-8 text-ink-secondary">
            Search people, filter branches, zoom across generations, and open profile details while the relationship map stays readable.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {familyTreeChips.map((chip, index) => {
              const Icon = controlIcons[index] ?? Eye;
              return (
                <motion.div
                  key={chip}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: index * 0.08, duration: 0.45 }}
                  className="group flex min-h-14 items-center gap-3 rounded-2xl border border-transparent p-2 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-stroke hover:bg-surface/70"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-muted text-primary transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-primary group-hover:text-surface">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="text-sm font-semibold text-ink">{chip}</span>
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
          className="rounded-[2.25rem] border border-white/80 bg-white/35 p-1.5 shadow-[0_32px_86px_-56px_rgba(80,54,30,0.92)] ring-1 ring-stroke/50"
        >
          <div className="overflow-hidden rounded-[calc(2.25rem-0.375rem)] border border-white/80 bg-surface/92 shadow-[inset_0_1px_1px_rgba(255,255,255,0.78)]">
            <div className="flex flex-col gap-3 border-b border-stroke bg-bg-alt/72 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-h-11 items-center gap-3 rounded-full border border-stroke bg-surface px-4 text-sm font-medium text-ink-muted sm:min-w-[300px]">
                <Search className="h-4 w-4 text-primary" strokeWidth={1.8} />
                Search by name, branch, or year
              </div>
              <div className="flex flex-wrap gap-2">
                {branches.map((branch) => (
                  <span key={branch} className="rounded-full border border-stroke bg-surface px-3 py-2 text-xs font-semibold text-ink-secondary">
                    {branch}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-[72px_minmax(0,1fr)_220px]">
              <aside className="flex gap-2 border-b border-stroke bg-bg-alt/56 p-3 lg:flex-col lg:border-b-0 lg:border-r">
                {[SlidersHorizontal, ZoomIn, GitBranch, Eye].map((Icon, index) => (
                  <button
                    key={index}
                    type="button"
                    className="grid h-11 w-11 place-items-center rounded-2xl border border-stroke bg-surface text-primary transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-primary hover:text-surface active:scale-[0.98]"
                    aria-label={`Tree tool ${index + 1}`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </button>
                ))}
              </aside>

              <div className="bg-[linear-gradient(135deg,hsl(var(--background)),hsl(var(--surface-soft)_/_0.72))] p-5">
                <div className="rounded-[1.65rem] border border-stroke bg-surface/82 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">Rahman generation map</p>
                      <p className="mt-1 text-xs font-medium text-ink-muted">7 visible profiles, 2 branches selected</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-primary-muted px-3 py-2 text-xs font-semibold text-primary">
                      <Clock3 className="h-4 w-4" strokeWidth={1.8} />
                      Synced today
                    </div>
                  </div>

                  <svg viewBox="0 0 320 218" className="h-auto w-full overflow-visible" aria-hidden="true">
                    <motion.path
                      d="M150 34 L88 100 M150 34 L212 100 M88 100 L48 170 M88 100 L132 170 M212 100 L212 170 M212 100 L268 170"
                      stroke="hsl(var(--sage-green) / 0.55)"
                      strokeWidth="2"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                    <motion.path
                      d="M48 170 L88 100 L150 34 L88 100 L132 170"
                      stroke="hsl(var(--soft-gold))"
                      strokeWidth="3"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 1.4, ease: "easeOut", delay: 0.35 }}
                    />
                    {treeNodes.map((node, index) => (
                      <g key={node.label}>
                        {node.tone === "active" && (
                          <motion.circle
                            cx={node.x}
                            cy={node.y}
                            r="25"
                            stroke="hsl(var(--soft-gold))"
                            strokeWidth="2"
                            fill="none"
                            animate={{ scale: [0.92, 1, 0.92], opacity: [0.45, 0.9, 0.45] }}
                            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
                          />
                        )}
                        <motion.circle
                          cx={node.x}
                          cy={node.y}
                          r={node.tone === "active" ? 19 : 17}
                          fill={nodeFill[node.tone as keyof typeof nodeFill]}
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.08, type: "spring", stiffness: 180, damping: 16 }}
                        />
                        <text x={node.x} y={node.y + 4} fill="white" fontSize="10" textAnchor="middle" fontWeight="700">
                          {node.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              <aside className="border-t border-stroke bg-bg-alt/56 p-4 lg:border-l lg:border-t-0">
                <div className="rounded-[1.45rem] border border-stroke bg-surface p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-sm font-semibold text-surface">AR</span>
                    <div>
                      <p className="font-semibold text-ink">Aditya Rahman</p>
                      <p className="text-xs font-medium text-ink-muted">1982, son</p>
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm">
                    {["Branch: Rahman core", "Linked photos: 42", "Biography: in review"].map((item) => (
                      <div key={item} className="flex items-center justify-between gap-3 rounded-2xl bg-bg-alt px-3 py-2 text-ink-secondary">
                        {item}
                        <ChevronRight className="h-4 w-4 text-primary" strokeWidth={1.8} />
                      </div>
                    ))}
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
