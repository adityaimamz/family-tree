import { motion } from "framer-motion";
import { Plus, Sprout } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState, LoadingState, PageShell, PrimaryButton, SectionHeader, pageTransition } from "../components/ui";
import { apiErrorMessage, authFetch } from "../lib/api";
import { getNeonAuthToken } from "../lib/auth";
import type { AppUser, FamilyMembership } from "../types/family";

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
        // Give Neon Auth session time to settle after sign-up/sign-in redirect.
        // Default getNeonAuthToken retries 6×180ms which is too short for sign-up flow.
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
        const data = await response.json();
        if (!cancelled) setMemberships(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load family spaces");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadSpaces();
    return () => { cancelled = true; };
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
        <SectionHeader
          eyebrow="Workspace"
          title="Keluarga Anda"
          description="Pilih keluarga untuk mengelola silsilah, anggota, dan dokumentasi."
        />

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <EmptyState title="Gagal memuat" description={error} />
        ) : memberships.length ? (
          <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {memberships.map(({ role, space }) => (
              <motion.button
                key={space.id}
                layout
                whileHover={{ y: -5, scale: 1.012 }}
                transition={{ type: "spring", stiffness: 170, damping: 18 }}
                onClick={() => navigate(`/app/${space.slug}`)}
                className="group relative min-h-32 overflow-hidden rounded-[1.35rem] border border-white/70 bg-[linear-gradient(135deg,hsl(var(--surface))_0%,hsl(var(--surface))_58%,hsl(var(--surface-soft)_/_0.62)_100%)] p-5 text-left shadow-[0_20px_48px_-34px_rgba(80,54,30,0.72)] ring-1 ring-border-soft/60 transition hover:border-dark-green sm:rounded-[1.7rem] sm:p-6"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,hsl(var(--soft-gold)),hsl(var(--sage-green)),hsl(var(--warm-brown)))] opacity-80" />

                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-dark-green text-white shadow-soft">
                    <Sprout className="h-6 w-6" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold leading-snug text-text-primary">{space.name}</h3>
                    {space.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-5 text-text-muted">{space.description}</p>
                    )}
                    <span className="mt-4 inline-flex rounded-full border border-sage-green/20 bg-sage-green/10 px-3 py-1 text-xs font-bold capitalize text-dark-green">
                      {role}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <EmptyState
            title="Belum ada keluarga"
            description="Buat space keluarga baru untuk mulai mengelola silsilah dan dokumentasi."
          />
        )}

        <form
          className="mt-10 rounded-[1.75rem] border border-border-soft bg-surface p-5 shadow-soft"
          onSubmit={createSpace}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-text-primary">Nama keluarga</span>
              <input
                className="min-h-12 w-full rounded-2xl border border-border-soft bg-surface px-4 py-3 text-sm font-semibold text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/70 focus:border-dark-green focus:ring-4 focus:ring-sage-green/12"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Rahman Archive"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-text-primary">Deskripsi</span>
              <input
                className="min-h-12 w-full rounded-2xl border border-border-soft bg-surface px-4 py-3 text-sm font-semibold text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/70 focus:border-dark-green focus:ring-4 focus:ring-sage-green/12"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Arsip keluarga pribadi"
              />
            </label>
            <PrimaryButton type="submit">
              <Plus className="h-4 w-4" strokeWidth={1.8} />
              {isCreating ? "Membuat..." : "Buat Keluarga"}
            </PrimaryButton>
          </div>
        </form>
      </PageShell>
    </motion.div>
  );
};
