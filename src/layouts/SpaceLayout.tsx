import { motion } from "framer-motion";
import { GitBranch, Home, Images, LogOut, Menu, Users, X, Calendar } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { EmptyState, iconStroke, pageTransition } from "../components/ui";
import { useSpaceStore } from "../hooks/useSpaceStore";
import { cx } from "../utils/family";
import { neonAuth } from "../lib/auth";

export const SpaceLayout = () => {
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const { currentSpace, membership, isLoading, canEdit } = useSpaceStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 animate-pulse">
            <div className="mx-auto h-12 w-12 rounded-full bg-surface-soft" />
          </div>
          <p className="text-sm font-semibold text-text-muted">Memuat ruang keluarga...</p>
        </div>
      </div>
    );
  }

  if (!currentSpace || !membership) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4">
        <EmptyState
          title="Akses Ditolak"
          description="Anda tidak memiliki akses ke ruang keluarga ini."
        />
      </div>
    );
  }

  const navLinks = [
    { icon: Home, label: "Dashboard", to: "", enabled: true },
    { icon: GitBranch, label: "Silsilah", to: "/tree", enabled: true },
    { icon: Users, label: "Anggota", to: "/members", enabled: true },
    { icon: Calendar, label: "Linimasa", to: "/timeline", enabled: true },
    { icon: Images, label: "Galeri", to: "/gallery", enabled: true },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cx(
      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
      isActive
        ? "bg-dark-green text-white shadow-soft"
        : "text-text-muted hover:bg-surface-soft hover:text-text-primary"
    );

  return (
    <motion.div {...pageTransition} className="flex min-h-[100dvh] flex-col">
      {/* Header */}
      <header className="border-b border-border-soft/70 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-dark-green text-white shadow-soft">
              <GitBranch className="h-5 w-5" strokeWidth={iconStroke} />
            </span>
            <div>
              <p className="font-display text-lg font-bold leading-tight text-text-primary">{currentSpace.name}</p>
              <p className="text-xs font-semibold text-text-muted capitalize">{membership.role}</p>
            </div>
          </div>

          <button
            className="grid min-h-11 min-w-11 place-items-center rounded-2xl border border-border-soft bg-surface text-text-primary lg:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <button
            onClick={() => neonAuth.signOut()}
            className="hidden min-h-11 items-center gap-2 rounded-2xl bg-surface px-4 py-3 text-sm font-semibold text-text-muted transition hover:bg-surface-soft hover:text-text-primary lg:flex"
          >
            <LogOut className="h-4 w-4" strokeWidth={iconStroke} />
            Keluar
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border-t border-border-soft bg-background px-4 pb-5 lg:hidden"
          >
            <div className="grid gap-2 pt-3">
              {navLinks.map(({ icon: Icon, label, to }) => (
                <NavLink
                  key={to}
                  to={`/app/${spaceSlug}${to}`}
                  end={to === ""}
                  className={linkClass}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={iconStroke} />
                  {label}
                </NavLink>
              ))}
              <button
                onClick={() => {
                  neonAuth.signOut();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-text-muted transition hover:bg-surface-soft hover:text-text-primary"
              >
                <LogOut className="h-4 w-4" strokeWidth={iconStroke} />
                Keluar
              </button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden border-r border-border-soft/70 bg-surface/40 px-4 py-6 lg:block lg:w-64">
          <nav className="flex flex-col gap-2">
            {navLinks.map(({ icon: Icon, label, to }) => (
              <NavLink
                key={to}
                to={`/app/${spaceSlug}${to}`}
                end={to === ""}
                className={linkClass}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={iconStroke} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Role Badge */}
          <div className="mt-8 border-t border-border-soft/70 pt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-text-muted">Izin Akses</p>
            <div className={`rounded-2xl px-3 py-2 text-center text-sm font-semibold ${
              membership.role === "owner" ? "bg-dark-green/12 text-dark-green" :
              membership.role === "admin" ? "bg-warm-brown/12 text-warm-brown" :
              "bg-sage-green/12 text-dark-green"
            }`}>
              {membership.role === "owner" ? "Pemilik" : membership.role === "admin" ? "Admin" : "Anggota"}
            </div>
          </div>

          {/* Edit Permissions */}
          {!canEdit() && (
            <div className="mt-6 rounded-2xl border border-sage-green/20 bg-sage-green/10 p-3 text-xs leading-5 text-text-muted">
              Mode baca. Hanya pemilik dan admin yang dapat mengedit.
            </div>
          )}
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </motion.div>
  );
};
