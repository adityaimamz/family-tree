import { motion } from "framer-motion";
import { Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, EmptyState, LoadingState, PageShell, SectionHeader, iconStroke, pageTransition } from "../../components/ui";
import { apiErrorMessage, platformFetch } from "../../lib/api";
import type { PlatformUser } from "../../types/family";

export const PlatformUsersPage = () => {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    platformFetch("/users")
      .then(async (response) => {
        if (!response.ok) throw new Error(await apiErrorMessage(response, "Failed to load users."));
        return response.json();
      })
      .then((data) => {
        if (mounted) setUsers(data);
      })
      .catch((loadError) => {
        if (mounted) setError(loadError instanceof Error ? loadError.message : "Failed to load users.");
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
    return users.filter((user) => [user.email, user.name ?? "", user.platformRole].join(" ").toLowerCase().includes(term));
  }, [query, users]);

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader
          eyebrow="Management"
          title="Users"
          description="Read-only account metadata. Family tree data remains scoped inside each FamilySpace."
        />

        <label className="relative mb-6 block max-w-xl">
          <span className="sr-only">Search users</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" strokeWidth={iconStroke} />
          <input
            className="min-h-12 w-full rounded-2xl border border-border-soft bg-surface py-3 pl-12 pr-4 text-base text-text-primary shadow-soft transition placeholder:text-text-muted/70 focus:border-dark-green focus:outline-none focus:ring-4 focus:ring-sage-green/12"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search email, name, or role"
          />
        </label>

        {error && <EmptyState title="Users unavailable" description={error} />}
        {isLoading ? (
          <LoadingState />
        ) : filtered.length ? (
          <div className="overflow-hidden rounded-[1.6rem] border border-white/75 bg-surface/94 shadow-soft ring-1 ring-border-soft/60">
            <div className="grid min-w-[760px] grid-cols-[minmax(220px,1.3fr)_minmax(160px,1fr)_140px_120px_150px] border-b border-border-soft bg-background/70 px-5 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-text-muted">
              <span>Email</span>
              <span>Name</span>
              <span>Role</span>
              <span>Spaces</span>
              <span>Created</span>
            </div>
            <div className="overflow-x-auto">
              {filtered.map((user) => (
                <div key={user.id} className="grid min-w-[760px] grid-cols-[minmax(220px,1.3fr)_minmax(160px,1fr)_140px_120px_150px] items-center border-b border-border-soft/70 px-5 py-4 text-sm font-semibold last:border-b-0">
                  <span className="truncate text-text-primary">{user.email}</span>
                  <span className="truncate text-text-muted">{user.name || "No name"}</span>
                  <span>
                    <Badge tone={user.platformRole === "platform_admin" ? "sage" : "muted"}>{user.platformRole}</Badge>
                  </span>
                  <span className="tabular-nums text-text-primary">{user.spacesCount}</span>
                  <span className="text-text-muted">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState title="No users found" description="Try a different search term." />
        )}

        {!isLoading && (
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-text-muted">
            <Users className="h-4 w-4 text-sage-green" strokeWidth={iconStroke} />
            {filtered.length} visible users
          </p>
        )}
      </PageShell>
    </motion.div>
  );
};
