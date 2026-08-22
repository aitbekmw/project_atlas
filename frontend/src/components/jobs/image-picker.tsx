import { useRef, type ChangeEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/locale-context";
import { isAllowedAvatarType, MAX_AVATAR_BYTES } from "@/lib/avatar";

interface ImagePickerProps {
  file: File | null;
  previewUrl?: string | null;
  onFile: (file: File | null) => void;
}

export function ImagePicker({ file, previewUrl, onFile }: ImagePickerProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const localPreview = file ? URL.createObjectURL(file) : null;
  const src = localPreview ?? previewUrl ?? null;

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!next) {
      return;
    }
    if (!isAllowedAvatarType(next.type)) {
      toast.error(t("error.unsupportedImage"));
      return;
    }
    if (next.size > MAX_AVATAR_BYTES) {
      toast.error(t("error.fileTooLarge"));
      return;
    }
    onFile(next);
  }

  return (
    <div className="grid gap-3">
      {src ? (
        <img
          src={src}
          alt=""
          className="h-40 w-full rounded-2xl border object-cover"
        />
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="min-h-11" onClick={() => inputRef.current?.click()}>
          {src ? t("upload.replace") : t("upload.choose")}
        </Button>
        {file || previewUrl ? (
          <Button type="button" variant="ghost" className="min-h-11" onClick={() => onFile(null)}>
            {t("upload.remove")}
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">{t("upload.hint")}</p>
    </div>
  );
}
