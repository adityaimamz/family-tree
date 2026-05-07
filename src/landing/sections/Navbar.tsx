import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";

const navItems = [
  { href: "#features", label: "Problems" },
  { href: "#family-space", label: "Private space" },
  { href: "#demo", label: "Demo" },
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
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 22 }}
        className={`pointer-events-auto relative mx-auto flex min-h-[64px] w-full max-w-[1180px] items-center justify-between gap-3 rounded-[1.55rem] border px-3.5 py-2 transition duration-300 sm:px-5 ${
          scrolled
            ? "border-white/80 bg-surface/88 shadow-[0_22px_60px_-38px_rgba(80,54,30,0.72)] backdrop-blur-xl"
            : "border-white/60 bg-surface/62 shadow-[0_18px_48px_-40px_rgba(80,54,30,0.66)] backdrop-blur-lg"
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

        <div className="hidden items-center gap-1 rounded-2xl border border-stroke/70 bg-bg-alt/68 p-1 md:flex">
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

        <div className="hidden items-center gap-2 md:flex">
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
            Create space
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" strokeWidth={1.8} />
          </Link>
        </div>

        <button
          type="button"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-stroke bg-surface text-primary outline-none transition hover:bg-bg-alt active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-sage-light md:hidden"
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? <X className="h-5 w-5" strokeWidth={1.8} /> : <Menu className="h-5 w-5" strokeWidth={1.8} />}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 210, damping: 24 }}
              className="absolute left-0 right-0 top-[calc(100%+0.65rem)] overflow-hidden rounded-[1.55rem] border border-white/80 bg-surface/96 p-2 shadow-[0_24px_68px_-38px_rgba(80,54,30,0.82)] backdrop-blur-xl md:hidden"
            >
              <div className="grid gap-1">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-2xl px-4 py-3 text-sm font-semibold text-ink outline-none transition hover:bg-bg-alt focus-visible:ring-4 focus-visible:ring-sage-light"
                    onClick={closeMenu}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 border-t border-stroke pt-2 sm:grid-cols-2">
                <Link
                  to="/"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-stroke bg-bg-alt px-4 text-sm font-semibold text-ink"
                  onClick={closeMenu}
                >
                  Sign in
                </Link>
                <Link
                  to="/"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-surface"
                  onClick={closeMenu}
                >
                  Create space
                  <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </nav>
  );
}
