import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";

const DEFAULT_TREE_ZOOM = 0.82;
const MIN_TREE_ZOOM = 0.4;
const MAX_TREE_ZOOM = 1.5;
const PAN_EDGE_PADDING = 24;

const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export interface UseCanvasPanZoomOptions {
  layout: { width: number; height: number };
  viewportRef: React.RefObject<HTMLDivElement | null>;
  memberCanvasPositions: Map<string, { x: number; y: number; width: number; height: number }>;
  branchHomeMemberId: string;
}

export interface UseCanvasPanZoomReturn {
  zoom: number;
  pan: { x: number; y: number };
  viewportSize: { width: number; height: number };
  homePan: { x: number; y: number };
  isAwayFromHome: boolean;
  clampPan: (nextPan: { x: number; y: number }, zoomLevel: number) => { x: number; y: number };
  updateZoom: (nextZoom: number) => void;
  returnToHome: (branchHomeMemberId: string) => void;
  handleMiniMapJump: (point: { x: number; y: number }) => void;
  panForMember: (memberId: string, zoomLevel: number) => { x: number; y: number } | null;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}

export function useCanvasPanZoom({
  layout,
  viewportRef,
  memberCanvasPositions,
  branchHomeMemberId,
}: UseCanvasPanZoomOptions): UseCanvasPanZoomReturn {
  const [zoom, setZoom] = useState(DEFAULT_TREE_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  // Track viewportSize in a ref so clampPan doesn't need it as a dep
  const viewportSizeRef = useRef(viewportSize);
  useEffect(() => {
    viewportSizeRef.current = viewportSize;
  }, [viewportSize]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateSize = () => {
      setViewportSize({ width: viewport.clientWidth, height: viewport.clientHeight });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [viewportRef]);

  const clampPan = useCallback(
    (nextPan: { x: number; y: number }, zoomLevel: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return nextPan;

      const contentWidth = layout.width * zoomLevel;
      const contentHeight = layout.height * zoomLevel;

      // Horizontal centering or clamping
      let minX, maxX;
      if (contentWidth < viewport.clientWidth) {
        const offset = (viewport.clientWidth - contentWidth) / 2;
        minX = offset;
        maxX = offset;
      } else {
        minX = viewport.clientWidth - contentWidth - PAN_EDGE_PADDING;
        maxX = PAN_EDGE_PADDING;
      }

      // Vertical centering or clamping
      let minY, maxY;
      if (contentHeight < viewport.clientHeight) {
        const offset = (viewport.clientHeight - contentHeight) / 2;
        minY = offset;
        maxY = offset;
      } else {
        minY = viewport.clientHeight - contentHeight - PAN_EDGE_PADDING;
        maxY = PAN_EDGE_PADDING;
      }

      return {
        x: Math.max(minX, Math.min(maxX, nextPan.x)),
        y: Math.max(minY, Math.min(maxY, nextPan.y)),
      };
    },
    [layout.height, layout.width, viewportRef],
  );

  const panForMember = useCallback(
    (memberId: string, zoomLevel: number) => {
      const viewport = viewportRef.current;
      const position = memberCanvasPositions.get(memberId);
      if (!viewport || !position) return null;

      const nodeCenterX = position.x + position.width / 2;
      const nodeCenterY = position.y + position.height / 2;
      return clampPan(
        {
          x: viewport.clientWidth / 2 - nodeCenterX * zoomLevel,
          y: viewport.clientHeight / 2 - nodeCenterY * zoomLevel,
        },
        zoomLevel,
      );
    },
    [clampPan, memberCanvasPositions, viewportRef],
  );

  const homePan = useMemo(
    () => panForMember(branchHomeMemberId, DEFAULT_TREE_ZOOM) ?? { x: 0, y: 0 },
    [branchHomeMemberId, panForMember],
  );

  const isAwayFromHome = useMemo(
    () =>
      Math.abs(pan.x - homePan.x) > 36 ||
      Math.abs(pan.y - homePan.y) > 36 ||
      Math.abs(zoom - DEFAULT_TREE_ZOOM) > 0.04,
    [homePan.x, homePan.y, pan.x, pan.y, zoom],
  );

  const updateZoom = useCallback(
    (nextZoom: number) => {
      const clampedZoom = clampNumber(nextZoom, MIN_TREE_ZOOM, MAX_TREE_ZOOM);
      setZoom(clampedZoom);
      setPan((current) => clampPan(current, clampedZoom));
    },
    [clampPan],
  );

  const returnToHome = useCallback(
    (homeMemberId: string) => {
      const nextPan = panForMember(homeMemberId, DEFAULT_TREE_ZOOM) ?? homePan;
      setZoom(DEFAULT_TREE_ZOOM);
      setPan(nextPan);
    },
    [homePan, panForMember],
  );

  const handleMiniMapJump = useCallback(
    (point: { x: number; y: number }) => {
      const vs = viewportSizeRef.current;
      setPan(
        clampPan(
          {
            x: vs.width / 2 - point.x * zoom,
            y: vs.height / 2 - point.y * zoom,
          },
          zoom,
        ),
      );
    },
    [clampPan, zoom],
  );

  return {
    zoom,
    pan,
    viewportSize,
    homePan,
    isAwayFromHome,
    clampPan,
    updateZoom,
    returnToHome,
    handleMiniMapJump,
    panForMember,
    setPan,
    setZoom,
  };
}
