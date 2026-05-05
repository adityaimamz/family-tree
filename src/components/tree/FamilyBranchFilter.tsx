import { Filter } from "lucide-react";
import { useFamilyStore } from "../../hooks/useFamilyStore";
import { FilterSelect } from "../ui";

export const FamilyBranchFilter = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (branchName: string) => void;
}) => {
  const { branches } = useFamilyStore();
  const branchOptions = ["Semua Cabang", ...branches.map((branch) => branch.name)];

  return (
    <div className="rounded-[1.6rem] border border-border-soft bg-surface p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-text-primary">
        <Filter className="h-4 w-4 text-sage-green" strokeWidth={1.8} />
        Pilih Keluarga
      </div>
      <FilterSelect label="Pilih keluarga yang ingin dilihat" value={value} options={branchOptions} onChange={onChange} />
    </div>
  );
};
