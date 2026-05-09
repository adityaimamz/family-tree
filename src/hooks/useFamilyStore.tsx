import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authFetch } from "../lib/api";
import type { FamilyBranch, FamilyMember, GalleryItem, NuclearFamily, TimelineEvent, ToastMessage } from "../types/family";

type FamilyContextValue = {
  members: FamilyMember[];
  branches: FamilyBranch[];
  families: NuclearFamily[];
  timeline: TimelineEvent[];
  gallery: GalleryItem[];
  toasts: ToastMessage[];
  addToast: (message: string, tone?: ToastMessage["tone"]) => void;
  dismissToast: (id: string) => void;
  saveMember: (member: FamilyMember, previousId?: string) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  saveGalleryItem: (item: GalleryItem, previousId?: string) => Promise<void>;
  deleteGalleryItem: (id: string) => Promise<void>;
  saveTimelineEvent: (event: TimelineEvent, previousId?: string) => Promise<void>;
  deleteTimelineEvent: (id: string) => Promise<void>;
  importMembers: (members: FamilyMember[]) => void;
  resetData: () => void;
  isLoading: boolean;
};

const FamilyContext = createContext<FamilyContextValue | null>(null);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72);

const idFrom = (prefix: string, value: string) => `${slugify(value) || prefix}-${Date.now()}`;

