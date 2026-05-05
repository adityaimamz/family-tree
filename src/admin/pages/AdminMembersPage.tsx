import { motion } from "framer-motion";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, ConfirmDialog, SearchBar, iconStroke, pageTransition } from "../../components/ui";
import { useFamilyStore } from "../../hooks/useFamilyStore";
import type { FamilyMember } from "../../types/family";
import { displayStatus } from "../../utils/family";
import { AdminMemberFormModal } from "../components/AdminMemberFormModal";

export function AdminMembersPage() {
  const { members, deleteMember } = useFamilyStore();
  const [query, setQuery] = useState("");
  const [memberToEdit, setMemberToEdit] = useState<FamilyMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((member) =>
      [
        member.fullName,
        member.displayName,
        member.familyBranch,
        member.statusLabel,
        member.relationshipToRoot,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q)),
    );
  }, [members, query]);

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    await deleteMember(memberToDelete.id);
    setMemberToDelete(null);
  };

  return (
    <motion.div {...pageTransition}>
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-dark-green">Data keluarga</p>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-4xl md:text-5xl">
            Members
          </h1>
          <p className="mt-3 max-w-[72ch] text-sm leading-7 text-text-muted sm:text-base">
            Kelola data anggota dan relasi keluarga yang tersimpan di database.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
        >
          <Plus className="h-4 w-4" strokeWidth={iconStroke} />
          Tambah Anggota
        </button>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <SearchBar value={query} onChange={setQuery} placeholder="Cari nama, cabang, status, atau hubungan" />
        <div className="flex items-center gap-2">
          <Badge tone="sage">{rows.length} tampil</Badge>
          <Badge tone="muted">{members.length} total</Badge>
        </div>
      </div>

      <section className="surface-grain relative overflow-hidden rounded-[1.8rem] border border-white/75 bg-surface/96 p-4 shadow-soft ring-1 ring-border-soft/60 sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-xs font-extrabold uppercase tracking-[0.16em] text-text-muted">
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Cabang</th>
                <th className="px-3 py-2">Generasi</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Relasi</th>
                <th className="px-3 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="rounded-[1.2rem] bg-background/55 shadow-soft">
                  <td className="px-3 py-3">
                    <p className="font-bold text-text-primary">{row.fullName}</p>
                    <p className="mt-0.5 text-xs font-semibold text-text-muted">{row.id}</p>
                  </td>
                  <td className="px-3 py-3 text-text-muted">{row.familyBranch}</td>
                  <td className="px-3 py-3 text-text-muted">Generasi {row.generation}</td>
                  <td className="px-3 py-3">
                    <Badge tone={row.isDeceased ? "muted" : "sage"}>{displayStatus(row)}</Badge>
                  </td>
                  <td className="max-w-[260px] truncate px-3 py-3 text-text-muted">{row.relationshipToRoot}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setMemberToEdit(row)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-border-soft bg-surface px-3 py-2 text-xs font-semibold text-text-primary shadow-soft transition hover:bg-surface-soft"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={iconStroke} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setMemberToDelete(row)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-warning/25 bg-warning/10 px-3 py-2 text-xs font-semibold text-warning shadow-soft transition hover:bg-warning/15"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={iconStroke} />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdminMemberFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <AdminMemberFormModal
        open={Boolean(memberToEdit)}
        member={memberToEdit}
        onClose={() => setMemberToEdit(null)}
      />

      <ConfirmDialog
        open={Boolean(memberToDelete)}
        title={memberToDelete ? `Hapus ${memberToDelete.displayName || memberToDelete.fullName}?` : "Hapus anggota?"}
        description="Data anggota akan dihapus dari database dan relasi anggota lain akan dibersihkan."
        onCancel={() => setMemberToDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </motion.div>
  );
}
