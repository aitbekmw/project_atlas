import { useQuery } from "@tanstack/react-query";

import { getUser } from "@/api/users";
import type { User } from "@/types/api";

export function useUsersMap(ids: number[]) {
  const unique = [...new Set(ids.filter((id) => Number.isFinite(id) && id > 0))].sort(
    (a, b) => a - b,
  );

  return useQuery({
    queryKey: ["users-map", unique],
    enabled: unique.length > 0,
    staleTime: 60_000,
    retry: false,
    queryFn: async () => {
      const entries = await Promise.all(
        unique.map(async (id) => {
          try {
            return [id, await getUser(id)] as const;
          } catch {
            return [id, null] as const;
          }
        }),
      );
      const users: Record<number, User> = {};
      for (const [id, user] of entries) {
        if (user) {
          users[id] = user;
        }
      }
      return users;
    },
  });
}
