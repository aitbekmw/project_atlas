import { Star } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/locale-context";
import { formatDate } from "@/lib/utils";

interface ReviewCardProps {
  rating: number;
  comment: string;
  createdAt?: string | null;
  author?: string;
  recipient?: string;
  jobId?: number;
  jobTitle?: string;
  onDelete?: () => void;
  deleting?: boolean;
}

export function ReviewCard({
  rating,
  comment,
  createdAt,
  author,
  recipient,
  jobId,
  jobTitle,
  onDelete,
  deleting,
}: ReviewCardProps) {
  const { t } = useI18n();
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-0.5 text-amber-500">
          {Array.from({ length: rating }).map((_, index) => (
            <Star key={index} className="h-3.5 w-3.5 fill-current" />
          ))}
        </div>
        <p className="mt-2 line-clamp-4 text-sm leading-5 break-words">{comment}</p>
        <div className="mt-3 space-y-0.5 text-xs text-muted-foreground">
          {author ? (
            <p className="font-medium text-foreground">
              {t("reviews.fromUser", { name: author })}
            </p>
          ) : null}
          {recipient ? <p>{t("reviews.forRecipient", { name: recipient })}</p> : null}
          {jobId ? (
            <p>
              <Link to={`/jobs/${jobId}`} className="hover:text-primary">
                {t("reviews.afterJob", { title: jobTitle ?? t("common.jobFallback", { id: jobId }) })}
              </Link>
            </p>
          ) : jobTitle ? (
            <p>{t("reviews.afterJob", { title: jobTitle })}</p>
          ) : null}
          <p>{formatDate(createdAt)}</p>
        </div>
        {onDelete ? (
          <Button
            className="mt-3"
            variant="ghost"
            size="sm"
            disabled={deleting}
            onClick={onDelete}
          >
            {t("common.delete")}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
