/**
 * API Client
 * @module lib/api-client
 * @description Standardized API fetch utilities with type safety
 */

import { toast } from "sonner";
import type { ApiResponse, ApiErrorResponse, ErrorCode } from "./api-utils";
import { ErrorCodes, isApiSuccess, isApiError } from "./api-utils";
import type { Listing, CreateListingInput } from "@/types/admin/listing";

// ============================================================================
// CORE FETCH FUNCTION
// ============================================================================

/**
 * Type-safe API fetch wrapper with standardized error handling
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Standardized API response
 */
export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      toast.error("Çok fazla istek gönderdiniz", {
        description: retryAfter
          ? `${retryAfter} saniye sonra tekrar deneyin.`
          : "Lütfen biraz bekleyip tekrar deneyin.",
      });
      return {
        success: false,
        error: {
          code: ErrorCodes.RATE_LIMIT,
          message: "Çok fazla istek gönderildi",
          details: retryAfter
            ? { retryAfter: parseInt(retryAfter) }
            : undefined,
        },
      };
    }

    // Parse response
    const data = await response.json();

    // If response already follows our standard format, return as-is
    if (typeof data === "object" && "success" in data) {
      return data as ApiResponse<T>;
    }

    // Legacy response format handling (during migration)
    if (!response.ok) {
      return {
        success: false,
        error: {
          code: mapStatusToErrorCode(response.status),
          message: data.error || data.message || "Bir hata oluştu",
          details: data.details,
        },
      };
    }

    // Transform legacy success response
    return {
      success: true,
      data: data.data ?? data,
      ...(data.pagination && { pagination: data.pagination }),
      ...(data.message && { message: data.message }),
    };
  } catch (error) {
    console.error(`API Error (${url}):`, error);
    return {
      success: false,
      error: {
        code: ErrorCodes.NETWORK_ERROR,
        message: "Bağlantı hatası oluştu",
        details: error instanceof Error ? error.message : error,
      },
    };
  }
}

/**
 * Map HTTP status code to error code
 */
function mapStatusToErrorCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCodes.BAD_REQUEST;
    case 401:
      return ErrorCodes.UNAUTHORIZED;
    case 403:
      return ErrorCodes.FORBIDDEN;
    case 404:
      return ErrorCodes.NOT_FOUND;
    case 409:
      return ErrorCodes.CONFLICT;
    case 429:
      return ErrorCodes.RATE_LIMIT;
    default:
      return status >= 500 ? ErrorCodes.SERVER_ERROR : ErrorCodes.BAD_REQUEST;
  }
}

// ============================================================================
// LEGACY FETCH FUNCTION (backward compatibility)
// ============================================================================

/**
 * @deprecated Use apiFetch instead. This is kept for backward compatibility.
 */
export async function legacyApiFetch(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      toast.error("Çok fazla istek gönderdiniz", {
        description: retryAfter
          ? `${retryAfter} saniye sonra tekrar deneyin.`
          : "Lütfen biraz bekleyip tekrar deneyin.",
      });
      throw new Error("RATE_LIMIT_EXCEEDED");
    }

    if (!response.ok) {
      const errorData = await response.json().catch((err) => {
        console.error("API response parsing failed:", err);
        return {};
      });
      throw {
        status: response.status,
        ...errorData,
      };
    }

    return await response.json();
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "RATE_LIMIT_EXCEEDED")
      throw error;

    console.error(`API Error (${url}):`, error);
    throw error;
  }
}

// ============================================================================
// TYPED API METHODS
// ============================================================================

export const api = {
  /**
   * Listings API
   */
  listings: {
    list: (params?: URLSearchParams) =>
      apiFetch<Listing[]>(`/api/listings${params ? `?${params}` : ""}`),

    get: (id: string) => apiFetch<Listing>(`/api/listings/${id}`),

    create: (data: CreateListingInput) =>
      apiFetch<Listing>("/api/listings", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Listing>) =>
      apiFetch<Listing>(`/api/listings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiFetch<void>(`/api/listings/${id}`, { method: "DELETE" }),

    feature: (id: string, isFeatured: boolean) =>
      apiFetch<Listing>(`/api/listings/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isFeatured }),
      }),

    updateStatus: (id: string, status: string) =>
      apiFetch<Listing>(`/api/listings/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },

  /**
   * Generic helpers
   */
  get: <T>(url: string) => apiFetch<T>(url),
  post: <T>(url: string, data: unknown) =>
    apiFetch<T>(url, { method: "POST", body: JSON.stringify(data) }),
  patch: <T>(url: string, data: unknown) =>
    apiFetch<T>(url, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(url: string) => apiFetch<T>(url, { method: "DELETE" }),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Handle API response with automatic error toast
 * @param response - API response
 * @param successMessage - Optional success message to show
 * @returns Data if successful, undefined if error
 */
export function handleApiResponse<T>(
  response: ApiResponse<T>,
  successMessage?: string,
): T | undefined {
  if (isApiSuccess(response)) {
    if (successMessage) {
      toast.success(successMessage);
    }
    return response.data;
  }

  if (isApiError(response)) {
    toast.error(response.error.message);
    return undefined;
  }

  return undefined;
}

/**
 * Extract error message from API response
 */
export function getErrorMessage(response: ApiErrorResponse): string {
  return response.error.message;
}

// Re-export types for convenience
export type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
} from "./api-utils";
export { isApiSuccess, isApiError } from "./api-utils";
