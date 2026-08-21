import { api } from "@/api/client";
import type { Category } from "@/types/api";

export async function listCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

export async function createCategory(payload: {
  name: string;
  description?: string;
  icon?: string;
}): Promise<Category> {
  const { data } = await api.post<Category>("/categories", payload);
  return data;
}

export async function updateCategory(
  categoryId: number,
  payload: Partial<Pick<Category, "name" | "description" | "icon" | "is_active">>,
): Promise<Category> {
  const { data } = await api.put<Category>(`/categories/${categoryId}`, payload);
  return data;
}

export async function deleteCategory(categoryId: number): Promise<void> {
  await api.delete(`/categories/${categoryId}`);
}
