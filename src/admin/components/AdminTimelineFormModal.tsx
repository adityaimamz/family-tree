import { Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { FilterSelect, SecondaryButton, iconStroke } from "../../components/ui";
import { useFamilyStore } from "../../hooks/useFamilyStore";
import type { TimelineEvent, TimelineEventType } from "../../types/family";
import { AdminModal } from "./AdminModal";

const inputClass =
  "min-h-12 w-full rounded-2xl border border-border-soft bg-background px-4 py-3 text-sm font-semibold text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/65 focus:border-dark-green focus:ring-4 focus:ring-sage-green/12";

const eventTypeOptions: TimelineEventType[] = [
  "Kelahiran",
  "Pernikahan",
  "Reuni",
  "Wafat",
  "Pindah Tempat",
  "Pendidikan",
  "Perjalanan Keluarga",
  "Peristiwa Penting",
  "Lainnya",
];

const emptyTimelineEvent: TimelineEvent = {
  id: "",
  year: "",
  type: "Peristiwa Penting",
  title: "",
  description: "",
  relatedMemberIds: [],
  memberIds: [],
  photo: null,
  isAutomatic: false,
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-text-primary">{label}</span>
    {children}
  </label>
);

export function AdminTimelineFormModal({
  event,
  open,
  onClose,
}: {
  event?: TimelineEvent | null;
  open: boolean;
  onClose: () => void;
}) {
  const { members, saveTimelineEvent, deleteTimelineEvent } = useFamilyStore();
  const [form, setForm] = useState<TimelineEvent>(() => event ?? emptyTimelineEvent);

  useEffect(() => {
    if (open) setForm(event ?? emptyTimelineEvent);
  }, [event, open]);

  const update = <K extends keyof TimelineEvent>(field: K, value: TimelineEvent[K]) =>
    setForm((current) => ({ ...current, [field]: value }));

  const selectedMemberIds = form.relatedMemberIds ?? form.memberIds ?? [];

  return (
    <AdminModal
      open={open}
      title={event ? `Edit ${event.title}` : "Tambah Event Linimasa"}
      description="Kelola event manual yang tampil di linimasa publik."
      size="lg"
      onClose={onClose}
    >
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Judul">
            <input className={inputClass} value={form.title} onChange={(item) => update("title", item.target.value)} />
          </Field>
          <Field label="Tahun / Periode">
            <input className={inputClass} value={form.year} onChange={(item) => update("year", item.target.value)} />
          </Field>
          <FilterSelect label="Tipe Event" value={form.type} options={eventTypeOptions} onChange={(value) => update("type", value as TimelineEventType)} />
          <Field label="URL Foto">
            <input className={inputClass} value={form.photo ?? ""} onChange={(item) => update("photo", item.target.value || null)} />
          </Field>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-text-primary">Deskripsi</span>
            <textarea className={`${inputClass} min-h-28 resize-y`} value={form.description} onChange={(item) => update("description", item.target.value)} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-text-primary">Anggota terkait</span>
            <select
              className="min-h-40 w-full rounded-2xl border border-border-soft bg-background px-4 py-3 text-sm font-medium text-text-primary shadow-soft outline-none transition focus:border-dark-green focus:ring-4 focus:ring-sage-green/12"
              multiple
              size={7}
              value={selectedMemberIds}
              onChange={(item) => {
                const ids = Array.from(item.currentTarget.selectedOptions, (option) => option.value);
                setForm((current) => ({ ...current, relatedMemberIds: ids, memberIds: ids }));
              }}
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName || member.fullName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col justify-end gap-3 sm:flex-row sm:flex-wrap">
          {event && (
            <SecondaryButton
              tone="warning"
              onClick={async () => {
                await deleteTimelineEvent(event.id);
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
              await saveTimelineEvent(form, event?.id);
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
