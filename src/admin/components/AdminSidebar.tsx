import { CalendarDays, Camera, LayoutDashboard, Users, Sprout } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { iconStroke } from "../../components/ui";
import { familyConfig } from "../../config";

type AdminNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

const navItems: AdminNavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Members", to: "/admin/members", icon: Users },
  { label: "Gallery", to: "/admin/gallery", icon: Camera },
  { label: "Timeline", to: "/admin/timeline", icon: CalendarDays },
].filter((item) => {
  if (item.to === "/admin/gallery") return familyConfig.features.gallery;
  if (item.to === "/admin/timeline") return familyConfig.features.timeline;
  return true;
});

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  const isItemActive = (to: string) => {
    if (to === "/admin") {
      return location.pathname === "/admin" || location.pathname === "/admin/dashboard";
    }
    return location.pathname === to || location.pathname.startsWith(to + "/");
  };

  return (
    <aside className="flex h-full w-72 flex-col border-r border-border-soft/80 bg-surface shadow-[18px_0_55px_-42px_rgba(54,44,33,0.65)]">
      <div className="flex items-center gap-3 border-b border-border-soft/70 px-4 py-5">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-dark-green text-white shadow-soft ring-1 ring-dark-green/15">
          <Sprout className="h-5 w-5" strokeWidth={iconStroke} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-extrabold tracking-tight text-text-primary">Admin Arsip</p>
          <p className="truncate text-xs font-semibold text-text-muted">{familyConfig.site.familyName}</p>
        </div>
      </div>

      <nav className="flex-1 p-3">
        <p className="px-3 pb-2 text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-text-muted">Menu</p>
        <ul className="grid gap-1">
          {navItems.map((item) => {
            const active = isItemActive(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={
                    "flex min-h-12 items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition active:translate-y-[1px] " +
                    (active
                      ? "bg-dark-green text-white shadow-soft"
                      : "text-text-primary/72 hover:bg-surface-soft hover:text-text-primary")
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" strokeWidth={iconStroke} />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border-soft/70 p-4">
        <div className="rounded-[1.35rem] border border-border-soft/80 bg-background/80 p-4 shadow-soft">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-text-muted">Panel Admin</p>
          <p className="mt-2 text-sm font-bold text-text-primary">Arsip Keluarga</p>
          <p className="mt-1 text-xs leading-5 text-text-muted">
            Kelola data anggota, galeri, dan linimasa dari satu tempat.
          </p>
        </div>
      </div>
    </aside>
  );
}
