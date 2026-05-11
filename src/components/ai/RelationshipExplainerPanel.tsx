import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Clipboard,
  Network,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { iconStroke } from "../ui";
import type { FamilyMember } from "../../types/family";
import { useAIDraft } from "../../hooks/useAIDraft";
import { useRoleGate, type Role } from "../../hooks/useRoleGate";
import { useAIStudioDeepLink } from "../../hooks/useAIStudioDeepLink";
import {
  AIDraftResultCard,
  ReadableBody,
  AIDraftSkeleton,
  AIErrorState,
  buildClipboardPayload,
  buildRelationshipExplainBody,
  type NormalizeFallbacks,
  type RelationshipExplainRequest,
} from "./index";
import { normalizeAIResponse } from "./normalizeAIResponse";
import { RelationshipPathVisualization } from "./RelationshipPathVisualization";
import { apiErrorMessage, spaceFetch } from "../../lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RelationshipExplainerPanelProps {
  members: FamilyMember[];
  spaceSlug: string;
  role: Role | null;
  panelId: string;
  initialFromId?: string;
  initialToId?: string;
  onPathChange?: (pathIds: string[], fromId: string, toId: string) => void;
  addToast: (message: string, tone?: "success" | "warning" | "info" | "error") => void;
}

// ---------------------------------------------------------------------------
// Inline SearchableMemberSelect (dark variant, self-contained)
// ---------------------------------------------------------------------------

const memberDisplayName = (member: FamilyMember) =>
  member.displayName || member.fullName;

const memberMatchesSearch = (member: FamilyMember, query: string) =>
  [member.fullName, member.displayName, member.familyBranch, member.relationshipToRoot, member.statusLabel]
    .join(" ")
    .toLowerCase()
    .includes(query.trim().toLowerCase());

