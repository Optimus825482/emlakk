"use client";

import { useState, useEffect, useCallback } from "react";

export interface BadgeCounts {
  appointments: number;
  messages: number;
  valuations: number;
}

export function useAdminCounts(intervalMs: number = 30000) {
  const [counts, setCounts] = useState<BadgeCounts>({
    appointments: 0,
    messages: 0,
    valuations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/counts");
      if (!res.ok) throw new Error("Sayaçlar yüklenemedi");
      const data = await res.json();
      setCounts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Bilinmeyen hata"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    if (intervalMs > 0) {
      const interval = setInterval(fetchCounts, intervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchCounts, intervalMs]);

  return { counts, loading, error, refetch: fetchCounts };
}
