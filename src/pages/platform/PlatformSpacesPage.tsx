import { motion } from "framer-motion";
import { Boxes, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, LoadingState, PageShell, SectionHeader, iconStroke, pageTransition } from "../../components/ui";
import { apiErrorMessage, platformFetch } from "../../lib/api";
import type { PlatformSpace } from "../../types/family";

export const PlatformSpacesPage = () => {
  const [spaces, setSpaces] = useState<PlatformSpace[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    platformFetch("/spaces")
      .then(async (response) => {
        if (!response.ok) throw new Error(await apiErrorMessage(response, "Failed to load spaces."));
        return response.json();
      })
      .then((data) => {
        if (mounted) setSpaces(data);
      })
      .catch((loadError) => {
        if (mounted) setError(loadError instanceof Error ? loadError.message : "Failed to load spaces.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    return spaces.filter((space) => [space.name, space.slug].join(" ").toLowerCase().includes(term));
  }, [query, spaces]);

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader
          eyebrow="Management"
          title="Family Spaces"
          description="Tenant metadata and record counts only. Private member details stay inside the user's FamilySpace."
        />

        <label className="relative mb-6 block max-w-xl">
          <span className="sr-only">Search spaces</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" strokeWidth={iconStroke} />
          <input
            className="min-h-12 w-full rounded-2xl border border-border-soft bg-surface py-3 pl-12 pr-4 text-base text-text-primary shadow-soft transition placeholder:text-text-muted/70 focus:border-dark-green focus:outline-none focus:ring-4 focus:ring-sage-green/12"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or slug"
          />
        </label>

        {error && <EmptyState title="Spaces unavailable" description={error} />}
        {isLoading ? (
          <LoadingState />
        ) : filtered.length ? (
          <div className="overflow-hidden rounded-[1.6rem] border border-white/75 bg-surface/94 shadow-soft ring-1 ring-border-soft/60">
            <div className="grid min-w-[920px] grid-cols-[minmax(180px,1.1fr)_180px_110px_110px_210px_150px] border-b border-border-soft bg-background/70 px-5 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-text-muted">
              <span>Name</span>
              <span>Slug</span>
              <span>Owners</span>
              <span>Members</span>
              <span>Records</span>
              <span>Created</span>
            </div>
            <div className="overflow-x-auto">
              {filtered.map((space) => (
                <div key={space.id} className="grid min-w-[920px] grid-cols-[minmax(180px,1.1fr)_180px_110px_110px_210px_150px] items-center border-b border-border-soft/70 px-5 py-4 text-sm font-semibold last:border-b-0">
                  <span className="truncate text-text-primary">{space.name}</span>
                  <span className="truncate font-mono text-xs text-text-muted">{space.slug}</span>
                  <span className="tabular-nums text-text-primary">{space.ownerCount}</span>
                  <span className="tabular-nums text-text-primary">{space.memberCount}</span>
                  <span className="text-xs font-bold text-text-muted">
                    {space.recordCounts.members} members / {space.recordCounts.timeline} timeline / {space.recordCounts.gallery} gallery
                  </span>
                  <span className="text-text-muted">{new Date(space.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState title="No spaces found" description="Try a different search term." />
        )}

        {!isLoading && (
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-text-muted">
            <Boxes className="h-4 w-4 text-sage-green" strokeWidth={iconStroke} />
            {filtered.length} visible FamilySpaces
          </p>
        )}
      </PageShell>
    </motion.div>
  );
};
