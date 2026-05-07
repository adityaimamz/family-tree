import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { footerLinks } from "../lib/data/sections";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-stroke bg-bg-alt px-4 py-16 sm:px-6 lg:py-20">
      <div className="absolute inset-0 bg-archive-texture opacity-35 [mask-image:linear-gradient(180deg,rgba(0,0,0,0.62),transparent_88%)]" />
      <div className="relative mx-auto w-full max-w-[1320px]">
        <div className="grid gap-12 rounded-[2rem] border border-white/70 bg-surface/58 p-5 shadow-[0_24px_70px_-58px_rgba(80,54,30,0.86)] sm:p-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:p-10">
          <div>
            <a
              href="/landing"
              className="group inline-flex items-center gap-3 rounded-2xl outline-none transition hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-sage-light"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                <ShieldCheck className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <span>
                <span className="block text-xl font-semibold leading-6 text-primary">WarisanAI</span>
                <span className="block text-sm font-medium text-ink-muted">Private family archive</span>
              </span>
            </a>

            <p className="mt-6 max-w-[48ch] text-base leading-8 text-ink-secondary">
              A calm workspace for families who want stories, photos, relationships, and timelines to stay organized
              without becoming public.
            </p>

            <a
              href="mailto:hello@warisan.ai"
              className="mt-8 inline-flex items-center gap-3 rounded-full border border-stroke bg-surface px-4 py-2.5 text-sm font-semibold text-ink outline-none transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-primary/35 hover:text-primary active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-sage-light"
            >
              <Mail className="h-4 w-4 text-primary" strokeWidth={1.8} />
              hello@warisan.ai
            </a>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerLinks.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <p className="text-sm font-semibold text-ink">{group.title}</p>
                <ul className="mt-4 grid gap-3">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.label}`}>
                      <a
                        href={link.href}
                        className="group inline-flex items-center gap-2 text-sm font-medium text-ink-secondary outline-none transition hover:text-primary focus-visible:rounded-lg focus-visible:ring-4 focus-visible:ring-sage-light"
                      >
                        {link.label}
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 transition duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" strokeWidth={1.8} />
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 text-center text-sm font-medium text-ink-muted">
          <p>2026 WarisanAI. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            <a href="#privacy" className="transition hover:text-primary">
              Security
            </a>
            <a href="#privacy" className="transition hover:text-primary">
              Privacy
            </a>
            <a href="mailto:hello@warisan.ai" className="transition hover:text-primary">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
