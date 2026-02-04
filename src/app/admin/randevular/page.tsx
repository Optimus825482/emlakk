"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/ui/icon";
import {
  appointmentTypeLabels,
  appointmentStatusLabels,
} from "@/lib/validations/appointment";

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: "kahve" | "property_visit" | "valuation" | "consultation";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  date: string;
  time: string;
  message: string | null;
  adminNotes: string | null;
  listingId: string | null;
  createdAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
}

interface ApiResponse {
  data: Appointment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

const typeIcons: Record<string, string> = {
  kahve: "coffee",
  property_visit: "home",
  valuation: "calculate",
  consultation: "support_agent",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  confirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function AdminRandevularPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(
    null
  );
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);

      const response = await fetch(`/api/appointments?${params.toString()}`);
      if (!response.ok) throw new Error("Randevular yüklenemedi");

      const result: ApiResponse = await response.json();
      setAppointments(result.data);
    } catch (error) {
      console.error("Randevu yükleme hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setUpdating(id);
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchAppointments();
      }
    } catch (error) {
      console.error("Durum güncelleme hatası:", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu randevuyu silmek istediğinize emin misiniz?")) return;

    try {
      await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (error) {
      console.error("Silme hatası:", error);
    }
  };

  const filteredAppointments =
    filter === "all"
      ? appointments
      : appointments.filter((a) => a.status === filter);

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
            Randevu Yönetimi
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {filteredAppointments.length} randevu listeleniyor
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "pending", "confirmed", "completed", "cancelled"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                  ? "bg-emerald-500 text-slate-900"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
                }`}
            >
              {status === "all" ? "Tümü" : appointmentStatusLabels[status]}
            </button>
          )
        )}
      </div>

      {/* Appointments Grid */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="event_busy" className="text-4xl text-slate-600 mb-3" />
          <p className="text-slate-400">Bu filtreye uygun randevu bulunamadı</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className={`bg-slate-800 border rounded-lg p-5 transition-all cursor-pointer ${selectedAppointment === appointment.id
                  ? "border-emerald-500 ring-1 ring-emerald-500/20"
                  : "border-slate-700 hover:border-slate-600"
                }`}
              onClick={() =>
                setSelectedAppointment(
                  selectedAppointment === appointment.id ? null : appointment.id
                )
              }
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                    <Icon
                      name={typeIcons[appointment.type]}
                      className="text-emerald-400"
                    />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">
                      {appointment.name}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {appointmentTypeLabels[appointment.type]}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded border ${statusColors[appointment.status]
                    }`}
                >
                  {appointmentStatusLabels[appointment.status]}
                </span>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-4 mb-3 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Icon
                    name="calendar_today"
                    className="text-slate-500 text-sm"
                  />
                  {new Date(appointment.date).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Icon name="schedule" className="text-slate-500 text-sm" />
                  {appointment.time}
                </div>
              </div>

              {/* Expanded Details */}
              {selectedAppointment === appointment.id && (
                <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs uppercase mb-1">
                        Telefon
                      </p>
                      <p className="text-white">{appointment.phone}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs uppercase mb-1">
                        E-posta
                      </p>
                      <p className="text-white">{appointment.email}</p>
                    </div>
                  </div>
                  {appointment.message && (
                    <div>
                      <p className="text-slate-500 text-xs uppercase mb-1">
                        Mesaj
                      </p>
                      <p className="text-slate-300 text-sm">
                        {appointment.message}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {appointment.status === "pending" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(appointment.id, "confirmed");
                          }}
                          disabled={updating === appointment.id}
                          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {updating === appointment.id ? (
                            <Icon name="sync" className="animate-spin" />
                          ) : (
                            <Icon name="check" />
                          )}
                          Onayla
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(appointment.id, "cancelled");
                          }}
                          disabled={updating === appointment.id}
                          aria-label="Randevuyu iptal et"
                          className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                        >
                          <Icon name="close" />
                        </button>
                      </>
                    )}
                    {appointment.status === "confirmed" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(appointment.id, "completed");
                        }}
                        disabled={updating === appointment.id}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {updating === appointment.id ? (
                          <Icon name="sync" className="animate-spin" />
                        ) : (
                          <Icon name="done_all" />
                        )}
                        Tamamlandı
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(appointment.id);
                      }}
                      aria-label="Randevuyu sil"
                      className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
