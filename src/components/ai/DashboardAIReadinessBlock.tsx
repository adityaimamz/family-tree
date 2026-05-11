import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ClipboardList,
  GitBranch,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { iconStroke } from "../ui";
import type { SpaceSummary } from "../../types/family";
import {
  deriveAIReadinessRecommendations,
  type AIRecommendation,
  type AIRecommendationKey,
} from "../../pages/spaceDashboard.derive";

export interface DashboardAIReadinessBlockProps {
  spaceSlug: string;
  summary: SpaceSummary | null;
  memberWithNotesId: string | null;
  canEdit: boolean;
}

const DASHBOARD_PRIVACY_LINE =
  "AI-assisted drafts stay inside this FamilySpace until reviewed";

const RECOMMENDATION_ICONS: Record<AIRecommendationKey, LucideIcon> = {
  relationship: GitBranch,
  biography: Users,
  "timeline-story": Calendar,
  "review-stories": ClipboardList,
};

const UNLOCK_SIGNALS: Array<{ label: string; detail: string; icon: LucideIcon }> = [
  {
    label: "Add at least two relatives",
    detail:
      "Unlock the Relationship Explainer so AI can trace how two people connect.",
    icon: Users,
  },
  {
    label: "Write notes on a member profile",
    detail:
      "Unlock the Biography Studio so AI can turn your notes into a reviewable draft.",
    icon: BookOpen,
  },
  {
    label: "Record a timeline event",
    detail:
      "Unlock the Timeline Story Generator so AI can weave milestones into a family journey.",
    icon: Calendar,
  },
  {
    label: "Draft your first family story",
    detail:
      "Open the Stories workspace so AI-assisted drafts have a review home.",
    icon: ClipboardList,
  },
];

interface RecommendationCardProps {
  recommendation: AIRecommendation;
  to: string;
}

function RecommendationCard({ recommendation, to }: RecommendationCardProps) {
  const Icon = RECOMMENDATION_ICONS[recommendation.key];
  return (
    <Link
      to={to}
      className="group flex min-h-16 items-start justify-between gap-4 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-left shadow-soft transition hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-[1px] active:scale-[0.995]"
    >
      <span className="flex min-w-0 gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20">
          <Icon className="h-4 w-4" strokeWidth={iconStroke} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-extrabold text-white">
            {recommendation.title}
          </span>
          <span className="mt-1 block text-sm leading-6 text-white/76">
            {recommendation.description}
          </span>
        </span>
      </span>
      <ArrowRight
        className="mt-3 h-4 w-4 shrink-0 text-white/60 transition group-hover:translate-x-0.5"
        strokeWidth={iconStroke}
      />
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="mt-5 grid gap-3">
      <p className="text-sm font-semibold leading-6 text-white/78">
        Unlock AI-assisted drafts by adding more to the archive:
      </p>
      <ul className="grid gap-2">
        {UNLOCK_SIGNALS.map(({ label, detail, icon: Icon }) => (
          <li
            key={label}
            className="flex items-start gap-3 rounded-[1.15rem] border border-white/10 bg-white/5 px-4 py-3"
          >
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20">
              <Icon className="h-4 w-4" strokeWidth={iconStroke} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-extrabold text-white">
                {label}
              </span>
              <span className="mt-1 block text-sm leading-6 text-white/72">
                {detail}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DashboardAIReadinessBlock({
  spaceSlug: _spaceSlug,
  summary,
  memberWithNotesId,
  canEdit: _canEdit,
}: DashboardAIReadinessBlockProps) {
  // `Link.to` is relative — the parent <Route path="/app/:spaceSlug/*">
  // already anchors the base. The underscore-prefixed props are kept on
  // the interface for future use by role gating and analytics, and also
  // guaranteed by the callsite to match the current FamilySpace.
  const membersCount = summary?.membersCount ?? 0;
  const timelineCount = summary?.timelineCount ?? 0;
  const storiesCount = summary?.storiesCount ?? 0;

  const recommendations = deriveAIReadinessRecommendations({
    membersCount,
    timelineCount,
    storiesCount,
    memberWithNotesId,
  });

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 150, damping: 22 }}
      className="relative overflow-hidden rounded-[1.8rem] border border-dark-green/15 bg-[linear-gradient(145deg,hsl(var(--dark-green))_0%,hsl(var(--warm-brown))_120%)] p-5 text-white shadow-[0_24px_70px_-42px_rgba(45,68,43,0.82)] sm:p-6"
    >
      <div className="pointer-events-none absolute inset-0 archive-grid opacity-[0.08]" />
      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-white/70">
              AI Studio
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">
              Next AI action, based on what the archive holds today.
            </h2>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20">
            <Sparkles className="h-5 w-5" strokeWidth={iconStroke} />
          </span>
        </div>

        <p className="mt-4 flex items-start gap-2 text-sm font-semibold leading-6 text-white/82">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-soft-gold"
            strokeWidth={iconStroke}
          />
          <span>{DASHBOARD_PRIVACY_LINE}</span>
        </p>

        {recommendations.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.key}
                recommendation={recommendation}
                to={recommendation.to}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </motion.section>
  );
}
