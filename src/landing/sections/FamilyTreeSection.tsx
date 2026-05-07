import { motion } from "framer-motion";
import { familyTreeChips } from "../lib/data/sections";

export default function FamilyTreeSection() {
  return (
    <section id="demo" className="bg-bg-alt py-24">
      <div className="max-w-[700px] mx-auto text-center px-6">
        <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-bold">✦ FAMILY TREE</div>
        <h2 className="font-display text-[clamp(32px,4vw,52px)] leading-[1.15] text-ink mt-4">
          Explore generations with an <em className="italic">interactive family tree.</em>
        </h2>
        <p className="text-base text-ink-secondary leading-relaxed mt-5">
          Search members, filter family branches, open profiles, and understand relationships across generations.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {familyTreeChips.map((chip) => (
            <div key={chip} className="bg-surface border border-stroke rounded-full px-4 py-2 text-sm text-ink-secondary">
              {chip}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[560px] mx-auto mt-16 px-6 relative flex justify-center">
        <svg viewBox="0 0 300 200" className="w-full h-auto overflow-visible" preserveAspectRatio="xMidYMid meet">
          <motion.path
            d="M 150 30 L 100 100 M 150 30 L 200 100"
            stroke="hsl(var(--sage-green) / 0.55)"
            strokeWidth="1.5"
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          />

          <motion.path
            d="M 100 100 L 50 170 M 100 100 L 150 170 M 200 100 L 250 170"
            stroke="hsl(var(--sage-green) / 0.55)"
            strokeWidth="1.5"
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
          />

          {/* Gen 1 */}
          <motion.circle
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            cx="150"
            cy="30"
            r="18"
            fill="hsl(var(--dark-green))"
          />
          <motion.text
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            x="150"
            y="34.5"
            fill="white"
            fontSize="11"
            textAnchor="middle"
            fontWeight="500"
          >
            TR
          </motion.text>

          {/* Gen 2 */}
          <motion.circle
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            cx="100"
            cy="100"
            r="18"
            fill="hsl(var(--dark-green))"
          />
          <motion.text
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            x="100"
            y="104.5"
            fill="white"
            fontSize="11"
            textAnchor="middle"
            fontWeight="500"
          >
            SR
          </motion.text>

          <motion.circle
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            cx="200"
            cy="100"
            r="18"
            fill="hsl(var(--dark-green))"
          />
          <motion.text
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            x="200"
            y="104.5"
            fill="white"
            fontSize="11"
            textAnchor="middle"
            fontWeight="500"
          >
            MR
          </motion.text>

          {/* Gen 3 */}
          <motion.circle
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            cx="50"
            cy="170"
            r="18"
            fill="hsl(var(--dark-green))"
          />
          <motion.text
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.0 }}
            x="50"
            y="174.5"
            fill="white"
            fontSize="11"
            textAnchor="middle"
            fontWeight="500"
          >
            RN
          </motion.text>

          {/* Highlighted Node Gen 3 */}
          <motion.circle
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            cx="150"
            cy="170"
            r="22"
            fill="hsl(var(--dark-green))"
          />
          <motion.circle
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            cx="150"
            cy="170"
            r="26"
            stroke="hsl(var(--soft-gold))"
            strokeWidth="2"
            fill="none"
          />
          <motion.text
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.0 }}
            x="150"
            y="174.5"
            fill="white"
            fontSize="12"
            textAnchor="middle"
            fontWeight="500"
          >
            AR
          </motion.text>

          {/* Third child */}
          <motion.circle
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            cx="250"
            cy="170"
            r="18"
            fill="hsl(var(--dark-green))"
          />
          <motion.text
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.0 }}
            x="250"
            y="174.5"
            fill="white"
            fontSize="11"
            textAnchor="middle"
            fontWeight="500"
          >
            DR
          </motion.text>
        </svg>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="absolute bg-surface border border-stroke rounded-xl shadow-md px-4 py-2 flex flex-col items-center left-1/2 -translate-x-1/2 bottom-0"
        >
          <span className="font-semibold text-sm text-ink">Aditya Rahman</span>
          <span className="text-[11px] text-ink-muted">1982 • Son</span>
        </motion.div>
      </div>
    </section>
  );
}
