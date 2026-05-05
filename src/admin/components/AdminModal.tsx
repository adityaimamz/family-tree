import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId } from "react";
import type { ReactNode } from "react";
import { iconStroke } from "../../components/ui";

export type AdminModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  size?: "md" | "lg" | "xl";
  children: ReactNode;
  onClose: () => void;
};

export function AdminModal({ open, title, description, size = "md", children, onClose }: AdminModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const sizeClass = size === "xl" ? "sm:max-w-6xl" : size === "lg" ? "sm:max-w-4xl" : "sm:max-w-2xl";

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-text-primary/35 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            className={`surface-grain relative flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-[1.6rem] border border-border-soft bg-surface shadow-warm sm:max-h-[90dvh] sm:rounded-[2rem] ${sizeClass}`}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="relative z-[1] flex shrink-0 items-start justify-between gap-4 border-b border-border-soft/70 bg-surface/96 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5">
              <div className="min-w-0">
                {title && (
                  <h2 id={titleId} className="truncate text-xl font-extrabold tracking-tight text-text-primary sm:text-2xl">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={descriptionId} className="mt-1 max-w-3xl text-xs font-medium leading-5 text-text-muted sm:text-sm sm:leading-6">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label="Tutup modal"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-border-soft bg-background text-text-primary shadow-soft transition hover:bg-surface-soft active:translate-y-[1px] sm:h-11 sm:w-11"
                onClick={onClose}
              >
                <X className="h-5 w-5" strokeWidth={iconStroke} />
              </button>
            </header>

            <div className="relative z-[1] min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
