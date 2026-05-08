import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useParams } from "react-router-dom";
import { authFetch, spaceFetch } from "../lib/api";
import type {
  AppUser,
  FamilyBranch,
  FamilyMember,
  FamilyMembership,
  FamilySpace,
  GalleryItem,
  NuclearFamily,
  SpaceSummary,
  TimelineEvent,
  ToastMessage,
} from "../types/family";

type SpaceContextValue = {
  // Space data
  currentSpace: FamilySpace | null;
  membership: FamilyMembership | null;
  currentUser: AppUser | null;
  
  // Family data (space-scoped)
  members: FamilyMember[];
  branches: FamilyBranch[];
  families: NuclearFamily[];
  timeline: TimelineEvent[];
  gallery: GalleryItem[];
  summary: SpaceSummary | null;
  
  // UI state
  toasts: ToastMessage[];
  isLoading: boolean;
  
  // Actions
  addToast: (message: string, tone?: ToastMessage["tone"]) => void;
  dismissToast: (id: string) => void;
  saveMember: (member: FamilyMember, previousId?: string) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  saveGalleryItem: (item: GalleryItem, previousId?: string) => Promise<void>;
  deleteGalleryItem: (id: string) => Promise<void>;
  saveTimelineEvent: (event: TimelineEvent, previousId?: string) => Promise<void>;
  deleteTimelineEvent: (id: string) => Promise<void>;
  updateSpace: (data: { name?: string; description?: string | null }) => Promise<void>;
  
  // Helpers
  canEdit: () => boolean;
  canDelete: () => boolean;
};

const SpaceContext = createContext<SpaceContextValue | null>(null);

const idFrom = (prefix: string, value: string) => {
  const slugify = (v: string) =>
    v
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 72);
  return `${slugify(value) || prefix}-${Date.now()}`;
};

