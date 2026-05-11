import { motion } from "framer-motion";
import { Archive, ArrowRight, BookOpen, Calendar, Camera, Home, LogOut, Plus, ShieldCheck, Sprout, Users } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState, LoadingState, PageShell, PrimaryButton, SectionHeader, iconStroke, pageTransition } from "../components/ui";
import { apiErrorMessage, authFetch } from "../lib/api";
import { getNeonAuthToken } from "../lib/auth";
import { performSignOut } from "../lib/signOut";
import type { AppUser, FamilyMembership } from "../types/family";

const roleLabel = (role: FamilyMembership["role"]) => {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
};

export const SpaceListPage = () => {
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState<FamilyMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadSpaces = async () => {
      try {
        const token = await getNeonAuthToken({ retries: 12, delayMs: 400 });
        if (cancelled) return;

        if (!token) {
          navigate("/auth/sign-in", { replace: true });
          return;
        }

        const meResponse = await authFetch("/api/auth/me");
        if (cancelled) return;

        if (meResponse.status === 401) {
          navigate("/auth/sign-in", { replace: true });
          return;
        }
        if (!meResponse.ok) throw new Error(await apiErrorMessage(meResponse, "Failed to load current user"));

        const meData = (await meResponse.json()) as { user?: AppUser };
        if (meData.user?.platformRole === "platform_admin") {
          navigate("/platform", { replace: true });
          return;
        }

        const response = await authFetch("/api/spaces");
        if (cancelled) return;

        if (response.status === 401) {
          navigate("/auth/sign-in", { replace: true });
          return;
        }
        if (!response.ok) throw new Error(await apiErrorMessage(response, "Failed to load spaces"));
        const data = (await response.json()) as FamilyMembership[];
        if (!cancelled) setMemberships(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load family spaces");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadSpaces();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const createSpace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsCreating(true);
    setError(null);
    try {
      const token = await getNeonAuthToken();
      if (!token) {
        navigate("/auth/sign-in", { replace: true });
        return;
      }

      const response = await authFetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          description: description.trim() || null,
        }),
      });

      if (response.status === 401) {
        navigate("/auth/sign-in", { replace: true });
        return;
      }
      if (!response.ok) throw new Error(await apiErrorMessage(response, "Failed to create space"));
      const created = (await response.json()) as FamilyMembership;
      setMemberships((current) => [...current, created]);
      setName("");
      setDescription("");
      navigate(`/app/${created.space.slug}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create family space");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-soft/75 bg-background/84 px-4 py-1.5 text-sm font-bold text-text-primary shadow-soft transition hover:-translate-y-0.5 hover:bg-white active:translate-y-[1px]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-sage-green/12 text-dark-green transition group-hover:bg-dark-green group-hover:text-white">
              <Home className="h-4 w-4" strokeWidth={iconStroke} />
            </span>
            <span className="pr-2">Back to homepage</span>
          </Link>
          <button
            type="button"
            onClick={() => void performSignOut()}
            className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-border-soft/75 bg-background/84 px-2 py-1.5 text-sm font-bold text-text-primary shadow-soft transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-white active:translate-y-[1px]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-warm-brown/10 text-warm-brown transition group-hover:bg-warm-brown group-hover:text-white">
              <LogOut className="h-4 w-4" strokeWidth={iconStroke} />
            </span>
            <span className="pr-3">Sign out</span>
          </button>
        </div>

        <SectionHeader
          eyebrow="Private archives"
          title="FamilySpace"
          description="Select a family space to manage the family tree, stories, photos, and memory archives privately."
        />

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <EmptyState title="Failed to load" description={error} />
        ) : memberships.length ? (
          <motion.div layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {memberships.map(({ role, space }) => (
              <motion.button
                key={space.id}
                layout
                whileHover={{ y: -5, scale: 1.012 }}
                transition={{ type: "spring", stiffness: 170, damping: 18 }}
                onClick={() => navigate(`/app/${space.slug}`)}
                className="group relative min-h-72 overflow-hidden rounded-[1.5rem] border border-white/70 bg-[linear-gradient(135deg,hsl(var(--surface))_0%,hsl(var(--surface))_58%,hsl(var(--surface-soft)_/_0.62)_100%)] p-5 text-left shadow-[0_20px_48px_-34px_rgba(80,54,30,0.72)] ring-1 ring-border-soft/60 transition hover:border-dark-green sm:rounded-[1.8rem] sm:p-6"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,hsl(var(--soft-gold)),hsl(var(--sage-green)),hsl(var(--warm-brown)))] opacity-80" />

                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-dark-green text-white shadow-soft">
                    <Archive className="h-6 w-6" strokeWidth={iconStroke} />
                  </div>
                  <span className="inline-flex rounded-full border border-sage-green/20 bg-sage-green/10 px-3 py-1 text-xs font-bold text-dark-green">
                    {roleLabel(role)}
                  </span>
                </div>

                <div className="mt-5">
                  <h3 className="font-display text-2xl font-bold leading-tight text-text-primary">{space.name}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-muted">
                    {space.description ||
                      "Private family archive for preserving relationships, memories, photos, and narrative drafts."}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2">
                  {[
                    { Icon: Users, value: space.recordCounts?.members ?? 0, label: "members" },
                    { Icon: Calendar, value: space.recordCounts?.timeline ?? 0, label: "timeline" },
                    { Icon: Camera, value: space.recordCounts?.photos ?? 0, label: "photos" },
                    { Icon: BookOpen, value: space.recordCounts?.stories ?? 0, label: "stories" },
                  ].map(({ Icon, value, label }) => (
                    <div key={label} className="rounded-[1.1rem] border border-border-soft bg-background/82 px-3 py-3 shadow-soft">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-sage-green" strokeWidth={iconStroke} />
                        <span className="font-display text-xl font-extrabold leading-none text-text-primary">{value}</span>
                      </div>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.11em] text-text-muted">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between gap-3 border-t border-border-soft/80 pt-4">
                  <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-sage-green/10 px-3 text-xs font-bold text-dark-green">
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={iconStroke} />
                    Private archive
                  </span>
                  <span className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-dark-green px-4 text-sm font-bold text-white shadow-soft transition group-hover:bg-warm-brown">
                    Open Archive
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" strokeWidth={iconStroke} />
                  </span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <section className="surface-grain relative overflow-hidden rounded-[2rem] border border-dashed border-border-soft bg-surface/80 p-8 text-center shadow-soft ring-1 ring-white/70 sm:p-10">
            <div className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-dark-green text-white shadow-soft">
              <Sprout className="h-6 w-6" strokeWidth={iconStroke} />
            </div>
            <h2 className="relative mt-5 font-display text-2xl font-bold text-text-primary">
              No private archive yet.
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-text-muted">
              Create your first FamilySpace to store family tree, photos, timeline, and stories in one private space.
            </p>
          </section>
        )}

        <form
          className="mt-10 rounded-[1.75rem] border border-border-soft bg-surface p-5 shadow-soft"
          onSubmit={createSpace}
        >
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-sage-green">Create archive</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-text-primary">Start a private FamilySpace.</h2>
            </div>
            <p className="max-w-md text-sm font-semibold leading-6 text-text-muted">
              Every archive begins with a name and a short note about the family memory it protects.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-text-primary">Archive name</span>
              <input
                className="min-h-12 w-full rounded-2xl border border-border-soft bg-surface px-4 py-3 text-sm font-semibold text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/70 focus:border-dark-green focus:ring-4 focus:ring-sage-green/12"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Rahman Archive"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-text-primary">Archive description</span>
              <input
                className="min-h-12 w-full rounded-2xl border border-border-soft bg-surface px-4 py-3 text-sm font-semibold text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/70 focus:border-dark-green focus:ring-4 focus:ring-sage-green/12"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Demo private family archive for preserving stories and memories"
              />
            </label>
            <PrimaryButton type="submit">
              <Plus className="h-4 w-4" strokeWidth={iconStroke} />
              {isCreating ? "Creating..." : "Create Archive"}
            </PrimaryButton>
          </div>
        </form>
      </PageShell>
    </motion.div>
  );
};
