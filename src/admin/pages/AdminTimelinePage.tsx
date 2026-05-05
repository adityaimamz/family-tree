import { motion } from "framer-motion";
import { CalendarPlus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge, ConfirmDialog, iconStroke, pageTransition } from "../../components/ui";
import { useFamilyStore } from "../../hooks/useFamilyStore";
import type { TimelineEvent } from "../../types/family";
import { AdminTimelineFormModal } from "../components/AdminTimelineFormModal";

export function AdminTimelinePage() {
  const { timeline, deleteTimelineEvent } = useFamilyStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<TimelineEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<TimelineEvent | null>(null);

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    await deleteTimelineEvent(eventToDelete.id);
    setEventToDelete(null);
  };

  return (
    <motion.div {...pageTransition}>
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-dark-green">Linimasa publik</p>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-4xl md:text-5xl">
            Timeline
          </h1>
          <p className="mt-3 max-w-[72ch] text-sm leading-7 text-text-muted sm:text-base">
            Tambah, edit, dan hapus event manual yang tampil di linimasa publik.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
        >
          <CalendarPlus className="h-4 w-4" strokeWidth={iconStroke} />
          Tambah Event
        </button>
      </div>

      <div className="mb-5 flex items-center gap-2">
        <Badge tone="sage">{timeline.length} item</Badge>
      </div>

      <section className="surface-grain relative overflow-hidden rounded-[1.8rem] border border-white/75 bg-surface/96 p-4 shadow-soft ring-1 ring-border-soft/60 sm:p-6">
        <ul className="grid gap-3">
          {timeline.map((item) => (
            <li key={item.id} className="rounded-[1.35rem] border border-border-soft bg-background/55 p-4 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-text-muted">{item.year}</p>
                  <p className="mt-2 text-base font-bold text-text-primary">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-text-muted">{item.description}</p>
                  <div className="mt-3">
                    <Badge tone="brown">{item.type}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEventToEdit(item)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-border-soft bg-surface px-3 py-2 text-xs font-semibold text-text-primary shadow-soft transition hover:bg-surface-soft"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={iconStroke} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventToDelete(item)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-warning/25 bg-warning/10 px-3 py-2 text-xs font-semibold text-warning shadow-soft transition hover:bg-warning/15"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={iconStroke} />
                    Hapus
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <AdminTimelineFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <AdminTimelineFormModal open={Boolean(eventToEdit)} event={eventToEdit} onClose={() => setEventToEdit(null)} />
      <ConfirmDialog
        open={Boolean(eventToDelete)}
        title={eventToDelete ? `Hapus ${eventToDelete.title}?` : "Hapus event?"}
        description="Event manual ini akan dihapus dari database dan tidak tampil lagi di halaman linimasa."
        onCancel={() => setEventToDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </motion.div>
  );
}
