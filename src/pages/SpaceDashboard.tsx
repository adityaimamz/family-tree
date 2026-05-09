import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Camera,
  Check,
  Circle,
  GitBranch,
  Images,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { StatsCard } from "../components/dashboard/StatsCard";
import { PageShell, SectionHeader, iconStroke, pageTransition } from "../components/ui";
import { useSpaceStore } from "../hooks/useSpaceStore";
import {
  deriveAiReady,
  deriveArchiveChecklist,
  deriveCompletionLabel,
  deriveSuggestedSteps,
  deriveArchiveSignals,
  AI_ACTIONS,
} from "./spaceDashboard.derive";

export const SpaceDashboard = () => {
  const { currentSpace, members, gallery, timeline, summary, canEdit } = useSpaceStore();

  if (!currentSpace) return null;

  const generations = summary?.generationsCount ?? new Set(members.map((member) => member.generation)).size;
  const membersCount = summary?.membersCount ?? members.length;
  const timelineCount = summary?.timelineCount ?? timeline.length;
  const galleryCount = summary?.galleryCount ?? gallery.length;
  const storiesCount = summary?.storiesCount ?? 0;

  const counts = { membersCount, generations, timelineCount, galleryCount, storiesCount };

  // Use derivation functions from the pure module
  const aiReady = deriveAiReady(counts);
  const archiveChecklist = deriveArchiveChecklist(counts, aiReady);
  const completedChecklist = archiveChecklist.filter((item) => item.complete).length;
  const archiveCompletion = Math.round((completedChecklist / 6) * 100);
  const completionLabel = deriveCompletionLabel(archiveCompletion);
  const suggestedSteps = deriveSuggestedSteps(counts);
  const archiveSignals = deriveArchiveSignals(counts);

  const quickActions = [
    { title: "Family Tree", description: "Understand relationships", to: "tree", icon: GitBranch },
    { title: "Members", description: "Preserve people records", to: "members", icon: Users },
    { title: "Timeline", description: "Capture milestones", to: "timeline", icon: Calendar },
    { title: "Photo Memories", description: "Add visual context", to: "gallery", icon: Images },
    { title: "Stories", description: "Review family narratives", to: "stories", icon: BookOpen },
    { title: "Settings", description: "Manage archive identity", to: "settings", icon: Settings },
  ];

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

        <section className="surface-grain relative mb-8 overflow-hidden rounded-[1.8rem] border border-border-soft bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-sage-green">Preservation focus</p>
              <h2 className="mt-2 font-display text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
                Every saved record protects a memory from being lost.
              </h2>
            </div>
            <p className="mt-4 max-w-lg text-sm leading-6 text-text-muted lg:mt-0">
              This FamilySpace brings together relatives, milestones, photos, and stories so the next generation can understand where they come from.
            </p>
          </div>
        </section>

        <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          <StatsCard icon={Users} value={membersCount} title="Family Members" description="People preserved in this archive" />
          <StatsCard icon={GitBranch} value={generations} title="Generations Preserved" description="Family levels connected" />
          <StatsCard icon={Calendar} value={timelineCount} title="Timeline Events" description="Milestones with context" />
          <StatsCard icon={Camera} value={galleryCount} title="Photo Memories" description="Images tied to family meaning" />
          <StatsCard icon={BookOpen} value={storiesCount} title="Story Drafts" description="Narratives ready for review" />
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
                    Completion is based on the records that make a family archive clear and ready to share: tree structure, members, milestones, photos, stories, and AI-assisted writing readiness.
                  </p>
                </div>

                <div className="w-full rounded-[1.45rem] border border-border-soft bg-background/86 p-4 shadow-soft lg:w-64">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Progress</p>
                      <p className="mt-2 font-display text-4xl font-extrabold leading-none text-text-primary">{archiveCompletion}%</p>
                      <span className="mt-2 inline-block rounded-full bg-soft-gold/20 px-2.5 py-1 text-xs font-bold text-warm-brown">
                        {completionLabel}
                      </span>
                    </div>
                    <ShieldCheck className="h-9 w-9 text-dark-green" strokeWidth={iconStroke} />
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-soft">
                    <div className="h-full rounded-full bg-dark-green transition-all" style={{ width: `${archiveCompletion}%` }} />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-text-muted">
                    {completedChecklist} of 6 archive signals completed
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

              <p className="mt-6 border-t border-border-soft pt-4 text-xs font-medium italic leading-relaxed text-text-muted">
                The best archive is not only complete; it is understandable by the next generation.
              </p>
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
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-sage-green">Archive Signals</p>
                <div className="mt-5 grid gap-3">
                  {archiveSignals.map((item, index) => (
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
                    <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">Turn scattered family memories into reviewable stories.</h2>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20">
                    <Sparkles className="h-5 w-5" strokeWidth={iconStroke} />
                  </span>
                </div>

                <p className="mt-4 text-sm font-medium leading-6 text-white/76">
                  Use AI to draft biographies, explain family relationships, and turn milestones into timeline stories. Drafts stay inside this FamilySpace until reviewed by the family.
                </p>

                <div className="mt-5 grid gap-3">
                  {AI_ACTIONS.map(({ title, description, to, icon: Icon }) => (
                    <Link
                      key={title}
                      to={to}
                      className="group flex min-h-16 items-start justify-between gap-4 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-left shadow-soft transition hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-[1px]"
                    >
                      <span className="flex min-w-0 gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20">
                          <Icon className="h-4 w-4" strokeWidth={iconStroke} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-extrabold text-white">{title}</span>
                          <span className="mt-1 block text-sm leading-6 text-white/76">{description}</span>
                        </span>
                      </span>
                      <ArrowRight className="mt-3 h-4 w-4 shrink-0 text-white/60 transition group-hover:translate-x-0.5" strokeWidth={iconStroke} />
                    </Link>
                  ))}
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

            <section className="rounded-[1.45rem] border border-dark-green/15 bg-dark-green/6 p-5">
              <p className="text-sm font-extrabold text-text-primary">Private by default</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">
                Only invited FamilySpace members can access this archive. AI-assisted drafts stay private until the family reviews them.
              </p>
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
