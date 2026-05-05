import { motion } from "framer-motion";
import { ImageUp, Pencil } from "lucide-react";
import { useState } from "react";
import { Badge, iconStroke, pageTransition } from "../../components/ui";
import { useFamilyStore } from "../../hooks/useFamilyStore";
import type { GalleryItem } from "../../types/family";
import { AdminGalleryFormModal } from "../components/AdminGalleryFormModal";

export function AdminGalleryPage() {
  const { gallery } = useFamilyStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<GalleryItem | null>(null);

  return (
    <motion.div {...pageTransition}>
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-dark-green">Arsip visual</p>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-4xl md:text-5xl">
            Gallery
          </h1>
          <p className="mt-3 max-w-[72ch] text-sm leading-7 text-text-muted sm:text-base">
            Kelola arsip foto dan dokumentasi keluarga yang tampil di halaman galeri.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
        >
          <ImageUp className="h-4 w-4" strokeWidth={iconStroke} />
          Tambah Foto
        </button>
      </div>

      <div className="mb-5 flex items-center gap-2">
        <Badge tone="sage">{gallery.length} item</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {gallery.map((item) => (
          <article
            key={item.id}
            className="surface-grain group relative overflow-hidden rounded-[1.8rem] border border-white/75 bg-surface/96 shadow-soft ring-1 ring-border-soft/60 transition hover:-translate-y-1"
          >
            <div className="aspect-[16/11] overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover contrast-105 sepia-[0.12] transition duration-700 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-text-muted">
                {item.date || item.year}
              </p>
              <h2 className="mt-2 text-lg font-bold text-text-primary">{item.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-text-muted">{item.description}</p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <Badge tone="sage">{item.familyGroup}</Badge>
                <button
                  type="button"
                  onClick={() => setItemToEdit(item)}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-dark-green transition hover:bg-sage-green/12"
                >
                  <Pencil className="h-4 w-4" strokeWidth={iconStroke} />
                  Edit
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <AdminGalleryFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <AdminGalleryFormModal open={Boolean(itemToEdit)} item={itemToEdit} onClose={() => setItemToEdit(null)} />
    </motion.div>
  );
}
