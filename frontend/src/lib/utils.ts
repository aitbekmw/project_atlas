import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

export function getErrorMessage(error: unknown): string {
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
      return AUTH_ERROR_MESSAGES[detail] ?? detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: unknown };
      if (typeof first?.msg === "string") {
        return first.msg.replace(/^Value error,\s*/i, "");
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Произошла ошибка. Попробуйте ещё раз.";
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "Invalid email or password": "Неверный email или пароль",
  "Email already exists": "Этот email уже зарегистрирован",
  "Username already exists": "Это имя пользователя уже занято",
  "Invalid refresh token": "Сессия истекла. Войдите снова",
  "You have already applied": "Вы уже откликнулись на этот заказ",
  "Job is not open for applications": "Этот заказ больше не принимает отклики",
  "You cannot apply to your own job": "Нельзя откликнуться на свой заказ",
  "You are not the owner of this job": "Только владелец заказа может это сделать",
  "Permission denied": "Недостаточно прав для этого действия",
  "Application not found": "Отклик не найден",
  "Job not found": "Заказ не найден",
  "Access denied": "Нет доступа к этому диалогу",
  "Conversation not found": "Диалог не найден",
  "Message not found": "Сообщение не найдено",
  "Conversation already exists": "Диалог по этому заказу уже создан",
  "Review not found": "Отзыв не найден",
  "Job is not completed": "Отзыв можно оставить только после завершения заказа",
  "You cannot review yourself": "Нельзя оставить отзыв самому себе",
  "Review already exists": "Вы уже оставили отзыв по этому заказу",
  "You can review only after the job is completed by its participants":
    "Отзыв доступен только участникам завершённого заказа",
  "You can delete only your own reviews": "Можно удалить только свой отзыв",
  "Unsupported file type": "Можно загрузить JPEG, PNG или WebP",
  "File too large": "Файл больше 5 МБ",
  "User not found": "Пользователь не найден",
  "Current password is incorrect": "Текущий пароль неверный",
  "New password must be different": "Новый пароль должен отличаться от текущего",
  "Not authenticated": "Нужна авторизация",
};


export function formatMoney(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value) + " сом";
}

export function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
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
