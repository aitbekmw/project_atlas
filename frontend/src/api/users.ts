import { api } from "@/api/client";
import type { ChangePasswordPayload, User, UserUpdatePayload } from "@/types/api";

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/users/me");
  return data;
}

export async function updateMe(payload: UserUpdatePayload): Promise<User> {
  const { data } = await api.patch<User>("/users/me", payload);
  return data;
}

export async function getUser(userId: number): Promise<User> {
  const { data } = await api.get<User>(`/users/${userId}`);
  return data;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await api.patch("/users/change-password", payload);
}

export async function uploadAvatar(file: File): Promise<User> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<User>("/users/me/avatar", formData, {
    transformRequest: [
      (body, headers) => {
        // Let the browser set multipart/form-data with a boundary.
        // Default axios Content-Type is application/json.
        headers.delete("Content-Type");
        return body;
      },
    ],
  });
  return data;
}

export async function deleteAvatar(): Promise<User> {
  const { data } = await api.delete<User>("/users/me/avatar");
  return data;
}
