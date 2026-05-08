import { motion } from "framer-motion";
import { BookOpen, Camera, FileText, GitBranch, Image, Users, Boxes, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { StatsCard } from "../../components/dashboard/StatsCard";
import { EmptyState, LoadingState, PageShell, SectionHeader, pageTransition } from "../../components/ui";
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

export const PlatformStatsPage = () => {
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

  const archiveRecords = stats.totalMembers + stats.totalGalleryItems + stats.totalTimelineEvents + stats.totalStories + stats.totalSourceNotes;

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader
          eyebrow="Stats"
          title="Operational metrics"
          description="A compact read-only view of platform volume, archive activity, and story tooling adoption."
        />

        {error && <EmptyState title="Stats unavailable" description={error} />}
        {isLoading ? (
          <LoadingState />
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatsCard title="Total users" value={stats.totalUsers} icon={Users} description="All authenticated app users" />
            <StatsCard title="FamilySpaces" value={stats.totalSpaces} icon={Boxes} description="Private archive tenants" />
            <StatsCard title="Archive records" value={archiveRecords} icon={FileText} description="Members, media, stories, and notes" />
            <StatsCard title="Members" value={stats.totalMembers} icon={GitBranch} description="Family tree records" />
            <StatsCard title="Gallery items" value={stats.totalGalleryItems} icon={Image} description="Photos and visual evidence" />
            <StatsCard title="Timeline events" value={stats.totalTimelineEvents} icon={Calendar} description="Manual historical entries" />
            <StatsCard title="Stories" value={stats.totalStories} icon={BookOpen} description="Narrative drafts and approvals" />
            <StatsCard title="Source notes" value={stats.totalSourceNotes} icon={Camera} description="Notes, interviews, and documents" />
          </section>
        )}
      </PageShell>
    </motion.div>
  );
};
