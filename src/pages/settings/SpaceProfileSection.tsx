import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, iconStroke } from "../../components/ui";

const inputClass =
  "min-h-12 w-full rounded-2xl border border-border-soft bg-background px-4 py-3 text-sm font-semibold text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/65 focus:border-dark-green focus:ring-4 focus:ring-sage-green/12 disabled:cursor-not-allowed disabled:opacity-70";

export type SpaceProfileSectionProps = {
  currentSpace: { name: string; description?: string | null };
  canEdit: () => boolean;
  updateSpace: (data: { name?: string; description?: string | null }) => Promise<void>;
  addToast: (message: string, tone?: "success" | "warning" | "info" | "error") => void;
};

export const SpaceProfileSection = ({
  currentSpace,
  canEdit,
  updateSpace,
  addToast: _addToast,
}: SpaceProfileSectionProps) => {
  const [form, setForm] = useState({
    name: currentSpace?.name ?? "",
    description: currentSpace?.description ?? "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: currentSpace?.name ?? "",
      description: currentSpace?.description ?? "",
    });
  }, [currentSpace]);

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
    <section className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-text-primary">FamilySpace profile</h2>
          <p className="mt-1 text-sm font-semibold text-text-muted">
            Name and description appear in the app shell and space list.
          </p>
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
  );
};
