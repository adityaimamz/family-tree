import { useRef, useState } from "react";
import type React from "react";
import type { MouseEvent, PointerEvent, Touch, TouchEvent, WheelEvent } from "react";

const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const touchPoint = (touch: Touch) => ({ x: touch.clientX, y: touch.clientY });

const distanceBetween = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const midpointBetween = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

const shouldIgnoreCanvasPan = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(target.closest("a, button, input, select, textarea, [data-no-canvas-pan='true']"));

const MIN_TREE_ZOOM = 0.4;
const MAX_TREE_ZOOM = 1.5;

export interface UseCanvasGesturesOptions {
  pan: { x: number; y: number };
  zoom: number;
  clampPan: (nextPan: { x: number; y: number }, zoomLevel: number) => { x: number; y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  viewportSize: { width: number; height: number };
}

export interface UseCanvasGesturesReturn {
  isTouchGestureActive: boolean;
  handlePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  handlePointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  handlePointerEnd: (event: PointerEvent<HTMLDivElement>) => void;
  handleCanvasClickCapture: (event: MouseEvent<HTMLDivElement>) => void;
  handleTouchStart: (event: TouchEvent<HTMLDivElement>) => void;
  handleTouchMove: (event: TouchEvent<HTMLDivElement>) => void;
  handleTouchEnd: (event: TouchEvent<HTMLDivElement>) => void;
  handleWheel: (event: WheelEvent<HTMLDivElement>) => void;
}

export function useCanvasGestures({
  pan,
  zoom,
  clampPan,
  setPan,
  setZoom,
  viewportRef,
  viewportSize,
}: UseCanvasGesturesOptions): UseCanvasGesturesReturn {
  const [isTouchGestureActive, setIsTouchGestureActive] = useState(false);

  // Pointer drag — used for mouse (left-click) and single-finger touch pan
  const pointerDragRef = useRef<{
    pointerId: number;
    startPoint: { x: number; y: number };
    startPan: { x: number; y: number };
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  // Two-finger pinch-zoom gesture state
  const touchGestureRef = useRef<{
    contentPoint: { x: number; y: number };
    startDistance: number;
    startZoom: number;
  } | null>(null);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      // Two-finger pinch — takes over from any single-finger drag
      pointerDragRef.current = null;
      event.preventDefault();
      const viewport = viewportRef.current;
      const rect = viewport?.getBoundingClientRect();
      const first = touchPoint(event.touches[0]);
      const second = touchPoint(event.touches[1]);
      const midpoint = midpointBetween(first, second);
      const localMidpoint = rect ? { x: midpoint.x - rect.left, y: midpoint.y - rect.top } : midpoint;

      setIsTouchGestureActive(true);
      touchGestureRef.current = {
        contentPoint: {
          x: (localMidpoint.x - pan.x) / zoom,
          y: (localMidpoint.y - pan.y) / zoom,
        },
        startDistance: distanceBetween(first, second),
        startZoom: zoom,
      };
    }
    // Single-finger pan is handled via onPointerDown (pointerType === "touch")
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const gesture = touchGestureRef.current;
    if (event.touches.length !== 2 || !gesture) return;

    event.preventDefault();
    const viewport = viewportRef.current;
    const rect = viewport?.getBoundingClientRect();
    const first = touchPoint(event.touches[0]);
    const second = touchPoint(event.touches[1]);
    const midpoint = midpointBetween(first, second);
    const localMidpoint = rect ? { x: midpoint.x - rect.left, y: midpoint.y - rect.top } : midpoint;
    const nextZoom = clampNumber(
      gesture.startZoom * (distanceBetween(first, second) / Math.max(1, gesture.startDistance)),
      MIN_TREE_ZOOM,
      MAX_TREE_ZOOM,
    );

    // Combine pinch-zoom with two-finger pan — set both atomically to avoid
    // double-clamping: setZoom directly (no re-clamp of pan), setPan with the
    // already-clamped value.
    setZoom(nextZoom);
    setPan(
      clampPan(
        {
          x: localMidpoint.x - gesture.contentPoint.x * nextZoom,
          y: localMidpoint.y - gesture.contentPoint.y * nextZoom,
        },
        nextZoom,
      ),
    );
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length >= 2) return;
    touchGestureRef.current = null;
    setIsTouchGestureActive(false);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // Skip mouse right/middle click; skip if inside interactive elements
    if (event.button !== 0 || shouldIgnoreCanvasPan(event.target)) return;
    // Skip if a two-finger gesture is already active
    if (isTouchGestureActive) return;

    pointerDragRef.current = {
      pointerId: event.pointerId,
      startPoint: { x: event.clientX, y: event.clientY },
      startPan: pan,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = pointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    // If a pinch gesture started mid-drag, abort the drag
    if (isTouchGestureActive) {
      pointerDragRef.current = null;
      return;
    }

    const dx = event.clientX - drag.startPoint.x;
    const dy = event.clientY - drag.startPoint.y;
    if (Math.hypot(dx, dy) > 6) drag.moved = true;
    event.preventDefault();

    setPan(
      clampPan(
        {
          x: drag.startPan.x + dx,
          y: drag.startPan.y + dy,
        },
        zoom,
      ),
    );
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const drag = pointerDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (drag.moved) {
      suppressClickRef.current = true;
      globalThis.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
    pointerDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleCanvasClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  };

  // Trackpad / mouse-wheel zoom
  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const viewport = viewportRef.current;
    const rect = viewport?.getBoundingClientRect();
    const localX = rect ? event.clientX - rect.left : viewportSize.width / 2;
    const localY = rect ? event.clientY - rect.top : viewportSize.height / 2;

    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    const nextZoom = clampNumber(zoom + delta, MIN_TREE_ZOOM, MAX_TREE_ZOOM);
    const contentX = (localX - pan.x) / zoom;
    const contentY = (localY - pan.y) / zoom;

    setZoom(nextZoom);
    setPan(clampPan({ x: localX - contentX * nextZoom, y: localY - contentY * nextZoom }, nextZoom));
  };

  return {
    isTouchGestureActive,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
    handleCanvasClickCapture,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
  };
}
