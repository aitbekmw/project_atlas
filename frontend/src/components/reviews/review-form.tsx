import { Star } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/locale-context";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (values: { rating: number; comment: string }) => Promise<void> | void;
}

export function ReviewForm({
  submitLabel,
  isSubmitting,
  onSubmit,
}: ReviewFormProps) {
  const { t } = useI18n();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const text = comment.trim();
        if (!text) {
          setError(t("reviews.commentRequired"));
          return;
        }
        setError(null);
        await onSubmit({ rating, comment: text });
        setComment("");
        setRating(5);
      }}
    >
      <div className="grid gap-2">
        <Label>{t("reviews.rating")}</Label>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, index) => {
            const value = index + 1;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded-md p-1 text-amber-500 hover:bg-secondary"
                aria-label={t("reviews.stars", { value })}
              >
                <Star
                  className={cn("h-5 w-5", value <= rating ? "fill-current" : "text-muted-foreground")}
                />
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="review-comment">{t("reviews.comment")}</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={t("reviews.commentPlaceholder")}
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t("reviews.sending") : submitLabel ?? t("reviews.submit")}
      </Button>
    </form>
  );
}
