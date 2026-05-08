import { AnimatePresence, motion } from "framer-motion";
import { Menu, Settings, Sprout, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { familyConfig } from "../config";
import { cx } from "../utils/family";

const links = [
  { to: "/", label: familyConfig.labels.navHome, enabled: true },
  { to: "/silsilah", label: familyConfig.labels.navTree, enabled: true },
  { to: "/anggota", label: familyConfig.labels.navMembers, enabled: true },
  { to: "/galeri", label: familyConfig.labels.navGallery, enabled: familyConfig.features.gallery },
  { to: "/linimasa", label: familyConfig.labels.navTimeline, enabled: familyConfig.features.timeline },
].filter((link) => link.enabled);

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cx(
      "rounded-full px-4 py-2 text-sm font-semibold transition",
      isActive ? "bg-surface-soft text-warm-brown" : "text-text-muted hover:bg-surface-soft hover:text-text-primary",
    );

  return (
    <header className="sticky top-0 z-20 border-b border-border-soft/70 bg-background/88 backdrop-blur-xl">
      <nav className="mx-auto flex min-h-20 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-dark-green text-white shadow-soft">
            <Sprout aria-hidden className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <span>
            <span className="block font-display text-lg font-bold leading-tight text-text-primary">{familyConfig.site.familyName}</span>
            <span className="block text-xs font-semibold text-text-muted">{familyConfig.site.subtitle}</span>
          </span>
        </NavLink>

        <div className="hidden items-center rounded-full border border-border-soft bg-surface/70 p-1 shadow-soft lg:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass} end={link.to === "/"}>
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to="/app"
            className={({ isActive }) =>
              cx(
                "ml-2 inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white shadow-soft transition active:translate-y-[1px]",
                isActive ? "bg-warm-brown" : "bg-dark-green hover:bg-warm-brown",
              )
            }
          >
            <Settings className="h-4 w-4" strokeWidth={1.8} />
            {familyConfig.labels.navAdmin}
          </NavLink>
        </div>

        <button
          className="grid min-h-11 min-w-11 place-items-center rounded-2xl border border-border-soft bg-surface text-text-primary lg:hidden"
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
        >
          {open ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="border-t border-border-soft bg-background px-4 pb-5 lg:hidden">
            <div className="grid gap-2 pt-3">
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.to === "/"} className="min-h-11 rounded-2xl px-4 py-3 font-semibold text-text-primary hover:bg-surface-soft" onClick={() => setOpen(false)}>
                  {link.label}
                </NavLink>
              ))}
              <NavLink
                to="/app"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-dark-green px-4 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-warm-brown active:translate-y-[1px]"
                onClick={() => setOpen(false)}
              >
                <Settings className="h-4 w-4" strokeWidth={1.8} />
                {familyConfig.labels.navAdmin}
              </NavLink>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
};
