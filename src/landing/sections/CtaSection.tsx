import { Link } from "react-router-dom";
import { values } from "../lib/data/sections";

export default function CtaSection() {
  return (
    <section className="bg-primary py-24 px-6 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--sage-green)) 1.5px, transparent 1.5px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-[700px] mx-auto text-center relative z-10">
        <h2 className="font-display text-[clamp(32px,4vw,52px)] leading-[1.15] text-surface">
          Your family&apos;s story deserves <em className="italic font-light">a home.</em>
        </h2>
        <p className="text-surface/75 text-base leading-relaxed max-w-xl mx-auto mt-5">
          Create a private family space where memories, relationships, photos, and stories can stay organized for
          generations.
        </p>
        <div className="flex justify-center gap-5 mt-12 flex-wrap">
          <Link
            to="/"
            className="bg-accent text-ink rounded-full px-8 py-4 font-semibold text-base shadow-lg shadow-accent/20 hover:scale-105 transition-transform"
          >
            Create Your Family Space &rarr;
          </Link>
          <a
            href="#demo"
            className="border border-surface/35 text-surface rounded-full px-8 py-4 hover:bg-white/10 transition-colors font-semibold text-base"
          >
            View Demo
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-[1000px] mx-auto mt-20 relative z-10">
        {values.map((v) => (
          <div
            key={v.title}
            className="bg-surface/[0.04] border border-surface/[0.08] backdrop-blur-sm rounded-2xl p-6 text-left hover:bg-surface/[0.06] transition-colors"
          >
            <div className="text-2xl mb-3 text-accent-light">{v.icon}</div>
            <h4 className="text-surface font-semibold text-[15px]">{v.title}</h4>
            <p className="text-surface/65 text-[13px] mt-2 leading-relaxed">{v.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
