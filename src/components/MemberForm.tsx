import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ClipboardList, FileJson, Save, Trash2, UserRound, UsersRound } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { PhotoUploadField } from "../admin/components/PhotoUploadField";
import { familyConfig } from "../config";
import type { FamilyMember, FamilyStatus, Gender } from "../types/family";
import { validateMember } from "../utils/family";
import { ConfirmDialog, FilterSelect, InitialsAvatar, PrimaryButton, SecondaryButton } from "./ui";

const formSteps = [
  { id: "personal", label: "Informasi Pribadi", Icon: UserRound },
  { id: "family", label: "Hubungan Keluarga", Icon: UsersRound },
  { id: "notes", label: "Foto & Catatan", Icon: ClipboardList },
] as const;

type FormStep = (typeof formSteps)[number]["id"];

const emptyMember: FamilyMember = {
  id: "",
  fullName: "",
  displayName: "",
  gender: "unknown",
  generation: 3,
  familyBranch: familyConfig.site.defaultBranchId ?? "garis-utama",
  fatherId: null,
  motherId: null,
  spouseIds: [],
  formerSpouseIds: [],
  childrenIds: [],
  siblingIds: [],
  parentFamilyId: null,
  nuclearFamilyIds: [],
  birthDate: null,
  marriageDate: null,
  deathDate: null,
  isDeceased: false,
  deceasedLabel: null,
  birthPlace: null,
  biography: "",
  notes: "",
  photo: null,
  statusLabel: "Kerabat",
  relationshipToRoot: "",
};

const slugify = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 64);

const inputClass =
  "min-h-11 w-full rounded-xl border border-border-soft bg-background px-3 py-2.5 text-sm font-medium text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/65 focus:border-dark-green focus:ring-4 focus:ring-sage-green/12 sm:min-h-12 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-base";

const Field = ({ label, children, helper }: { label: string; children: ReactNode; helper?: string }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-text-primary">{label}</span>
    {children}
    {helper && <span className="mt-1 block text-xs leading-5 text-text-muted">{helper}</span>}
  </label>
);

export const FormSection = ({ title, description, children }: { title: string; description: string; children: ReactNode }) => (
  <section className="rounded-[1.25rem] border border-white/75 bg-surface/95 p-4 shadow-[0_22px_50px_-36px_rgba(80,54,30,0.82)] ring-1 ring-border-soft/60 sm:p-5 md:rounded-[2rem] md:p-7">
    <h2 className="text-lg font-extrabold tracking-tight text-text-primary sm:text-xl">{title}</h2>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">{description}</p>
    <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2 md:gap-5">{children}</div>
  </section>
);

