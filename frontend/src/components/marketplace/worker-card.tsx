import { BadgeCheck, Star } from "lucide-react";

import { UserAvatar } from "@/components/users/user-avatar";
import { formatRating } from "@/lib/marketplace";
import { ROLE_LABEL, type Review, type User } from "@/types/api";

export interface FeaturedWorker {
  id: number;
  first_name: string;
  last_name: string;
  avatar: string | null;
  verified: boolean;
  roleLabel: string;
  rating: number;
  reviewCount: number;
}

export function featuredWorkersFromReviews(
  reviews: Review[],
  users: Record<number, User>,
  limit = 4,
): FeaturedWorker[] {
  const ratings = new Map<number, number[]>();
  for (const review of reviews) {
    const list = ratings.get(review.to_user_id) ?? [];
    list.push(review.rating);
    ratings.set(review.to_user_id, list);
  }

  return [...ratings.entries()]
    .flatMap(([id, values]) => {
      const user = users[id];
      if (!user || user.role !== "worker") {
        return [];
      }
      const total = values.reduce((sum, value) => sum + value, 0);
      return [
        {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar: user.avatar,
          verified: user.is_verified,
          roleLabel: ROLE_LABEL[user.role],
          rating: total / values.length,
          reviewCount: values.length,
        } satisfies FeaturedWorker,
      ];
    })
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

export function WorkerCard({ worker }: { worker: FeaturedWorker }) {
  return (
    <article className="rounded-2xl border bg-card p-5 transition-colors duration-200 hover:border-primary/30 hover:bg-card-hover">
      <div className="flex items-start gap-3">
        <UserAvatar user={worker} className="h-12 w-12" />
        <div className="min-w-0">
          <h3 className="truncate font-semibold">
            {worker.first_name} {worker.last_name}
            {worker.verified ? (
              <BadgeCheck className="ml-1 inline h-4 w-4 text-primary" aria-label="Проверен" />
            ) : null}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{worker.roleLabel}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
        <div className="rounded-xl bg-secondary px-2 py-2">
          <p className="inline-flex items-center justify-center gap-1 font-semibold">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {formatRating(worker.rating)}
          </p>
          <p className="mt-1 text-muted-foreground">рейтинг</p>
        </div>
        <div className="rounded-xl bg-secondary px-2 py-2">
          <p className="font-semibold">{worker.reviewCount}</p>
          <p className="mt-1 text-muted-foreground">отзывов</p>
        </div>
      </div>
    </article>
  );
}
