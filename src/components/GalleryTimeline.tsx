import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Camera,
  GraduationCap,
  Heart,
  MapPin,
  Pencil,
  Route,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { familyConfig } from "../config";
import type { FamilyMember, GalleryItem, TimelineEvent } from "../types/family";
import { EmptyState, InitialsAvatar, iconStroke } from "./ui";

export const GalleryCard = ({
  item,
  onClick,
  className = "",
}: {
  item: GalleryItem;
  onClick: () => void;
  className?: string;
}) => (
  <motion.button
    layout
    whileHover={{ y: -6, scale: 1.01 }}
    transition={{ type: "spring", stiffness: 150, damping: 18 }}
    className={`group relative min-h-[19rem] overflow-hidden rounded-[1.55rem] border border-white/75 bg-surface text-left shadow-[0_24px_54px_-38px_rgba(80,54,30,0.78)] ring-1 ring-border-soft/60 md:h-full md:min-h-0 ${className}`}
    onClick={onClick}
  >
    <div className="absolute inset-0 overflow-hidden bg-surface-soft">
      <img
        alt={`Foto album ${item.title}`}
        className="h-full w-full object-cover contrast-105 sepia-[0.14] transition duration-700 ease-out group-hover:scale-105"
        src={item.image}
      />
    </div>
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(45,36,27,0.06)_0%,rgba(45,36,27,0.72)_100%)]" />
    <div className="relative flex h-full min-h-[19rem] flex-col justify-end p-5 sm:p-6 md:min-h-0">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-soft-gold">{item.date}</p>
      <h3 className="mt-2 font-display text-2xl font-bold leading-tight text-white sm:text-3xl">{item.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-white/80">{item.description}</p>
      <span className="mt-4 inline-flex w-fit rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur">
        {item.familyGroup}
      </span>
    </div>
  </motion.button>
);

export const Lightbox = ({
  items,
  activeId,
  onClose,
  onSelect,
}: {
  items: GalleryItem[];
  activeId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
}) => {
  const active = items.find((item) => item.id === activeId);
  if (!active) return null;
  const index = items.findIndex((item) => item.id === active.id);
  const previous = items[(index - 1 + items.length) % items.length];
  const next = items[(index + 1) % items.length];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 grid place-items-center bg-text-primary/55 p-4 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          className="grid max-h-[90dvh] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/75 bg-surface shadow-warm ring-1 ring-border-soft/70 md:grid-cols-[1.35fr_0.65fr]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative min-h-[320px] overflow-hidden bg-surface-soft">
            <img
              alt={`Foto album ${active.title}`}
              className="h-full min-h-[320px] w-full object-cover contrast-105 sepia-[0.12]"
              src={active.image}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(45,36,27,0.42)_100%)]" />
          </div>
          <div className="flex flex-col p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-sage-green">{active.date}</p>
                <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-text-primary">
                  {active.title}
                </h2>
              </div>
              <button
                aria-label="Tutup galeri"
                className="grid min-h-11 min-w-11 place-items-center rounded-2xl border border-border-soft bg-surface-soft text-text-primary transition hover:bg-background active:translate-y-[1px]"
                onClick={onClose}
              >
                <X className="h-5 w-5" strokeWidth={iconStroke} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-7 text-text-muted">{active.description}</p>
            <div className="mt-5 rounded-[1.25rem] border border-border-soft bg-surface-soft/60 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Kelompok foto</p>
              <p className="mt-1 text-sm font-bold text-warm-brown">{active.familyGroup}</p>
            </div>
            <div className="mt-auto flex gap-3 pt-6">
              <button
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-surface-soft px-4 text-sm font-bold text-text-primary transition hover:bg-background active:translate-y-[1px]"
                onClick={() => onSelect(previous.id)}
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={iconStroke} />
                Sebelumnya
              </button>
              <button
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-dark-green px-4 text-sm font-bold text-white shadow-warm transition hover:bg-warm-brown active:translate-y-[1px]"
                onClick={() => onSelect(next.id)}
              >
                Berikutnya
                <ArrowRight className="h-4 w-4" strokeWidth={iconStroke} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const iconForType = (type: TimelineEvent["type"]) => {
  const icons = {
    Kelahiran: Baby,
    Pernikahan: Heart,
    Reuni: Users,
    Wafat: Sparkles,
    "Pindah Tempat": MapPin,
    Pendidikan: GraduationCap,
    "Perjalanan Keluarga": Route,
    "Peristiwa Penting": Camera,
    Lainnya: Sparkles,
  };
  return icons[type];
};

