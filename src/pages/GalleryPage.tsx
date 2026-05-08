import { motion } from "framer-motion";
import { Camera, Edit3, Images, Layers3, Plus } from "lucide-react";
import { useState } from "react";
import { GalleryFormModal } from "../components/forms/GalleryFormModal";
import { GalleryGrid } from "../components/GalleryTimeline";
import { PageShell, iconStroke, pageTransition } from "../components/ui";
import { familyConfig } from "../config";
import { useSpaceStore } from "../hooks/useSpaceStore";
import type { GalleryItem } from "../types/family";

export const GalleryPage = () => {
  const { gallery, canEdit } = useSpaceStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<GalleryItem | null>(null);

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <section className="surface-grain relative mb-8 overflow-hidden rounded-[2rem] border border-white/75 bg-[linear-gradient(135deg,hsl(var(--surface))_0%,hsl(var(--background))_58%,hsl(var(--surface-soft))_100%)] p-5 shadow-[0_30px_80px_-50px_rgba(80,54,30,0.85)] ring-1 ring-border-soft/70 sm:p-8 lg:p-10">
          <div className="relative grid min-w-0 gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.75fr)] lg:items-end">
            <div className="min-w-0">
              <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.18em] text-sage-green">Photo memories</p>
              <h1 className="max-w-5xl font-display text-5xl font-bold leading-[0.96] text-text-primary sm:text-6xl lg:text-7xl">
                Photo Memories
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-text-muted sm:text-lg">
                Preserve family photos with dates, event context, and the stories that make each image easier to remember.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative col-span-2 min-h-[15rem] overflow-hidden rounded-[1.5rem] border border-white/75 bg-surface shadow-soft">
                <img
                  alt={`Album keluarga ${familyConfig.site.familyName}`}
                  className="h-full w-full object-cover contrast-105 sepia-[0.14]"
                  src={familyConfig.site.galleryHeroImage}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_38%,rgba(45,36,27,0.62)_100%)]" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-sm font-bold">Visual archive across branches</p>
                  <p className="mt-1 text-xs font-semibold text-white/75">Photos, reunions, documents, and remembered context</p>
                </div>
              </div>
              {[
                { Icon: Images, value: `${gallery.length} photos`, label: "Photo memories" },
                { Icon: Layers3, value: "Context", label: "Dates and events" },
              ].map(({ Icon, value, label }) => (
                <div key={value} className="rounded-[1.35rem] border border-white/75 bg-surface/92 p-4 shadow-soft ring-1 ring-border-soft/60">
                  <Icon className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
                  <p className="mt-5 font-display text-3xl font-bold text-text-primary">{value as string}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-text-muted">{label as string}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-sage-green">Memory collection</p>
            <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
              Photos with family context.
            </h2>
          </div>
          {canEdit() ? (
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
              type="button"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" strokeWidth={iconStroke} />
              Add photo memory
            </button>
          ) : (
            <div className="hidden h-12 w-12 place-items-center rounded-2xl border border-border-soft bg-surface text-warm-brown shadow-soft sm:grid">
              <Camera className="h-5 w-5" strokeWidth={iconStroke} />
            </div>
          )}
        </section>
        <GalleryGrid items={gallery} />
        {canEdit() && gallery.length > 0 && (
          <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((item) => (
              <button
                key={item.id}
                className="inline-flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-border-soft bg-surface px-4 py-3 text-left text-sm font-bold text-text-primary shadow-soft transition hover:bg-surface-soft"
                type="button"
                onClick={() => setItemToEdit(item)}
              >
                <span className="min-w-0 truncate">{item.title}</span>
                <Edit3 className="h-4 w-4 shrink-0 text-sage-green" strokeWidth={iconStroke} />
              </button>
            ))}
          </div>
        )}
        <GalleryFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
        <GalleryFormModal open={Boolean(itemToEdit)} item={itemToEdit} onClose={() => setItemToEdit(null)} />
      </PageShell>
    </motion.div>
  );
};
