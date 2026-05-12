import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { memberMatchesTerm } from "../components/tree/FocusSearchCombobox";
import { TREE_NODE_HEIGHT, TREE_NODE_WIDTH } from "../constants/treeLayout";
import type { FamilyMember } from "../types/family";
import type { FocusMode } from "../types/tree";
import { getAncestorIds, getDescendantIds } from "../utils/family";

const MIN_TREE_ZOOM = 0.4;
const MAX_TREE_ZOOM = 1.5;

const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export interface UseTreeFocusOptions {
  members: FamilyMember[];
  visibleTreeMembers: FamilyMember[];
  memberMap: Record<string, FamilyMember>;
  memberCanvasPositions: Map<string, { x: number; y: number; width: number; height: number }>;
  zoom: number;
  clampPan: (nextPan: { x: number; y: number }, zoomLevel: number) => { x: number; y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  viewportSize: { width: number; height: number };
}

export interface UseTreeFocusReturn {
  query: string;
  focusMode: FocusMode;
  focusMemberId: string;
  pulseMemberId: string | null;
  activeFocusMemberId: string;
  matchingIds: Set<string> | null;
  focusIds: Set<string> | null;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  setFocusMode: React.Dispatch<React.SetStateAction<FocusMode>>;
  setFocusMemberId: React.Dispatch<React.SetStateAction<string>>;
  setPulseMemberId: React.Dispatch<React.SetStateAction<string | null>>;
  focusCanvasOnMember: (memberId: string) => void;
  focusCanvasOnMembers: (memberIds: string[], zoomLevel?: number) => void;
}

export function useTreeFocus({
  members,
  visibleTreeMembers,
  memberMap,
  memberCanvasPositions,
  zoom,
  clampPan,
  setPan,
  setZoom,
  viewportRef,
  viewportSize,
}: UseTreeFocusOptions): UseTreeFocusReturn {
  const [query, setQuery] = useState("");
  const [focusMode, setFocusMode] = useState<FocusMode>("all");
  const [focusMemberId, setFocusMemberId] = useState("");
  const [pulseMemberId, setPulseMemberId] = useState<string | null>(null);

  const pulseTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (pulseTimerRef.current) globalThis.clearTimeout(pulseTimerRef.current);
    },
    [],
  );

  const focusOptions = visibleTreeMembers.length ? visibleTreeMembers : members;
  const activeFocusMemberId = focusOptions.some((member) => member.id === focusMemberId)
    ? focusMemberId
    : (focusOptions[0]?.id ?? focusMemberId);

  const matchingIds = useMemo(() => {
    if (!query.trim()) return null;
    const term = query.toLowerCase();
    return new Set(members.filter((member) => memberMatchesTerm(member, term)).map((member) => member.id));
  }, [members, query]);

  const focusIds = useMemo(() => {
    if (focusMode === "all") return matchingIds;
    const base = new Set<string>([activeFocusMemberId]);
    if (focusMode === "descendants") getDescendantIds(activeFocusMemberId, members).forEach((id) => base.add(id));
    if (focusMode === "ancestors") getAncestorIds(activeFocusMemberId, members).forEach((id) => base.add(id));
    if (focusMode === "nuclear") {
      const member = memberMap[activeFocusMemberId];
      member?.spouseIds.forEach((id) => base.add(id));
      member?.formerSpouseIds.forEach((id) => base.add(id));
      member?.childrenIds.forEach((id) => base.add(id));
      if (member?.fatherId) base.add(member.fatherId);
      if (member?.motherId) base.add(member.motherId);
      member?.siblingIds.forEach((id) => base.add(id));
    }
    if (matchingIds) return new Set([...base].filter((id) => matchingIds.has(id)));
    return base;
  }, [activeFocusMemberId, focusMode, matchingIds, memberMap, members]);

  const focusCanvasOnMember = useCallback(
    (memberId: string) => {
      const viewport = viewportRef.current;
      const position = memberCanvasPositions.get(memberId);
      if (!viewport || !position) return;

      const nodeCenterX = position.x + position.width / 2;
      const nodeCenterY = position.y + position.height / 2;
      const nextPan = clampPan(
        {
          x: viewport.clientWidth / 2 - nodeCenterX * zoom,
          y: viewport.clientHeight / 2 - nodeCenterY * zoom,
        },
        zoom,
      );
      setPan(nextPan);

      if (pulseTimerRef.current) globalThis.clearTimeout(pulseTimerRef.current);
      setPulseMemberId(memberId);
      pulseTimerRef.current = globalThis.setTimeout(() => setPulseMemberId(null), 2100);
    },
    [clampPan, memberCanvasPositions, setPan, viewportRef, zoom],
  );

  const focusCanvasOnMembers = useCallback(
    (memberIds: string[], zoomLevel = Math.min(0.86, Math.max(MIN_TREE_ZOOM, zoom))) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const positions = memberIds.map((memberId) => memberCanvasPositions.get(memberId)).filter(Boolean) as {
        x: number;
        y: number;
        width: number;
        height: number;
      }[];
      if (!positions.length) return;

      const left = Math.min(...positions.map((position) => position.x));
      const right = Math.max(...positions.map((position) => position.x + position.width));
      const top = Math.min(...positions.map((position) => position.y));
      const bottom = Math.max(...positions.map((position) => position.y + position.height));
      const boxWidth = Math.max(TREE_NODE_WIDTH, right - left);
      const boxHeight = Math.max(TREE_NODE_HEIGHT, bottom - top);
      const fitZoom = clampNumber(
        Math.min((viewport.clientWidth - 96) / boxWidth, (viewport.clientHeight - 120) / boxHeight, zoomLevel),
        MIN_TREE_ZOOM,
        MAX_TREE_ZOOM,
      );

      setFocusMode("all");
      setZoom(fitZoom);
      setPan(
        clampPan(
          {
            x: viewport.clientWidth / 2 - (left + boxWidth / 2) * fitZoom,
            y: viewport.clientHeight / 2 - (top + boxHeight / 2) * fitZoom,
          },
          fitZoom,
        ),
      );

      if (pulseTimerRef.current) globalThis.clearTimeout(pulseTimerRef.current);
      setPulseMemberId(memberIds[0] ?? null);
      pulseTimerRef.current = globalThis.setTimeout(() => setPulseMemberId(null), 1800);
    },
    [clampPan, memberCanvasPositions, setPan, setZoom, viewportRef, zoom],
  );

  // Suppress unused-variable warning for viewportSize — it's part of the public API
  // and may be used by callers to trigger re-renders when the viewport changes.
  void viewportSize;

  return {
    query,
    focusMode,
    focusMemberId,
    pulseMemberId,
    activeFocusMemberId,
    matchingIds,
    focusIds,
    setQuery,
    setFocusMode,
    setFocusMemberId,
    setPulseMemberId,
    focusCanvasOnMember,
    focusCanvasOnMembers,
  };
}
