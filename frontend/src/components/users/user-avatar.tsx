import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveAvatarSrc } from "@/lib/avatar";
import { cn, fullName, initials } from "@/lib/utils";
import type { User } from "@/types/api";

type AvatarUser = Pick<User, "first_name" | "last_name" | "avatar">;

export function UserAvatar({
  user,
  className,
}: {
  user: AvatarUser;
  className?: string;
}) {
  const src = resolveAvatarSrc(user.avatar);

  return (
    <Avatar className={cn(className)}>
      {src ? <AvatarImage src={src} alt={fullName(user)} /> : null}
      <AvatarFallback>{initials(user)}</AvatarFallback>
    </Avatar>
  );
}
