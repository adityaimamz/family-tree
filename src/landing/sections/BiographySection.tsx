import { motion } from "framer-motion";

export default function BiographySection() {
  return (
    <section className="bg-bg py-24 px-6 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-[1200px] mx-auto">
        <div className="text-center lg:text-left">
          <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-bold">✦ AI BIOGRAPHY</div>
          <h2 className="font-display text-[clamp(32px,4vw,52px)] leading-[1.15] text-ink mt-4">
            Turn short notes into <em className="italic">meaningful biographies.</em>
          </h2>
          <p className="text-base text-ink-secondary leading-relaxed mt-5">
            Write a few details. Let AI shape them into warm, readable family stories your relatives can keep.
          </p>
          <div className="text-sm text-ink-muted italic mt-4 flex items-center justify-center lg:justify-start gap-1.5">
            🔒 Only your family space can access this story.
          </div>
        </div>

        <div className="flex justify-center lg:justify-end w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="bg-surface border border-stroke rounded-2xl shadow-[0_2px_12px_rgba(44,80,22,0.08)] p-6 w-full max-w-[420px]"
          >
            <div className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">✦ Your notes</div>
            <div className="bg-bg-alt rounded-xl p-4 text-sm text-ink-secondary font-mono leading-relaxed">
              Born in 1952. Loved cooking.
              <br />
              Raised six children.
              <br />
              Known for kindness.
            </div>

            <button className="w-full mt-5 bg-primary text-surface rounded-full px-8 py-4 font-semibold text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-105 transition-transform">
              ✦ Generate Biography
            </button>

            <div className="my-6 border-t border-stroke"></div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-3">AI-generated biography</div>
              <p className="font-display italic text-lg text-ink leading-relaxed">
                &quot;She became the heart of the family, remembered for her warmth, patience, and everyday acts of care.
                Through decades of quiet dedication, she shaped the lives of those around her.&quot;
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
