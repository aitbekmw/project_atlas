import { BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/users/user-avatar";
import type { User } from "@/types/api";
import { ROLE_LABEL } from "@/types/api";

interface UserCardProps {
  user: User;
  href?: string;
}

export function UserCard({ user, href }: UserCardProps) {
  const content = (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        <UserAvatar user={user} className="h-12 w-12" />
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {user.first_name} {user.last_name}
            {user.is_verified ? (
              <BadgeCheck className="ml-1 inline h-4 w-4 text-primary" />
            ) : null}
          </p>
          <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary">{ROLE_LABEL[user.role]}</Badge>
            {user.is_online ? (
              <span className="text-xs text-success">онлайн</span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link to={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
