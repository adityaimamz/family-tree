import { motion } from "framer-motion";
import { useState } from "react";
import { FamilyTreeCanvas } from "../components/FamilyTree";
import { MemberDetailModal } from "../components/MemberDetail";
import { PageShell, SectionHeader, pageTransition } from "../components/ui";
import { familyConfig } from "../config";
import { useSpaceStore } from "../hooks/useSpaceStore";
import type { FamilyMember } from "../types/family";

export const TreePage = () => {
  const { members } = useSpaceStore();
  const [selected, setSelected] = useState<FamilyMember | null>(null);
  
  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader 
          eyebrow="Silsilah" 
          title={familyConfig.site.treeTitle}
          description={familyConfig.site.treeDescription}
        />
        <FamilyTreeCanvas members={members} onSelectMember={setSelected} />
        <MemberDetailModal member={selected} members={members} onClose={() => setSelected(null)} />
      </PageShell>
    </motion.div>
  );
};
