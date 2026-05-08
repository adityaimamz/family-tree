import { motion } from "framer-motion";
import { BarChart3, Boxes, Camera, GitBranch, Server, Users, BookOpen, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatsCard } from "../../components/dashboard/StatsCard";
import { EmptyState, LoadingState, PageShell, SectionHeader, iconStroke, pageTransition } from "../../components/ui";
import { apiErrorMessage, platformFetch } from "../../lib/api";
import type { PlatformStats } from "../../types/family";

const emptyStats: PlatformStats = {
  totalUsers: 0,
  totalSpaces: 0,
  totalMembers: 0,
  totalGalleryItems: 0,
  totalTimelineEvents: 0,
  totalStories: 0,
  totalSourceNotes: 0,
};

export const PlatformDashboard = () => {
  const [stats, setStats] = useState<PlatformStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    platformFetch("/stats")
      .then(async (response) => {
        if (!response.ok) throw new Error(await apiErrorMessage(response, "Failed to load platform stats."));
        return response.json();
      })
      .then((data) => {
        if (mounted) setStats(data);
      })
      .catch((loadError) => {
        if (mounted) setError(loadError instanceof Error ? loadError.message : "Failed to load platform stats.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader
          eyebrow="Platform"
          title="Operations overview"
          description="Metadata and operational counters for WarisanAI without exposing private family archive contents."
        />

        {error && <EmptyState title="Platform data unavailable" description={error} />}
        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <StatsCard title="Users" value={stats.totalUsers} icon={Users} description="Registered accounts" />
              <StatsCard title="Spaces" value={stats.totalSpaces} icon={Boxes} description="FamilySpaces" />
              <StatsCard title="Members" value={stats.totalMembers} icon={GitBranch} description="Private records" />
              <StatsCard title="Gallery" value={stats.totalGalleryItems} icon={Camera} description="Photo entries" />
              <StatsCard title="Timeline" value={stats.totalTimelineEvents} icon={Calendar} description="Manual events" />
              <StatsCard title="Stories" value={stats.totalStories} icon={BookOpen} description="Narratives" />
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { title: "Users", to: "/platform/users", icon: Users },
                { title: "Family Spaces", to: "/platform/spaces", icon: Boxes },
                { title: "Stats", to: "/platform/stats", icon: BarChart3 },
                { title: "System", to: "/platform/system", icon: Server },
              ].map(({ title, to, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex min-h-24 items-center justify-between gap-4 rounded-[1.35rem] border border-white/75 bg-surface/94 p-5 text-sm font-bold text-text-primary shadow-soft ring-1 ring-border-soft/60 transition hover:-translate-y-0.5 hover:bg-surface-soft active:translate-y-[1px]"
                >
                  <span>{title}</span>
                  <Icon className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
                </Link>
              ))}
            </section>
          </>
        )}
      </PageShell>
    </motion.div>
  );
};
