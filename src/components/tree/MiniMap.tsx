import type { TreeLayout } from "../../types/tree";

const MINI_MAP_WIDTH = 120;
const MINI_MAP_HEIGHT = 80;

const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const MiniMap = ({
  layout,
  pan,
  zoom,
  viewportSize,
  onJump,
}: {
  layout: TreeLayout;
  pan: { x: number; y: number };
  zoom: number;
  viewportSize: { width: number; height: number };
  onJump: (point: { x: number; y: number }) => void;
}) => {
  const scale = Math.min(MINI_MAP_WIDTH / layout.width, MINI_MAP_HEIGHT / layout.height);
  const contentWidth = layout.width * scale;
  const contentHeight = layout.height * scale;
  const offsetX = (MINI_MAP_WIDTH - contentWidth) / 2;
  const offsetY = (MINI_MAP_HEIGHT - contentHeight) / 2;
  const viewX = clampNumber(-pan.x / zoom, 0, layout.width);
  const viewY = clampNumber(-pan.y / zoom, 0, layout.height);
  const viewWidth = clampNumber(viewportSize.width / zoom, 4, layout.width);
  const viewHeight = clampNumber(viewportSize.height / zoom, 4, layout.height);

  return (
    <button
      data-no-canvas-pan="true"
      aria-label="Peta kecil pohon keluarga"
      className="absolute bottom-4 right-4 z-[3] h-20 w-[120px] overflow-hidden rounded-2xl border border-border-soft bg-surface/95 p-0 shadow-warm backdrop-blur"
      type="button"
      onPointerDown={(event) => {
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        const x = clampNumber((event.clientX - rect.left - offsetX) / scale, 0, layout.width);
        const y = clampNumber((event.clientY - rect.top - offsetY) / scale, 0, layout.height);
        onJump({ x, y });
      }}
    >
      <svg aria-hidden="true" className="h-full w-full" viewBox={`0 0 ${MINI_MAP_WIDTH} ${MINI_MAP_HEIGHT}`}>
        <rect width={MINI_MAP_WIDTH} height={MINI_MAP_HEIGHT} rx="16" fill="#f7f1e7" />
        <rect
          x={offsetX}
          y={offsetY}
          width={contentWidth}
          height={contentHeight}
          rx="5"
          fill="#eee4d5"
          stroke="#8a6237"
          strokeOpacity="0.28"
        />
        {layout.units.map((unit) => (
          <rect
            key={unit.id}
            x={offsetX + unit.x * scale}
            y={offsetY + unit.y * scale}
            width={Math.max(1.5, unit.width * scale)}
            height={Math.max(1.5, unit.height * scale)}
            rx="1.5"
            fill="#55724f"
            opacity="0.72"
          />
        ))}
        <rect
          x={offsetX + viewX * scale}
          y={offsetY + viewY * scale}
          width={Math.max(8, viewWidth * scale)}
          height={Math.max(8, viewHeight * scale)}
          rx="4"
          fill="none"
          stroke="#b78a35"
          strokeWidth="2"
        />
      </svg>
    </button>
  );
};
