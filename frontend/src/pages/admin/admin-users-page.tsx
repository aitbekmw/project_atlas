import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { UserCard } from "@/components/users/user-card";
import { mockAdminUsers } from "@/mocks/admin-users";

export function AdminUsersPage() {
  return (
    <div>
      <PageHeader
        title="Пользователи"
        description="GET /users в backend нет. Ниже демо-карточки, это не записи из PostgreSQL."
      />
      <div className="mb-4 rounded-xl border border-dashed bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
        Демо-список. Реальные профили доступны только по `GET /users/me` и `GET /users/{"{id}"}`.
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mockAdminUsers.map((user) => (
          <div key={user.id} className="relative">
            <Badge variant="warning" className="absolute right-3 top-3 z-10">
              демо
            </Badge>
            <UserCard user={user} />
          </div>
        ))}
      </div>
    </div>
  );
}