export const FamilyProvider = ({ children }: { children: ReactNode }) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [branches, setBranches] = useState<FamilyBranch[]>([]);
  const [families, setFamilies] = useState<NuclearFamily[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchJson = async <T,>(url: string, fallback: T): Promise<T> => {
      const response = await fetch(url);
      if (!response.ok) return fallback;

      const data = await response.json();
      return data;
    };

    const fetchFamilyData = async () => {
      if (isMounted) setIsLoading(true);
      try {
        const [nextMembers, nextBranches, nextFamilies, nextTimeline, nextGallery] = await Promise.all([
          fetchJson<FamilyMember[]>("/api/members", []),
          fetchJson<FamilyBranch[]>("/api/branches", []),
          fetchJson<NuclearFamily[]>("/api/nuclear-families", []),
          fetchJson<TimelineEvent[]>("/api/timeline", []),
          fetchJson<GalleryItem[]>("/api/gallery", []),
        ]);

        if (!isMounted) return;

        setMembers(nextMembers);
        setBranches(nextBranches);
        setFamilies(nextFamilies);
        setTimeline(nextTimeline);
        setGallery(nextGallery);
      } catch (error) {
        console.error("Failed to fetch data from API, using initial data", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchFamilyData();

    return () => {
      isMounted = false;
    };
  }, []);

  const addToast = (message: string, tone: ToastMessage["tone"] = "success") => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3800);
  };

  const dismissToast = (id: string) => setToasts((current) => current.filter((toast) => toast.id !== id));

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
    try {
      const isNew = !members.some((item) => item.id === (previousId || member.id));
      const url = isNew ? '/api/members' : `/api/members/${previousId || member.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member)
      });

      if (!response.ok) throw new Error("Failed to save to server");

      // Optimistic update locally
      setMembers((current) => {
        const withoutMember = current.filter((item) => item.id !== (previousId || member.id));
        const next = [...withoutMember, member];
        const result = normalizeRelations(next, member, previousId).sort(
          (a, b) => a.generation - b.generation || a.fullName.localeCompare(b.fullName)
        );
        return result;
      });
      
      addToast(isNew ? "Member added successfully" : "Data updated successfully");
    } catch (error) {
      console.error(error);
      addToast("Error occurred while saving data", "error");
    }
  };

  const deleteMember = async (id: string) => {
    try {
      const response = await authFetch(`/api/members/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error("Failed to delete from server");

      // Optimistic update locally
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
      addToast("Data deleted successfully", "warning");
    } catch (error) {
      console.error(error);
      addToast("Error occurred while deleting data", "error");
    }
  };

  const saveGalleryItem = async (item: GalleryItem, previousId?: string) => {
    try {
      const nextItem = {
        ...item,
        id: item.id || idFrom("gallery", item.title || item.year || "gallery"),
      };
      const isNew = !gallery.some((current) => current.id === (previousId || nextItem.id));
      const response = await authFetch(isNew ? "/api/gallery" : `/api/gallery/${previousId || nextItem.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextItem),
      });

      if (!response.ok) throw new Error("Failed to save gallery to server");

      const saved = (await response.json()) as GalleryItem;
      setGallery((current) => {
        const withoutItem = current.filter((galleryItem) => galleryItem.id !== (previousId || saved.id));
        return [...withoutItem, saved].sort((a, b) => a.year.localeCompare(b.year) || a.title.localeCompare(b.title));
      });
      addToast(isNew ? "Gallery item added successfully" : "Gallery item updated successfully");
    } catch (error) {
      console.error(error);
      addToast("Error occurred while saving gallery", "error");
    }
  };

  const deleteGalleryItem = async (id: string) => {
    try {
      const response = await authFetch(`/api/gallery/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete gallery from server");

      setGallery((current) => current.filter((item) => item.id !== id));
      addToast("Gallery item deleted successfully", "warning");
    } catch (error) {
      console.error(error);
      addToast("Error occurred while deleting gallery", "error");
    }
  };

  const saveTimelineEvent = async (event: TimelineEvent, previousId?: string) => {
    try {
      const nextEvent = {
        ...event,
        id: event.id || idFrom("timeline", `${event.year}-${event.title}`),
        relatedMemberIds: event.relatedMemberIds ?? event.memberIds ?? [],
        memberIds: event.memberIds ?? event.relatedMemberIds ?? [],
        isAutomatic: event.isAutomatic ?? false,
      };
      const isNew = !timeline.some((current) => current.id === (previousId || nextEvent.id));
      const response = await authFetch(isNew ? "/api/timeline" : `/api/timeline/${previousId || nextEvent.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextEvent),
      });

      if (!response.ok) throw new Error("Failed to save timeline to server");

      const saved = (await response.json()) as TimelineEvent;
      setTimeline((current) => {
        const withoutEvent = current.filter((item) => item.id !== (previousId || saved.id));
        return [...withoutEvent, saved].sort((a, b) => a.year.localeCompare(b.year) || a.title.localeCompare(b.title));
      });
      addToast(isNew ? "Timeline event added successfully" : "Timeline event updated successfully");
    } catch (error) {
      console.error(error);
      addToast("Error occurred while saving timeline", "error");
    }
  };

  const deleteTimelineEvent = async (id: string) => {
    try {
      const response = await authFetch(`/api/timeline/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete timeline from server");

      setTimeline((current) => current.filter((event) => event.id !== id));
      addToast("Timeline event deleted successfully", "warning");
    } catch (error) {
      console.error(error);
      addToast("Error occurred while deleting timeline", "error");
    }
  };

  const value = useMemo<FamilyContextValue>(
    () => ({
      members,
      branches,
      families,
      timeline,
      gallery,
      toasts,
      addToast,
      dismissToast,
      saveMember,
      deleteMember,
      saveGalleryItem,
      deleteGalleryItem,
      saveTimelineEvent,
      deleteTimelineEvent,
      isLoading,
      importMembers: (imported) => {
        // Implementasi bulk import ke server bisa ditambahkan nanti
        setMembers(imported);
        addToast("Family data imported successfully (Local)");
      },
      resetData: () => {
        setMembers([]);
        setBranches([]);
        setFamilies([]);
        setTimeline([]);
        setGallery([]);
        addToast("Data reset successfully (Local)", "info");
      },
    }),
    [branches, families, gallery, members, timeline, toasts, isLoading]
  );

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
};

export const useFamilyStore = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error("useFamilyStore must be used inside FamilyProvider");
  }
  return context;
};
