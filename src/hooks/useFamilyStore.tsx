import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
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
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
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

const STORAGE_KEY = "admin_authenticated";

const readAuthenticated = () => {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(STORAGE_KEY) === "true";
};

const configuredPassword = () => import.meta.env.VITE_ADMIN_PASSWORD;

export const FamilyProvider = ({ children }: { children: ReactNode }) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [branches, setBranches] = useState<FamilyBranch[]>([]);
  const [families, setFamilies] = useState<NuclearFamily[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(readAuthenticated);

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
        console.error("Gagal mengambil data dari API, menggunakan data awal", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchFamilyData();
    } else {
      setMembers([]);
      setBranches([]);
      setFamilies([]);
      setTimeline([]);
      setGallery([]);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

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

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member)
      });

      if (!response.ok) throw new Error("Gagal menyimpan ke server");

      // Optimistic update locally
      setMembers((current) => {
        const withoutMember = current.filter((item) => item.id !== (previousId || member.id));
        const next = [...withoutMember, member];
        const result = normalizeRelations(next, member, previousId).sort(
          (a, b) => a.generation - b.generation || a.fullName.localeCompare(b.fullName)
        );
        return result;
      });
      
      addToast(isNew ? "Anggota berhasil ditambahkan" : "Data berhasil diperbarui");
    } catch (error) {
      console.error(error);
      addToast("Terjadi kesalahan saat menyimpan data", "error");
    }
  };

  const deleteMember = async (id: string) => {
    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error("Gagal menghapus dari server");

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
      addToast("Data berhasil dihapus", "warning");
    } catch (error) {
      console.error(error);
      addToast("Terjadi kesalahan saat menghapus data", "error");
    }
  };

  const saveGalleryItem = async (item: GalleryItem, previousId?: string) => {
    try {
      const nextItem = {
        ...item,
        id: item.id || idFrom("gallery", item.title || item.year || "gallery"),
      };
      const isNew = !gallery.some((current) => current.id === (previousId || nextItem.id));
      const response = await fetch(isNew ? "/api/gallery" : `/api/gallery/${previousId || nextItem.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextItem),
      });

      if (!response.ok) throw new Error("Gagal menyimpan galeri ke server");

      const saved = (await response.json()) as GalleryItem;
      setGallery((current) => {
        const withoutItem = current.filter((galleryItem) => galleryItem.id !== (previousId || saved.id));
        return [...withoutItem, saved].sort((a, b) => a.year.localeCompare(b.year) || a.title.localeCompare(b.title));
      });
      addToast(isNew ? "Item galeri berhasil ditambahkan" : "Item galeri berhasil diperbarui");
    } catch (error) {
      console.error(error);
      addToast("Terjadi kesalahan saat menyimpan galeri", "error");
    }
  };

  const deleteGalleryItem = async (id: string) => {
    try {
      const response = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Gagal menghapus galeri dari server");

      setGallery((current) => current.filter((item) => item.id !== id));
      addToast("Item galeri berhasil dihapus", "warning");
    } catch (error) {
      console.error(error);
      addToast("Terjadi kesalahan saat menghapus galeri", "error");
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
      const response = await fetch(isNew ? "/api/timeline" : `/api/timeline/${previousId || nextEvent.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextEvent),
      });

      if (!response.ok) throw new Error("Gagal menyimpan linimasa ke server");

      const saved = (await response.json()) as TimelineEvent;
      setTimeline((current) => {
        const withoutEvent = current.filter((item) => item.id !== (previousId || saved.id));
        return [...withoutEvent, saved].sort((a, b) => a.year.localeCompare(b.year) || a.title.localeCompare(b.title));
      });
      addToast(isNew ? "Event linimasa berhasil ditambahkan" : "Event linimasa berhasil diperbarui");
    } catch (error) {
      console.error(error);
      addToast("Terjadi kesalahan saat menyimpan linimasa", "error");
    }
  };

  const deleteTimelineEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/timeline/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Gagal menghapus linimasa dari server");

      setTimeline((current) => current.filter((event) => event.id !== id));
      addToast("Event linimasa berhasil dihapus", "warning");
    } catch (error) {
      console.error(error);
      addToast("Terjadi kesalahan saat menghapus linimasa", "error");
    }
  };

  const login = (password: string) => {
    const valid = password === configuredPassword();
    if (valid) {
      window.sessionStorage.setItem(STORAGE_KEY, "true");
      setIsAuthenticated(true);
    }
    return valid;
  };

  const logout = () => {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
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
        addToast("Data keluarga berhasil diimpor (Lokal)");
      },
      resetData: () => {
        setMembers([]);
        setBranches([]);
        setFamilies([]);
        setTimeline([]);
        setGallery([]);
        addToast("Data berhasil dikosongkan (Lokal)", "info");
      },
      isAuthenticated,
      login,
      logout,
    }),
    [branches, families, gallery, members, timeline, toasts, isLoading, isAuthenticated]
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
