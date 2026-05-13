import { Skeleton } from "@syraui/core";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  GitBranch,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { EmptyState, LoadingState, PageShell, SectionHeader, iconStroke, pageTransition } from "../components/ui";
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

const contentTitleFromPath = (pathname: string, spaceName: string) => {
  if (pathname.endsWith("/members")) return "Members Directory";
  if (pathname.includes("/members/")) return "Member Profile";
  if (pathname.endsWith("/tree")) return "Family Tree";
  if (pathname.endsWith("/timeline")) return "Timeline";
  if (pathname.endsWith("/gallery")) return "Photo Memories";
  if (pathname.endsWith("/stories")) return "Family Stories";
  if (pathname.endsWith("/settings")) return "Settings";
  return spaceName;
};

const contentEyebrowFromPath = (pathname: string) => {
  if (pathname.endsWith("/members")) return "Family records";
  if (pathname.includes("/members/")) return "Family profile";
  if (pathname.endsWith("/tree")) return "Family tree";
  if (pathname.endsWith("/timeline")) return "Living family history";
  if (pathname.endsWith("/gallery")) return "Photo memories";
  if (pathname.endsWith("/stories")) return "Stories and Memory Inbox";
  if (pathname.endsWith("/settings")) return "FamilySpace settings";
  return "Archive overview";
};

const contentDescriptionFromPath = (pathname: string) => {
  if (pathname.endsWith("/members")) return "Search for family members by name, relationship to root, generation, status, or family branch.";
  if (pathname.includes("/members/")) return "Review one family member's relationships, memories, and biography draft tools.";
  if (pathname.endsWith("/tree")) return "Explore relationships across generations and ask AI how two relatives are connected.";
  if (pathname.endsWith("/timeline")) return "Connect milestones, photos, biographies, and memories into a readable family timeline.";
  if (pathname.endsWith("/gallery")) return "Preserve family photos with dates, event context, and the stories behind each image.";
  if (pathname.endsWith("/stories")) return "Turn raw memories, interview notes, photo context, and document snippets into reviewed family narratives.";
  if (pathname.endsWith("/settings")) return "Manage archive identity and your account profile for this FamilySpace.";
  return "A private family archive for preserving relationships, stories, photos, and memories across generations.";
};

const SpaceBootLoader = () => (
  <div className="grid min-h-[100dvh] place-items-center bg-[radial-gradient(circle_at_14%_0%,hsl(var(--soft-gold)_/_0.16),transparent_28rem),radial-gradient(circle_at_92%_8%,hsl(var(--sage-green)_/_0.18),transparent_30rem),hsl(var(--background))] px-4">
    <div className="rounded-[2rem] border border-white/75 bg-surface/90 p-8 text-center shadow-soft ring-1 ring-border-soft/60">
      <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-sage-green/15" />
      <p className="mt-4 text-sm font-semibold text-text-muted">Loading FamilySpace...</p>
    </div>
  </div>
);

const SpaceContentSkeleton = ({
  pathname,
  spaceName,
}: {
  pathname: string;
  spaceName: string;
}) => {
  const title = contentTitleFromPath(pathname, spaceName);
  const eyebrow = contentEyebrowFromPath(pathname);
  const description = contentDescriptionFromPath(pathname);

  return (
    <PageShell>
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      <LoadingState />
    </PageShell>
  );
};

