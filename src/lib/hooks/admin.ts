"use client";

import { useState, useCallback, useEffect } from "react";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions<T> {
  initialData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

/**
 * Admin sayfaları için ortak API çağrı hook'u
 * Tutarlı loading, error handling ve state yönetimi sağlar
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  options: UseApiOptions<T> = {},
) {
  const { initialData = null, onSuccess, onError } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: true,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
      onSuccess?.(data);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Bir hata oluştu";
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      onError?.(errorMessage);
      return null;
    }
  }, [fetcher, onSuccess, onError]);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  return {
    ...state,
    execute,
    refetch,
    setData: (data: T) => setState((prev) => ({ ...prev, data })),
  };
}

/**
 * Sayfa yüklenirken otomatik fetch yapan hook
 */
export function useApiOnMount<T>(
  fetcher: () => Promise<T>,
  options: UseApiOptions<T> = {},
) {
  const api = useApi(fetcher, options);

  useEffect(() => {
    api.execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return api;
}

/**
 * Debounce hook - arama vb. için
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Pagination state yönetimi
 */
export function usePagination(initialPage = 1, initialLimit = 10) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
      }
    },
    [totalPages],
  );

  const nextPage = useCallback(() => {
    if (hasNext) setPage((p) => p + 1);
  }, [hasNext]);

  const prevPage = useCallback(() => {
    if (hasPrev) setPage((p) => p - 1);
  }, [hasPrev]);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    setPage,
    setLimit,
    setTotal,
    goToPage,
    nextPage,
    prevPage,
  };
}

/**
 * Format helpers
 */
export function formatDate(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(
    "tr-TR",
    options || {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("tr-TR");
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return "Az önce";
  if (hours < 24) return `${hours} saat önce`;
  if (days < 7) return `${days} gün önce`;
  return formatDate(dateStr);
}

export function formatPrice(price: string | number): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}

export function formatArea(area: number | string): string {
  const numArea = typeof area === "string" ? parseFloat(area) : area;
  return `${numArea.toLocaleString("tr-TR")} m²`;
}
