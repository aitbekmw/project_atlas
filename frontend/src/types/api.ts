export const UserRole = {
  CUSTOMER: "customer",
  WORKER: "worker",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const JobStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const PaymentMethod = {
  CASH: "CASH",
  QR: "QR",
  AGREEMENT: "AGREEMENT",
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.CASH,
  PaymentMethod.QR,
  PaymentMethod.AGREEMENT,
];

export function isPaymentMethod(value: string): value is PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod);
}

export const ApplicationStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
} as const;

export type ApplicationStatus =
  (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  is_online: boolean;
  last_seen: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: "customer" | "worker";
  username?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserUpdatePayload {
  first_name?: string;
  last_name?: string;
  phone?: string | null;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  salary: number;
  payment_method: PaymentMethod;
  city: string;
  address: string;
  category_id: number;
  owner_id: number;
  is_active: boolean;
  status: JobStatus;
  created_at: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  distance_km?: number;
}

export interface JobPayload {
  title: string;
  description: string;
  salary: number;
  payment_method: PaymentMethod;
  city: string;
  address: string;
  category_id: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface JobFilters {
  page?: number;
  size?: number;
  search?: string;
  city?: string;
  category_id?: number;
  min_salary?: number;
  payment_method?: PaymentMethod;
  status?: JobStatus;
}

export interface Application {
  id: number;
  worker_id: number;
  job_id: number;
  status: ApplicationStatus;
  created_at: string | null;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  job_id: number;
  from_user_id: number;
  to_user_id: number;
  created_at: string;
}

export interface ReviewPayload {
  job_id: number;
  to_user_id: number;
  rating: number;
  comment: string;
}

export interface Conversation {
  id: number;
  job_id: number;
  customer_id: number;
  worker_id: number;
  created_at: string;
  updated_at: string | null;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  text: string;
  is_delivered: boolean;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