export const FormStepper = ({
  currentStep,
  onStepChange,
}: {
  currentStep: FormStep;
  onStepChange: (step: FormStep) => void;
}) => {
  const currentIndex = formSteps.findIndex((step) => step.id === currentStep);

  return (
    <nav aria-label="Langkah kelola data">
      <ol className="grid grid-cols-3 items-stretch gap-2 sm:gap-3">
        {formSteps.map((step, index) => {
          const Icon = step.Icon;
          const active = step.id === currentStep;
          const completed = index < currentIndex;

          return (
            <li key={step.id} className="min-w-0">
              <button
                type="button"
                aria-current={active ? "step" : undefined}
                className={`group flex h-full min-h-[4.8rem] w-full min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-2 text-center transition active:translate-y-[1px] focus:outline focus:outline-2 focus:outline-offset-4 focus:outline-soft-gold sm:min-h-14 sm:flex-row sm:justify-start sm:px-3 sm:text-left ${
                  active
                    ? "border-dark-green bg-dark-green text-white shadow-soft"
                    : completed
                      ? "border-soft-gold/45 bg-soft-gold/20 text-warm-brown"
                      : "border-border-soft bg-surface text-text-primary/72 hover:bg-surface-soft hover:text-text-primary"
                }`}
                onClick={() => onStepChange(step.id)}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition sm:h-10 sm:w-10 ${
                    active || completed
                      ? "border-white/30 bg-white/20 text-current"
                      : "border-border-soft bg-surface text-warm-brown/70 group-hover:border-soft-gold/60 group-hover:bg-soft-gold/10"
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span className="max-w-full text-[0.68rem] font-extrabold leading-3 sm:text-sm sm:leading-5">
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export const RelationshipSelector = ({
  label,
  value,
  members,
  onChange,
  multiple = false,
}: {
  label: string;
  value: string | string[] | null;
  members: FamilyMember[];
  onChange: (value: string | string[] | null) => void;
  multiple?: boolean;
}) => {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const [query, setQuery] = useState("");
  const options = useMemo(() => members.filter((member) => member.fullName.toLowerCase().includes(query.toLowerCase())), [members, query]);
  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-text-primary">{label}</span>
      <input className={inputClass} placeholder={`Cari ${label.toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="mt-2 max-h-52 overflow-y-auto rounded-2xl border border-border-soft bg-surface/80 p-2 shadow-soft">
        <button type="button" className="mb-1 min-h-10 w-full rounded-xl px-3 text-left text-sm font-semibold text-text-muted transition hover:bg-surface-soft active:translate-y-[1px]" onClick={() => onChange(multiple ? [] : null)}>
          Belum dipilih
        </button>
        {options.map((member) => {
          const active = selected.includes(member.id);
          return (
            <button key={member.id} type="button" className={`mb-1 min-h-10 w-full rounded-xl px-3 text-left text-sm font-semibold transition active:translate-y-[1px] ${active ? "bg-dark-green text-white shadow-soft" : "text-text-primary hover:bg-surface-soft"}`} onClick={() => (multiple ? onChange(active ? selected.filter((id) => id !== member.id) : [...selected, member.id]) : onChange(member.id))}>
              {member.fullName}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const MemberPreviewCard = ({ member }: { member: FamilyMember }) => (
  <div className="rounded-[1.5rem] border border-white/75 bg-surface/95 p-4 shadow-warm ring-1 ring-border-soft/60 sm:p-6 xl:sticky xl:top-24 xl:rounded-[2rem]">
    <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.16em] text-sage-green">Preview kartu</p>
    <div className="overflow-hidden rounded-[1.25rem] border border-white/75 bg-background shadow-soft sm:rounded-[1.6rem]">
      <div className="archive-grid grid min-h-[13rem] place-items-center bg-[linear-gradient(135deg,hsl(var(--surface-soft)),hsl(var(--soft-gold)_/_0.22))] p-5">
        <InitialsAvatar member={member.fullName ? member : { ...member, fullName: "Nama Anggota", displayName: "Nama Anggota" }} size="lg" />
      </div>
      <div className="p-5">
        <h3 className="break-words text-lg font-bold leading-tight text-text-primary sm:text-xl">{member.fullName || "Nama lengkap anggota"}</h3>
        <p className="mt-2 text-sm leading-6 text-text-muted">{member.relationshipToRoot || "Hubungan dengan keluarga inti akan tampil di sini."}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-text-muted">
          <span className="rounded-full border border-soft-gold/25 bg-soft-gold/16 px-3 py-1.5 text-warm-brown">Generasi {member.generation}</span>
          <span className="rounded-full border border-sage-green/20 bg-sage-green/12 px-3 py-1.5 text-dark-green">{member.familyBranch}</span>
          {member.isDeceased && <span className="rounded-full border border-border-soft bg-surface px-3 py-1.5">{member.deceasedLabel}</span>}
        </div>
      </div>
    </div>
  </div>
);

export const MemberForm = ({
  members,
  initial,
  onSave,
  onDelete,
  onImport,
  onCancel,
  cancelTo = "/app",
}: {
  members: FamilyMember[];
  initial?: FamilyMember;
  onSave: (member: FamilyMember) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onImport?: (members: FamilyMember[]) => void;
  onCancel?: () => void;
  cancelTo?: string | null;
}) => {
  const [member, setMember] = useState<FamilyMember>(() => initial ?? { ...emptyMember });
  const [jsonData, setJsonData] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [step, setStep] = useState<FormStep>("personal");
  const errors = validateMember(member);
  const statuses = useMemo<FamilyStatus[]>(
    () => Array.from(new Set([...familyConfig.labels.statusOptions, ...members.map((item) => item.statusLabel).filter(Boolean), member.statusLabel])),
    [member.statusLabel, members],
  );
  const branches = useMemo(
    () => Array.from(new Set([familyConfig.site.defaultBranchId ?? "garis-utama", ...members.map((item) => item.familyBranch).filter(Boolean), member.familyBranch])),
    [member.familyBranch, members],
  );
  const stepIndex = formSteps.findIndex((item) => item.id === step);
  const lastStepIndex = formSteps.length - 1;
  const update = <K extends keyof FamilyMember>(field: K, value: FamilyMember[K]) => setMember((current) => ({ ...current, [field]: value }));
  const goToPreviousStep = () => setStep(formSteps[Math.max(0, stepIndex - 1)].id);
  const goToNextStep = () => setStep(formSteps[Math.min(lastStepIndex, stepIndex + 1)].id);
  const save = async () => {
    const id = member.id || slugify(member.fullName || member.displayName || `anggota-${Date.now()}`);
    await onSave({
      ...member,
      id,
      displayName: member.displayName || member.fullName,
      biography: member.biography || `${member.fullName} ${familyConfig.labels.memberBiographyFallback}`,
      relationshipToRoot: member.relationshipToRoot || "Hubungan keluarga belum dilengkapi",
    });
  };
  const importJson = () => {
    if (!onImport) return;
    try {
      const parsed = JSON.parse(jsonData) as FamilyMember[];
      if (Array.isArray(parsed)) {
        onImport(parsed);
        setJsonData("");
      }
    } catch {
      window.alert("Data JSON belum valid. Periksa kembali struktur data keluarga.");
    }
  };
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-6">
      <div className="rounded-[1.25rem] border border-white/75 bg-surface/95 px-3 py-3 shadow-soft ring-1 ring-border-soft/60 sm:rounded-[1.5rem] sm:px-6 sm:py-5 xl:col-span-2">
        <FormStepper currentStep={step} onStepChange={setStep} />
      </div>
      <div className="grid min-w-0 gap-4 xl:gap-6">
        <AnimatePresence mode="wait">
          {step === "personal" && (
            <motion.div
              key="personal"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 140, damping: 22 }}
            >
              <FormSection title="Informasi Pribadi" description="Isi nama dan status anggota dengan lengkap. Nama, gelar, tanda baca, dan apostrof disimpan sebagaimana dimasukkan.">
          <Field label="Nama lengkap"><input className={inputClass} value={member.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Contoh: Hj. Sofu’ah" /></Field>
          <Field label="Nama tampilan"><input className={inputClass} value={member.displayName} onChange={(event) => update("displayName", event.target.value)} placeholder="Nama pendek untuk kartu" /></Field>
          <Field label="Gelar depan"><input className={inputClass} placeholder="Contoh: H., Hj., Ns." /></Field>
          <Field label="Gelar belakang"><input className={inputClass} placeholder="Contoh: S.T, S.Kom, MM" /></Field>
          <FilterSelect label="Jenis kelamin" value={member.gender} options={["male", "female", "unknown"]} onChange={(value) => update("gender", value as Gender)} />
          <Field label="Generasi"><input className={inputClass} min={0} type="number" value={member.generation} onChange={(event) => update("generation", Number(event.target.value))} /></Field>
          <FilterSelect label="Status keluarga" value={member.statusLabel} options={statuses} onChange={(value) => update("statusLabel", value as FamilyStatus)} />
          <FilterSelect label="Status hidup/wafat" value={member.isDeceased ? "Wafat" : "Hidup"} options={["Hidup", "Wafat"]} onChange={(value) => update("isDeceased", value === "Wafat")} />
          <FilterSelect label="Label wafat" value={member.deceasedLabel ?? "Tidak ada"} options={["Tidak ada", "Alm.", "Almh."]} onChange={(value) => update("deceasedLabel", value === "Tidak ada" ? null : (value as "Alm." | "Almh."))} />
          <Field label="Tempat lahir"><input className={inputClass} value={member.birthPlace ?? ""} onChange={(event) => update("birthPlace", event.target.value || null)} placeholder="Belum diketahui" /></Field>
          <Field label="Tanggal lahir"><input className={inputClass} type="date" value={member.birthDate ?? ""} onChange={(event) => update("birthDate", event.target.value || null)} /></Field>
          <Field label="Tanggal wafat"><input className={inputClass} type="date" value={member.deathDate ?? ""} onChange={(event) => update("deathDate", event.target.value || null)} /></Field>
              </FormSection>
            </motion.div>
          )}
          {step === "family" && (
            <motion.div
              key="family"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 140, damping: 22 }}
            >
              <FormSection title="Hubungan Keluarga" description="Pilih relasi keluarga agar pohon dapat tersusun otomatis dan tidak membingungkan.">
          <RelationshipSelector label="Ayah" value={member.fatherId} members={members.filter((item) => item.id !== member.id)} onChange={(value) => update("fatherId", value as string | null)} />
          <RelationshipSelector label="Ibu" value={member.motherId} members={members.filter((item) => item.id !== member.id)} onChange={(value) => update("motherId", value as string | null)} />
          <RelationshipSelector label="Pasangan" multiple value={member.spouseIds} members={members.filter((item) => item.id !== member.id)} onChange={(value) => update("spouseIds", value as string[])} />
          <Field label="Tanggal menikah"><input className={inputClass} type="date" value={member.marriageDate ?? ""} onChange={(event) => update("marriageDate", event.target.value || null)} /></Field>
          <RelationshipSelector label="Mantan pasangan" multiple value={member.formerSpouseIds} members={members.filter((item) => item.id !== member.id)} onChange={(value) => update("formerSpouseIds", value as string[])} />
          <RelationshipSelector label="Anak" multiple value={member.childrenIds} members={members.filter((item) => item.id !== member.id)} onChange={(value) => update("childrenIds", value as string[])} />
          <RelationshipSelector label="Saudara kandung" multiple value={member.siblingIds} members={members.filter((item) => item.id !== member.id)} onChange={(value) => update("siblingIds", value as string[])} />
          <FilterSelect label="Cabang keluarga" value={member.familyBranch} options={branches} onChange={(value) => update("familyBranch", value)} />
          <Field label="Hubungan dengan keluarga inti"><input className={inputClass} value={member.relationshipToRoot} onChange={(event) => update("relationshipToRoot", event.target.value)} placeholder={familyConfig.labels.relationshipPlaceholder} /></Field>
              </FormSection>
            </motion.div>
          )}
          {step === "notes" && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 140, damping: 22 }}
            >
              <FormSection title="Foto dan Biografi" description="Tambahkan catatan yang hangat dan mudah dibaca. Foto dapat berupa URL; jika kosong, avatar inisial dibuat otomatis.">
          <div className="md:col-span-2">
            <PhotoUploadField
              folder="members"
              label="Foto"
              value={member.photo ?? ""}
              onChange={(value) => update("photo", value || null)}
            />
          </div>
          <Field label="Catatan tambahan"><input className={inputClass} value={member.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Catatan singkat" /></Field>
          <label className="md:col-span-2"><span className="mb-2 block text-sm font-semibold text-text-primary">Biografi</span><textarea className={`${inputClass} min-h-36 resize-y`} value={member.biography} onChange={(event) => update("biography", event.target.value)} placeholder="Tuliskan cerita singkat anggota keluarga" /></label>
              </FormSection>
            </motion.div>
          )}
        </AnimatePresence>
        {!!errors.length && <div className="rounded-[1.6rem] border border-warning/25 bg-warning/10 p-4 text-sm font-semibold leading-6 text-warning shadow-soft">{errors.map((error) => <p key={error}>{error}</p>)}</div>}
        {onImport && step === "notes" && (
          <section className="rounded-[1.5rem] border border-white/75 bg-surface/95 p-4 shadow-[0_22px_50px_-36px_rgba(80,54,30,0.82)] ring-1 ring-border-soft/60 sm:p-5 md:rounded-[2rem] md:p-7">
            <h2 className="flex items-center gap-2 text-xl font-bold text-text-primary"><FileJson className="h-5 w-5 text-sage-green" strokeWidth={1.8} />Import Data Keluarga</h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">{familyConfig.labels.importMembersHelp}</p>
            <textarea className={`${inputClass} mt-5 min-h-36 resize-y font-mono text-sm`} value={jsonData} onChange={(event) => setJsonData(event.target.value)} placeholder='[{"id":"contoh","fullName":"Nama Lengkap", ...}]' />
            <div className="mt-4"><SecondaryButton onClick={importJson}>Import Data Keluarga</SecondaryButton></div>
          </section>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {stepIndex > 0 && (
            <SecondaryButton onClick={goToPreviousStep}>
              <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
              Kembali
            </SecondaryButton>
          )}
          {stepIndex < lastStepIndex ? (
            <PrimaryButton onClick={goToNextStep}>
              Lanjut
              <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={() => void save()}><Save className="h-4 w-4" strokeWidth={1.8} />Simpan Anggota</PrimaryButton>
          )}
          {cancelTo ? <SecondaryButton to={cancelTo}>Batal</SecondaryButton> : <SecondaryButton onClick={onCancel}>Batal</SecondaryButton>}
          {initial && onDelete && <SecondaryButton tone="warning" onClick={() => setConfirmOpen(true)}><Trash2 className="h-4 w-4" strokeWidth={1.8} />Hapus Data</SecondaryButton>}
        </div>
      </div>
      <MemberPreviewCard member={member} />
      <ConfirmDialog open={confirmOpen} title="Hapus data anggota?" description="Apakah Anda yakin ingin menghapus data ini? Hubungan keluarga yang terhubung dengan anggota ini dapat terpengaruh. Tindakan ini tidak dapat dibatalkan." onCancel={() => setConfirmOpen(false)} onConfirm={() => { if (initial && onDelete) void onDelete(initial.id); setConfirmOpen(false); }} />
    </div>
  );
};
