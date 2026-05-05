import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Search,
  Users,
  X,
} from "lucide-react";
import { useId, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { FamilyMember } from "../types/family";
import { displayStatus, generationLabel, getInitials } from "../utils/family";

export const iconStroke = 1.8;

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { type: "spring", stiffness: 110, damping: 22 },
} as const;

export const PageShell = ({ children }: { children: ReactNode }) => (
  <main className="mx-auto w-full max-w-[1400px] overflow-x-clip px-3 pb-12 pt-4 sm:px-5 sm:pb-16 sm:pt-6 lg:px-8">
    {children}
  </main>
);

export const SectionHeader = ({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div className="max-w-3xl">
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-sage-green">{eyebrow}</p>
      )}
      <h1 className="font-display text-3xl font-bold leading-tight text-text-primary sm:text-4xl md:text-5xl">{title}</h1>
      {description && <p className="mt-3 max-w-[68ch] text-sm leading-7 text-text-muted sm:text-base">{description}</p>}
    </div>
    {action}
  </div>
);

export const PrimaryButton = ({
  children,
  to,
  type = "button",
  onClick,
}: {
  children: ReactNode;
  to?: string;
  type?: "button" | "submit";
  onClick?: () => void;
}) => {
  const className =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px] focus:outline focus:outline-2 focus:outline-offset-4 max-sm:w-full";

  if (to) {
    return (
      <Link className={className} to={to}>
        {children}
      </Link>
    );
  }

  return (
    <button className={className} type={type} onClick={onClick}>
      {children}
    </button>
  );
};

export const SecondaryButton = ({
  children,
  to,
  type = "button",
  onClick,
  tone = "neutral",
}: {
  children: ReactNode;
  to?: string;
  type?: "button";
  onClick?: () => void;
  tone?: "neutral" | "warning";
}) => {
  const className = `inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-soft transition hover:-translate-y-0.5 active:translate-y-[1px] max-sm:w-full ${
    tone === "warning"
      ? "border-warning/25 bg-warning/10 text-warning hover:bg-warning/15"
      : "border-border-soft bg-surface text-text-primary hover:bg-surface-soft"
  }`;
  if (to) {
    return (
      <Link className={className} to={to}>
        {children}
      </Link>
    );
  }
  return (
    <button className={className} type={type} onClick={onClick}>
      {children}
    </button>
  );
};

export const InitialsAvatar = ({ member, size = "md" }: { member: FamilyMember; size?: "sm" | "md" | "lg" }) => {
  const sizes = {
    sm: "h-11 w-11 text-sm",
    md: "h-14 w-14 text-base",
    lg: "h-24 w-24 text-2xl",
  };
  const initials = getInitials(member.displayName || member.fullName);

  if (member.photo) {
    return (
      <img
        alt={`Foto ${member.fullName}`}
        className={`${sizes[size]} rounded-full object-cover ring-4 ring-surface-soft`}
        src={member.photo}
      />
    );
  }

  return (
    <div
      aria-label={`Inisial ${member.fullName}`}
      className={`${sizes[size]} grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-surface-soft via-soft-gold/30 to-sage-green/20 font-display font-bold text-warm-brown ring-4 ring-white`}
    >
      {initials.toUpperCase()}
    </div>
  );
};

export const Badge = ({ children, tone = "sage" }: { children: ReactNode; tone?: "sage" | "gold" | "brown" | "blue" | "muted" }) => {
  const tones = {
    sage: "bg-sage-green/12 text-dark-green border-sage-green/20",
    gold: "bg-soft-gold/16 text-warm-brown border-soft-gold/25",
    brown: "bg-warm-brown/10 text-warm-brown border-warm-brown/20",
    blue: "bg-soft-blue/15 text-text-primary border-soft-blue/25",
    muted: "bg-surface-soft text-text-muted border-border-soft",
  };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
};

