export const queryKeys = {
  me: ["me"] as const,
  user: (id: number) => ["user", id] as const,
  jobs: (filters?: object) => ["jobs", filters] as const,
  job: (id: number) => ["job", id] as const,
  myJobs: ["my-jobs"] as const,
  jobApplications: (jobId: number) => ["job-applications", jobId] as const,
  applications: ["applications"] as const,
  myApplications: ["my-applications"] as const,
  categories: ["categories"] as const,
  conversations: ["conversations"] as const,
  conversation: (id: number) => ["conversation", id] as const,
  messages: (conversationId: number) => ["messages", conversationId] as const,
  reviews: ["reviews"] as const,
  userReviews: (userId: number) => ["user-reviews", userId] as const,
  jobCoords: (jobs: Array<{ id: number; city: string; address: string }>) =>
    ["job-coords", jobs.map((job) => `${job.id}:${job.city}:${job.address}`)] as const,
};