function SearchableMemberSelect({
  label,
  value,
  members,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  members: FamilyMember[];
  onChange: (memberId: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedMember = members.find((m) => m.id === value);
  const filtered = query.trim()
    ? members.filter((m) => memberMatchesSearch(m, query))
    : members;

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/82">
        {label}
      </span>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/56"
          strokeWidth={iconStroke}
        />
        <input
          disabled={disabled}
          className="min-h-12 w-full rounded-2xl border border-white/28 bg-white/12 py-3 pl-10 pr-20 text-sm font-bold text-white shadow-soft outline-none transition placeholder:text-white/58 hover:border-white/46 hover:bg-white/16 focus:border-white/58 focus:bg-white/18 focus:ring-4 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          placeholder={selectedMember ? memberDisplayName(selectedMember) : "Search member"}
          value={open ? query : ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => !disabled && setOpen(true)}
        />
        {!open && selectedMember && (
          <span className="pointer-events-none absolute left-10 right-20 top-1/2 -translate-y-1/2 truncate text-sm font-bold text-white">
            {memberDisplayName(selectedMember)}
          </span>
        )}
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {query && open && (
            <button
              aria-label={`Clear ${label} search`}
              className="grid h-8 w-8 place-items-center rounded-xl text-white/70 transition hover:bg-white/12 hover:text-white active:translate-y-[1px]"
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(true);
              }}
            >
              <X className="h-4 w-4" strokeWidth={iconStroke} />
            </button>
          )}
          <button
            aria-label={`Open ${label} options`}
            className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white/72 transition hover:bg-white/16 hover:text-white active:translate-y-[1px]"
            type="button"
            onClick={() => !disabled && setOpen((v) => !v)}
          >
            <ChevronDown
              className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
              strokeWidth={iconStroke}
            />
          </button>
        </div>
      </div>

      {open && !disabled && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="dropdown-scroll absolute left-0 right-0 top-[calc(100%+0.55rem)] z-[32] max-h-72 overflow-y-auto rounded-[1.2rem] border border-white/14 bg-[hsl(var(--dark-green))] p-2 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.62)] ring-1 ring-white/10"
        >
          <div className="mb-1 flex items-center justify-between gap-3 px-2 py-2">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-white/58">
              {filtered.length ? `${filtered.length} results` : "No results"}
            </span>
          </div>
          {filtered.length ? (
            filtered.slice(0, 24).map((member) => {
              const selected = member.id === value;
              return (
                <button
                  key={member.id}
                  className={`grid min-h-12 w-full grid-cols-[minmax(0,1fr)_22px] items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm transition active:translate-y-[1px] ${
                    selected
                      ? "bg-white font-extrabold text-dark-green"
                      : "font-bold text-white hover:bg-white/10"
                  }`}
                  type="button"
                  onClick={() => {
                    onChange(member.id);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{memberDisplayName(member)}</span>
                    <span
                      className={`mt-0.5 block truncate text-xs ${
                        selected ? "text-dark-green/68" : "text-white/58"
                      }`}
                    >
                      {member.familyBranch}
                    </span>
                  </span>
                  {selected && <Check className="h-4 w-4" strokeWidth={2} />}
                </button>
              );
            })
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-extrabold text-white">No member found</p>
              <p className="mt-1 text-xs font-bold leading-5 text-white/60">
                Try another name or family branch.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

const SAME_MEMBER_MESSAGE =
  "Pick two different members to explain a relationship";

const FALLBACKS: NormalizeFallbacks = {
  privacy: "This explanation only uses data inside this FamilySpace.",
  fallbackNote:
    "Explanation derived deterministically from the archive relationship graph.",
};

type RelationshipHistoryItem = {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  relationshipLabel: string;
  explanation: string;
  pathMemberIds: string[];
  confidence: "high" | "medium" | "low";
  source: "ai" | "deterministic";
  fallbackNote: string;
  updatedAt: string;
  viewCount: number;
};

const formatHistoryDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function RelationshipExplainerPanel({
  members,
  spaceSlug,
  role,
  panelId,
  initialFromId,
  initialToId,
  onPathChange,
  addToast,
}: RelationshipExplainerPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  useAIStudioDeepLink("relationship", panelRef);

  const permissions = useRoleGate(role);
  const memberOptions = useMemo(
    () => [...members].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [members],
  );

  const [fromMemberId, setFromMemberId] = useState(
    initialFromId || memberOptions[0]?.id || "",
  );
  const [toMemberId, setToMemberId] = useState(
    initialToId ||
      memberOptions.find((m) => m.id !== (initialFromId || memberOptions[0]?.id))?.id ||
      "",
  );
  const [sameMemberWarning, setSameMemberWarning] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyItems, setHistoryItems] = useState<RelationshipHistoryItem[]>([]);
  const [selectedHistoryEnvelope, setSelectedHistoryEnvelope] = useState<ReturnType<typeof normalizeAIResponse> | null>(null);

  const {
    status,
    envelope,
    error,
    isBusy,
    generate,
    reset,
  } = useAIDraft<RelationshipExplainRequest>(spaceSlug, {
    kind: "relationship",
    endpoint: "/ai/explain-relationship",
    buildBody: buildRelationshipExplainBody,
    fallbacks: FALLBACKS,
  });

  // Same-member short-circuit (Property 7 / Requirement 12).
  const handleExplain = useCallback(() => {
    if (fromMemberId === toMemberId) {
      setSameMemberWarning(true);
      return;
    }
    setSelectedHistoryEnvelope(null);
    setSameMemberWarning(false);
    void generate({ fromMemberId, toMemberId });
  }, [fromMemberId, toMemberId, generate]);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members],
  );

  const activeEnvelope = selectedHistoryEnvelope ?? envelope;

  const handleReset = useCallback(() => {
    reset();
    setFromMemberId("");
    setToMemberId("");
    setSelectedHistoryEnvelope(null);
    setSameMemberWarning(false);
    onPathChange?.([], "", "");
  }, [reset, onPathChange]);

  const handleOpenHistory = useCallback(async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const response = await spaceFetch(spaceSlug, "/ai/relationship-history");
      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, "Failed to load relationship history."));
      }
      const data = (await response.json()) as RelationshipHistoryItem[];
      setHistoryItems(data);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Failed to load relationship history.");
    } finally {
      setHistoryLoading(false);
    }
  }, [spaceSlug]);

  const handleSelectHistory = useCallback((item: RelationshipHistoryItem) => {
    const path = item.pathMemberIds
      .map((id) => {
        const member = memberMap.get(id);
        if (!member) return null;
        return { id, name: memberDisplayName(member) };
      })
      .filter((step): step is { id: string; name: string } => step !== null);

    const nextEnvelope = normalizeAIResponse(
      {
        relationshipLabel: item.relationshipLabel,
        explanation: item.explanation,
        path,
        confidence: item.confidence,
        fallbackNote: item.fallbackNote,
        source: item.source,
        cached: true,
        historyId: item.id,
      },
      { kind: "relationship" },
      FALLBACKS,
    );

    reset();
    setFromMemberId(item.fromMemberId);
    setToMemberId(item.toMemberId);
    setSameMemberWarning(false);
    setSelectedHistoryEnvelope(nextEnvelope);
    setHistoryOpen(false);
    onPathChange?.(path.map((step) => step.id), item.fromMemberId, item.toMemberId);
  }, [memberMap, reset, onPathChange]);

  // Sync path back to parent (Property 15 / Requirement 14).
  useEffect(() => {
    if (status === "ready" && envelope?.path && !selectedHistoryEnvelope) {
      const pathIds = envelope.path.map((step) => step.id);
      onPathChange?.(pathIds, fromMemberId, toMemberId);
    }
  }, [status, envelope, selectedHistoryEnvelope, fromMemberId, toMemberId, onPathChange]);

  const handleCopy = useCallback(async () => {
    if (!activeEnvelope) return;
    const payload = buildClipboardPayload(activeEnvelope, activeEnvelope.relationshipLabel);
    try {
      await navigator.clipboard.writeText(payload);
      addToast("Copied to clipboard", "success");
    } catch {
      addToast("Clipboard access was blocked", "error");
    }
  }, [activeEnvelope, addToast]);

  const handleFromChange = (id: string) => {
    setFromMemberId(id);
    setSameMemberWarning(false);
    setSelectedHistoryEnvelope(null);
    reset();
    onPathChange?.([], "", "");
  };

  const handleToChange = (id: string) => {
    setToMemberId(id);
    setSameMemberWarning(false);
    setSelectedHistoryEnvelope(null);
    reset();
    onPathChange?.([], "", "");
  };

  const isNotFound =
    activeEnvelope?.relationshipLabel?.toLowerCase() === "relationship not found";
  const personA = memberMap.get(fromMemberId);
  const personB = memberMap.get(toMemberId);

  // Derive step roles from the member graph for the path visualization.
  const pathRoles = useMemo(() => {
    if (!activeEnvelope?.path) return [];
    return activeEnvelope.path.map((step, index, arr) => {
      const next = arr[index + 1];
      if (!next) return index === 0 ? "Start" : "Target";
      const member = memberMap.get(step.id);
      const nextMember = memberMap.get(next.id);
      if (!member || !nextMember) return "";
      if (member.fatherId === nextMember.id || member.motherId === nextMember.id)
        return `child of ${next.name}`;
      if (nextMember.fatherId === member.id || nextMember.motherId === member.id)
        return `parent of ${next.name}`;
      if (member.spouseIds.includes(nextMember.id) || nextMember.spouseIds.includes(member.id))
        return `spouse of ${next.name}`;
      if (member.siblingIds.includes(nextMember.id) || nextMember.siblingIds.includes(member.id))
        return `sibling of ${next.name}`;
      return `connected to ${next.name}`;
    });
  }, [activeEnvelope?.path, memberMap]);

  // Action buttons for the result card.
  const renderActions = () => {
    if (!activeEnvelope) return null;
    return (
      <>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-white/22 bg-white/12 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/18 active:translate-y-[1px] active:scale-[0.98]"
        >
          <Clipboard className="h-4 w-4" strokeWidth={iconStroke} />
          Copy
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={handleReset}
          className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-white/22 bg-white/12 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/18 active:translate-y-[1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={iconStroke} />
          Reset
        </button>
      </>
    );
  };

  return (
    <section
      ref={panelRef}
      id={panelId}
      tabIndex={-1}
      aria-label="AI Relationship Explainer"
      className="relative overflow-visible rounded-[1.7rem] bg-dark-green/12 p-1.5 shadow-[0_28px_90px_-46px_rgba(45,68,43,0.86)] ring-1 ring-dark-green/15"
    >
      <div className="relative overflow-visible rounded-[1.35rem] border border-white/12 bg-[linear-gradient(145deg,hsl(var(--dark-green))_0%,hsl(85_20%_31%)_58%,hsl(var(--warm-brown))_135%)] px-4 py-5 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.16)] sm:px-5 sm:py-6">
        <div className="pointer-events-none absolute inset-0 archive-grid opacity-[0.08]" />
        <div className="relative flex flex-col gap-5">
          {/* Header */}
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-white/78">
              AI Relationship Explainer
            </p>
            <h2 className="mt-2 text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">
              Ask how two family members are related.
            </h2>
          </div>

          {/* Member pickers */}
          <div className="grid gap-3">
            <SearchableMemberSelect
              label="From"
              value={fromMemberId}
              members={memberOptions}
              onChange={handleFromChange}
              disabled={!permissions.canGenerate}
            />
            <SearchableMemberSelect
              label="To"
              value={toMemberId}
              members={memberOptions}
              onChange={handleToChange}
              disabled={!permissions.canGenerate}
            />
          </div>

          {/* Primary action */}
          <button
            type="button"
            disabled={
              isBusy ||
              !permissions.canGenerate ||
              !fromMemberId ||
              !toMemberId
            }
            title={!permissions.canGenerate ? "Owner or admin access required" : undefined}
            onClick={handleExplain}
            className="group flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-white/35 bg-white px-4 text-sm font-extrabold text-dark-green shadow-[0_20px_42px_-28px_rgba(255,255,255,0.86)] transition hover:-translate-y-0.5 hover:bg-soft-gold active:translate-y-[1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-dark-green/10 text-dark-green transition group-hover:bg-white/55">
              <Network className="h-4 w-4" strokeWidth={iconStroke} />
            </span>
            <span>Explain relationship</span>
          </button>

          <button
            type="button"
            onClick={() => void handleOpenHistory()}
            disabled={historyLoading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/22 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/16 active:translate-y-[1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            View History
          </button>

          {/* Role-gating banner for member role */}
          {!permissions.canGenerate && (
            <p className="rounded-[1rem] border border-white/12 bg-white/8 px-3 py-2.5 text-xs font-semibold leading-5 text-white/78">
              This FamilySpace is read-only for your role. Owners and admins can
              generate AI explanations.
            </p>
          )}

          {/* Same-member short-circuit (Property 7 / Requirement 12) */}
          {sameMemberWarning && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 rounded-[1rem] border border-warning/30 bg-warning/18 p-3 text-sm font-bold leading-6 text-white"
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-soft-gold"
                strokeWidth={iconStroke}
              />
              {SAME_MEMBER_MESSAGE}
            </motion.p>
          )}

          {/* Loading skeleton */}
          {status === "loading" && <AIDraftSkeleton variant="on-dark" />}

          {/* Error state */}
          {status === "error" && error && (
            <AIErrorState
              message={error}
              onRetry={handleExplain}
              variant="on-dark"
              disabled={isBusy}
            />
          )}

          {/* Result card */}
          <AnimatePresence mode="wait">
            {activeEnvelope && status !== "loading" && !sameMemberWarning && (
              <AIDraftResultCard
                key={activeEnvelope.historyId || "result"}
                envelope={activeEnvelope}
                variant="on-dark"
                body={
                  isNotFound ? (
                    <div className="flex flex-col gap-3">
                      <p className="flex items-start gap-2 text-sm font-bold leading-6 text-white">
                        <AlertTriangle
                          className="mt-0.5 h-4 w-4 shrink-0 text-soft-gold"
                          strokeWidth={iconStroke}
                        />
                        No clear relationship path found between{" "}
                        {personA ? memberDisplayName(personA) : "Person A"} and{" "}
                        {personB ? memberDisplayName(personB) : "Person B"}.
                      </p>
                      <ul className="grid gap-1 pl-6 text-xs font-semibold leading-5 text-white/82">
                        <li className="list-disc">Add parent or child links.</li>
                        <li className="list-disc">Add spouse or sibling links.</li>
                        <li className="list-disc">Try another branch.</li>
                      </ul>
                    </div>
                      ) : (
                    <div className="flex flex-col gap-3">
                      {activeEnvelope.relationshipLabel && (
                        <h3 className="text-xl font-extrabold capitalize leading-tight text-white">
                          {activeEnvelope.relationshipLabel}
                        </h3>
                      )}
                      <ReadableBody text={activeEnvelope.body} variant="on-dark" />
                    </div>
                  )
                }
                afterBody={
                  !isNotFound && activeEnvelope.path && activeEnvelope.path.length > 0 ? (
                    <RelationshipPathVisualization
                      path={activeEnvelope.path}
                      roles={pathRoles}
                      variant="on-dark"
                    />
                  ) : undefined
                }
                actions={renderActions()}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {historyOpen && (
              <motion.div
                className="fixed inset-0 z-50 grid place-items-center bg-text-primary/38 px-4 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setHistoryOpen(false)}
              >
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="relationship-history-title"
                  className="dropdown-scroll max-h-[82vh] w-full max-w-2xl overflow-y-auto rounded-[1.8rem] border border-border-soft bg-surface p-5 text-text-primary shadow-warm ring-1 ring-white/70 sm:p-6"
                  initial={{ opacity: 0, y: 18, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 240, damping: 24 }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-sage-green">
                        Relationship history
                      </p>
                      <h3 id="relationship-history-title" className="mt-2 font-display text-2xl font-bold text-text-primary">
                        Previous explanations
                      </h3>
                    </div>
                    <button
                      type="button"
                      aria-label="Close relationship history"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-border-soft bg-background text-text-primary shadow-soft transition hover:bg-surface-soft active:translate-y-[1px]"
                      onClick={() => setHistoryOpen(false)}
                    >
                      <X className="h-4 w-4" strokeWidth={iconStroke} />
                    </button>
                  </div>

                  <div className="mt-5">
                    {historyLoading ? (
                      <div className="grid gap-3">
                        {["h1", "h2", "h3"].map((item) => (
                          <div key={item} className="animate-pulse rounded-[1.2rem] border border-border-soft bg-background p-4">
                            <div className="h-4 w-2/5 rounded-full bg-surface-soft" />
                            <div className="mt-3 h-5 w-3/4 rounded-full bg-surface-soft" />
                            <div className="mt-3 h-3 w-1/2 rounded-full bg-surface-soft" />
                          </div>
                        ))}
                      </div>
                    ) : historyError ? (
                      <p className="rounded-[1rem] border border-warning/25 bg-warning/10 px-4 py-3 text-sm font-bold text-warning">
                        {historyError}
                      </p>
                    ) : historyItems.length ? (
                      <div className="grid gap-3">
                        {historyItems.map((item) => {
                          const from = memberMap.get(item.fromMemberId);
                          const to = memberMap.get(item.toMemberId);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              className="rounded-[1.2rem] border border-border-soft bg-background p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:bg-surface-soft active:translate-y-[1px]"
                              onClick={() => handleSelectHistory(item)}
                            >
                              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-text-muted">
                                <span>{formatHistoryDate(item.updatedAt)}</span>
                                <span className="rounded-full border border-border-soft bg-surface px-2 py-0.5 capitalize">
                                  {item.source}
                                </span>
                              </div>
                              <p className="mt-2 text-sm font-extrabold text-text-primary">
                                {from ? memberDisplayName(from) : item.fromMemberId} {"->"} {to ? memberDisplayName(to) : item.toMemberId}
                              </p>
                              <p className="mt-1 text-sm font-semibold capitalize text-text-muted">
                                {item.relationshipLabel}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="rounded-[1rem] border border-border-soft bg-background px-4 py-5 text-center text-sm font-semibold text-text-muted">
                        No relationship history yet.
                      </p>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
