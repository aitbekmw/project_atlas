import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, type ChangeEvent } from "react";
import { toast } from "sonner";

import { deleteAvatar, uploadAvatar } from "@/api/users";
import { UserAvatar } from "@/components/users/user-avatar";
import { Button } from "@/components/ui/button";
import {
  isAllowedAvatarType,
  MAX_AVATAR_BYTES,
  resolveAvatarSrc,
} from "@/lib/avatar";
import { useI18n } from "@/i18n/locale-context";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/utils";
import type { User } from "@/types/api";

interface AvatarEditorProps {
  user: User;
  onUpdated: (user: User) => Promise<void> | void;
}

export function AvatarEditor({ user, onUpdated }: AvatarEditorProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const storedValue = user.avatar;
  const displayUrl = resolveAvatarSrc(storedValue);

  const uploadMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: async (updated) => {
      await syncUser(updated);
      toast.success(t("avatar.updated"));
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAvatar,
    onSuccess: async (updated) => {
      await syncUser(updated);
      toast.success(t("avatar.deleted"));
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  async function syncUser(updated: User) {
    queryClient.setQueryData(queryKeys.me, updated);
    queryClient.setQueryData(queryKeys.user(updated.id), updated);
    await onUpdated(updated);
  }

  const busy = uploadMutation.isPending || deleteMutation.isPending;

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (!isAllowedAvatarType(file.type)) {
      toast.error(t("error.unsupportedFile"));
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(t("error.fileTooLarge"));
      return;
    }

    uploadMutation.mutate(file);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <UserAvatar user={user} className="h-20 w-20 text-lg" />
      <div className="min-w-0 flex-1">
        {storedValue ? (
          <p className="truncate text-sm text-muted-foreground" title={displayUrl}>
            {displayUrl}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{t("avatar.none")}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{t("avatar.hint")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {uploadMutation.isPending ? t("avatar.uploading") : t("avatar.upload")}
          </Button>
          {storedValue ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
