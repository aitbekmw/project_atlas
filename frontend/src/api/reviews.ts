import { api } from "@/api/client";
import type { Review, ReviewPayload } from "@/types/api";

export async function createReview(payload: ReviewPayload): Promise<Review> {
  const { data } = await api.post<Review>("/reviews", payload);
  return data;
}

export async function listReviews(): Promise<Review[]> {
  const { data } = await api.get<Review[]>("/reviews");
  return data;
}

export async function getUserReviews(userId: number): Promise<Review[]> {
  const { data } = await api.get<Review[]>(`/reviews/user/${userId}`);
  return data;
}

export async function getReview(reviewId: number): Promise<Review> {
  const { data } = await api.get<Review>(`/reviews/${reviewId}`);
  return data;
}

export async function deleteReview(reviewId: number): Promise<void> {
  await api.delete(`/reviews/${reviewId}`);
}
