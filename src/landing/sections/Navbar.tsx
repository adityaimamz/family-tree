import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpenText, Clock3, GitBranch, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const navItems = [
  { href: "#features", label: "Problems", note: "Why memory fades", icon: Clock3 },
  { href: "#family-space", label: "Private archive", note: "One protected place", icon: LockKeyhole },
  { href: "#demo", label: "Family tree", note: "Generations with context", icon: GitBranch },
  { href: "#biography", label: "Biography studio", note: "Drafts families approve", icon: BookOpenText },
  { href: "#timeline", label: "Timeline", note: "Milestones connected", icon: Sparkles },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 36);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="pointer-events-none fixed inset-x-0 top-3 z-50 px-3 sm:top-5 sm:px-6" aria-label="Primary">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="pointer-events-auto fixed inset-0 bg-primary/18 backdrop-blur-[2px] lg:hidden"
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 22 }}
        className={`pointer-events-auto relative mx-auto flex min-h-[64px] w-full max-w-[1180px] items-center justify-between gap-3 rounded-[1.55rem] border px-3.5 py-2 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:px-5 ${
          scrolled
            ? "border-white/80 bg-surface/88 shadow-[0_22px_60px_-38px_rgba(80,54,30,0.72)] backdrop-blur-xl"
            : "border-white/80 bg-surface/95 shadow-[0_18px_48px_-40px_rgba(80,54,30,0.66)] backdrop-blur-xl md:border-white/60 md:bg-surface/62 md:backdrop-blur-lg"
        }`}
      >
        <Link
          to="/landing"
          className="group flex min-w-0 items-center gap-3 rounded-2xl px-2 py-1.5 outline-none transition hover:bg-surface-soft/70 focus-visible:ring-4 focus-visible:ring-sage-light"
          onClick={closeMenu}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition group-hover:-translate-y-0.5">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-semibold leading-5 text-primary">WarisanAI</span>
            <span className="hidden text-[11px] font-medium leading-4 text-ink-muted sm:block">Private family archive</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 rounded-2xl border border-stroke/70 bg-bg-alt/68 p-1 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-ink-secondary outline-none transition hover:bg-surface hover:text-primary focus-visible:ring-4 focus-visible:ring-sage-light"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-stroke bg-surface px-4 text-sm font-semibold text-ink outline-none transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-bg-alt active:translate-y-[1px] focus-visible:ring-4 focus-visible:ring-sage-light"
          >
            Sign in
          </Link>
          <Link
            to="/"
            className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-surface shadow-[0_18px_34px_-26px_rgba(44,80,22,0.95)] outline-none transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px] focus-visible:ring-4 focus-visible:ring-sage-light"
          >
            Create archive
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" strokeWidth={1.8} />
          </Link>
        </div>

        <button
          type="button"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl border border-stroke bg-surface text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] outline-none transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-bg-alt active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-sage-light lg:hidden"
          onClick={() => setIsOpen((value) => !value)}
        >
          <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
          <span
            className={`absolute h-px w-4 rounded-full bg-primary transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              isOpen ? "translate-y-0 rotate-45" : "-translate-y-1.5 rotate-0"
            }`}
          />
          <span
            className={`absolute h-px w-4 rounded-full bg-primary transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              isOpen ? "translate-y-0 -rotate-45" : "translate-y-1.5 rotate-0"
            }`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 210, damping: 24 }}
              className="absolute left-0 right-0 top-[calc(100%+0.65rem)] max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-[2rem] border border-white/90 bg-bg p-2 shadow-[0_30px_76px_-38px_rgba(80,54,30,0.9)] ring-1 ring-stroke/70 lg:hidden"
            >
              <div className="rounded-[calc(2rem-0.5rem)] border border-white/80 bg-surface p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.76)]">
                <div className="rounded-[1.45rem] bg-primary p-4 text-surface">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface/12">
                      <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className="text-base font-semibold leading-5">WarisanAI archive</p>
                      <p className="mt-1 text-xs font-medium text-surface/68">Private family memory workspace</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm font-medium leading-6 text-surface/76">
                    Jump to the part of the archive you want to inspect.
                  </p>
                </div>

                <div className="mt-3 grid gap-2">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.a
                        key={item.href}
                        href={item.href}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06 + index * 0.04, duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
                        className="grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 rounded-[1.25rem] bg-bg-alt/74 p-2.5 text-left outline-none transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary-muted focus-visible:ring-4 focus-visible:ring-sage-light"
                        onClick={closeMenu}
                      >
                        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-surface text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
                          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold leading-5 text-ink">{item.label}</span>
                          <span className="mt-0.5 block text-xs font-medium leading-4 text-ink-muted">{item.note}</span>
                        </span>
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-surface text-primary">
                          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                        </span>
                      </motion.a>
                    );
                  })}
                </div>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Link
                  to="/"
                  className="inline-flex min-h-12 items-center justify-center rounded-[1.25rem] border border-stroke bg-surface px-4 text-sm font-semibold text-ink shadow-[0_14px_34px_-28px_rgba(80,54,30,0.72)]"
                  onClick={closeMenu}
                >
                  Sign in
                </Link>
                <Link
                  to="/"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.25rem] bg-primary px-4 text-sm font-semibold text-surface shadow-[0_18px_38px_-28px_rgba(44,80,22,0.95)]"
                  onClick={closeMenu}
                >
                  Create archive
                  <ArrowRight className="h-4 w-4 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1" strokeWidth={1.8} />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </nav>
  );
}
