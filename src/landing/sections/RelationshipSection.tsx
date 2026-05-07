import { motion } from "framer-motion";
import { GitBranch, Link2, MessageSquareText, Route, Search, Send, UserRound } from "lucide-react";
import { fadeUp, staggerContainer } from "../lib/animationVariants";
import { relationshipNodes, relationshipPath } from "../lib/data/sections";

const graphLines = "M 100 20 L 50 70 M 100 20 L 150 70 M 50 70 L 20 120 M 150 70 L 180 120";
const highlightedPath = "M 20 120 L 50 70 L 100 20 L 150 70 L 180 120";

export default function RelationshipSection() {
  return (
    <section id="relationships" className="relative overflow-hidden bg-[hsl(var(--sage-green)_/_0.13)] py-24 lg:py-32">
      <div className="absolute inset-0 bg-archive-texture opacity-28 [mask-image:linear-gradient(180deg,rgba(0,0,0,0.7),transparent_90%)]" />
      <div className="relative mx-auto grid w-full max-w-[1320px] gap-14 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(560px,1.14fr)] lg:items-center lg:gap-16 xl:px-8">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        >
          <p className="max-w-[42ch] text-sm font-semibold leading-6 text-primary">
            Relationship answers should be simple enough for anyone in the family to understand.
          </p>
          <h2 className="mt-5 max-w-[720px] font-body text-4xl font-semibold leading-[1.04] text-ink sm:text-5xl lg:text-6xl">
            Ask how two relatives connect and see the path instantly.
          </h2>
          <p className="mt-6 max-w-[58ch] text-base leading-8 text-ink-secondary">
            The explainer turns a question into a short answer, then highlights the exact route through the tree so the
            relationship stays verifiable.
          </p>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-10 grid gap-3"
          >
            {["Plain-language answers", "Highlighted relationship path", "Tree-backed explanation"].map((item, index) => (
              <motion.div key={item} variants={fadeUp} custom={index} className="flex items-center gap-3 text-sm font-semibold text-ink-secondary">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-muted text-primary">
                  {index === 0 ? <MessageSquareText className="h-4 w-4" strokeWidth={1.8} /> : index === 1 ? <Route className="h-4 w-4" strokeWidth={1.8} /> : <GitBranch className="h-4 w-4" strokeWidth={1.8} />}
                </span>
                {item}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 34, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
          className="rounded-[2.25rem] border border-white/80 bg-white/35 p-1.5 shadow-[0_32px_86px_-56px_rgba(80,54,30,0.92)] ring-1 ring-stroke/50"
        >
          <div className="overflow-hidden rounded-[calc(2.25rem-0.375rem)] border border-white/80 bg-surface/92 shadow-[inset_0_1px_1px_rgba(255,255,255,0.78)]">
            <div className="border-b border-stroke bg-bg-alt/72 p-5">
              <div className="flex min-h-12 items-center gap-3 rounded-full border border-stroke bg-surface px-4 text-sm font-medium text-ink">
                <Search className="h-4 w-4 text-primary" strokeWidth={1.8} />
                How is Rina related to Aditya?
                <span className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-primary text-surface">
                  <Send className="h-4 w-4" strokeWidth={1.8} />
                </span>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,0.92fr)_minmax(260px,0.78fr)]">
              <div className="border-b border-stroke p-5 lg:border-b-0 lg:border-r">
                <div className="rounded-[1.55rem] border border-stroke bg-bg-alt/58 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-muted text-primary">
                      <MessageSquareText className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">Relationship answer</p>
                      <p className="mt-1 text-xs font-medium text-ink-muted">Generated from the selected family path</p>
                    </div>
                  </div>
                  <p className="text-lg font-medium leading-8 text-ink">
                    Rina is Aditya&apos;s cousin. They share the same grandparents: Arman Rahman is Rina&apos;s father,
                    and Siti Rahman is Aditya&apos;s mother. The highlighted route shows both branches meeting at the
                    grandparent line.
                  </p>
                </div>

                <div className="mt-4 rounded-[1.55rem] border border-stroke bg-surface p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">Relationship path</p>
                    <Link2 className="h-5 w-5 text-primary" strokeWidth={1.8} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {relationshipPath.map((name, index) => (
                      <div key={`${name}-${index}`} className="flex items-center gap-2">
                        <motion.span
                          initial={{ opacity: 0, y: 8 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.08, duration: 0.4 }}
                          className="rounded-full bg-primary-muted px-3 py-2 text-xs font-semibold text-primary"
                        >
                          {name}
                        </motion.span>
                        {index < relationshipPath.length - 1 && (
                          <span className="h-px w-6 bg-stroke" aria-hidden="true" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[linear-gradient(135deg,hsl(var(--background)),hsl(var(--surface-soft)_/_0.72))] p-5">
                <div className="rounded-[1.65rem] border border-stroke bg-surface/82 p-5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">Visual route</p>
                      <p className="mt-1 text-xs font-medium text-ink-muted">Highlighted path through the tree</p>
                    </div>
                    <GitBranch className="h-5 w-5 text-primary" strokeWidth={1.8} />
                  </div>

                  <svg viewBox="0 0 200 130" className="h-auto w-full overflow-visible" aria-hidden="true">
                    <path d={graphLines} stroke="hsl(var(--border))" strokeWidth="1.8" fill="none" />
                    <motion.path
                      d={highlightedPath}
                      stroke="hsl(var(--soft-gold))"
                      strokeWidth="3"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.25 }}
                    />
                    {relationshipNodes.map((node, index) => (
                      <g key={`${node.label}-${index}`}>
                        <motion.circle
                          cx={node.x}
                          cy={node.y}
                          r="13"
                          fill={node.ring ? "hsl(var(--dark-green))" : node.fill}
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.35 + index * 0.08, type: "spring", stiffness: 180, damping: 16 }}
                        />
                        {node.ring && (
                          <motion.circle
                            cx={node.x}
                            cy={node.y}
                            r="18"
                            stroke="hsl(var(--soft-gold))"
                            strokeWidth="2"
                            fill="none"
                            animate={{ scale: [0.92, 1, 0.92], opacity: [0.42, 0.9, 0.42] }}
                            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                          />
                        )}
                        <text
                          x={node.x}
                          y={node.y + 3.5}
                          fill={node.ring ? "white" : "hsl(var(--dark-green))"}
                          fontSize="8.5"
                          textAnchor="middle"
                          fontWeight="700"
                        >
                          {node.label}
                        </text>
                      </g>
                    ))}
                  </svg>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {["4 people", "1 shared line"].map((stat) => (
                      <div key={stat} className="rounded-2xl border border-stroke bg-bg-alt px-3 py-2 text-xs font-semibold text-ink-secondary">
                        <UserRound className="mb-2 h-4 w-4 text-primary" strokeWidth={1.8} />
                        {stat}
                      </div>
                    ))}
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