export const SpaceLayout = () => {
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const location = useLocation();
  const { currentSpace, membership, currentUser, isLoading, canEdit } = useSpaceStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const pageTitle = titleFromPath(location.pathname);
  const userDisplayName = membership?.displayName || currentUser?.name || currentUser?.email || "Family user";
  const userAvatarUrl = membership?.avatarUrl ?? null;

  const userInitial = useMemo(
    () => getInitials(userDisplayName).toUpperCase(),
    [userDisplayName],
  );

  if (isLoading && (!currentSpace || !membership)) {
    return <SpaceBootLoader />;
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
      "group relative flex min-h-12 items-center gap-3 overflow-hidden rounded-[1.1rem] px-3 py-2.5 text-sm font-extrabold transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:translate-y-[1px]",
      isActive
        ? "bg-dark-green text-white shadow-[0_18px_38px_-26px_rgba(45,68,43,0.88)]"
        : "text-text-muted hover:bg-surface/80 hover:text-text-primary",
    );

  const sidebar = (onNavigate?: () => void) => (
    <aside className="surface-grain relative flex h-full w-[19rem] flex-col overflow-hidden border-r border-white/80 bg-[linear-gradient(180deg,hsl(var(--surface))_0%,hsl(var(--background))_54%,hsl(var(--surface-soft)_/_0.62)_100%)] px-4 py-5 shadow-[24px_0_80px_-56px_rgba(80,54,30,0.9)] ring-1 ring-border-soft/65">
      <div className="pointer-events-none absolute inset-x-5 top-0 h-40 rounded-full bg-soft-gold/12 blur-3xl" />
      <div className="relative z-[1]">
        <Link
          to="/app"
          className="group mb-5 inline-flex min-h-10 items-center gap-2 rounded-full border border-border-soft/70 bg-surface/78 px-3 text-sm font-extrabold text-text-muted shadow-soft transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-sage-green/25 hover:bg-white hover:text-dark-green active:translate-y-[1px]"
          onClick={onNavigate}
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-sage-green/10 text-dark-green transition group-hover:-translate-x-0.5">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={iconStroke} />
          </span>
          Back to spaces
        </Link>

        <div className="rounded-[1.9rem] bg-white/62 p-1.5 shadow-[0_24px_58px_-42px_rgba(80,54,30,0.78)] ring-1 ring-warm-brown/10">
          <div className="relative overflow-hidden rounded-[1.45rem] border border-white/85 bg-[linear-gradient(145deg,hsl(var(--surface))_0%,hsl(var(--background))_70%,hsl(var(--soft-gold)_/_0.14)_100%)] p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.92)]">
            <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-sage-green/10 blur-2xl" />
            <div className="relative flex items-start justify-between gap-3">
              <span className="grid h-14 w-14 place-items-center rounded-[1.15rem] bg-dark-green text-white shadow-[0_16px_34px_-22px_rgba(45,68,43,0.95)] ring-1 ring-white/60">
                <GitBranch className="h-5 w-5" strokeWidth={iconStroke} />
              </span>
              <span className="rounded-full border border-sage-green/18 bg-sage-green/10 px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-dark-green">
                {roleLabel(membership.role)}
              </span>
            </div>
            <p className="relative mt-4 truncate font-display text-xl font-extrabold leading-tight tracking-tight text-text-primary">{currentSpace.name}</p>
            <p className="relative mt-1 truncate text-xs font-bold uppercase tracking-[0.18em] text-text-muted">Private FamilySpace</p>
          </div>
        </div>
      </div>

      <nav className="dropdown-scroll relative z-[1] mt-6 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
        {spaceNavGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[0.68rem] font-extrabold uppercase tracking-[0.22em] text-text-muted/82">{group.label}</p>
            <div className="grid gap-1">
              {group.items.map(({ icon: Icon, label, to, end }) => (
                <NavLink
                  key={to || "overview"}
                  to={`/app/${spaceSlug}${to}`}
                  end={end}
                  className={linkClass}
                  onClick={onNavigate}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cx(
                          "absolute inset-y-2 left-1 w-1 rounded-full transition duration-500",
                          isActive ? "bg-soft-gold opacity-100" : "bg-transparent opacity-0",
                        )}
                      />
                      <span
                        className={cx(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-xl transition duration-500",
                          isActive ? "bg-white/14 text-white" : "bg-surface-soft/80 text-warm-brown group-hover:bg-soft-gold/16 group-hover:text-dark-green",
                        )}
                      >
                        <Icon className="h-4 w-4 transition group-hover:scale-105" strokeWidth={iconStroke} />
                      </span>
                  <span className="truncate">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative z-[1] mt-6 rounded-[1.45rem] border border-sage-green/18 bg-[linear-gradient(135deg,hsl(var(--sage-green)_/_0.12),hsl(var(--surface))_76%)] p-4 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-dark-green text-white">
            <ShieldCheck className="h-4 w-4" strokeWidth={iconStroke} />
          </span>
          <div>
            <p className="text-sm font-extrabold text-text-primary">Archive access</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-sage-green">{roleLabel(membership.role)}</p>
          </div>
        </div>
        <p className="mt-3 text-xs font-semibold leading-5 text-text-muted">
          {canEdit()
            ? "You can manage records in this FamilySpace."
            : "Read-only access. Owners and admins manage records."}
        </p>
        {!canEdit() && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-soft-gold/30 bg-soft-gold/14 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-warm-brown">
            Read-only
          </span>
        )}
      </div>
    </aside>
  );

  return (
    <motion.div
      {...pageTransition}
      className="min-h-[100dvh] bg-[radial-gradient(circle_at_14%_0%,hsl(var(--soft-gold)_/_0.16),transparent_28rem),radial-gradient(circle_at_92%_8%,hsl(var(--sage-green)_/_0.18),transparent_30rem),hsl(var(--background))] text-text-primary"
    >
      <div className="flex min-h-[100dvh] w-full">
        <motion.div
          initial={false}
          animate={{
            width: desktopSidebarOpen ? "19rem" : "0rem",
            opacity: desktopSidebarOpen ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 250, damping: 32 }}
          className="relative z-40 hidden h-full overflow-hidden lg:block"
        >
          <div className="h-full w-[19rem]">
            {sidebar()}
          </div>
        </motion.div>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="top-0 z-30 border-b border-border-soft/60 bg-background/78 px-3 py-2 backdrop-blur-xl sm:px-6">
            <div className="flex min-h-14 items-center justify-between gap-3 rounded-[1.35rem] border border-white/80 bg-surface/78 px-3 shadow-[0_18px_52px_-42px_rgba(80,54,30,0.82)] ring-1 ring-border-soft/55 sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="grid h-11 w-11 place-items-center rounded-2xl  shadow-soft transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-dark-green hover:text-white active:translate-y-[1px]"
                aria-label="Toggle FamilySpace navigation"
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setMobileOpen(true);
                  } else {
                    setDesktopSidebarOpen(!desktopSidebarOpen);
                  }
                }}
              >
                <Menu className="h-5 w-5" strokeWidth={iconStroke} />
              </button>
              <div className="min-w-0 py-1">
                <p className="truncate text-xs font-extrabold uppercase tracking-[0.18em] text-sage-green">{currentSpace.name}</p>
                <p className="truncate text-xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-2xl">{pageTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden min-h-11 items-center gap-3 rounded-full border border-border-soft/75 bg-background/84 px-2 py-1.5 shadow-soft sm:flex">
                <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-dark-green text-sm font-extrabold text-white shadow-soft">
                  {userAvatarUrl ? (
                    <img className="h-full w-full object-cover" src={userAvatarUrl} alt={`${userDisplayName} avatar`} />
                  ) : (
                    userInitial
                  )}
                </span>
                <div className="min-w-0 pr-3">
                  <p className="max-w-40 truncate text-sm font-bold text-text-primary">{userDisplayName}</p>
                  <p className="truncate text-xs font-semibold text-text-muted">{roleLabel(membership.role)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void performSignOut()}
                className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-border-soft/75 bg-background/84 px-2 py-1.5 text-sm font-bold text-text-primary shadow-soft transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-white active:translate-y-[1px]"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-warm-brown/10 text-warm-brown transition group-hover:bg-warm-brown group-hover:text-white">
                  <LogOut className="h-4 w-4" strokeWidth={iconStroke} />
                </span>
                <span className="hidden pr-3 sm:inline">Sign out</span>
              </button>
            </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-auto">
            {isLoading ? (
              <SpaceContentSkeleton
                pathname={location.pathname}
                spaceName={currentSpace.name}
              />
            ) : (
              <Outlet />
            )}
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