export const SpaceProvider = ({ children }: { children: ReactNode }) => {
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const location = useLocation();
  const dashboardPath = spaceSlug ? `/app/${spaceSlug}` : "";
  const shouldLoadSummaryOnly = Boolean(spaceSlug && location.pathname.replace(/\/$/, "") === dashboardPath);
  
  const [currentSpace, setCurrentSpace] = useState<FamilySpace | null>(null);
  const [membership, setMembership] = useState<FamilyMembership | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [branches, setBranches] = useState<FamilyBranch[]>([]);
  const [families, setFamilies] = useState<NuclearFamily[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [summary, setSummary] = useState<SpaceSummary | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch space data on mount or when spaceSlug changes
  useEffect(() => {
    let isMounted = true;

    const loadSpaceData = async () => {
      if (!spaceSlug) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [meResponse, spaceResponse] = await Promise.all([
          authFetch("/api/auth/me"),
          spaceFetch(spaceSlug, ""),
        ]);

        if (meResponse.ok) {
          const data = await meResponse.json();
          if (isMounted) setCurrentUser(data.user ?? null);
        }

        if (!spaceResponse.ok) {
          if (isMounted) setIsLoading(false);
          return;
        }
        
        const spaceData = await spaceResponse.json();
        if (isMounted) {
          setCurrentSpace(spaceData.space);
          setMembership(spaceData.membership);
        }

        if (shouldLoadSummaryOnly) {
          const summaryResponse = await spaceFetch(spaceSlug, "/summary");
          if (isMounted && summaryResponse.ok) setSummary(await summaryResponse.json());
          if (isMounted) {
            setMembers([]);
            setBranches([]);
            setFamilies([]);
            setTimeline([]);
            setGallery([]);
          }
          return;
        }

        setSummary(null);

        const [membersRes, branchesRes, familiesRes, timelineRes, galleryRes] = await Promise.all([
          spaceFetch(spaceSlug, "/members"),
          spaceFetch(spaceSlug, "/branches"),
          spaceFetch(spaceSlug, "/nuclear-families"),
          spaceFetch(spaceSlug, "/timeline"),
          spaceFetch(spaceSlug, "/gallery"),
        ]);

        if (!isMounted) return;

        if (membersRes.ok) {
          const data = await membersRes.json();
          setMembers(data);
        }
        if (branchesRes.ok) {
          const data = await branchesRes.json();
          setBranches(data);
        }
        if (familiesRes.ok) {
          const data = await familiesRes.json();
          setFamilies(data);
        }
        if (timelineRes.ok) {
          const data = await timelineRes.json();
          setTimeline(data);
        }
        if (galleryRes.ok) {
          const data = await galleryRes.json();
          setGallery(data);
        }
      } catch (error) {
        console.error("Failed to load space data:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadSpaceData();

    return () => {
      isMounted = false;
    };
  }, [shouldLoadSummaryOnly, spaceSlug]);

  const addToast = (message: string, tone: ToastMessage["tone"] = "success") => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3800);
  };

  const dismissToast = (id: string) => setToasts((current) => current.filter((toast) => toast.id !== id));

  const canEdit = () => membership?.role === "owner" || membership?.role === "admin";
  const canDelete = () => membership?.role === "owner" || membership?.role === "admin";

  const normalizeRelations = (nextMembers: FamilyMember[], member: FamilyMember, previousId?: string) => {
    const memberId = member.id;
    const oldId = previousId && previousId !== memberId ? previousId : null;

    return nextMembers.map((item) => {
      const replaceId = (id: string) => (oldId && id === oldId ? memberId : id);
      const removeSelf = (ids: string[]) => Array.from(new Set(ids.map(replaceId).filter((id) => id !== item.id)));

      let updated = { ...item };

      if (oldId) {
        updated = {
          ...updated,
          fatherId: updated.fatherId === oldId ? memberId : updated.fatherId,
          motherId: updated.motherId === oldId ? memberId : updated.motherId,
          spouseIds: removeSelf(updated.spouseIds),
          formerSpouseIds: removeSelf(updated.formerSpouseIds),
          childrenIds: removeSelf(updated.childrenIds),
          siblingIds: removeSelf(updated.siblingIds),
        };
      }

      if (member.fatherId === item.id || member.motherId === item.id) {
        updated.childrenIds = Array.from(new Set([...updated.childrenIds, memberId]));
      }
      if (member.spouseIds.includes(item.id)) {
        updated.spouseIds = Array.from(new Set([...updated.spouseIds, memberId]));
      }
      if (member.formerSpouseIds.includes(item.id)) {
        updated.formerSpouseIds = Array.from(new Set([...updated.formerSpouseIds, memberId]));
      }

      return updated;
    });
  };

  const saveMember = async (member: FamilyMember, previousId?: string) => {
    if (!spaceSlug) return;
    try {
      const isNew = !members.some((item) => item.id === (previousId || member.id));
      const url = isNew ? "" : `/${previousId || member.id}`;
      const method = isNew ? "POST" : "PUT";

      const response = await spaceFetch(spaceSlug, `/members${url}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
      });

      if (!response.ok) throw new Error("Failed to save member to server");

      setMembers((current) => {
        const withoutMember = current.filter((item) => item.id !== (previousId || member.id));
        const next = [...withoutMember, member];
        const result = normalizeRelations(next, member, previousId).sort(
          (a, b) => a.generation - b.generation || a.fullName.localeCompare(b.fullName)
        );
        return result;
      });

      addToast(isNew ? "Member added successfully" : "Member updated successfully");
    } catch (error) {
      console.error(error);
      addToast("Failed to save member", "error");
    }
  };

  const deleteMember = async (id: string) => {
    if (!spaceSlug) return;
    try {
      const response = await spaceFetch(spaceSlug, `/members/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete member from server");

      setMembers((current) =>
        current
          .filter((member) => member.id !== id)
          .map((member) => ({
            ...member,
            fatherId: member.fatherId === id ? null : member.fatherId,
            motherId: member.motherId === id ? null : member.motherId,
            spouseIds: member.spouseIds.filter((item) => item !== id),
            formerSpouseIds: member.formerSpouseIds.filter((item) => item !== id),
            childrenIds: member.childrenIds.filter((item) => item !== id),
            siblingIds: member.siblingIds.filter((item) => item !== id),
          }))
      );
      addToast("Member deleted successfully", "warning");
    } catch (error) {
      console.error(error);
      addToast("Failed to delete member", "error");
    }
  };

  const saveGalleryItem = async (item: GalleryItem, previousId?: string) => {
    if (!spaceSlug) return;
    try {
      const nextItem = {
        ...item,
        id: item.id || idFrom("gallery", item.title || item.year || "gallery"),
      };
      const isNew = !gallery.some((current) => current.id === (previousId || nextItem.id));
      const response = await spaceFetch(
        spaceSlug,
        isNew ? "/gallery" : `/gallery/${previousId || nextItem.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextItem),
        }
      );

      if (!response.ok) throw new Error("Failed to save gallery item to server");

      const saved = (await response.json()) as GalleryItem;
      setGallery((current) => {
        const withoutItem = current.filter((galleryItem) => galleryItem.id !== (previousId || saved.id));
        return [...withoutItem, saved].sort((a, b) => a.year.localeCompare(b.year) || a.title.localeCompare(b.title));
      });
      addToast(isNew ? "Gallery item added successfully" : "Gallery item updated successfully");
    } catch (error) {
      console.error(error);
      addToast("Failed to save gallery item", "error");
    }
  };

  const deleteGalleryItem = async (id: string) => {
    if (!spaceSlug) return;
    try {
      const response = await spaceFetch(spaceSlug, `/gallery/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete gallery item from server");

      setGallery((current) => current.filter((item) => item.id !== id));
      addToast("Gallery item deleted successfully", "warning");
    } catch (error) {
      console.error(error);
      addToast("Failed to delete gallery item", "error");
    }
  };

  const saveTimelineEvent = async (event: TimelineEvent, previousId?: string) => {
    if (!spaceSlug) return;
    try {
      const nextEvent = {
        ...event,
        id: event.id || idFrom("timeline", `${event.year}-${event.title}`),
        relatedMemberIds: event.relatedMemberIds ?? event.memberIds ?? [],
        memberIds: event.memberIds ?? event.relatedMemberIds ?? [],
        isAutomatic: event.isAutomatic ?? false,
      };
      const isNew = !timeline.some((current) => current.id === (previousId || nextEvent.id));
      const response = await spaceFetch(
        spaceSlug,
        isNew ? "/timeline" : `/timeline/${previousId || nextEvent.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextEvent),
        }
      );

      if (!response.ok) throw new Error("Failed to save timeline event to server");

      const saved = (await response.json()) as TimelineEvent;
      setTimeline((current) => {
        const withoutEvent = current.filter((item) => item.id !== (previousId || saved.id));
        return [...withoutEvent, saved].sort((a, b) => a.year.localeCompare(b.year) || a.title.localeCompare(b.title));
      });
      addToast(isNew ? "Timeline event added successfully" : "Timeline event updated successfully");
    } catch (error) {
      console.error(error);
      addToast("Failed to save timeline event", "error");
    }
  };

  const deleteTimelineEvent = async (id: string) => {
    if (!spaceSlug) return;
    try {
      const response = await spaceFetch(spaceSlug, `/timeline/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete timeline event from server");

      setTimeline((current) => current.filter((event) => event.id !== id));
      addToast("Timeline event deleted successfully", "warning");
    } catch (error) {
      console.error(error);
      addToast("Failed to delete timeline event", "error");
    }
  };

  const updateSpace = async (data: { name?: string; description?: string | null }) => {
    if (!spaceSlug) return;
    try {
      const response = await spaceFetch(spaceSlug, "", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update FamilySpace");

      const result = await response.json();
      setCurrentSpace(result.space);
      setMembership((current) => (current && result.space ? { ...current, space: result.space } : current));
      addToast("FamilySpace settings saved successfully");
    } catch (error) {
      console.error(error);
      addToast("Failed to save FamilySpace settings", "error");
    }
  };

  const value = useMemo<SpaceContextValue>(
    () => ({
      currentSpace,
      membership,
      currentUser,
      members,
      branches,
      families,
      timeline,
      gallery,
      summary,
      toasts,
      isLoading,
      addToast,
      dismissToast,
      saveMember,
      deleteMember,
      saveGalleryItem,
      deleteGalleryItem,
      saveTimelineEvent,
      deleteTimelineEvent,
      updateSpace,
      canEdit,
      canDelete,
    }),
    [currentSpace, membership, currentUser, members, branches, families, timeline, gallery, summary, toasts, isLoading]
  );

  return <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>;
};

export const useSpaceStore = () => {
  const context = useContext(SpaceContext);
  if (!context) {
    throw new Error("useSpaceStore must be used inside SpaceProvider");
  }
  return context;
};
