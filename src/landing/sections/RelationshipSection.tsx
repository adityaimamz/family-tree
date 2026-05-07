import React from "react";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "../lib/animationVariants";
import { relationshipNodes, relationshipPath } from "../lib/data/sections";

export default function RelationshipSection() {
  return (
    <section className="bg-bg-alt py-24 px-6 overflow-hidden">
      <div className="max-w-[700px] mx-auto text-center">
        <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-bold">✦ AI RELATIONSHIP EXPLAINER</div>
        <h2 className="font-display text-[clamp(32px,4vw,52px)] leading-[1.15] text-ink mt-4">
          Understand family relationships <em className="italic">instantly.</em>
        </h2>
        <p className="text-base text-ink-secondary leading-relaxed mt-5">
          Ask how two people are related and get a simple explanation with a highlighted path through the family tree.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1000px] mx-auto mt-14">
        {/* Left - Chat Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-surface border border-stroke rounded-2xl p-6 shadow-[0_2px_12px_rgba(44,80,22,0.08)] flex flex-col"
        >
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-4">Ask a question</div>

          <div className="self-end bg-primary-muted text-primary text-sm rounded-2xl rounded-tr-sm px-4 py-3 inline-block max-w-[80%] mb-3">
            How is Rina related to Aditya?
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="self-start bg-bg border border-stroke text-sm rounded-2xl rounded-tl-sm px-4 py-3 text-ink-secondary leading-relaxed max-w-[90%]"
          >
            Rina is Aditya&apos;s cousin. Rina&apos;s father and Aditya&apos;s mother are siblings.
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-6 pt-5 border-t border-stroke"
          >
            <div className="text-[11px] font-semibold tracking-wider text-ink-muted mb-3 uppercase">Relationship path</div>
            <div className="flex flex-wrap items-center gap-2">
              {relationshipPath.map((name, i, arr) => (
                <React.Fragment key={`${name}-${i}`}>
                  <motion.div
                    variants={fadeUp}
                    custom={i}
                    className="bg-sage-light text-primary text-xs px-2.5 py-1 rounded-full font-medium"
                  >
                    {name}
                  </motion.div>
                  {i < arr.length - 1 && (
                    <motion.div variants={fadeUp} custom={i} className="text-ink-muted text-sm">
                      &rarr;
                    </motion.div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Right - Mini tree panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-surface border border-stroke rounded-2xl p-6 flex flex-col items-center justify-center min-h-[220px] shadow-[0_2px_12px_rgba(44,80,22,0.08)]"
        >
          <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-6 self-start">Visual Path</div>
          <svg viewBox="0 0 200 120" className="w-full max-w-[280px] h-auto overflow-visible">
            {/* Base lines */}
            <path
              d="M 100 20 L 50 70 M 100 20 L 150 70 M 50 70 L 20 120 M 150 70 L 180 120"
              stroke="hsl(var(--border))"
              strokeWidth="1.5"
              fill="none"
            />

            {/* Highlighted path */}
            <motion.path
              d="M 20 120 L 50 70 L 100 20 L 150 70 L 180 120"
              stroke="hsl(var(--soft-gold))"
              strokeWidth="2.5"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.8 }}
            />

            {/* Nodes */}
            {relationshipNodes.map((node, i) => (
              <g key={`${node.label}-${i}`}>
                <circle cx={node.x} cy={node.y} r="12" fill={node.fill} />
                {node.ring && (
                  <motion.circle
                    cx={node.x}
                    cy={node.y}
                    r="15"
                    stroke="hsl(var(--soft-gold))"
                    strokeWidth="2"
                    fill="none"
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.2 + i * 0.2 }}
                  />
                )}
                <text
                  x={node.x}
                  y={node.y + 3}
                  fill="hsl(var(--dark-green))"
                  fontSize="9"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </motion.div>
      </div>
    </section>
  );
}
