import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Camera,
  Check,
  Circle,
  ClipboardList,
  GitBranch,
  Images,
  Lock,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { StatsCard } from "../components/dashboard/StatsCard";
import { PageShell, SectionHeader, iconStroke, pageTransition } from "../components/ui";
import { useSpaceStore } from "../hooks/useSpaceStore";

type ArchiveChecklistItem = {
  label: string;
  detail: string;
  complete: boolean;
};

type SuggestedStep = {
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
};

export const SpaceDashboard = () => {
  const { currentSpace, members, gallery, timeline, summary, canEdit } = useSpaceStore();

  const generations = useMemo(
    () => summary?.generationsCount ?? new Set(members.map((member) => member.generation)).size,
    [members, summary?.generationsCount],
  );
  const membersCount = summary?.membersCount ?? members.length;
  const timelineCount = summary?.timelineCount ?? timeline.length;
  const galleryCount = summary?.galleryCount ?? gallery.length;
  const storiesCount = summary?.storiesCount ?? 0;

  const archiveChecklist = useMemo<ArchiveChecklistItem[]>(
    () => [
      {
        label: "Family tree started",
        detail: membersCount > 0 ? "The archive has a visible relationship base." : "Add the first family member record.",
        complete: membersCount > 0,
      },
      {
        label: "Members added",
        detail: membersCount > 0 ? `${membersCount} member records preserved.` : "Start with the relatives closest to the root family.",
        complete: membersCount >= 3,
      },
      {
        label: "Timeline has events",
        detail: timelineCount > 0 ? `${timelineCount} milestones can anchor family stories.` : "Add dates that explain moves, weddings, reunions, or births.",
        complete: timelineCount > 0,
      },
      {
        label: "Stories drafted",
        detail: storiesCount > 0 ? `${storiesCount} narrative drafts are ready for review.` : "Turn source notes into the first family story draft.",
        complete: storiesCount > 0,
      },
      {
        label: "Photos connected",
        detail: galleryCount > 0 ? `${galleryCount} photo memories are stored in this archive.` : "Connect old photos to their family context.",
        complete: galleryCount > 0,
      },
      {
        label: "AI draft generated",
        detail: "AI generation is waiting for the Sprint 6 backend endpoint.",
        complete: false,
      },
    ],
    [galleryCount, membersCount, storiesCount, timelineCount],
  );

  const completedChecklist = archiveChecklist.filter((item) => item.complete).length;
  const archiveCompletion = Math.round((completedChecklist / archiveChecklist.length) * 100);

  const suggestedSteps = useMemo<SuggestedStep[]>(() => {
    const steps: SuggestedStep[] = [];

    if (membersCount === 0) {
      steps.push({
        title: "Add the first family member",
        description: "Create the root record so this archive has a starting point.",
        to: "members",
        icon: Users,
      });
    }

    if (membersCount > 0 && generations < 2) {
      steps.push({
        title: "Preserve another generation",
        description: "Add parents, children, or elders so the tree shows continuity.",
        to: "members",
        icon: GitBranch,
      });
    }

    if (timelineCount === 0) {
      steps.push({
        title: "Add the first timeline event",
        description: "Anchor the archive with a birth, move, wedding, reunion, or milestone.",
        to: "timeline",
        icon: Calendar,
      });
    }

    if (galleryCount === 0) {
      steps.push({
        title: "Connect a photo memory",
        description: "Save one photo with context so it becomes part of the family record.",
        to: "gallery",
        icon: Images,
      });
    }

    if (storiesCount === 0) {
      steps.push({
        title: "Draft the first family story",
        description: "Capture a remembered moment before it stays only in conversation.",
        to: "stories",
        icon: BookOpen,
      });
    }

    if (steps.length === 0) {
      steps.push(
        {
          title: "Review story drafts",
          description: "Check narrative drafts and move the strongest memories toward approval.",
          to: "stories",
          icon: ClipboardList,
        },
        {
          title: "Walk through the family tree",
          description: "Use the tree to spot missing relationships before the demo recording.",
          to: "tree",
          icon: GitBranch,
        },
        {
          title: "Add more photo context",
          description: "Attach names, dates, and event context to the photo archive.",
          to: "gallery",
          icon: Camera,
        },
      );
    }

    return steps.slice(0, 3);
  }, [galleryCount, generations, membersCount, storiesCount, timelineCount]);

  const recentActivity = useMemo(() => {
    const activity = [
      membersCount > 0
        ? `${membersCount} family member records are available for relationship browsing.`
        : "No member records yet. The archive is ready for its first family profile.",
      generations > 1
        ? `${generations} generations are preserved in the current tree structure.`
        : "Generation depth will appear after parent and child records are connected.",
      timelineCount > 0
        ? `${timelineCount} timeline events can be used as story anchors.`
        : "Timeline events have not been added yet.",
      galleryCount > 0
        ? `${galleryCount} photo memories are stored for this FamilySpace.`
        : "Photo memories are still waiting for upload and context.",
      storiesCount > 0
        ? `${storiesCount} story drafts are waiting for family review.`
        : "No story drafts yet. Source notes can become family narratives.",
    ];

    return activity;
  }, [galleryCount, generations, membersCount, storiesCount, timelineCount]);

  const quickActions = [
    { title: "Family Tree", description: "Browse relationships", to: "tree", icon: GitBranch },
    { title: "Members", description: "Manage family records", to: "members", icon: Users },
    { title: "Timeline", description: "Preserve milestones", to: "timeline", icon: Calendar },
    { title: "Photo Memories", description: "Review visual context", to: "gallery", icon: Images },
    { title: "Stories", description: "Draft narratives", to: "stories", icon: BookOpen },
    { title: "Settings", description: "Archive identity", to: "settings", icon: Settings },
  ];

  if (!currentSpace) return null;

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader
          eyebrow="Archive overview"
          title={currentSpace.name}
          description={
            currentSpace.description ||
            "A private family archive for preserving relationships, stories, photos, and memories across generations."
          }
        />

        <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          <StatsCard icon={Users} value={membersCount} title="Family Members" description="People preserved in this archive" />
          <StatsCard icon={GitBranch} value={generations} title="Generations Preserved" description="Distinct family levels" />
          <StatsCard icon={Calendar} value={timelineCount} title="Timeline Events" description="Milestones with context" />
          <StatsCard icon={Camera} value={galleryCount} title="Photo Memories" description="Visual memories saved" />
          <StatsCard icon={BookOpen} value={storiesCount} title="Story Drafts" description="Narratives ready to review" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="grid gap-5">
            <section className="surface-grain relative overflow-hidden rounded-[1.8rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60 sm:p-6">
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-sage-green">Archive Health</p>
                  <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                    Your archive is {archiveCompletion}% complete.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-text-muted">
                    Completion is based on the records needed for a clear demo: tree structure, members, milestones, photos, stories, and AI draft readiness.
                  </p>
                </div>

                <div className="w-full rounded-[1.45rem] border border-border-soft bg-background/86 p-4 shadow-soft lg:w-64">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Progress</p>
                      <p className="mt-2 font-display text-4xl font-extrabold leading-none text-text-primary">{archiveCompletion}%</p>
                    </div>
                    <ShieldCheck className="h-9 w-9 text-dark-green" strokeWidth={iconStroke} />
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-soft">
                    <div className="h-full rounded-full bg-dark-green transition-all" style={{ width: `${archiveCompletion}%` }} />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-text-muted">
                    {completedChecklist} of {archiveChecklist.length} archive signals completed
                  </p>
                </div>
              </div>

              <div className="relative mt-6 grid gap-3 md:grid-cols-2">
                {archiveChecklist.map((item) => (
                  <div key={item.label} className="flex gap-3 rounded-[1.25rem] border border-border-soft bg-background/84 p-4">
                    <span
                      className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                        item.complete ? "bg-dark-green text-white" : "bg-surface-soft text-text-muted"
                      }`}
                    >
                      {item.complete ? <Check className="h-4 w-4" strokeWidth={iconStroke} /> : <Circle className="h-3 w-3" strokeWidth={2.2} />}
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-text-primary">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-text-muted">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="rounded-[1.7rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60 sm:p-6">
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-sage-green">Suggested Next Steps</p>
                <div className="mt-5 grid gap-3">
                  {suggestedSteps.map(({ title, description, to, icon: Icon }) => (
                    <Link
                      key={title}
                      to={to}
                      className="group flex items-start justify-between gap-4 rounded-[1.25rem] border border-border-soft bg-background px-4 py-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:bg-surface-soft active:translate-y-[1px]"
                    >
                      <span className="flex min-w-0 gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sage-green/12 text-dark-green">
                          <Icon className="h-4 w-4" strokeWidth={iconStroke} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-extrabold text-text-primary">{title}</span>
                          <span className="mt-1 block text-sm leading-6 text-text-muted">{description}</span>
                        </span>
                      </span>
                      <ArrowRight className="mt-3 h-4 w-4 shrink-0 text-text-muted transition group-hover:translate-x-0.5" strokeWidth={iconStroke} />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.7rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60 sm:p-6">
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-sage-green">Recent Activity</p>
                <div className="mt-5 grid gap-3">
                  {recentActivity.map((item, index) => (
                    <div key={item} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-[1.15rem] border border-border-soft bg-background px-4 py-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-soft text-xs font-extrabold text-warm-brown">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold leading-6 text-text-muted">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <aside className="grid gap-5">
            <section className="relative overflow-hidden rounded-[1.8rem] border border-dark-green/15 bg-[linear-gradient(145deg,hsl(var(--dark-green))_0%,hsl(var(--warm-brown))_120%)] p-5 text-white shadow-[0_24px_70px_-42px_rgba(45,68,43,0.82)] sm:p-6">
              <div className="pointer-events-none absolute inset-0 archive-grid opacity-[0.08]" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-white/70">AI Family Assistant</p>
                    <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">Turn scattered notes into meaningful family history.</h2>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20">
                    <Sparkles className="h-5 w-5" strokeWidth={iconStroke} />
                  </span>
                </div>

                <p className="mt-4 text-sm font-medium leading-6 text-white/76">
                  AI drafts stay inside this family space until reviewed.
                </p>

                <div className="mt-5 grid gap-3">
                  {[
                    { title: "Explain Relationship", description: "Ask how two family members are related." },
                    { title: "Generate Biography", description: "Create a warm biography from short notes." },
                    { title: "Create Timeline Story", description: "Turn milestones into a readable family journey." },
                  ].map((action) => (
                    <button
                      key={action.title}
                      type="button"
                      disabled
                      className="flex min-h-16 cursor-not-allowed items-center justify-between gap-4 rounded-[1.15rem] border border-white/15 bg-white/10 px-4 py-3 text-left opacity-90"
                      title="Available after the Sprint 6 AI backend is connected."
                    >
                      <span>
                        <span className="block text-sm font-extrabold text-white">{action.title}</span>
                        <span className="mt-1 block text-xs font-semibold leading-5 text-white/65">{action.description}</span>
                      </span>
                      <Lock className="h-4 w-4 shrink-0 text-white/60" strokeWidth={iconStroke} />
                    </button>
                  ))}
                </div>

                <div className="mt-5 rounded-[1.15rem] border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/58">Status</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/76">
                    Disabled until protected AI endpoints are available. No fake action is exposed to users.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[1.7rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60 sm:p-6">
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-sage-green">Archive Workbench</p>
              <div className="mt-5 grid gap-2">
                {quickActions.map(({ title, description, to, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="group flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-border-soft bg-background px-4 py-3 text-sm font-bold text-text-primary shadow-soft transition hover:-translate-y-0.5 hover:bg-surface-soft active:translate-y-[1px]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0 text-sage-green" strokeWidth={iconStroke} />
                      <span className="min-w-0">
                        <span className="block truncate">{title}</span>
                        <span className="mt-0.5 block truncate text-xs font-semibold text-text-muted">{description}</span>
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-text-muted transition group-hover:translate-x-0.5" strokeWidth={iconStroke} />
                  </Link>
                ))}
              </div>
            </section>

            {!canEdit() && (
              <section className="rounded-[1.45rem] border border-soft-gold/25 bg-soft-gold/12 p-5">
                <p className="text-sm font-extrabold text-text-primary">Read-only archive access</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">
                  Owners and admins can add records. You can still browse preserved relationships, photos, timelines, and stories.
                </p>
              </section>
            )}
          </aside>
        </section>
      </PageShell>
    </motion.div>
  );
};
