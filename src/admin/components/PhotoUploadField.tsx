import { ImageUp } from "lucide-react";
import { useId, useState } from "react";
import { iconStroke } from "../../components/ui";
import { authFetch } from "../../lib/api";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxUploadBytes = 4 * 1024 * 1024;

export const photoInputClass =
  "min-h-12 w-full rounded-2xl border border-border-soft bg-background px-4 py-3 text-sm font-semibold text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/65 focus:border-dark-green focus:ring-4 focus:ring-sage-green/12";

type PhotoUploadFieldProps = {
  folder: "members" | "gallery";
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function PhotoUploadField({ folder, label, value, onChange }: PhotoUploadFieldProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const uploadFile = async (file: File) => {
    setError("");

    if (!acceptedTypes.includes(file.type)) {
      setError("Format harus JPG, PNG, atau WebP.");
      return;
    }

    if (file.size > maxUploadBytes) {
      setError("Ukuran foto maksimal 4 MB.");
      return;
    }

    setUploading(true);
    try {
      const params = new URLSearchParams({
        folder,
        filename: file.name,
      });
      const response = await authFetch(`/api/uploads/photos?${params.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });
      const responseText = await response.text();
      const responseType = response.headers.get("content-type") ?? "";
      const result = responseType.includes("application/json")
        ? (JSON.parse(responseText) as { url?: string; error?: string })
        : {
            error: responseText.trim().startsWith("<!DOCTYPE")
              ? "Endpoint upload belum aktif. Restart backend dev server atau cek routing /api/uploads/photos."
              : responseText || "Upload foto gagal.",
          };

      if (!response.ok || !result.url) {
        throw new Error(result.error || "Upload foto gagal.");
      }

      onChange(result.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload foto gagal.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-text-primary">{label}</span>
          <input
            className={photoInputClass}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="URL foto atau hasil upload WebP"
          />
        </label>
        <div>
          <input
            id={inputId}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void uploadFile(file);
            }}
          />
          <label
            htmlFor={inputId}
            className={`inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border-soft bg-surface px-4 py-3 text-sm font-bold text-text-primary shadow-soft transition hover:-translate-y-0.5 hover:bg-surface-soft active:translate-y-[1px] sm:w-auto ${
              uploading ? "pointer-events-none opacity-65" : ""
            }`}
          >
            <ImageUp className="h-4 w-4 text-sage-green" strokeWidth={iconStroke} />
            {uploading ? "Mengupload..." : "Upload Foto"}
          </label>
        </div>
      </div>

      {value && (
        <div className="overflow-hidden rounded-[1.35rem] border border-border-soft bg-background shadow-soft">
          <img className="h-48 w-full object-cover" src={value} alt="Preview foto upload" />
        </div>
      )}

      {error && (
        <p className="rounded-2xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
          {error}
        </p>
      )}
    </div>
  );
}
