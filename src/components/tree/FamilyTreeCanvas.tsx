import { AnimatePresence, motion } from "framer-motion";
import { Eye, Maximize2, Network, RotateCcw, Search, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent, PointerEvent, Touch, TouchEvent, WheelEvent } from "react";
import { TREE_NODE_HEIGHT, TREE_NODE_WIDTH, TREE_SPOUSE_GAP } from "../../constants/treeLayout";
import { familyConfig } from "../../config";
import { useSpaceStore } from "../../hooks/useSpaceStore";
import type { FamilyMember } from "../../types/family";
import type { FocusMode } from "../../types/tree";
import { getAncestorIds, getDescendantIds, memberById } from "../../utils/family";
import { buildTreeLayout } from "../../utils/treeLayout";
import { DropdownSelect } from "../ui";
import { AutoGenerationTree } from "./AutoGenerationTree";
import { BranchSummaryCard } from "./BranchSummaryCard";
import { FocusSearchCombobox, memberMatchesTerm } from "./FocusSearchCombobox";
import { MiniMap } from "./MiniMap";
import { TreeControls } from "./TreeControls";

const DEFAULT_TREE_ZOOM = familyConfig.tree.defaultZoom;
const MIN_TREE_ZOOM = familyConfig.tree.minZoom;
const MAX_TREE_ZOOM = familyConfig.tree.maxZoom;
const TREE_HOME_MEMBER_ID = familyConfig.site.homeMemberId;
const PAN_EDGE_PADDING = 24;

const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const touchPoint = (touch: Touch) => ({ x: touch.clientX, y: touch.clientY });

const distanceBetween = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const midpointBetween = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