export const MemberCard = ({ member, compact = false }: { member: FamilyMember; compact?: boolean }) => {
  const initials = getInitials(member.displayName || member.fullName).toUpperCase();

  return (
    <motion.article
      layout
      whileHover={{ y: -5, scale: 1.012 }}
      transition={{ type: "spring", stiffness: 170, damping: 18 }}
      className="group relative min-w-0 overflow-hidden rounded-[1.35rem] border border-white/70 bg-[linear-gradient(135deg,hsl(var(--surface))_0%,hsl(var(--surface))_58%,hsl(var(--surface-soft)_/_0.62)_100%)] p-3 shadow-[0_20px_48px_-34px_rgba(80,54,30,0.72)] ring-1 ring-border-soft/60 sm:rounded-[1.7rem]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,hsl(var(--soft-gold)),hsl(var(--sage-green)),hsl(var(--warm-brown)))] opacity-80" />
      <div className="flex items-start gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-white/80 bg-surface-soft shadow-soft">
          {member.photo ? (
            <img
              alt={`Foto ${member.fullName}`}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              src={member.photo}
            />
          ) : (
            <div className="archive-grid grid h-full w-full place-items-center bg-[linear-gradient(135deg,hsl(var(--surface-soft)),hsl(var(--soft-gold)_/_0.22))]">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-surface/88 font-display text-lg font-bold text-warm-brown shadow-soft ring-1 ring-white/90">
                {initials}
              </span>
            </div>
          )}
          {!member.photo && (
            <span className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-surface/92 text-sage-green shadow-soft">
              <Camera className="h-3.5 w-3.5" strokeWidth={iconStroke} />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 py-1">
          <div className="flex flex-wrap gap-2">
            <Badge tone="gold">{generationLabel(member.generation)}</Badge>
            <Badge tone={member.isDeceased ? "muted" : "sage"}>{displayStatus(member)}</Badge>
          </div>
          <h3 className="mt-3 break-words text-base font-bold leading-snug text-text-primary sm:text-lg">
            {member.fullName}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-text-muted">{member.relationshipToRoot}</p>
        </div>
      </div>

      {!compact && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft/80 pt-4">
          <span className="max-w-full truncate rounded-full border border-soft-gold/25 bg-soft-gold/12 px-3 py-1.5 text-xs font-semibold text-warm-brown">
            {member.familyBranch}
          </span>
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-dark-green transition hover:bg-sage-green/12 active:translate-y-[1px]"
            to={`/anggota/${member.id}`}
          >
            Lihat Detail
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" strokeWidth={iconStroke} />
          </Link>
        </div>
      )}
    </motion.article>
  );
};

export const SearchBar = ({
  value,
  onChange,
  placeholder = "Cari nama, pasangan, orang tua, atau cabang keluarga",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <label className="relative block">
    <span className="sr-only">Pencarian</span>
    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" strokeWidth={iconStroke} />
    <input
      className="min-h-12 w-full rounded-2xl border border-border-soft bg-surface py-3 pl-12 pr-4 text-base text-text-primary shadow-soft transition placeholder:text-text-muted/70 focus:border-dark-green focus:outline-none focus:ring-4 focus:ring-sage-green/12"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

export const FilterSelect = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const listboxId = useId();

  return (
    <div
      className="relative block"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <span className="mb-2 block text-sm font-semibold text-text-primary">{label}</span>
      <button
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border bg-surface px-4 py-3 text-left text-sm font-semibold text-text-primary shadow-soft transition ${
          open
            ? "border-dark-green ring-4 ring-sage-green/12"
            : "border-border-soft hover:border-sage-green/40 hover:bg-surface-soft/55"
        }`}
        type="button"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        <span className="min-w-0 truncate">{value === "Semua Cabang" ? "Semua Keluarga" : value}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-text-muted transition ${open ? "rotate-180 text-dark-green" : ""}`}
          strokeWidth={iconStroke}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={listboxId}
            role="listbox"
            aria-label={label}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-[24] max-h-72 overflow-y-auto rounded-[1.35rem] border border-border-soft bg-surface p-2 shadow-warm ring-1 ring-white/70"
          >
            {options.map((option) => {
              const selected = option === value;
              return (
                <button
                  key={option}
                  role="option"
                  aria-selected={selected}
                  className={`grid w-full grid-cols-[minmax(0,1fr)_22px] items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition ${
                    selected
                      ? "bg-dark-green font-bold text-white"
                      : "font-semibold text-text-primary hover:bg-surface-soft"
                  }`}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{option === "Semua Cabang" ? "Semua Keluarga" : option}</span>
                  {selected && <Check className="h-4 w-4" strokeWidth={2} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const StatCard = ({ icon, value, label }: { icon: ReactNode; value: string; label: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="group rounded-[1.45rem] border border-white/75 bg-surface/92 p-5 shadow-[0_20px_44px_-34px_rgba(80,54,30,0.7)] ring-1 ring-border-soft/65 transition hover:-translate-y-1"
  >
    <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-green/12 text-dark-green transition group-hover:bg-dark-green group-hover:text-white">
      {icon}
    </div>
    <p className="font-display text-3xl font-bold text-text-primary">{value}</p>
    <p className="mt-1 text-sm font-semibold text-text-muted">{label}</p>
  </motion.div>
);

export const EmptyState = ({ title, description }: { title: string; description?: string }) => (
  <div className="rounded-[2rem] border border-dashed border-border-soft bg-surface/70 p-10 text-center">
    <Archive className="mx-auto h-10 w-10 text-sage-green" strokeWidth={iconStroke} />
    <h3 className="mt-4 text-xl font-bold text-text-primary">{title}</h3>
    {description && <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-muted">{description}</p>}
  </div>
);

export const LoadingState = () => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="animate-pulse rounded-[1.6rem] border border-border-soft bg-surface p-5 shadow-soft">
        <div className="h-14 w-14 rounded-full bg-surface-soft" />
        <div className="mt-5 h-4 w-28 rounded-full bg-surface-soft" />
        <div className="mt-3 h-5 w-4/5 rounded-full bg-surface-soft" />
        <div className="mt-3 h-4 w-full rounded-full bg-surface-soft" />
      </div>
    ))}
    <span className="sr-only">Memuat data keluarga...</span>
  </div>
);

export const Toast = ({ message }: { message: string | null }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
    className="fixed bottom-5 left-1/2 z-40 flex min-h-12 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl border border-sage-green/20 bg-surface px-4 py-3 text-sm font-semibold text-text-primary shadow-warm sm:w-auto sm:px-5"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-sage-green/15 text-dark-green">
          <Check className="h-4 w-4" strokeWidth={iconStroke} />
        </span>
        {message}
      </motion.div>
    )}
  </AnimatePresence>
);

export const ConfirmDialog = ({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 grid place-items-center bg-text-primary/30 px-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          className="w-full max-w-md rounded-[2rem] border border-border-soft bg-surface p-6 shadow-warm"
        >
          <div className="flex gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-warning/12 text-warning">
              <AlertTriangle className="h-6 w-6" strokeWidth={iconStroke} />
            </div>
            <div>
              <h2 id="confirm-title" className="text-xl font-bold text-text-primary">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
            <SecondaryButton onClick={onCancel}>Batal</SecondaryButton>
            <SecondaryButton tone="warning" onClick={onConfirm}>
              Hapus Data
            </SecondaryButton>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const InfoPill = ({ icon, label }: { icon?: ReactNode; label: string }) => (
  <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border-soft bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted">
    {icon}
    {label}
  </span>
);

export const defaultIcons = {
  users: <Users className="h-5 w-5" strokeWidth={iconStroke} />,
  book: <BookOpen className="h-5 w-5" strokeWidth={iconStroke} />,
  archive: <Archive className="h-5 w-5" strokeWidth={iconStroke} />,
  calendar: <CalendarDays className="h-5 w-5" strokeWidth={iconStroke} />,
  close: <X className="h-5 w-5" strokeWidth={iconStroke} />,
};
