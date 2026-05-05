import { Minus, Plus, RotateCcw } from "lucide-react";

export const TreeControls = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) => (
  <div className="grid grid-cols-[44px_44px_minmax(0,1fr)_auto] gap-2 rounded-[1.6rem] border border-border-soft bg-surface p-3 shadow-soft sm:flex sm:flex-wrap">
    <button
      className="grid min-h-11 min-w-11 place-items-center rounded-2xl bg-surface-soft text-text-primary hover:bg-soft-gold/20"
      aria-label="Perbesar gambar"
      onClick={onZoomIn}
    >
      <Plus className="h-5 w-5" strokeWidth={1.8} />
    </button>
    <button
      className="grid min-h-11 min-w-11 place-items-center rounded-2xl bg-surface-soft text-text-primary hover:bg-soft-gold/20"
      aria-label="Perkecil gambar"
      onClick={onZoomOut}
    >
      <Minus className="h-5 w-5" strokeWidth={1.8} />
    </button>
    <button
      className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-surface-soft px-4 text-sm font-semibold text-text-primary hover:bg-soft-gold/20"
      aria-label="Kembali ke Tampilan Awal"
      onClick={onReset}
    >
      <RotateCcw className="h-4 w-4" strokeWidth={1.8} />
      Tampilan Awal
    </button>
    <span className="inline-flex min-h-11 items-center rounded-2xl px-3 text-sm font-bold text-text-muted">
      {Math.round(zoom * 100)}%
    </span>
  </div>
);