export const FamilyTreeCanvas = ({
  members,
  highlightMemberIds = [],
  relationshipEndpointIds,
  onSelectMember,
}: {
  members: FamilyMember[];
  highlightMemberIds?: string[];
  relationshipEndpointIds?: { startId?: string; targetId?: string };
  onSelectMember: (member: FamilyMember) => void;
}) => {
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(DEFAULT_TREE_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isTouchGestureActive, setIsTouchGestureActive] = useState(false);
  const [pulseMemberId, setPulseMemberId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<FocusMode>("all");
  const [focusMemberId, setFocusMemberId] = useState(TREE_HOME_MEMBER_ID);
  const [activeBranch, setActiveBranch] = useState("all");

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pulseTimerRef = useRef<number | null>(null);
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

  const { families } = useSpaceStore();
  const memberMap = useMemo(() => memberById(members), [members]);
  const highlightIds = useMemo(
    () => new Set(highlightMemberIds.filter((id) => memberMap[id])),
    [highlightMemberIds, memberMap],
  );
  const pathOrderByMemberId = useMemo(
    () => new Map(highlightMemberIds.map((id, index) => [id, index + 1] as const).filter(([id]) => memberMap[id])),
    [highlightMemberIds, memberMap],
  );
  const relationshipMode = highlightIds.size > 0;
  const branchOptions = useMemo(
    () => Array.from(new Set(members.map((member) => member.familyBranch).filter(Boolean))).sort(),
    [members],
  );
  const branchSelectOptions = useMemo(
    () => [
      { value: "all", label: "All branches" },
      ...branchOptions.map((branch) => ({ value: branch, label: branch })),
    ],
    [branchOptions],
  );
  const visibleTreeMembers = useMemo(
    () => (activeBranch === "all" ? members : members.filter((member) => member.familyBranch === activeBranch)),
    [activeBranch, members],
  );

  const layout = useMemo(
    () => buildTreeLayout(visibleTreeMembers, memberMap, families),
    [families, memberMap, visibleTreeMembers],
  );

  const branchHomeMemberId = useMemo(() => {
    const visibleIds = new Set(visibleTreeMembers.map((member) => member.id));

    if (visibleIds.has(TREE_HOME_MEMBER_ID)) return TREE_HOME_MEMBER_ID;
    return visibleTreeMembers[0]?.id ?? TREE_HOME_MEMBER_ID;
  }, [visibleTreeMembers]);

  const memberCanvasPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number; width: number; height: number }>();
    layout.units.forEach((unit) => {
      unit.members.forEach((member, index) => {
        positions.set(member.id, {
          x: unit.x + index * (TREE_NODE_WIDTH + TREE_SPOUSE_GAP),
          y: unit.y,
          width: TREE_NODE_WIDTH,
          height: TREE_NODE_HEIGHT,
        });
      });
    });
    return positions;
  }, [layout]);

  const focusOptions = visibleTreeMembers.length ? visibleTreeMembers : members;
  const activeFocusMemberId = focusOptions.some((member) => member.id === focusMemberId)
    ? focusMemberId
    : focusOptions[0]?.id ?? focusMemberId;

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
    [layout.height, layout.width, viewportSize.width, viewportSize.height],
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
    [clampPan, memberCanvasPositions, viewportSize.height, viewportSize.width],
  );

  const focusCanvasOnMember = useCallback(
    (memberId: string) => {
      const nextPan = panForMember(memberId, zoom);
      if (!nextPan) return;
      setPan(nextPan);

      if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
      setPulseMemberId(memberId);
      pulseTimerRef.current = window.setTimeout(() => setPulseMemberId(null), 2100);
    },
    [panForMember, zoom],
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

      if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
      setPulseMemberId(memberIds[0] ?? null);
      pulseTimerRef.current = window.setTimeout(() => setPulseMemberId(null), 1800);
    },
    [clampPan, memberCanvasPositions, zoom],
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

  useEffect(
    () => () => {
      if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
    },
    [],
  );

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
  }, []);

  useEffect(() => {
    if (!viewportSize.width || !viewportSize.height) return;
    if (!memberCanvasPositions.has(branchHomeMemberId)) return;

    if (isAwayFromHome) return;

    const nextPan = panForMember(branchHomeMemberId, DEFAULT_TREE_ZOOM);
    if (!nextPan) return;

    setQuery("");
    setFocusMode("all");
    setPulseMemberId(null);
    setFocusMemberId(branchHomeMemberId);
    setZoom(DEFAULT_TREE_ZOOM);
    setPan(nextPan);
  }, [
    branchHomeMemberId,
    layout.height,
    layout.width,
    memberCanvasPositions,
    panForMember,
    viewportSize.height,
    viewportSize.width,
    isAwayFromHome,
  ]);

  useEffect(() => {
    if (!relationshipMode || !viewportSize.width || !viewportSize.height) return;
    focusCanvasOnMembers(highlightMemberIds);
  }, [focusCanvasOnMembers, highlightMemberIds, relationshipMode, viewportSize.height, viewportSize.width]);

  const updateZoom = (nextZoom: number) => {
    const clampedZoom = clampNumber(nextZoom, MIN_TREE_ZOOM, MAX_TREE_ZOOM);
    setZoom(clampedZoom);
    setPan((current) => clampPan(current, clampedZoom));
  };

  const returnToHome = () => {
    const nextPan = panForMember(branchHomeMemberId, DEFAULT_TREE_ZOOM) ?? homePan;
    setZoom(DEFAULT_TREE_ZOOM);
    setPan(nextPan);
    setFocusMemberId(branchHomeMemberId);
    setPulseMemberId(null);
  };

  const handleMiniMapJump = (point: { x: number; y: number }) => {
    setPan(
      clampPan(
        {
          x: viewportSize.width / 2 - point.x * zoom,
          y: viewportSize.height / 2 - point.y * zoom,
        },
        zoom,
      ),
    );
  };

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

    // Combine pinch-zoom with two-finger pan
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

  const shouldIgnoreCanvasPan = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    Boolean(target.closest("a, button, input, select, textarea, [data-no-canvas-pan='true']"));

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
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
    pointerDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
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

  const handleSelect = (member: FamilyMember) => {
    setFocusMemberId(member.id);
    setFocusMode("all");
    focusCanvasOnMember(member.id);
    onSelectMember(member);
  };

  const handleFocusResultChange = (memberId: string) => {
    if (!memberId) return;
    setFocusMemberId(memberId);
    focusCanvasOnMember(memberId);
  };

  return (
    <div className="grid min-w-0 gap-4">
      <div className="min-w-0 rounded-[1.5rem] border border-white/75 bg-surface/95 p-3 shadow-warm ring-1 ring-border-soft/60 sm:rounded-[1.8rem] sm:p-4">
        <div className="mb-4 grid gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold text-text-primary">Family Tree Canvas</h2>
              <p className="mt-1 text-sm leading-6 text-text-muted">
                Search, filter, then focus the tree around the relationship path.
              </p>
            </div>
            <TreeControls
              zoom={zoom}
              onZoomIn={() => updateZoom(zoom + 0.1)}
              onZoomOut={() => updateZoom(zoom - 0.1)}
              onReset={() => {
                returnToHome();
                setFocusMode("all");
                setQuery("");
              }}
            />
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_240px]">
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-text-primary">
                <Search className="h-4 w-4 text-sage-green" strokeWidth={1.8} />
                Search family member
              </p>
              <FocusSearchCombobox
                members={focusOptions}
                query={query}
                selectedId={activeFocusMemberId}
                onQueryChange={setQuery}
                onSelect={handleFocusResultChange}
              />
            </div>
            <DropdownSelect
              label="Branch filter"
              value={activeBranch}
              options={branchSelectOptions}
              onChange={(value) => {
                setActiveBranch(value);
                setQuery("");
                setFocusMode("all");
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
            {(
              [
                ["all", relationshipMode ? "Focus path" : "Full tree", Maximize2],
                ["descendants", "Descendants", Network],
                ["ancestors", "Ancestors", Eye],
                ["nuclear", "Close family", Users],
              ] as const
            ).map(([mode, label, Icon]) => (
              <button
                key={mode as string}
                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl px-3 text-center text-sm font-semibold transition active:translate-y-[1px] ${
                  focusMode === mode
                    ? "bg-dark-green text-white shadow-soft"
                    : "bg-surface-soft/80 text-text-primary hover:bg-soft-gold/20"
                }`}
                onClick={() => {
                  setFocusMode(mode);
                  if (mode === "all" && relationshipMode) focusCanvasOnMembers(highlightMemberIds);
                }}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                <span className="line-clamp-1">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          ref={viewportRef}
          className="tree-scroll archive-grid relative h-[68vh] min-h-[430px] max-h-[720px] touch-none select-none overflow-hidden rounded-[1.25rem] border border-border-soft/75 bg-[linear-gradient(135deg,hsl(var(--surface-soft)_/_0.72),hsl(var(--background)))] p-3 sm:h-[70vh] sm:rounded-[1.45rem] sm:p-5 xl:h-[720px]"
          onClickCapture={handleCanvasClickCapture}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onWheel={handleWheel}
        >
          <motion.div
            animate={{ x: pan.x, y: pan.y, scale: zoom }}
            transition={{ type: "spring", stiffness: 95, damping: 24 }}
            style={{ transformOrigin: "top left" }}
          >
            <AnimatePresence>
              <AutoGenerationTree
                layout={layout}
                focusIds={focusIds}
                highlightIds={highlightIds}
                pathOrderByMemberId={pathOrderByMemberId}
                endpointIds={relationshipEndpointIds}
                pulseMemberId={pulseMemberId}
                onSelect={handleSelect}
              />
            </AnimatePresence>
          </motion.div>
          {familyConfig.features.minimap && <MiniMap layout={layout} pan={pan} zoom={zoom} viewportSize={viewportSize} onJump={handleMiniMapJump} />}
          {relationshipMode && (
            <div className="absolute left-4 top-4 z-[4] rounded-[1.1rem] border border-border-soft/80 bg-surface/95 p-3 text-xs font-bold text-text-primary shadow-warm ring-1 ring-white/80">
              <p className="mb-2 text-[0.64rem] font-extrabold uppercase tracking-[0.16em] text-text-muted">Relationship legend</p>
              <div className="grid gap-2">
                <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-dark-green" />Start person</span>
                <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-soft-gold" />Relationship path</span>
                <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full border-2 border-soft-gold bg-dark-green" />Target person</span>
                <span className="flex items-center gap-2 text-text-muted"><i className="h-3 w-3 rounded-full bg-border-soft" />Other members</span>
              </div>
            </div>
          )}
          {isAwayFromHome && (
            <motion.button
              data-no-canvas-pan="true"
              aria-label="Return to the center of the family tree"
              className="absolute bottom-[6.25rem] right-4 z-[3] inline-flex min-h-11 items-center gap-2 rounded-2xl border border-border-soft bg-surface/95 px-4 text-sm font-bold text-text-primary shadow-warm backdrop-blur transition hover:bg-surface-soft active:translate-y-[1px]"
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              type="button"
              onClick={returnToHome}
            >
              <RotateCcw className="h-4 w-4 text-sage-green" strokeWidth={1.8} />
              {relationshipMode ? "Focus path" : "Recenter"}
            </motion.button>
          )}
        </div>
      </div>

      <BranchSummaryCard branchName={activeBranch === "all" ? "All branches" : activeBranch} members={visibleTreeMembers} />
    </div>
  );
};
