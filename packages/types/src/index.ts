// Tipos compartidos web <-> api

export type ApiResponse<T> = { data: T };

export type ApiPaginatedResponse<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type ApiError = {
  error: { code: string; message: string; details?: unknown };
};

export type UserRole = 'admin' | 'seller' | 'buyer';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
