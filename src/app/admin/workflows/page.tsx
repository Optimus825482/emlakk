"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";

interface WorkflowLog {
  id: string;
  workflowName: string;
  workflowId: string | null;
  status: "pending" | "running" | "completed" | "failed";
  entityType: string | null;
  entityId: string | null;
  result: Record<string, unknown> | null;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface WorkflowStats {
  total: number;
  completed: number;
  failed: number;
  running: number;
  pending: number;
}

const WORKFLOW_INFO: Record<
  string,
  { label: string; icon: string; description: string }
> = {
  "appointment-reminder": {
    label: "Randevu Hatırlatma",
    icon: "calendar_month",
    description: "Randevu onayı ve hatırlatma e-postaları",
  },
  "ai-valuation": {
    label: "AI Değerleme",
    icon: "analytics",
    description: "Yapay zeka ile gayrimenkul değerleme",
  },
  "listing-description": {
    label: "İlan Açıklaması",
    icon: "description",
    description: "AI ile profesyonel ilan açıklaması oluşturma",
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  pending: {
    label: "Bekliyor",
    color: "text-yellow-400 bg-yellow-400/10",
    icon: "schedule",
  },
  running: {
    label: "Çalışıyor",
    color: "text-blue-400 bg-blue-400/10",
    icon: "sync",
  },
  completed: {
    label: "Tamamlandı",
    color: "text-emerald-400 bg-emerald-400/10",
    icon: "check_circle",
  },
  failed: {
    label: "Başarısız",
    color: "text-red-400 bg-red-400/10",
    icon: "error",
  },
};

export default function AdminWorkflowsPage() {
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Her 10 saniyede güncelle
    return () => clearInterval(interval);
  }, [filter]);

  async function fetchLogs() {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);

      const response = await fetch(`/api/workflows/logs?${params}`);
      if (response.ok) {
        const result = await response.json();
        setLogs(result.data || []);
        setStats(result.stats);
      }
    } catch (error) {
      console.error("Workflow logs yüklenemedi:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchLogs();
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getDuration(start: string, end: string | null) {
    if (!end) return "—";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 60000)}dk`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon name="sync" className="text-4xl text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
            Workflow Yönetimi
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Arka plan işlemlerini izleyin ve yönetin
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Icon name="refresh" className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Yenileniyor..." : "Yenile"}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                <Icon name="list_alt" className="text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-slate-500">Toplam</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Icon name="check_circle" className="text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">
                  {stats.completed}
                </p>
                <p className="text-xs text-slate-500">Tamamlanan</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Icon name="sync" className="text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {stats.running}
                </p>
                <p className="text-xs text-slate-500">Çalışan</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Icon name="error" className="text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">
                  {stats.failed}
                </p>
                <p className="text-xs text-slate-500">Başarısız</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(WORKFLOW_INFO).map(([key, info]) => (
          <div
            key={key}
            className="bg-slate-800 border border-slate-700 rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Icon name={info.icon} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{info.label}</h3>
                <p className="text-xs text-slate-500">{info.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "Tümü" },
          { key: "running", label: "Çalışan" },
          { key: "completed", label: "Tamamlanan" },
          { key: "failed", label: "Başarısız" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-emerald-500 text-slate-900"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                  Workflow
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                  Durum
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                  Başlangıç
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                  Süre
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                  Detay
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    <Icon name="inbox" className="text-4xl mb-2" />
                    <p>Henüz workflow kaydı yok</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const info = WORKFLOW_INFO[log.workflowName] || {
                    label: log.workflowName,
                    icon: "play_arrow",
                  };
                  const statusConfig = STATUS_CONFIG[log.status];

                  return (
                    <tr key={log.id} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Icon name={info.icon} className="text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-white">
                              {info.label}
                            </p>
                            <p className="text-xs text-slate-500">
                              {log.entityType}: {log.entityId?.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                        >
                          <Icon
                            name={statusConfig.icon}
                            className={`text-sm ${
                              log.status === "running" ? "animate-spin" : ""
                            }`}
                          />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {formatDate(log.startedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400 font-mono">
                        {getDuration(log.startedAt, log.completedAt)}
                      </td>
                      <td className="px-4 py-3">
                        {log.error ? (
                          <span
                            className="text-xs text-red-400 truncate max-w-[200px] block"
                            title={log.error}
                          >
                            {log.error.slice(0, 50)}...
                          </span>
                        ) : log.result ? (
                          <span className="text-xs text-emerald-400">
                            {log.result.success ? "✓ Başarılı" : "Sonuç mevcut"}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
