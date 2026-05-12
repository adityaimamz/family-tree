import { AnimatePresence, motion } from "framer-motion";
import { Eye, Maximize2, Network, RotateCcw, Search, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { TREE_NODE_HEIGHT, TREE_NODE_WIDTH, TREE_SPOUSE_GAP } from "../../constants/treeLayout";
import { useCanvasGestures } from "../../hooks/useCanvasGestures";
import { useCanvasPanZoom } from "../../hooks/useCanvasPanZoom";
import { useTreeFocus } from "../../hooks/useTreeFocus";
import { useSpaceStore } from "../../hooks/useSpaceStore";
import type { FamilyMember } from "../../types/family";
import { memberById } from "../../utils/family";
import { rootMemberIdFromData } from "../../utils/spaceDisplay";
import { buildTreeLayout } from "../../utils/treeLayout";
import { DropdownSelect } from "../ui";
import { AutoGenerationTree } from "./AutoGenerationTree";
import { BranchSummaryCard } from "./BranchSummaryCard";
import { FocusSearchCombobox } from "./FocusSearchCombobox";
import { MiniMap } from "./MiniMap";
import { TreeControls } from "./TreeControls";

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
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [activeBranch, setActiveBranch] = useState("all");

  const { branches, families } = useSpaceStore();
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
    const homeMemberId = rootMemberIdFromData(members, branches);
    if (homeMemberId && visibleIds.has(homeMemberId)) return homeMemberId;
    return rootMemberIdFromData(visibleTreeMembers, branches) || visibleTreeMembers[0]?.id || homeMemberId;
  }, [branches, members, visibleTreeMembers]);

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

  const {
    zoom, pan, viewportSize, isAwayFromHome,
    clampPan, updateZoom, returnToHome, handleMiniMapJump, panForMember,
    setPan, setZoom,
  } = useCanvasPanZoom({ layout, viewportRef, memberCanvasPositions, branchHomeMemberId });

  const {
    query, focusMode, pulseMemberId, activeFocusMemberId, focusIds,
    setQuery, setFocusMode, setFocusMemberId, setPulseMemberId,
    focusCanvasOnMember, focusCanvasOnMembers,
  } = useTreeFocus({
    members, visibleTreeMembers, memberMap, memberCanvasPositions,
    zoom, clampPan, setPan, setZoom, viewportRef, viewportSize,
  });

  const {
    handlePointerDown, handlePointerMove, handlePointerEnd,
    handleCanvasClickCapture,
    handleTouchStart, handleTouchMove, handleTouchEnd,
    handleWheel,
  } = useCanvasGestures({ pan, zoom, clampPan, setPan, setZoom, viewportRef, viewportSize });

  // Re-center on home when branchHomeMemberId or layout changes (if not away from home)
  useEffect(() => {
    if (!viewportSize.width || !viewportSize.height) return;
    if (!memberCanvasPositions.has(branchHomeMemberId)) return;
    if (isAwayFromHome) return;
    const nextPan = panForMember(branchHomeMemberId, 0.82);
    if (!nextPan) return;
    setQuery("");
    setFocusMode("all");
    setPulseMemberId(null);
    setFocusMemberId(branchHomeMemberId);
    setZoom(0.82);
    setPan(nextPan);
  }, [
    branchHomeMemberId, layout.height, layout.width, memberCanvasPositions,
    panForMember, viewportSize.height, viewportSize.width, isAwayFromHome,
    setQuery, setFocusMode, setPulseMemberId, setFocusMemberId, setZoom, setPan,
  ]);

  // Focus on relationship path when relationship mode activates
  useEffect(() => {
    if (!relationshipMode || !viewportSize.width || !viewportSize.height) return;
    focusCanvasOnMembers(highlightMemberIds);
  }, [focusCanvasOnMembers, highlightMemberIds, relationshipMode, viewportSize.height, viewportSize.width]);

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

  const focusOptions = visibleTreeMembers.length ? visibleTreeMembers : members;

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
                returnToHome(branchHomeMemberId);
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
          <MiniMap layout={layout} pan={pan} zoom={zoom} viewportSize={viewportSize} onJump={handleMiniMapJump} />
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
              onClick={returnToHome.bind(null, branchHomeMemberId)}
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
