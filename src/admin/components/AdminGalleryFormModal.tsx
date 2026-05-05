import { Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { SecondaryButton, iconStroke } from "../../components/ui";
import { useFamilyStore } from "../../hooks/useFamilyStore";
import type { GalleryItem } from "../../types/family";
import { AdminModal } from "./AdminModal";
import { PhotoUploadField } from "./PhotoUploadField";

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

export function AdminGalleryFormModal({
  item,
  open,
  onClose,
}: {
  item?: GalleryItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const { saveGalleryItem, deleteGalleryItem } = useFamilyStore();
  const [form, setForm] = useState<GalleryItem>(() => item ?? emptyGalleryItem);

  useEffect(() => {
    if (open) setForm(item ?? emptyGalleryItem);
  }, [item, open]);

  const update = <K extends keyof GalleryItem>(field: K, value: GalleryItem[K]) =>
    setForm((current) => ({ ...current, [field]: value }));

  return (
    <AdminModal
      open={open}
      title={item ? `Edit ${item.title}` : "Tambah Item Galeri"}
      description="Simpan arsip foto dengan URL gambar, kelompok keluarga, dan keterangan singkat."
      size="lg"
      onClose={onClose}
    >
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Judul">
            <input className={inputClass} value={form.title} onChange={(event) => update("title", event.target.value)} />
          </Field>
          <Field label="Tanggal">
            <input className={inputClass} value={form.date} onChange={(event) => update("date", event.target.value)} placeholder="Contoh: 2026-05-05" />
          </Field>
          <Field label="Tahun">
            <input className={inputClass} value={form.year} onChange={(event) => update("year", event.target.value)} />
          </Field>
          <Field label="Event">
            <input className={inputClass} value={form.event ?? ""} onChange={(event) => update("event", event.target.value)} />
          </Field>
          <Field label="Kelompok Keluarga">
            <input className={inputClass} value={form.familyGroup} onChange={(event) => update("familyGroup", event.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <PhotoUploadField
              folder="gallery"
              label="Foto Galeri"
              value={form.image}
              onChange={(value) => update("image", value)}
            />
          </div>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-text-primary">Deskripsi</span>
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
              Hapus
            </SecondaryButton>
          )}
          <SecondaryButton onClick={onClose}>Batal</SecondaryButton>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
            onClick={async () => {
              await saveGalleryItem(form, item?.id);
              onClose();
            }}
          >
            Simpan
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
