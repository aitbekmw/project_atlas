import { isAxiosError } from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { BCP47, messages, type Locale, type MessageKey } from "@/i18n/messages";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

let activeLocale: Locale = "ru";

export function setActiveLocale(locale: Locale): void {
  activeLocale = locale;
}

export function getActiveLocale(): Locale {
  return activeLocale;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] === undefined ? `{${name}}` : String(vars[name]),
  );
}

function tr(key: MessageKey, vars?: Record<string, string | number>): string {
  const value = messages[activeLocale][key];
  return interpolate(value ?? key, vars);
}

export function getHttpStatus(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "status" in error.response &&
    typeof error.response.status === "number"
  ) {
    return error.response.status;
  }
  return undefined;
}

const AUTH_ERROR_KEYS: Record<string, MessageKey> = {
  "Invalid email or password": "error.invalidCredentials",
  "Email already exists": "auth.emailAlreadyExists",
  "Username already exists": "error.usernameExists",
  "Invalid refresh token": "error.sessionExpired",
  "You have already applied": "error.alreadyApplied",
  "Job is not open for applications": "error.jobNotOpen",
  "You cannot apply to your own job": "error.ownJob",
  "You are not the owner of this job": "error.notOwner",
  "Permission denied": "error.permission",
  "Application not found": "error.applicationNotFound",
  "Job not found": "error.jobNotFound",
  "Access denied": "error.accessDenied",
  "Conversation not found": "error.conversationNotFound",
  "Message not found": "error.messageNotFound",
  "Conversation already exists": "error.conversationExists",
  "Review not found": "error.reviewNotFound",
  "Job is not completed": "error.jobNotCompleted",
  "You cannot review yourself": "error.selfReview",
  "Review already exists": "error.reviewExists",
  "You can review only after the job is completed by its participants":
    "error.reviewParticipants",
  "You can delete only your own reviews": "error.deleteOwnReview",
  "Unsupported file type": "error.unsupportedImage",
  "File too large": "error.fileTooLarge",
  "Email is not verified": "auth.emailNotVerified",
  "Invalid verification code": "error.invalidCode",
  "Verification code expired": "error.codeExpired",
  "Please wait before requesting a new code": "error.resendTooSoon",
  "Email is already verified": "error.emailAlreadyVerified",
  "Password does not meet requirements": "error.weakPassword",
  "Invalid phone number": "error.invalidPhone",
  "Google sign-in is not configured": "auth.googleNotConfigured",
  "Google authentication failed": "auth.googleFailed",
  "Google sign-in was cancelled": "auth.googleCancelled",
  "Google has not verified this email": "auth.googleEmailNotVerified",
  "Complete your Atlas profile": "completeProfile.missingCode",
  "User not found": "error.userNotFound",
  "Current password is incorrect": "error.wrongPassword",
  "New password must be different": "error.passwordSame",
  "Not authenticated": "error.notAuthenticated",
};

function looksTechnical(text: string): boolean {
  return /GET \/|POST \/|DELETE \/|PATCH \/|FastAPI|endpoint|ECONNABORTED|Network Error|Request failed|status code/i.test(
    text,
  );
}

export function getRetryAfter(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "retry_after" in error.response.data
  ) {
    const value = error.response.data.retry_after;
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return Math.ceil(value);
    }
  }
  return undefined;
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return tr("error.timeout");
    }
    if (!error.response) {
      return tr("error.network");
    }
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "detail" in error.response.data
  ) {
    const detail = error.response.data.detail;
    if (typeof detail === "string") {
      const key = AUTH_ERROR_KEYS[detail];
      if (key) {
        if (key === "error.resendTooSoon") {
          return tr(key, { seconds: getRetryAfter(error) ?? 60 });
        }
        return tr(key);
      }
      if (looksTechnical(detail)) {
        return tr("error.generic");
      }
      return tr("error.generic");
    }
    if (Array.isArray(detail) && detail.length > 0) {
      return tr("error.validation");
    }
  }

  if (error instanceof Error) {
    if (error.message === "Network Error" || error.message === "Failed to fetch") {
      return tr("error.network");
    }
    if (looksTechnical(error.message)) {
      return tr("error.generic");
    }
  }

  return tr("error.generic");
}

function numberFormatLocale(locale: Locale): string {
  /* ky-KG grouping is unreliable in some browsers and falls back to en-US commas. */
  return locale === "ky" ? "ru-RU" : BCP47[locale];
}

export function formatMoney(value: number): string {
  return formatMoneyKgs(value);
}

export function formatMoneyKgs(value: number): string {
  const formatted = new Intl.NumberFormat(numberFormatLocale(activeLocale), {
    maximumFractionDigits: 0,
  }).format(value);
  return `${formatted} ${tr("common.kgs")}`;
}

export function formatDistanceKm(km: number): string {
  if (km < 1) {
    return tr("map.m", { value: Math.round(km * 1000) });
  }
  const value = new Intl.NumberFormat(numberFormatLocale(activeLocale), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(km);
  return tr("map.km", { value });
}

export function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(BCP47[activeLocale], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(BCP47[activeLocale], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function fullName(user: {
  first_name: string;
  last_name: string;
}): string {
  return `${user.first_name} ${user.last_name}`.trim();
}

export function initials(user: {
  first_name: string;
  last_name: string;
}): string {
  return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
}
