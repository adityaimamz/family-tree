import { motion } from "framer-motion";
import { AlertTriangle, ArrowDown, Check, ChevronDown, Database, GitBranch, Info, Loader2, Network, RotateCcw, Route, Search, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { FamilyTreeCanvas } from "../components/FamilyTree";
import { MemberDetailModal } from "../components/MemberDetail";
import { PageShell, SectionHeader, iconStroke, pageTransition } from "../components/ui";
import { familyConfig } from "../config";
import { useSpaceStore } from "../hooks/useSpaceStore";
import { apiErrorMessage, spaceFetch } from "../lib/api";
import type { FamilyMember, RelationshipExplanation } from "../types/family";

const memberDisplayName = (member: FamilyMember) => member.displayName || member.fullName;

const memberMatchesSearch = (member: FamilyMember, query: string) =>
  [
    member.fullName,
    member.displayName,
    member.familyBranch,
    member.relationshipToRoot,
    member.statusLabel,
  ].join(" ").toLowerCase().includes(query.trim().toLowerCase());

const SearchableMemberSelect = ({
  label,
  value,
  members,
  onChange,
}: {
  label: string;
  value: string;
  members: FamilyMember[];
  onChange: (memberId: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedMember = members.find((member) => member.id === value);
  const filteredMembers = query.trim()
    ? members.filter((member) => memberMatchesSearch(member, query))
    : members;

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/82">{label}</span>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/56" strokeWidth={iconStroke} />
        <input
          className="min-h-12 w-full rounded-2xl border border-white/28 bg-white/12 py-3 pl-10 pr-20 text-sm font-bold text-white shadow-soft outline-none transition placeholder:text-white/58 hover:border-white/46 hover:bg-white/16 focus:border-white/58 focus:bg-white/18 focus:ring-4 focus:ring-white/10"
          placeholder={selectedMember ? memberDisplayName(selectedMember) : "Search member"}
          value={open ? query : ""}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
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
            onClick={() => setOpen((current) => !current)}
          >
            <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} strokeWidth={iconStroke} />
          </button>
        </div>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="dropdown-scroll absolute left-0 right-0 top-[calc(100%+0.55rem)] z-[32] max-h-72 overflow-y-auto rounded-[1.2rem] border border-white/14 bg-[hsl(var(--dark-green))] p-2 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.62)] ring-1 ring-white/10"
        >
          <div className="mb-1 flex items-center justify-between gap-3 px-2 py-2">
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-white/58">
              {filteredMembers.length ? `${filteredMembers.length} results` : "No results"}
            </span>
          </div>
          {filteredMembers.length ? (
            filteredMembers.slice(0, 24).map((member) => {
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
                    <span className={`mt-0.5 block truncate text-xs ${selected ? "text-dark-green/68" : "text-white/58"}`}>
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
              <p className="mt-1 text-xs font-bold leading-5 text-white/60">Try another name or family branch.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export const TreePage = () => {
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const { members, addToast } = useSpaceStore();
  const [selected, setSelected] = useState<FamilyMember | null>(null);
  const [fromMemberId, setFromMemberId] = useState("");
  const [toMemberId, setToMemberId] = useState("");
  const [relationship, setRelationship] = useState<RelationshipExplanation | null>(null);
  const [relationshipError, setRelationshipError] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);
  const [showFullRelationshipPath, setShowFullRelationshipPath] = useState(false);

  const memberOptions = useMemo(
    () => [...members].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [members],
  );
  const memberMap = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const relationshipPathIds = relationship
    ? relationship.pathMemberIds?.length
      ? relationship.pathMemberIds
      : relationship.path.map((item) => item.id)
    : [];
  const relationshipHasClearPath = Boolean(
    relationship &&
      relationship.relationshipLabel.toLowerCase() !== "relationship not found" &&
      relationship.confidence !== "low" &&
      relationshipPathIds.length > 1,
  );
  const selectedPathIds = relationshipHasClearPath ? relationshipPathIds : [];
  const personA = memberMap.get(fromMemberId);
  const personB = memberMap.get(toMemberId);
  const relationshipQuestion = personA && personB
    ? `How is ${personA.displayName || personA.fullName} related to ${personB.displayName || personB.fullName}?`
    : "Choose two family members to explain their relationship.";
  const confidenceCopy = {
    high: "High confidence means the path uses direct parent, child, spouse, or sibling links.",
    medium: "Medium confidence means the path is clear, but it may depend on inferred family links.",
    low: "Low confidence means the current records do not contain enough linked data.",
  } as const;
  const describeStepRole = (memberId: string, nextMemberId?: string, index?: number) => {
    const member = memberMap.get(memberId);
    const next = nextMemberId ? memberMap.get(nextMemberId) : null;
    if (!member || !next) {
      if (index === 0) return "Start person";
      return "Target person";
    }

    const memberName = member.displayName || member.fullName;
    const nextName = next.displayName || next.fullName;
    if (member.fatherId === next.id || member.motherId === next.id) return `child of ${nextName}`;
    if (next.fatherId === member.id || next.motherId === member.id) return `parent of ${nextName}`;
    if (member.spouseIds.includes(next.id) || next.spouseIds.includes(member.id)) return `spouse of ${nextName}`;
    if (member.formerSpouseIds.includes(next.id) || next.formerSpouseIds.includes(member.id)) return `former spouse of ${nextName}`;
    if (member.siblingIds.includes(next.id) || next.siblingIds.includes(member.id)) return `sibling of ${nextName}`;
    return `connected to ${nextName}`;
  };
  const relationTypeBetween = (memberId: string, nextMemberId?: string) => {
    const member = memberMap.get(memberId);
    const next = nextMemberId ? memberMap.get(nextMemberId) : null;
    if (!member || !next) return "linked";
    if (member.fatherId === next.id || member.motherId === next.id) return "child";
    if (next.fatherId === member.id || next.motherId === member.id) return "parent";
    if (member.spouseIds.includes(next.id) || next.spouseIds.includes(member.id)) return "spouse";
    if (member.formerSpouseIds.includes(next.id) || next.formerSpouseIds.includes(member.id)) return "former spouse";
    if (member.siblingIds.includes(next.id) || next.siblingIds.includes(member.id)) return "sibling";
    return "linked";
  };
  const relationshipPathSteps = relationship?.path.map((step, index, path) => ({
    ...step,
    role: describeStepRole(step.id, path[index + 1]?.id, index),
  })) ?? [];
  const relationshipLinkTypes = relationship?.path.slice(0, -1).map((step, index, path) => relationTypeBetween(step.id, path[index + 1]?.id)) ?? [];
  const relationshipTypesCopy = Array.from(new Set(relationshipLinkTypes)).join(", ");
  const pathIsLong = relationshipPathSteps.length > 5;
  const compactRelationshipPathSteps = pathIsLong && !showFullRelationshipPath
    ? [
        ...relationshipPathSteps.slice(0, 2),
        ...relationshipPathSteps.slice(-2),
      ]
    : relationshipPathSteps;
  const collapsedRelationshipCount = Math.max(0, relationshipPathSteps.length - compactRelationshipPathSteps.length);
  const relationshipPathMetadata = relationshipPathSteps.length
    ? `${relationshipPathSteps.length} people | ${Math.max(0, relationshipPathSteps.length - 1)} links${relationshipTypesCopy ? ` | ${relationshipTypesCopy} links` : ""}`
    : "";
  const branchCount = useMemo(
    () => new Set(members.map((member) => member.familyBranch).filter(Boolean)).size,
    [members],
  );
  const displayNameForMember = (member?: FamilyMember | null) => member?.displayName || member?.fullName || "";
  const inferRelationshipLabel = () => {
    if (!relationship || !relationshipHasClearPath) return relationship?.relationshipLabel ?? "";
    const currentLabel = relationship.relationshipLabel.toLowerCase();
    if (currentLabel !== "related family member") return relationship.relationshipLabel;

    const ids = relationshipPathIds;
    const [fromId, spouseOrSiblingId, parentId, targetId] = ids;
    const from = memberMap.get(fromId);
    const middleA = memberMap.get(spouseOrSiblingId);
    const middleB = memberMap.get(parentId);
    const target = memberMap.get(targetId);
    const spouseToSiblingToParent =
      from &&
      middleA &&
      middleB &&
      target &&
      (from.spouseIds.includes(middleA.id) || middleA.spouseIds.includes(from.id)) &&
      (middleA.siblingIds.includes(middleB.id) || middleB.siblingIds.includes(middleA.id)) &&
      (target.fatherId === middleB.id || target.motherId === middleB.id);

    if (spouseToSiblingToParent) {
      if (from.gender === "female") return "Aunt by marriage";
      if (from.gender === "male") return "Uncle by marriage";
      return "Aunt or uncle by marriage";
    }

    return "Connected through family links";
  };
  const displayRelationshipLabel = inferRelationshipLabel();
  const readableRelationshipExplanation = () => {
    if (!relationship || !relationshipHasClearPath) return relationship?.explanation ?? "";
    const currentLabel = relationship.relationshipLabel.toLowerCase();
    if (relationship.source === "ai" && currentLabel !== "related family member") return relationship.explanation;

    const fromName = displayNameForMember(personA) || relationship.path[0]?.name;
    const toName = displayNameForMember(personB) || relationship.path[relationship.path.length - 1]?.name;
    const connectors = relationship.path.slice(1, -1).map((step) => step.name);
    const intro = connectors.length
      ? `${fromName} is connected to ${toName} through ${connectors.join(" and ")}.`
      : `${fromName} is connected to ${toName}.`;
    const steps = relationshipPathSteps.slice(0, -1).map((step, index) => {
      const next = relationshipPathSteps[index + 1];
      if (!next) return "";
      if (step.role.startsWith("spouse of ")) return `${step.name} is ${step.role.replace("spouse of ", "")}'s spouse.`;
      if (step.role.startsWith("sibling of ")) return `${step.name} and ${step.role.replace("sibling of ", "")} are siblings.`;
      if (step.role.startsWith("parent of ")) return `${step.name} is ${step.role.replace("parent of ", "")}'s parent.`;
      if (step.role.startsWith("child of ")) return `${step.name} is ${step.role.replace("child of ", "")}'s child.`;
      return `${step.name} is ${step.role}.`;
    }).filter(Boolean);

    return [intro, ...steps].join(" ");
  };

  useEffect(() => {
    if (!memberOptions.length) return;
    setFromMemberId((current) => current || memberOptions[0]?.id || "");
    setToMemberId((current) => current || memberOptions.find((member) => member.id !== memberOptions[0]?.id)?.id || memberOptions[0]?.id || "");
  }, [memberOptions]);

  useEffect(() => {
    setShowFullRelationshipPath(false);
  }, [relationship?.pathMemberIds, relationship?.path]);

  const resetRelationshipExplorer = () => {
    setFromMemberId(memberOptions[0]?.id || "");
    setToMemberId(memberOptions.find((member) => member.id !== memberOptions[0]?.id)?.id || memberOptions[0]?.id || "");
    setRelationship(null);
    setRelationshipError("");
    setShowFullRelationshipPath(false);
    setIsExplaining(false);
  };

  const explainRelationship = async () => {
    if (!spaceSlug || !fromMemberId || !toMemberId) return;

    setIsExplaining(true);
    setRelationshipError("");
    setRelationship(null);
    setShowFullRelationshipPath(false);
    try {
      const response = await spaceFetch(spaceSlug, "/ai/explain-relationship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromMemberId, toMemberId }),
      });

      if (!response.ok) throw new Error(await apiErrorMessage(response, "Failed to explain relationship."));
      const result = (await response.json()) as RelationshipExplanation;
      setRelationship(result);
      if (result.relationshipLabel.toLowerCase() === "relationship not found") {
        addToast("No clear relationship path found using current FamilySpace data.", "warning");
      } else {
        addToast("Relationship explanation ready", "info");
      }
    } catch (error) {
      setRelationshipError("No clear relationship path found using current FamilySpace data.");
      addToast("No clear relationship path found using current FamilySpace data.", "error");
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader
          eyebrow="Family tree"
          title={`${familyConfig.site.familyName} Family Tree`}
          description="Explore relationships across generations and ask AI how two relatives are connected."
        />

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <FamilyTreeCanvas
              members={members}
              highlightMemberIds={selectedPathIds}
              relationshipEndpointIds={{ startId: fromMemberId, targetId: toMemberId }}
              onSelectMember={setSelected}
            />
          </div>

          <aside className="relative overflow-visible rounded-[1.7rem] bg-dark-green/12 p-1.5 shadow-[0_28px_90px_-46px_rgba(45,68,43,0.86)] ring-1 ring-dark-green/15 xl:sticky xl:top-6">
            <div className="relative overflow-visible rounded-[1.35rem] border border-white/12 bg-[linear-gradient(145deg,hsl(var(--dark-green))_0%,hsl(85_20%_31%)_58%,hsl(var(--warm-brown))_135%)] p-4 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.16)] sm:p-5">
            <div className="pointer-events-none absolute inset-0 archive-grid opacity-[0.08]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-white/78">AI Relationship Explainer</p>
                  <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-white">Ask how two family members are related.</h2>
                  <p className="mt-2 text-sm font-bold leading-6 text-white/78">{relationshipQuestion}</p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20">
                  <Sparkles className="h-5 w-5" strokeWidth={iconStroke} />
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                <SearchableMemberSelect
                  label="Person A"
                  value={fromMemberId}
                  members={memberOptions}
                  onChange={(value) => {
                    setFromMemberId(value);
                    setRelationship(null);
                    setRelationshipError("");
                    setShowFullRelationshipPath(false);
                  }}
                />
                <SearchableMemberSelect
                  label="Person B"
                  value={toMemberId}
                  members={memberOptions}
                  onChange={(value) => {
                    setToMemberId(value);
                    setRelationship(null);
                    setRelationshipError("");
                    setShowFullRelationshipPath(false);
                  }}
                />
                <div className="grid grid-cols-[minmax(0,1fr)_48px] gap-2">
                  <button
                    type="button"
                    disabled={isExplaining || !fromMemberId || !toMemberId}
                    className="group mt-1 flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-white/35 bg-white px-4 text-sm font-extrabold text-dark-green shadow-[0_20px_42px_-28px_rgba(255,255,255,0.86)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-soft-gold active:translate-y-[1px] disabled:cursor-wait disabled:border-white/25 disabled:bg-white disabled:text-dark-green disabled:opacity-95 disabled:shadow-[0_18px_36px_-28px_rgba(255,255,255,0.82)]"
                    onClick={() => void explainRelationship()}
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-dark-green/10 text-dark-green transition group-hover:translate-x-0.5 group-hover:bg-white/55">
                      {isExplaining ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={iconStroke} /> : <Network className="h-4 w-4" strokeWidth={iconStroke} />}
                    </span>
                    <span>{isExplaining ? "Generating relationship" : "Explain relationship"}</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Reset relationship explorer"
                    className="mt-1 grid min-h-12 place-items-center rounded-2xl border border-white/20 bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-white/16 active:translate-y-[1px]"
                    onClick={resetRelationshipExplorer}
                  >
                    <RotateCcw className="h-4 w-4" strokeWidth={iconStroke} />
                  </button>
                </div>
              </div>

              {relationshipError && (
                <div className="mt-4 rounded-[1.15rem] border border-warning/30 bg-warning/18 p-4">
                  <p className="flex items-start gap-2 text-sm font-bold leading-6 text-white">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-soft-gold" strokeWidth={iconStroke} />
                    {relationshipError}
                  </p>
                  <ul className="mt-3 grid gap-1 pl-6 text-xs font-semibold leading-5 text-white/82">
                    <li className="list-disc">Check parent links.</li>
                    <li className="list-disc">Add missing family members.</li>
                    <li className="list-disc">Try another branch.</li>
                  </ul>
                </div>
              )}

              {relationship && relationshipHasClearPath ? (
                <div className="mt-4 rounded-[1.2rem] border border-white/16 bg-[linear-gradient(155deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.16)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-soft-gold/35 bg-soft-gold/18 px-3 py-1 text-xs font-extrabold text-soft-gold">
                      Based on FamilySpace data
                    </span>
                    <span className="rounded-full border border-white/18 bg-white/12 px-3 py-1 text-xs font-extrabold text-white">
                      Confidence: {relationship.confidence}
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl font-extrabold capitalize leading-tight text-white">{displayRelationshipLabel}</h3>
                  <p className="mt-2 text-sm font-bold leading-6 text-white/92">{readableRelationshipExplanation()}</p>
                  <div className="mt-3 rounded-[1rem] border border-white/18 bg-white/12 p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/76">Relationship route</p>
                      <span className="rounded-full border border-white/14 bg-white/10 px-2.5 py-1 text-[0.68rem] font-extrabold text-white/78">
                        {relationshipPathMetadata}
                      </span>
                    </div>
                    {!showFullRelationshipPath && pathIsLong && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-sm font-extrabold text-white">
                        {compactRelationshipPathSteps.map((step, index) => {
                          const insertCollapse = index === 2 && collapsedRelationshipCount > 0;
                          return (
                            <span key={`${step.id}-compact-${index}`} className="contents">
                              {insertCollapse && (
                                <>
                                  <span className="text-white/36">-&gt;</span>
                                  <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-extrabold text-white/72">
                                    {collapsedRelationshipCount} more relatives
                                  </span>
                                </>
                              )}
                              {index > 0 && !insertCollapse && <span className="text-white/36">-&gt;</span>}
                              <span className={`max-w-[9.5rem] truncate rounded-full px-3 py-1 ${
                                index === 0 || index === compactRelationshipPathSteps.length - 1
                                  ? "bg-soft-gold text-text-primary"
                                  : "bg-white/14 text-white"
                              }`}>
                                {step.name}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {(!pathIsLong || showFullRelationshipPath) && (
                    <div className={`mt-3 grid gap-2 ${pathIsLong ? "max-h-72 overflow-y-auto pr-1" : ""}`}>
                      {relationshipPathSteps.map((step, index) => (
                        <div key={`${step.id}-${index}`}>
                          <div className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3 rounded-[0.9rem] border border-white/12 bg-white/10 p-2.5">
                            <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold ${
                              index === 0 || index === relationshipPathSteps.length - 1
                                ? "bg-soft-gold text-text-primary"
                                : "bg-white/16 text-white"
                            }`}>
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-extrabold text-white">{step.name}</p>
                              <p className="mt-1 text-xs font-bold leading-5 text-white/72">{step.role}</p>
                            </div>
                          </div>
                          {index < relationshipPathSteps.length - 1 && (
                            <div className="grid h-5 place-items-center text-soft-gold">
                              <ArrowDown className="h-3.5 w-3.5" strokeWidth={iconStroke} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    )}
                    {pathIsLong && (
                      <button
                        type="button"
                        className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-full border border-white/16 bg-white/10 px-3 text-xs font-extrabold text-white/86 transition hover:bg-white/16 active:translate-y-[1px]"
                        onClick={() => setShowFullRelationshipPath((value) => !value)}
                      >
                        {showFullRelationshipPath ? "Hide full path" : "Show full path"}
                        <ChevronDown className={`h-3.5 w-3.5 transition ${showFullRelationshipPath ? "rotate-180" : ""}`} strokeWidth={iconStroke} />
                      </button>
                    )}
                  </div>
                  <p className="mt-3 flex items-start gap-2 rounded-[1rem] border border-white/12 bg-white/8 p-3 text-xs font-bold leading-5 text-white/84">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-soft-gold" strokeWidth={iconStroke} />
                    {relationship.fallbackNote || "This explanation only uses data inside this FamilySpace."}
                  </p>
                  <details className="mt-3 rounded-[1rem] border border-white/12 bg-white/8 p-3 text-xs font-bold leading-5 text-white/86 open:bg-white/10">
                    <summary className="cursor-pointer select-none text-xs font-extrabold uppercase tracking-[0.14em] text-white/78">
                      Details
                    </summary>
                    <div className="mt-3 grid gap-3">
                    <p className="flex items-start gap-2">
                      <Database className="mt-0.5 h-4 w-4 shrink-0 text-soft-gold" strokeWidth={iconStroke} />
                      Data used: parent, child, spouse, and sibling links from this FamilySpace only.
                    </p>
                    <p className="flex items-start gap-2">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-soft-gold" strokeWidth={iconStroke} />
                      {confidenceCopy[relationship.confidence]}
                    </p>
                    </div>
                  </details>
                </div>
              ) : relationship ? (
                <div className="mt-5 rounded-[1.45rem] border border-warning/30 bg-warning/18 p-4">
                  <p className="flex items-start gap-2 text-sm font-extrabold leading-6 text-white">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-soft-gold" strokeWidth={iconStroke} />
                    No clear relationship path found using current FamilySpace data.
                  </p>
                  <ul className="mt-3 grid gap-1 pl-6 text-xs font-bold leading-5 text-white/86">
                    <li className="list-disc">Check parent links.</li>
                    <li className="list-disc">Add missing family members.</li>
                    <li className="list-disc">Try another branch.</li>
                  </ul>
                  <p className="mt-4 flex items-start gap-2 text-xs font-bold leading-5 text-white/78">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-soft-gold" strokeWidth={iconStroke} />
                    This explanation only uses data inside this FamilySpace.
                  </p>
                </div>
              ) : (
                <p className="mt-4 rounded-[1.1rem] border border-white/12 bg-white/10 p-3 text-sm font-bold leading-6 text-white/86">
                  Relationship data stays scoped to this FamilySpace. Choose two people to reveal the path, explanation, confidence, and highlighted canvas route.
                </p>
              )}
            </div>
            </div>
          </aside>
        </section>

        <section className="mt-5 rounded-[1.35rem] border border-white/75 bg-surface/88 p-4 shadow-[0_18px_46px_-36px_rgba(80,54,30,0.72)] ring-1 ring-border-soft/60">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sage-green/12 text-dark-green">
                <GitBranch className="h-4 w-4" strokeWidth={iconStroke} />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-text-primary">Relationship Workspace</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-text-muted">
                  Search, focus, and trace how family members are connected.
                </p>
              </div>
            </div>
            <div className="grid gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-text-muted sm:grid-cols-3 lg:min-w-[520px]">
              <span className="rounded-2xl border border-border-soft bg-background px-3 py-2">
                <Users className="mr-2 inline h-3.5 w-3.5 text-sage-green" strokeWidth={iconStroke} />
                {members.length} members indexed
              </span>
              <span className="rounded-2xl border border-border-soft bg-background px-3 py-2">
                <GitBranch className="mr-2 inline h-3.5 w-3.5 text-sage-green" strokeWidth={iconStroke} />
                {branchCount || "-"} branches
              </span>
              <span className="rounded-2xl border border-border-soft bg-background px-3 py-2">
                <Route className="mr-2 inline h-3.5 w-3.5 text-sage-green" strokeWidth={iconStroke} />
                {selectedPathIds.length ? `${selectedPathIds.length} path nodes` : "AI path ready"}
              </span>
            </div>
          </div>
        </section>
        <MemberDetailModal member={selected} members={members} onClose={() => setSelected(null)} />
      </PageShell>
    </motion.div>
  );
};
