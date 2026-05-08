import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calendar,
  GitBranch,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { EmptyState, iconStroke, pageTransition } from "../components/ui";
import { useSpaceStore } from "../hooks/useSpaceStore";
import { performSignOut } from "../lib/signOut";
import { cx, getInitials } from "../utils/family";

type ShellNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
};

type NavGroup = {
  label: string;
  items: ShellNavItem[];
};

const spaceNavGroups: NavGroup[] = [
  {
    label: "Archive",
    items: [
      { label: "Overview", to: "", icon: LayoutDashboard, end: true },
      { label: "Family Tree", to: "/tree", icon: GitBranch },
      { label: "Members", to: "/members", icon: Users },
    ],
  },
  {
    label: "Memories",
    items: [
      { label: "Timeline", to: "/timeline", icon: Calendar },
      { label: "Gallery", to: "/gallery", icon: Images },
      { label: "Stories", to: "/stories", icon: BookOpen },
    ],
  },
  {
    label: "Control",
    items: [{ label: "Settings", to: "/settings", icon: Settings }],
  },
];

const roleLabel = (role: string) => {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
};

const titleFromPath = (pathname: string) => {
  if (pathname.endsWith("/tree")) return "Family Tree";
  if (pathname.endsWith("/members")) return "Members";
  if (pathname.includes("/members/")) return "Member Profile";
  if (pathname.endsWith("/timeline")) return "Timeline";
  if (pathname.endsWith("/gallery")) return "Gallery";
  if (pathname.endsWith("/stories")) return "Stories";
  if (pathname.endsWith("/settings")) return "Settings";
  return "Overview";
};

export const SpaceLayout = () => {
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const location = useLocation();
  const { currentSpace, membership, currentUser, isLoading, canEdit } = useSpaceStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = titleFromPath(location.pathname);

  const userInitial = useMemo(
    () => getInitials(currentUser?.name || currentUser?.email || "Family User").toUpperCase(),
    [currentUser],
  );

  if (isLoading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[radial-gradient(circle_at_14%_0%,hsl(var(--soft-gold)_/_0.16),transparent_28rem),radial-gradient(circle_at_92%_8%,hsl(var(--sage-green)_/_0.18),transparent_30rem),hsl(var(--background))]">
        <div className="rounded-[2rem] border border-white/75 bg-surface/90 p-8 text-center shadow-soft ring-1 ring-border-soft/60">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-sage-green/15" />
          <p className="mt-4 text-sm font-semibold text-text-muted">Loading FamilySpace...</p>
        </div>
      </div>
    );
  }

  if (!currentSpace || !membership) {
    return (
      <div className="grid min-h-[100dvh] place-items-center px-4">
        <EmptyState
          title="Access denied"
          description="You do not have access to this private family archive."
        />
      </div>
    );
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cx(
      "group flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition active:translate-y-[1px]",
      isActive
        ? "bg-dark-green text-white shadow-soft"
        : "text-text-muted hover:bg-surface-soft hover:text-text-primary",
    );

  const sidebar = (onNavigate?: () => void) => (
    <aside className="surface-grain relative flex h-full w-72 flex-col overflow-hidden border-r border-white/75 bg-surface/94 px-4 py-5 shadow-[18px_0_60px_-48px_rgba(80,54,30,0.85)] ring-1 ring-border-soft/65">
      <div className="relative z-[1]">
        <Link
          to="/app"
          className="mb-5 inline-flex min-h-10 items-center rounded-2xl px-2 text-sm font-bold text-text-muted transition hover:bg-surface-soft hover:text-text-primary active:translate-y-[1px]"
          onClick={onNavigate}
        >
          Back to spaces
        </Link>

        <div className="rounded-[1.6rem] border border-white/75 bg-background/80 p-4 shadow-soft ring-1 ring-border-soft/60">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-dark-green text-white shadow-soft">
            <GitBranch className="h-5 w-5" strokeWidth={iconStroke} />
          </span>
          <p className="mt-4 truncate font-display text-lg font-extrabold tracking-tight text-text-primary">{currentSpace.name}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-sage-green">{roleLabel(membership.role)}</p>
        </div>
      </div>

      <nav className="relative z-[1] mt-6 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
        {spaceNavGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-text-muted">{group.label}</p>
            <div className="grid gap-1">
              {group.items.map(({ icon: Icon, label, to, end }) => (
                <NavLink
                  key={to || "overview"}
                  to={`/app/${spaceSlug}${to}`}
                  end={end}
                  className={linkClass}
                  onClick={onNavigate}
                >
                  <Icon className="h-4 w-4 shrink-0 transition group-hover:scale-105" strokeWidth={iconStroke} />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative z-[1] mt-6 rounded-[1.45rem] border border-sage-green/20 bg-sage-green/10 p-4">
        <p className="text-sm font-extrabold text-text-primary">Role: {roleLabel(membership.role)}</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-text-muted">
          {canEdit()
            ? "You can manage records in this FamilySpace."
            : "Read-only access. Owners and admins manage records."}
        </p>
      </div>
    </aside>
  );

  return (
    <motion.div
      {...pageTransition}
      className="min-h-[100dvh] bg-[radial-gradient(circle_at_14%_0%,hsl(var(--soft-gold)_/_0.16),transparent_28rem),radial-gradient(circle_at_92%_8%,hsl(var(--sage-green)_/_0.18),transparent_30rem),hsl(var(--background))] text-text-primary"
    >
      <div className="flex min-h-[100dvh] w-full">
        <div className="hidden lg:block">{sidebar()}</div>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border-soft/70 bg-background/92 px-3 shadow-[0_18px_42px_-36px_rgba(80,54,30,0.75)] backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="grid h-11 w-11 place-items-center rounded-2xl bg-dark-green text-white shadow-soft transition hover:bg-warm-brown active:translate-y-[1px] lg:hidden"
                aria-label="Open FamilySpace navigation"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" strokeWidth={iconStroke} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-lg font-extrabold tracking-tight text-text-primary sm:text-xl">{pageTitle}</p>
                <p className="truncate text-xs font-semibold text-text-muted">{currentSpace.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden min-h-10 items-center gap-3 rounded-2xl border border-border-soft bg-surface px-3 py-2 shadow-soft sm:flex">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-sage-green/12 text-sm font-extrabold text-dark-green">
                  {userInitial}
                </span>
                <div className="min-w-0">
                  <p className="max-w-40 truncate text-sm font-bold text-text-primary">{currentUser?.name || currentUser?.email || "Family user"}</p>
                  <p className="truncate text-xs font-semibold text-text-muted">{roleLabel(membership.role)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void performSignOut()}
                className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-border-soft bg-surface px-3 py-2 text-sm font-bold text-text-primary shadow-soft transition hover:-translate-y-0.5 hover:bg-surface-soft active:translate-y-[1px]"
              >
                <LogOut className="h-4 w-4" strokeWidth={iconStroke} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-text-primary/38 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div
              className="absolute inset-y-0 left-0 w-72 max-w-[86vw]"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative h-full">
                <button
                  type="button"
                  aria-label="Close FamilySpace navigation"
                  className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-2xl border border-border-soft bg-background text-text-primary shadow-soft transition hover:bg-surface-soft active:translate-y-[1px]"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" strokeWidth={iconStroke} />
                </button>
                {sidebar(() => setMobileOpen(false))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
