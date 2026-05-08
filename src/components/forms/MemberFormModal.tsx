import { MemberForm } from "../MemberForm";
import { AppModal } from "../ui/AppModal";
import { useSpaceStore } from "../../hooks/useSpaceStore";
import type { FamilyMember } from "../../types/family";

export function MemberFormModal({
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
    <AppModal
      open={open}
      title={member ? `Edit ${member.displayName || member.fullName}` : "Add Member"}
      description="Fill in member details and family relations."
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
    </AppModal>
  );
}
