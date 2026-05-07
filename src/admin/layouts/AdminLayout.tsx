import { AnimatePresence, motion } from "framer-motion";
import { Home, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { iconStroke } from "../../components/ui";
import { AdminSidebar } from "../components/AdminSidebar";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { AdminLoginPage } from "../pages/AdminLoginPage";

const getAdminTitle = (pathname: string) => {
  if (pathname === "/admin" || pathname === "/admin/dashboard") return "Dashboard";
  if (pathname.startsWith("/admin/members")) return "Members";
  if (pathname.startsWith("/admin/gallery")) return "Gallery";
  if (pathname.startsWith("/admin/timeline")) return "Timeline";
  return "Admin";
};

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = getAdminTitle(location.pathname);

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_14%_0%,hsl(var(--soft-gold)_/_0.16),transparent_28rem),radial-gradient(circle_at_92%_8%,hsl(var(--sage-green)_/_0.18),transparent_30rem),hsl(var(--background))] text-text-primary">
      <div className="flex min-h-[100dvh] w-full">
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border-soft/70 bg-background/92 px-3 shadow-[0_18px_42px_-36px_rgba(80,54,30,0.75)] backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="grid h-11 w-11 place-items-center rounded-2xl bg-dark-green text-white shadow-soft transition hover:bg-warm-brown active:translate-y-[1px] lg:hidden"
                aria-label="Buka navigasi admin"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" strokeWidth={iconStroke} />
              </button>

              <div className="min-w-0">
                <p className="truncate text-lg font-extrabold tracking-tight text-text-primary sm:text-xl">{title}</p>
                <p className="truncate text-xs font-semibold text-text-muted">Panel Admin</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-border-soft bg-surface px-3 py-2 text-sm font-bold text-text-primary shadow-soft transition hover:-translate-y-0.5 hover:bg-surface-soft active:translate-y-[1px]"
              >
                <Home className="h-4 w-4" strokeWidth={iconStroke} />
                <span className="hidden sm:inline">Ke Website</span>
              </Link>

              <button
                type="button"
                onClick={async () => {
                  await auth.logout();
                  navigate("/admin");
                }}
                className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-border-soft bg-surface px-3 py-2 text-sm font-bold text-text-primary shadow-soft transition hover:-translate-y-0.5 hover:bg-surface-soft active:translate-y-[1px]"
              >
                <LogOut className="h-4 w-4" strokeWidth={iconStroke} />
                <span className="hidden sm:inline">Keluar</span>
              </button>

              <div className="hidden min-h-10 items-center gap-3 rounded-2xl border border-border-soft bg-surface px-3 py-2 shadow-soft sm:flex">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-sage-green/12 text-sm font-extrabold text-dark-green">
                  A
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-text-primary">{auth.user?.name || "Admin"}</p>
                  <p className="truncate text-xs font-semibold text-text-muted">Sesi aktif</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="mx-auto w-full max-w-[1400px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-text-primary/38 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw]"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative h-full">
                <button
                  type="button"
                  aria-label="Tutup navigasi admin"
                  className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-2xl border border-border-soft bg-background text-text-primary shadow-soft transition hover:bg-surface-soft active:translate-y-[1px]"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" strokeWidth={iconStroke} />
                </button>
                <AdminSidebar onNavigate={() => setMobileOpen(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
