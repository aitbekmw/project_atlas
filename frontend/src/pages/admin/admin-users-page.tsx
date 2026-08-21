import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { UserCard } from "@/components/users/user-card";
import { useI18n } from "@/i18n/locale-context";
import { mockAdminUsers } from "@/mocks/admin-users";

export function AdminUsersPage() {
  const { t } = useI18n();
  return (
    <div>
      <PageHeader
        title={t("admin.usersTitle")}
        description={t("admin.usersHint")}
      />
      <div className="mb-4 rounded-xl border border-dashed bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
        {t("admin.usersNote")}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mockAdminUsers.map((user) => (
          <div key={user.id} className="relative">
            <Badge variant="warning" className="absolute right-3 top-3 z-10">
              {t("admin.sample")}
            </Badge>
            <UserCard user={user} />
          </div>
        ))}
      </div>
    </div>
  );
}
