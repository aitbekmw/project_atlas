import { api } from "@/api/client";
import type { Application, Job, JobFilters, JobPayload } from "@/types/api";

export async function listJobs(filters: JobFilters = {}): Promise<Job[]> {
  const params: JobFilters = {};
  if (filters.page != null) params.page = filters.page;
  if (filters.size != null) params.size = filters.size;
  if (filters.search) params.search = filters.search;
  if (filters.city) params.city = filters.city;
  if (filters.category_id != null) params.category_id = filters.category_id;
  if (filters.min_salary != null) params.min_salary = filters.min_salary;
  if (filters.status) params.status = filters.status;
  const { data } = await api.get<Job[]>("/jobs", { params });
  return data;
}

export async function getJob(jobId: number): Promise<Job> {
  const { data } = await api.get<Job>(`/jobs/${jobId}`);
  return data;
}

export async function createJob(payload: JobPayload): Promise<Job> {
  const { data } = await api.post<Job>("/jobs", payload);
  return data;
}

export async function updateJob(
  jobId: number,
  payload: Partial<JobPayload> & { is_active?: boolean },
): Promise<Job> {
  const { data } = await api.put<Job>(`/jobs/${jobId}`, payload);
  return data;
}

export async function deleteJob(jobId: number): Promise<void> {
  await api.delete(`/jobs/${jobId}`);
}

export async function completeJob(jobId: number): Promise<Job> {
  const { data } = await api.post<Job>(`/jobs/${jobId}/complete`);
  return data;
}

export async function cancelJob(jobId: number): Promise<Job> {
  const { data } = await api.post<Job>(`/jobs/${jobId}/cancel`);
  return data;
}

export async function getMyJobs(): Promise<Job[]> {
  const { data } = await api.get<Job[]>("/users/me/jobs");
  return data;
}

export async function getJobApplications(jobId: number): Promise<Application[]> {
  const { data } = await api.get<Application[]>(`/jobs/${jobId}/applications`);
  return data;
}
