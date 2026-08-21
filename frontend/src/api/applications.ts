import { api } from "@/api/client";
import type { Application, ApplicationStatus } from "@/types/api";

export async function createApplication(jobId: number): Promise<Application> {
  const { data } = await api.post<Application>("/applications", { job_id: jobId });
  return data;
}

export async function listApplications(): Promise<Application[]> {
  const { data } = await api.get<Application[]>("/applications");
  return data;
}

export async function getApplication(applicationId: number): Promise<Application> {
  const { data } = await api.get<Application>(`/applications/${applicationId}`);
  return data;
}

export async function getMyApplications(): Promise<Application[]> {
  const { data } = await api.get<Application[]>("/users/me/applications");
  return data;
}

export async function acceptApplication(applicationId: number): Promise<Application> {
  const { data } = await api.post<Application>(
    `/applications/${applicationId}/accept`,
  );
  return data;
}

export async function rejectApplication(applicationId: number): Promise<Application> {
  const { data } = await api.post<Application>(
    `/applications/${applicationId}/reject`,
  );
  return data;
}

export async function withdrawApplication(applicationId: number): Promise<void> {
  await api.delete(`/applications/${applicationId}`);
}

export async function updateApplicationStatus(
  applicationId: number,
  status: ApplicationStatus,
): Promise<Application> {
  const { data } = await api.put<Application>(`/applications/${applicationId}`, {
    status,
  });
  return data;
}
