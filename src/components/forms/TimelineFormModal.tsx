import { Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useSpaceStore } from "../../hooks/useSpaceStore";
import type { TimelineEvent, TimelineEventType } from "../../types/family";
import { FilterSelect, MultiSelectList, SecondaryButton, iconStroke } from "../ui";
import { AppModal } from "../ui/AppModal";

const inputClass =
  "min-h-12 w-full rounded-2xl border border-border-soft bg-background px-4 py-3 text-sm font-semibold text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/65 focus:border-dark-green focus:ring-4 focus:ring-sage-green/12";

const eventTypeOptions: TimelineEventType[] = [
  "Birth",
  "Marriage",
  "Reunion",
  "Deceased",
  "Place Move",
  "Education",
  "Family Trip",
  "Important Event",
  "Other",
];

const emptyTimelineEvent: TimelineEvent = {
  id: "",
  year: "",
  type: "Important Event",
  title: "",
  description: "",
  relatedMemberIds: [],
  memberIds: [],
  photo: null,
  isAutomatic: false,
};

const Field = ({ label, children }: Readonly<{ label: string; children: ReactNode }>) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-text-primary">{label}</span>
    {children}
  </label>
);

export function TimelineFormModal({
  event,
  open,
  onClose,
}: Readonly<{
  event?: TimelineEvent | null;
  open: boolean;
  onClose: () => void;
}>) {
  const { members, saveTimelineEvent, deleteTimelineEvent } = useSpaceStore();
  const [form, setForm] = useState<TimelineEvent>(() => event ?? emptyTimelineEvent);

  useEffect(() => {
    if (open) setForm(event ?? emptyTimelineEvent);
  }, [event, open]);

  const update = <K extends keyof TimelineEvent>(field: K, value: TimelineEvent[K]) =>
    setForm((current) => ({ ...current, [field]: value }));

  const selectedMemberIds = form.relatedMemberIds ?? form.memberIds ?? [];

  return (
    <AppModal
      open={open}
      title={event ? `Edit ${event.title}` : "Add Timeline Event"}
      description="Manage manual events that appear in the family timeline."
      size="lg"
      onClose={onClose}
    >
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <input className={inputClass} value={form.title} onChange={(item) => update("title", item.target.value)} />
          </Field>
          <Field label="Year / Period">
            <input className={inputClass} value={form.year} onChange={(item) => update("year", item.target.value)} />
          </Field>
          <FilterSelect label="Event Type" value={form.type} options={eventTypeOptions} onChange={(value) => update("type", value as TimelineEventType)} />
          <Field label="Photo URL">
            <input className={inputClass} value={form.photo ?? ""} onChange={(item) => update("photo", item.target.value || null)} />
          </Field>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-text-primary">Description</span>
            <textarea className={`${inputClass} min-h-28 resize-y`} value={form.description} onChange={(item) => update("description", item.target.value)} />
          </label>
          <MultiSelectList
            className="md:col-span-2"
            label="Related members"
            values={selectedMemberIds}
            options={members.map((member) => ({
              value: member.id,
              label: member.displayName || member.fullName,
              description: member.familyBranch,
            }))}
            onChange={(ids) => setForm((current) => ({ ...current, relatedMemberIds: ids, memberIds: ids }))}
          />
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
              Delete
            </SecondaryButton>
          )}
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
            onClick={async () => {
              await saveTimelineEvent(form, event?.id);
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
