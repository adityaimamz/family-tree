import { Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useSpaceStore } from "../../hooks/useSpaceStore";
import type { GalleryItem } from "../../types/family";
import { SecondaryButton, iconStroke } from "../ui";
import { AppModal } from "../ui/AppModal";
import { PhotoUploadField } from "../ui/PhotoUploadField";

const inputClass =
  "min-h-12 w-full rounded-2xl border border-border-soft bg-background px-4 py-3 text-sm font-semibold text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/65 focus:border-dark-green focus:ring-4 focus:ring-sage-green/12";

const emptyGalleryItem: GalleryItem = {
  id: "",
  title: "",
  date: "",
  year: "",
  event: "",
  familyGroup: "",
  description: "",
  image: "",
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-text-primary">{label}</span>
    {children}
  </label>
);

export function GalleryFormModal({
  item,
  open,
  onClose,
}: {
  item?: GalleryItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const { saveGalleryItem, deleteGalleryItem } = useSpaceStore();
  const [form, setForm] = useState<GalleryItem>(() => item ?? emptyGalleryItem);

  useEffect(() => {
    if (open) setForm(item ?? emptyGalleryItem);
  }, [item, open]);

  const update = <K extends keyof GalleryItem>(field: K, value: GalleryItem[K]) =>
    setForm((current) => ({ ...current, [field]: value }));

  return (
    <AppModal
      open={open}
      title={item ? `Edit ${item.title}` : "Add Gallery Item"}
      description="Save a private family photo with its date, family group, and context."
      size="lg"
      onClose={onClose}
    >
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <input className={inputClass} value={form.title} onChange={(event) => update("title", event.target.value)} />
          </Field>
          <Field label="Date">
            <input className={inputClass} value={form.date} onChange={(event) => update("date", event.target.value)} placeholder="Example: 2026-05-05" />
          </Field>
          <Field label="Year">
            <input className={inputClass} value={form.year} onChange={(event) => update("year", event.target.value)} />
          </Field>
          <Field label="Event">
            <input className={inputClass} value={form.event ?? ""} onChange={(event) => update("event", event.target.value)} />
          </Field>
          <Field label="Family Group">
            <input className={inputClass} value={form.familyGroup} onChange={(event) => update("familyGroup", event.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <PhotoUploadField
              folder="gallery"
              label="Gallery Photo"
              value={form.image}
              onChange={(value) => update("image", value)}
            />
          </div>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-text-primary">Description</span>
            <textarea className={`${inputClass} min-h-28 resize-y`} value={form.description} onChange={(event) => update("description", event.target.value)} />
          </label>
        </div>

        <div className="flex flex-col justify-end gap-3 sm:flex-row sm:flex-wrap">
          {item && (
            <SecondaryButton
              tone="warning"
              onClick={async () => {
                await deleteGalleryItem(item.id);
                onClose();
              }}
            >
              <Trash2 className="h-4 w-4" strokeWidth={iconStroke} />
              Delete
            </SecondaryButton>
          )}
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
            onClick={async () => {
              await saveGalleryItem(form, item?.id);
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </AppModal>
  );
}
