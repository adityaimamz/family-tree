import { AnimatePresence, motion } from "framer-motion";
import { Menu, Settings, Sprout, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { familyConfig } from "../config";

const links = [
  { label: familyConfig.labels.navHome, to: "/", enabled: true },
  { label: "FamilySpaces", to: "/app", enabled: true },
].filter((link) => link.enabled);

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive ? "bg-sage-green/14 text-dark-green" : "text-text-muted hover:bg-surface-soft hover:text-text-primary"
  }`;

export const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border-soft/70 bg-background/88 backdrop-blur-xl">
      <nav className="mx-auto flex min-h-16 w-full max-w-[1400px] items-center justify-between gap-3 px-3 sm:min-h-20 sm:px-6 lg:px-8">
        <NavLink className="flex min-w-0 items-center gap-3" to="/">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-dark-green text-white shadow-soft">
            <Sprout className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-base font-bold leading-tight text-text-primary sm:text-lg">{familyConfig.site.familyName}</span>
            <span className="hidden truncate text-xs font-semibold text-text-muted sm:block">{familyConfig.site.subtitle}</span>
          </span>
        </NavLink>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink key={link.to} className={navClass} to={link.to}>
              {link.label}
            </NavLink>
          ))}
          <NavLink
            className={({ isActive }) =>
              `ml-2 inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-soft transition active:translate-y-[1px] ${
                isActive ? "bg-warm-brown text-white" : "bg-dark-green text-white hover:bg-warm-brown"
              }`
            }
            to="/app"
          >
            <Settings className="h-4 w-4" strokeWidth={1.8} />
            Masuk Arsip
          </NavLink>
        </div>

        <button
          aria-label={open ? "Tutup menu" : "Buka menu"}
          className="grid min-h-11 min-w-11 place-items-center rounded-2xl border border-border-soft bg-surface text-text-primary shadow-soft lg:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" strokeWidth={1.8} /> : <Menu className="h-5 w-5" strokeWidth={1.8} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-border-soft bg-background lg:hidden"
          >
            <div className="mx-auto grid max-w-[1400px] gap-2 px-4 py-4 sm:px-6">
              {links.map((link) => (
                <NavLink key={link.to} className={navClass} to={link.to} onClick={() => setOpen(false)}>
                  {link.label}
                </NavLink>
              ))}
              <NavLink
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-dark-green px-4 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-warm-brown active:translate-y-[1px]"
                to="/app"
                onClick={() => setOpen(false)}
              >
                <Settings className="h-4 w-4" strokeWidth={1.8} />
                Masuk Arsip
              </NavLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-border-soft/50 py-12">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-6 px-6 sm:flex-row sm:px-8">
        <div className="flex flex-col gap-1.5 text-center sm:text-left">
          <p className="text-sm font-semibold text-text-primary">
            &copy; {new Date().getFullYear()} {familyConfig.site.familyName}.
          </p>
          <p className="text-xs font-medium text-text-muted/60">
            {familyConfig.site.subtitle}
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
          <span>dibuat oleh</span>
          <motion.a
            href="https://izaditya.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-1 font-bold text-text-primary transition-colors hover:text-dark-green"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            aditya imam zuhdi
            <motion.span 
              className="absolute -bottom-1 left-0 h-px w-0 bg-dark-green transition-all duration-300 group-hover:w-full"
              initial={{ width: 0 }}
            />
          </motion.a>
        </div>
      </div>
    </footer>
  );
};

