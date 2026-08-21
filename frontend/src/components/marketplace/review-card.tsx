import { Star } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface ReviewCardProps {
  rating: number;
  comment: string;
  createdAt?: string | null;
  author?: string;
  recipient?: string;
  jobId?: number;
  jobTitle?: string;
  demo?: boolean;
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
  demo = false,
  onDelete,
  deleting,
}: ReviewCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-1 text-amber-500">
          {Array.from({ length: rating }).map((_, index) => (
            <Star key={index} className="h-4 w-4 fill-current" />
          ))}
        </div>
        <p className="mt-3 text-sm leading-6">{comment}</p>
        <div className="mt-4 space-y-1 text-xs text-muted-foreground">
          {author ? <p className="font-medium text-foreground">{author}</p> : null}
          {recipient ? <p>Оценка для: {recipient}</p> : null}
          {jobId ? (
            <p>
              <Link to={`/jobs/${jobId}`} className="hover:text-primary">
                {jobTitle ?? `Заказ #${jobId}`}
              </Link>
            </p>
          ) : jobTitle ? (
            <p>{jobTitle}</p>
          ) : null}
          <p>
            {formatDate(createdAt)}
            {demo ? " · демо" : ""}
          </p>
        </div>
        {onDelete ? (
          <Button
            className="mt-3"
            variant="ghost"
            size="sm"
            disabled={deleting}
            onClick={onDelete}
          >
            Удалить
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
