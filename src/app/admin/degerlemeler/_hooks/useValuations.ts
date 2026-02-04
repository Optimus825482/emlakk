"use client";

import { useState, useEffect, useCallback } from "react";
import type { Valuation, ApiResponse, GroupedValuation } from "../_types";
import { PAGE_SIZE } from "../_types";

interface UseValuationsReturn {
  valuations: Valuation[];
  loading: boolean;
  filter: string;
  setFilter: (filter: string) => void;
  selectedValuation: string | null;
  setSelectedValuation: (id: string | null) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  total: number;
  groupByUser: boolean;
  setGroupByUser: (value: boolean) => void;
  groupedData: GroupedValuation[];
  toggleGroup: (userId: string, date: string) => void;
  refetch: () => void;
  handleDelete: (id: string) => Promise<void>;
}

export function useValuations(): UseValuationsReturn {
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedValuation, setSelectedValuation] = useState<string | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [groupByUser, setGroupByUser] = useState(true);
  const [groupedData, setGroupedData] = useState<GroupedValuation[]>([]);

  const groupValuations = useCallback((data: Valuation[]) => {
    const groups: Record<string, GroupedValuation> = {};

    data.forEach((val) => {
      const date = new Date(val.createdAt).toLocaleDateString("tr-TR");
      const userId = val.email || val.phone || "unknown";
      const key = `${userId}_${date}`;

      if (!groups[key]) {
        groups[key] = {
          userId,
          userName: val.name || "İsimsiz",
          date,
          valuations: [],
          expanded: false,
        };
      }

      groups[key].valuations.push(val);
    });

    setGroupedData(Object.values(groups));
  }, []);

  const fetchValuations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.set("propertyType", filter);
      params.set("page", page.toString());
      params.set("limit", PAGE_SIZE.toString());

      const response = await fetch(`/api/valuations?${params.toString()}`);
      if (!response.ok) throw new Error("Değerlemeler yüklenemedi");

      const result: ApiResponse = await response.json();
      setValuations(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);

      if (groupByUser) {
        groupValuations(result.data);
      }
    } catch (error) {
      console.error("Değerleme yükleme hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, page, groupByUser, groupValuations]);

  const toggleGroup = useCallback((userId: string, date: string) => {
    setGroupedData((prev) =>
      prev.map((group) =>
        group.userId === userId && group.date === date
          ? { ...group, expanded: !group.expanded }
          : group,
      ),
    );
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Bu değerleme talebini silmek istediğinize emin misiniz?")) {
        return;
      }

      try {
        const response = await fetch(`/api/valuations/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Silme işlemi başarısız");
        }

        setSelectedValuation(null);
        fetchValuations();
      } catch (error) {
        console.error("Silme hatası:", error);
        alert("Silme işlemi sırasında bir hata oluştu");
      }
    },
    [fetchValuations],
  );

  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter);
    setPage(1);
  }, []);

  useEffect(() => {
    fetchValuations();
  }, [fetchValuations]);

  return {
    valuations,
    loading,
    filter,
    setFilter: handleFilterChange,
    selectedValuation,
    setSelectedValuation,
    page,
    setPage,
    totalPages,
    total,
    groupByUser,
    setGroupByUser,
    groupedData,
    toggleGroup,
    refetch: fetchValuations,
    handleDelete,
  };
}
