import type { MessageKey } from "@/i18n/messages";
import type { ApplicationStatus, JobStatus, UserRole } from "@/types/api";

export function jobStatusKey(status: JobStatus): MessageKey {
  switch (status) {
    case "OPEN":
      return "status.open";
    case "IN_PROGRESS":
      return "status.inProgress";
    case "COMPLETED":
      return "status.completed";
    case "CANCELLED":
      return "status.cancelled";
  }
}

export function applicationStatusKey(status: ApplicationStatus): MessageKey {
  switch (status) {
    case "PENDING":
      return "appStatus.pending";
    case "ACCEPTED":
      return "appStatus.accepted";
    case "REJECTED":
      return "appStatus.rejected";
  }
}

export function roleKey(role: UserRole): MessageKey {
  switch (role) {
    case "customer":
      return "role.customer";
    case "worker":
      return "role.worker";
    case "admin":
      return "role.admin";
  }
}
