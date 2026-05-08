import { motion } from "framer-motion";
import { AlertTriangle, Lock, Save, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, PageShell, SectionHeader, iconStroke, pageTransition } from "../components/ui";
import { useSpaceStore } from "../hooks/useSpaceStore";

const inputClass =
  "min-h-12 w-full rounded-2xl border border-border-soft bg-background px-4 py-3 text-sm font-semibold text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/65 focus:border-dark-green focus:ring-4 focus:ring-sage-green/12 disabled:cursor-not-allowed disabled:opacity-70";

const roleLabel = (role: string) => {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
};

export const SpaceSettingsPage = () => {
  const { currentSpace, membership, canEdit, updateSpace } = useSpaceStore();
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: currentSpace?.name ?? "",
      description: currentSpace?.description ?? "",
    });
  }, [currentSpace]);

  if (!currentSpace || !membership) return null;

  const saveSettings = async () => {
    if (!canEdit() || !form.name.trim()) return;
    setSaving(true);
    await updateSpace({
      name: form.name.trim(),
      description: form.description.trim() || null,
    });
    setSaving(false);
  };

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader
          eyebrow="Control"
          title="Settings"
          description="Manage the visible identity of this private FamilySpace. Access control remains scoped to members of this archive."
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60 sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-text-primary">FamilySpace profile</h2>
                <p className="mt-1 text-sm font-semibold text-text-muted">Name and description appear in the app shell and space list.</p>
              </div>
              <Badge tone="sage">Private Family Archive</Badge>
            </div>

            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-text-primary">Space name</span>
                <input
                  className={inputClass}
                  value={form.name}
                  disabled={!canEdit()}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-text-primary">Description</span>
                <textarea
                  className={`${inputClass} min-h-32 resize-y`}
                  value={form.description}
                  disabled={!canEdit()}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>

              {canEdit() ? (
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px] sm:w-max"
                  onClick={() => void saveSettings()}
                  disabled={saving}
                >
                  <Save className="h-4 w-4" strokeWidth={iconStroke} />
                  {saving ? "Saving..." : "Save settings"}
                </button>
              ) : (
                <div className="rounded-2xl border border-sage-green/20 bg-sage-green/10 p-4 text-sm font-semibold leading-6 text-text-muted">
                  Your member role can view settings but cannot edit this FamilySpace.
                </div>
              )}
            </div>
          </section>

          <aside className="grid gap-5">
            <section className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60">
              <ShieldCheck className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
              <h2 className="mt-4 text-xl font-extrabold text-text-primary">Current access</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">
                You are signed in as <span className="text-text-primary">{roleLabel(membership.role)}</span> for {currentSpace.name}.
              </p>
              <div className="mt-4 rounded-2xl border border-border-soft bg-background p-4">
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-sage-green" strokeWidth={iconStroke} />
                  <p className="text-sm font-bold text-text-primary">Private Family Archive</p>
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-text-muted">
                  Platform admins cannot automatically access private FamilySpace records.
                </p>
              </div>
            </section>

            <section className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60">
              <Users className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
              <h2 className="mt-4 text-xl font-extrabold text-text-primary">Invite & role management</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">
                Invite links, role changes, and member removal are coming in a later sprint.
              </p>
              <button
                type="button"
                disabled
                className="mt-4 min-h-11 rounded-2xl border border-border-soft bg-surface-soft px-4 py-3 text-sm font-bold text-text-muted opacity-70"
              >
                Coming soon
              </button>
            </section>

            <section className="rounded-[1.6rem] border border-warning/20 bg-warning/10 p-5 shadow-soft ring-1 ring-border-soft/60">
              <AlertTriangle className="h-5 w-5 text-warning" strokeWidth={iconStroke} />
              <h2 className="mt-4 text-xl font-extrabold text-text-primary">Danger zone</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">
                Ownership transfer and archive deletion are intentionally disabled for this sprint.
              </p>
              <div className="mt-4 grid gap-2">
                <button type="button" disabled className="min-h-11 rounded-2xl border border-warning/20 bg-surface px-4 py-3 text-sm font-bold text-text-muted opacity-70">
                  Transfer ownership
                </button>
                <button type="button" disabled className="min-h-11 rounded-2xl border border-warning/20 bg-surface px-4 py-3 text-sm font-bold text-warning opacity-60">
                  Delete space
                </button>
              </div>
            </section>
          </aside>
        </div>
      </PageShell>
    </motion.div>
  );
};
