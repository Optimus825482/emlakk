/**
 * API Response Utilities
 * @module lib/api-utils
 * @description Standardized API response helpers and types
 */

import { NextResponse } from "next/server";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Standard success response structure
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
}

/**
 * Standard error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// ERROR CODES
// ============================================================================

export const ErrorCodes = {
  // Client errors (4xx)
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMIT: "RATE_LIMIT",
  CONFLICT: "CONFLICT",

  // Server errors (5xx)
  SERVER_ERROR: "SERVER_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",

  // Network errors (client-side)
  NETWORK_ERROR: "NETWORK_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Create a standardized success response
 * @param data - Response payload
 * @param options - Optional message and pagination
 */
export function successResponse<T>(
  data: T,
  options?: {
    message?: string;
    pagination?: PaginationMeta;
    status?: number;
  },
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };

  if (options?.message) {
    response.message = options.message;
  }

  if (options?.pagination) {
    response.pagination = options.pagination;
  }

  return NextResponse.json(response, { status: options?.status ?? 200 });
}

/**
 * Create a standardized error response
 * @param message - Human-readable error message
 * @param code - Error code for programmatic handling
 * @param status - HTTP status code
 * @param details - Additional error details (validation errors, etc.)
 */
export function errorResponse(
  message: string,
  code: ErrorCode | string = ErrorCodes.BAD_REQUEST,
  status: number = 400,
  details?: unknown,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined && { details }),
      },
    } as ApiErrorResponse,
    { status },
  );
}

// ============================================================================
// PRE-BUILT ERROR RESPONSES
// ============================================================================

export const errors = {
  /**
   * 401 Unauthorized - No valid authentication
   */
  unauthorized: (message: string = "Yetkisiz erişim") =>
    errorResponse(message, ErrorCodes.UNAUTHORIZED, 401),

  /**
   * 403 Forbidden - Authenticated but not authorized
   */
  forbidden: (message: string = "Bu işlem için yetkiniz yok") =>
    errorResponse(message, ErrorCodes.FORBIDDEN, 403),

  /**
   * 404 Not Found - Resource doesn't exist
   */
  notFound: (resource: string = "Kaynak") =>
    errorResponse(`${resource} bulunamadı`, ErrorCodes.NOT_FOUND, 404),

  /**
   * 400 Bad Request - Invalid request
   */
  badRequest: (message: string, details?: unknown) =>
    errorResponse(message, ErrorCodes.BAD_REQUEST, 400, details),

  /**
   * 400 Validation Error - Schema validation failed
   */
  validation: (errors: unknown) =>
    errorResponse("Doğrulama hatası", ErrorCodes.VALIDATION_ERROR, 400, errors),

  /**
   * 409 Conflict - Resource already exists
   */
  conflict: (message: string = "Kaynak zaten mevcut") =>
    errorResponse(message, ErrorCodes.CONFLICT, 409),

  /**
   * 429 Rate Limit - Too many requests
   */
  rateLimit: (retryAfter?: number) =>
    errorResponse(
      "Çok fazla istek gönderildi",
      ErrorCodes.RATE_LIMIT,
      429,
      retryAfter ? { retryAfter } : undefined,
    ),

  /**
   * 500 Server Error - Internal server error
   */
  serverError: (message: string = "Sunucu hatası oluştu") =>
    errorResponse(message, ErrorCodes.SERVER_ERROR, 500),

  /**
   * 500 Database Error - Database operation failed
   */
  databaseError: (message: string = "Veritabanı hatası oluştu") =>
    errorResponse(message, ErrorCodes.DATABASE_ERROR, 500),
};

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

/**
 * Create pagination metadata from query results
 * @param page - Current page (1-indexed)
 * @param limit - Items per page
 * @param total - Total item count
 */
export function createPagination(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Parse pagination parameters from request
 * @param searchParams - URL search params
 * @param defaults - Default values
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number } = {},
): { page: number; limit: number; offset: number } {
  const page = Math.max(
    1,
    parseInt(searchParams.get("page") || "") || defaults.page || 1,
  );
  const limit = Math.min(
    100,
    Math.max(
      1,
      parseInt(searchParams.get("limit") || "") || defaults.limit || 12,
    ),
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if response is successful
 */
export function isApiSuccess<T>(
  response: ApiResponse<T>,
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Check if response is an error
 */
export function isApiError<T>(
  response: ApiResponse<T>,
): response is ApiErrorResponse {
  return response.success === false;
}
