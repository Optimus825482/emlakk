/**
 * Pagination & API Response Types
 * @module types/admin/pagination
 * @description Merkezi sayfalama ve API yanıt tip tanımları
 */

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: PaginationInfo;
  error?: ApiError;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
  error?: ApiError;
}

// ============================================================================
// FILTER & SORT TYPES
// ============================================================================

export type SortDirection = "asc" | "desc";

export interface SortParams<T extends string = string> {
  field: T;
  direction: SortDirection;
}

export interface FilterParams {
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface QueryParams extends PaginationParams {
  search?: string;
  sort?: string;
  order?: SortDirection;
  [key: string]: string | number | boolean | undefined;
}

// ============================================================================
// COMMON ERROR CODES
// ============================================================================

export const API_ERROR_CODES = {
  // Genel hatalar
  INTERNAL_ERROR: "INTERNAL_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",

  // İlan hataları
  LISTING_NOT_FOUND: "LISTING_NOT_FOUND",
  LISTING_ALREADY_EXISTS: "LISTING_ALREADY_EXISTS",
  INVALID_LISTING_TYPE: "INVALID_LISTING_TYPE",

  // İletişim hataları
  CONTACT_NOT_FOUND: "CONTACT_NOT_FOUND",
  SPAM_DETECTED: "SPAM_DETECTED",

  // Randevu hataları
  APPOINTMENT_NOT_FOUND: "APPOINTMENT_NOT_FOUND",
  APPOINTMENT_CONFLICT: "APPOINTMENT_CONFLICT",
  INVALID_APPOINTMENT_DATE: "INVALID_APPOINTMENT_DATE",

  // Değerleme hataları
  VALUATION_NOT_FOUND: "VALUATION_NOT_FOUND",
  VALUATION_FAILED: "VALUATION_FAILED",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function createPaginationInfo(
  page: number,
  limit: number,
  total: number,
): PaginationInfo {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

export function createSuccessResponse<T>(
  data: T,
  pagination?: PaginationInfo,
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(pagination && { pagination }),
  };
}

export function createListResponse<T>(
  data: T[],
  pagination: PaginationInfo,
): ApiListResponse<T> {
  return {
    success: true,
    data,
    pagination,
  };
}

export function createErrorResponse<T>(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, string[]>,
): ApiResponse<T> {
  return {
    success: false,
    data: null as T,
    error: { code, message, details },
  };
}

export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number } = {},
): PaginationParams {
  const page = parseInt(
    searchParams.get("page") || String(defaults.page || 1),
    10,
  );
  const limit = parseInt(
    searchParams.get("limit") || String(defaults.limit || 20),
    10,
  );

  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)),
  };
}

export function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
}

export function getOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
