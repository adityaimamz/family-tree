import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "../lib/animationVariants";
import { events } from "../lib/data/sections";

export default function TimelineSection() {
  return (
    <section className="bg-bg py-24 px-6 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-[1200px] mx-auto">
        <div className="order-2 lg:order-1 flex justify-center lg:justify-start lg:ml-12">
          <div className="relative pl-8 max-w-[360px] w-full">
            <div className="absolute left-[11px] top-4 bottom-8 w-0.5 bg-sage-light/50"></div>

            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {events.map((ev, i) => (
                <motion.div variants={fadeUp} custom={i} key={`${ev.year}-${ev.title}`} className="relative mb-6 ml-2 group">
                  <div className="absolute -left-[30px] top-[14px] w-[10px] h-[10px] rounded-full bg-primary border-2 border-bg z-10 group-hover:scale-125 transition-transform"></div>
                  <div className="bg-surface border border-stroke rounded-xl p-4 shadow-[0_2px_12px_rgba(44,80,22,0.04)] hover:shadow-md transition-shadow">
                    <div className="text-[13px] font-bold tracking-wider text-primary mb-1">{ev.year}</div>
                    <h3 className="font-semibold text-ink text-[15px]">{ev.title}</h3>
                    <p className="text-[13px] text-ink-muted mt-1 leading-relaxed">{ev.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="order-1 lg:order-2 text-center lg:text-left">
          <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-bold">✦ TIMELINE</div>
          <h2 className="font-display text-[clamp(32px,4vw,52px)] leading-[1.15] text-ink mt-4">
            Turn family history into a <em className="italic">living timeline.</em>
          </h2>
          <p className="text-base text-ink-secondary leading-relaxed mt-5">
            Connect milestones, photos, biographies, and memories into a timeline that tells the story of your family
            across generations.
          </p>
        </div>
      </div>
    </section>
  );
}
