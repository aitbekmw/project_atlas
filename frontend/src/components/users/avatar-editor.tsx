import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, type ChangeEvent } from "react";
import { toast } from "sonner";

import { deleteAvatar, uploadAvatar } from "@/api/users";
import { UserAvatar } from "@/components/users/user-avatar";
import { Button } from "@/components/ui/button";
import {
  AVATAR_ACCEPT,
  isAllowedAvatarType,
  MAX_AVATAR_BYTES,
  resolveAvatarSrc,
} from "@/lib/avatar";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/utils";
import type { User } from "@/types/api";

interface AvatarEditorProps {
  user: User;
  onUpdated: (user: User) => Promise<void> | void;
}

export function AvatarEditor({ user, onUpdated }: AvatarEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const storedValue = user.avatar;
  const displayUrl = resolveAvatarSrc(storedValue);

  const uploadMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: async (updated) => {
      await syncUser(updated);
      toast.success("Фото профиля обновлено");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAvatar,
    onSuccess: async (updated) => {
      await syncUser(updated);
      toast.success("Фото профиля удалено");
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
      toast.error("Можно загрузить JPEG, PNG или WebP");
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Файл больше 5 МБ");
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
          <p className="text-sm text-muted-foreground">Фото не загружено — показаны инициалы</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG или WebP, до 5 МБ</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={AVATAR_ACCEPT}
            className="hidden"
            onChange={onFileChange}
          />
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {uploadMutation.isPending ? "Загрузка…" : "Загрузить фото"}
          </Button>
          {storedValue ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Удаление…" : "Удалить"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