export const TimelineItem = ({
  event,
  memberNames,
  relatedMembers = [],
  canEdit = false,
  sourceLabel,
  onEdit,
  onDelete,
}: {
  event: TimelineEvent;
  memberNames: string[];
  relatedMembers?: FamilyMember[];
  canEdit?: boolean;
  sourceLabel?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}) => {
  const Icon = iconForType(event.type);
  const visibleSourceLabel = sourceLabel ?? (event.isAutomatic ? "Otomatis" : "Manual");

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      className="relative grid gap-4 md:grid-cols-[150px_minmax(0,1fr)]"
    >
      <div className="md:text-right">
        <p className="font-display text-3xl font-bold text-warm-brown">{event.year}</p>
        <p className="mt-1 text-sm font-semibold text-text-muted">{event.type}</p>
      </div>
      <div className="group relative overflow-hidden rounded-[1.7rem] border border-white/75 bg-[linear-gradient(135deg,hsl(var(--surface))_0%,hsl(var(--surface-soft)_/_0.48)_100%)] p-5 shadow-[0_22px_50px_-36px_rgba(80,54,30,0.82)] ring-1 ring-border-soft/60 transition hover:-translate-y-1 hover:shadow-warm md:ml-8">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,hsl(var(--soft-gold)),hsl(var(--sage-green)),hsl(var(--warm-brown)))] opacity-80" />
        <span className="absolute -left-11 top-6 hidden h-10 w-10 place-items-center rounded-full border border-white/75 bg-background text-sage-green shadow-soft md:grid">
          <Icon className="h-5 w-5" strokeWidth={iconStroke} />
        </span>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-sage-green/20 bg-sage-green/12 text-sage-green" aria-hidden="true">
                <Icon className="h-4 w-4" strokeWidth={iconStroke} />
              </span>
              <span className="rounded-full border border-border-soft bg-surface px-3 py-1 text-xs font-bold text-text-muted">
                {visibleSourceLabel}
              </span>
            </div>
            <h3 className="break-words text-xl font-bold text-text-primary">{event.title}</h3>
          </div>
          {canEdit && (
            <div className="flex shrink-0 gap-2">
              <button
                aria-label={`Edit ${event.title}`}
                className="grid h-10 w-10 place-items-center rounded-full border border-border-soft bg-surface text-dark-green transition hover:bg-sage-green/15 active:translate-y-[1px]"
                type="button"
                onClick={onEdit}
              >
                <Pencil className="h-4 w-4" strokeWidth={iconStroke} />
              </button>
              <button
                aria-label={`Hapus ${event.title}`}
                className="grid h-10 w-10 place-items-center rounded-full border border-warning/20 bg-warning/10 text-warning transition hover:bg-warning/15 active:translate-y-[1px]"
                type="button"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" strokeWidth={iconStroke} />
              </button>
            </div>
          )}
        </div>
        <p className="mt-2 text-sm leading-7 text-text-muted">{event.description}</p>
        {!!relatedMembers.length ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {relatedMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-2 rounded-full border border-border-soft bg-surface py-1 pl-1 pr-3 shadow-soft">
                <InitialsAvatar member={member} size="sm" />
                <span className="max-w-[14rem] truncate text-xs font-semibold text-warm-brown">
                  {member.displayName || member.fullName}
                </span>
              </div>
            ))}
          </div>
        ) : (
          !!memberNames.length && (
            <div className="mt-4 flex flex-wrap gap-2">
              {memberNames.map((name) => (
                <span key={name} className="rounded-full border border-border-soft bg-surface px-3 py-1.5 text-xs font-semibold text-warm-brown">
                  {name}
                </span>
              ))}
            </div>
          )
        )}
      </div>
    </motion.article>
  );
};

export const GalleryGrid = ({ items }: { items: GalleryItem[] }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  if (!items.length) return <EmptyState title={familyConfig.labels.emptyGalleryTitle} description={familyConfig.labels.emptyGalleryDescription} />;
  const layoutClasses = [
    "md:col-span-6 md:row-span-2",
    "md:col-span-3",
    "md:col-span-3",
    "md:col-span-6",
  ];
  return (
    <>
      <motion.div layout className="grid grid-flow-dense gap-4 md:auto-rows-[18rem] md:grid-cols-12">
        {items.map((item, index) => (
          <GalleryCard
            key={item.id}
            item={item}
            className={layoutClasses[index % layoutClasses.length]}
            onClick={() => setActiveId(item.id)}
          />
        ))}
      </motion.div>
      <Lightbox items={items} activeId={activeId} onClose={() => setActiveId(null)} onSelect={setActiveId} />
    </>
  );
};
