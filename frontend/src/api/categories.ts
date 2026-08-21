import { api } from "@/api/client";
import type { Category } from "@/types/api";

function isCategory(item: unknown): item is Category {
  return (
    typeof item === "object" &&
    item !== null &&
    typeof (item as Category).id === "number" &&
    typeof (item as Category).name === "string"
  );
}

function parseCategoryList(data: unknown): Category[] {
  if (Array.isArray(data)) {
    return data.filter(isCategory);
  }
  if (
    typeof data === "object" &&
    data !== null &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return (data as { items: unknown[] }).items.filter(isCategory);
  }
  return [];
}

export async function listCategories(): Promise<Category[]> {
  const { data } = await api.get<unknown>("/categories");
  return parseCategoryList(data);
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
