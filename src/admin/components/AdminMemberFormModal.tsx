import { MemberForm } from "../../components/MemberForm";
import { useSpaceStore } from "../../hooks/useSpaceStore";
import type { FamilyMember } from "../../types/family";
import { AdminModal } from "./AdminModal";

export function AdminMemberFormModal({
  member,
  open,
  onClose,
}: {
  member?: FamilyMember | null;
  open: boolean;
  onClose: () => void;
}) {
  const { members, saveMember, deleteMember } = useSpaceStore();

  return (
    <AdminModal
      open={open}
      title={member ? `Edit ${member.displayName || member.fullName}` : "Tambah Anggota"}
      description="Lengkapi data anggota dan relasi keluarga. Perubahan disimpan ke database."
      size="xl"
      onClose={onClose}
    >
      <MemberForm
        members={members}
        initial={member ?? undefined}
        cancelTo={null}
        onCancel={onClose}
        onSave={async (nextMember) => {
          await saveMember(nextMember, member?.id);
          onClose();
        }}
        onDelete={
          member
            ? async (id) => {
                await deleteMember(id);
                onClose();
              }
            : undefined
        }
      />
    </AdminModal>
  );
}
