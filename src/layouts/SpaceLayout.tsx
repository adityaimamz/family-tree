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

const SkeletonBlock = ({ className = "" }: { className?: string }) => (
  <span aria-hidden="true" className={cx("block rounded-full bg-surface-soft", className)} />
);

const SpaceLoadingSkeleton = () => {
  const navWidths = ["w-24", "w-32", "w-28", "w-24", "w-28", "w-24", "w-24"];
  const treeNodes = [
    "left-[14%] top-[18%]",
    "left-[42%] top-[12%]",
    "left-[66%] top-[25%]",
    "left-[24%] top-[58%]",
    "left-[52%] top-[54%]",
    "left-[76%] top-[64%]",
  ];

  return (
    <Skeleton loading={true} speed={1.8}>
      <motion.div
        {...pageTransition}
        className="min-h-[100dvh] bg-[radial-gradient(circle_at_14%_0%,hsl(var(--soft-gold)_/_0.2),transparent_30rem),radial-gradient(circle_at_92%_8%,hsl(var(--sage-green)_/_0.2),transparent_32rem),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--surface-soft)_/_0.42)_100%)] text-text-primary"
        role="status"
        aria-live="polite"
        aria-label="Loading FamilySpace"
      >
      <div className="flex min-h-[100dvh] w-full">
        <aside className="surface-grain relative hidden h-[100dvh] w-[19rem] shrink-0 flex-col overflow-hidden border-r border-border-soft/75 bg-[linear-gradient(180deg,hsl(var(--surface)_/_0.92)_0%,hsl(var(--background))_52%,hsl(var(--surface-soft)_/_0.76)_100%)] px-4 py-5 shadow-[28px_0_90px_-58px_rgba(80,54,30,0.95)] ring-1 ring-border-soft/80 lg:flex">
          <div className="pointer-events-none absolute inset-x-5 top-0 h-40 rounded-full bg-soft-gold/16 blur-3xl" />
          <div className="relative z-[1]">
            <div className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-full border border-border-soft/80 bg-surface/88 px-3 shadow-[0_14px_34px_-28px_rgba(80,54,30,0.9)]">
              <SkeletonBlock className="h-6 w-6" />
              <SkeletonBlock className="h-3 w-24" />
            </div>

            <div className="rounded-[1.9rem] bg-surface/72 p-1.5 shadow-[0_26px_62px_-42px_rgba(80,54,30,0.86)] ring-1 ring-warm-brown/16">
              <div className="relative overflow-hidden rounded-[1.45rem] border border-border-soft/65 bg-[linear-gradient(145deg,hsl(var(--surface)_/_0.96)_0%,hsl(var(--background))_68%,hsl(var(--soft-gold)_/_0.18)_100%)] p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.92)]">
                <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-sage-green/14 blur-2xl" />
                <div className="relative flex items-start justify-between gap-3">
                  <SkeletonBlock className="h-14 w-14 rounded-[1.15rem]" />
                  <SkeletonBlock className="h-7 w-20" />
                </div>
                <SkeletonBlock className="mt-4 h-5 w-44 max-w-full" />
                <SkeletonBlock className="mt-3 h-3 w-36 max-w-full" />
              </div>
            </div>
          </div>

          <nav className="relative z-[1] mt-6 flex min-h-0 flex-1 flex-col gap-5 overflow-hidden pr-1">
            {spaceNavGroups.map((group, groupIndex) => (
              <div key={group.label}>
                <SkeletonBlock className="mb-3 ml-3 h-2.5 w-20" />
                <div className="grid gap-1.5">
                  {group.items.map((item, itemIndex) => (
                    <div
                      key={item.label}
                      className="flex min-h-12 items-center gap-3 rounded-[1.1rem] bg-surface/66 px-3 py-2.5 shadow-[0_12px_26px_-24px_rgba(80,54,30,0.72)] ring-1 ring-border-soft/35"
                    >
                      <SkeletonBlock className="h-8 w-8 rounded-xl" />
                      <SkeletonBlock className={`h-3.5 ${navWidths[groupIndex * 3 + itemIndex] ?? "w-24"}`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="relative z-[1] mt-6 rounded-[1.45rem] border border-sage-green/24 bg-[linear-gradient(135deg,hsl(var(--sage-green)_/_0.16),hsl(var(--surface)_/_0.9)_76%)] p-4 shadow-[0_18px_42px_-32px_rgba(80,54,30,0.82)]">
            <div className="flex items-start gap-3">
              <SkeletonBlock className="h-9 w-9" />
              <div className="flex-1">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="mt-3 h-3 w-20" />
              </div>
            </div>
            <SkeletonBlock className="mt-4 h-3 w-full" />
            <SkeletonBlock className="mt-2 h-3 w-4/5" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="top-0 z-30 border-b border-border-soft/70 bg-background/86 px-3 py-2 backdrop-blur-xl sm:px-6">
            <div className="flex min-h-14 items-center justify-between gap-3 rounded-[1.35rem] border border-border-soft/70 bg-surface/88 px-3 shadow-[0_20px_56px_-42px_rgba(80,54,30,0.92)] ring-1 ring-border-soft/70 sm:px-4">
              <div className="flex min-w-0 items-center gap-3">
                <SkeletonBlock className="h-11 w-11 rounded-2xl" />
                <div className="min-w-0 py-1">
                  <SkeletonBlock className="h-3 w-36 max-w-[42vw]" />
                  <SkeletonBlock className="mt-2 h-6 w-44 max-w-[54vw]" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden min-h-11 items-center gap-3 rounded-full border border-border-soft/75 bg-background/84 px-2 py-1.5 shadow-soft sm:flex">
                  <SkeletonBlock className="h-9 w-9" />
                  <div className="min-w-0 pr-3">
                    <SkeletonBlock className="h-3.5 w-28" />
                    <SkeletonBlock className="mt-2 h-3 w-16" />
                  </div>
                </div>
                <div className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-soft/75 bg-background/84 px-2 py-1.5 shadow-soft">
                  <SkeletonBlock className="h-8 w-8" />
                  <SkeletonBlock className="hidden h-3 w-14 sm:block" />
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-hidden">
            <div className="mx-auto w-full max-w-[1400px] px-3 pb-12 pt-4 sm:px-5 sm:pb-16 sm:pt-6 lg:px-8">
              <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="max-w-3xl">
                  <SkeletonBlock className="h-3 w-32" />
                  <SkeletonBlock className="mt-4 h-11 w-[min(34rem,86vw)] rounded-[1.25rem]" />
                  <SkeletonBlock className="mt-4 h-4 w-[min(44rem,88vw)]" />
                  <SkeletonBlock className="mt-2 h-4 w-[min(30rem,76vw)]" />
                </div>
                <div className="flex gap-2">
                  <SkeletonBlock className="h-11 w-28 rounded-2xl" />
                  <SkeletonBlock className="h-11 w-11 rounded-2xl" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {["members", "stories", "photos", "timeline"].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.6rem] border border-border-soft/70 bg-[linear-gradient(145deg,hsl(var(--surface)_/_0.96),hsl(var(--background)_/_0.72))] p-5 shadow-[0_24px_52px_-36px_rgba(80,54,30,0.82)] ring-1 ring-white/78"
                  >
                    <SkeletonBlock className="h-11 w-11 rounded-2xl" />
                    <SkeletonBlock className="mt-5 h-8 w-20 rounded-xl" />
                    <SkeletonBlock className="mt-3 h-3 w-28" />
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-12">
                <section className="surface-grain relative min-h-[24rem] overflow-hidden rounded-[1.8rem] border border-border-soft/70 bg-surface/96 p-5 shadow-[0_24px_58px_-40px_rgba(80,54,30,0.82)] ring-1 ring-white/80 xl:col-span-8">
                  <div className="relative h-full min-h-[20rem] overflow-hidden rounded-[1.35rem] border border-border-soft/75 bg-[linear-gradient(135deg,hsl(var(--background)_/_0.84),hsl(var(--surface)_/_0.72))]">
                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-soft-gold/12 blur-3xl" />
                    <div className="absolute left-[18%] top-[32%] h-px w-[52%] rotate-12 bg-warm-brown/18" />
                    <div className="absolute left-[24%] top-[47%] h-px w-[48%] -rotate-12 bg-warm-brown/16" />
                    <div className="absolute left-[44%] top-[18%] h-[54%] w-px bg-warm-brown/14" />
                    {treeNodes.map((position, index) => (
                      <div
                        key={position}
                        className={`absolute ${position} w-28 max-w-[42vw] rounded-[1.25rem] border border-border-soft/60 bg-surface/94 p-3 shadow-[0_18px_42px_-30px_rgba(80,54,30,0.8)] ring-1 ring-white/80 sm:w-32 sm:max-w-[36vw]`}
                      >
                        <div className="flex items-center gap-3">
                          <SkeletonBlock className="h-10 w-10" />
                          <div className="flex-1">
                            <SkeletonBlock className="h-3.5 w-full" />
                            <SkeletonBlock className="mt-2 h-2.5 w-2/3" />
                          </div>
                        </div>
                        {index < 3 && <SkeletonBlock className="mt-3 h-2.5 w-4/5" />}
                      </div>
                    ))}
                  </div>
                </section>

                <div className="grid gap-5 xl:col-span-4">
                  {["activity", "access"].map((item) => (
                    <section
                      key={item}
                      className="rounded-[1.6rem] border border-border-soft/70 bg-[linear-gradient(145deg,hsl(var(--surface)_/_0.96),hsl(var(--background)_/_0.74))] p-5 shadow-[0_24px_52px_-38px_rgba(80,54,30,0.82)] ring-1 ring-white/78"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <SkeletonBlock className="h-4 w-28" />
                        <SkeletonBlock className="h-9 w-9 rounded-2xl" />
                      </div>
                      <div className="mt-5 grid gap-3">
                        <SkeletonBlock className="h-14 w-full rounded-2xl ring-1 ring-border-soft/30" />
                        <SkeletonBlock className="h-14 w-full rounded-2xl ring-1 ring-border-soft/30" />
                        <SkeletonBlock className="h-14 w-4/5 rounded-2xl ring-1 ring-border-soft/30" />
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <span className="sr-only">Loading FamilySpace...</span>
    </motion.div>
    </Skeleton>
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

  if (isLoading) {
    return <SpaceLoadingSkeleton />;
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
