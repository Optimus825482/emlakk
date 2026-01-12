"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/ui/icon";
import { contactStatusLabels } from "@/lib/validations/contact";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  listingId: string | null;
  status: "new" | "read" | "replied" | "archived";
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

interface ApiResponse {
  data: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

const statusColors: Record<string, string> = {
  new: "bg-emerald-500",
  read: "bg-slate-500",
  replied: "bg-blue-500",
  archived: "bg-gray-600",
};

export default function AdminMesajlarPage() {
  const [messages, setMessages] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);

      const response = await fetch(`/api/contacts?${params.toString()}`);
      if (!response.ok) throw new Error("Mesajlar yüklenemedi");

      const result: ApiResponse = await response.json();
      setMessages(result.data);
    } catch (error) {
      console.error("Mesaj yükleme hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "read" }),
      });
      fetchMessages();
    } catch (error) {
      console.error("Durum güncelleme hatası:", error);
    }
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply: replyText }),
      });

      if (response.ok) {
        setReplyText("");
        fetchMessages();
      }
    } catch (error) {
      console.error("Yanıt gönderme hatası:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu mesajı silmek istediğinize emin misiniz?")) return;

    try {
      await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      console.error("Silme hatası:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Az önce";
    if (hours < 24) return `${hours} saat önce`;
    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  };

  const newCount = messages.filter((m) => m.status === "new").length;
  const filteredMessages =
    filter === "all" ? messages : messages.filter((m) => m.status === filter);

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
            Mesajlar
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {newCount > 0 && (
              <span className="text-emerald-400">{newCount} yeni, </span>
            )}
            toplam {messages.length} mesaj
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "new", "read", "replied", "archived"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? "bg-emerald-500 text-slate-900"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
            }`}
          >
            {status === "all" ? "Tümü" : contactStatusLabels[status]}
            {status === "new" && newCount > 0 && (
              <span className="ml-2 bg-emerald-400 text-slate-900 text-xs px-1.5 py-0.5 rounded-full">
                {newCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="lg:col-span-1 space-y-2">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Icon name="inbox" className="text-4xl mb-2" />
              <p>Mesaj bulunamadı</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => {
                  setSelectedMessage(message.id);
                  if (message.status === "new") handleMarkAsRead(message.id);
                }}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selectedMessage === message.id
                    ? "bg-slate-700 border-emerald-500 border"
                    : message.status === "new"
                    ? "bg-slate-800 border border-emerald-500/30 hover:border-emerald-500/50"
                    : "bg-slate-800 border border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        statusColors[message.status]
                      }`}
                    />
                    <span className="text-white font-medium text-sm">
                      {message.name}
                    </span>
                  </div>
                  <span className="text-slate-500 text-xs">
                    {formatDate(message.createdAt)}
                  </span>
                </div>
                <p className="text-slate-300 text-sm font-medium mb-1 truncate">
                  {message.subject || "Konu belirtilmemiş"}
                </p>
                <p className="text-slate-500 text-xs truncate">
                  {message.message}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            (() => {
              const message = messages.find((m) => m.id === selectedMessage);
              if (!message) return null;

              return (
                <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="p-5 border-b border-slate-700">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl text-white font-bold">
                          {message.subject || "Konu belirtilmemiş"}
                        </h3>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded text-white ${
                          statusColors[message.status]
                        }`}
                      >
                        {contactStatusLabels[message.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Icon name="person" className="text-slate-500" />
                        {message.name}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Icon name="email" className="text-slate-500" />
                        {message.email}
                      </div>
                      {message.phone && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Icon name="phone" className="text-slate-500" />
                          {message.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="p-5">
                    <p className="text-slate-300 leading-relaxed">
                      {message.message}
                    </p>
                    <p className="text-slate-500 text-xs mt-4">
                      {new Date(message.createdAt).toLocaleString("tr-TR")}
                    </p>
                  </div>

                  {/* Previous Reply */}
                  {message.adminReply && (
                    <div className="px-5 pb-5">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                        <p className="text-xs text-emerald-400 uppercase font-bold mb-2">
                          Yanıtınız
                        </p>
                        <p className="text-slate-300 text-sm">
                          {message.adminReply}
                        </p>
                        {message.repliedAt && (
                          <p className="text-slate-500 text-xs mt-2">
                            {new Date(message.repliedAt).toLocaleString(
                              "tr-TR"
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reply Section */}
                  <div className="p-5 border-t border-slate-700 bg-slate-900/50">
                    <h4 className="text-sm font-bold text-slate-400 uppercase mb-3">
                      {message.adminReply ? "Yeni Yanıt" : "Yanıtla"}
                    </h4>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Yanıtınızı yazın..."
                      rows={4}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="flex items-center gap-2 bg-slate-700 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                      >
                        <Icon name="delete" />
                        Sil
                      </button>
                      <button
                        onClick={() => handleReply(message.id)}
                        disabled={!replyText.trim() || submitting}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        {submitting ? (
                          <Icon name="sync" className="animate-spin" />
                        ) : (
                          <Icon name="send" />
                        )}
                        Gönder
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
              <Icon name="mail" className="text-4xl text-slate-600 mb-3" />
              <p className="text-slate-400">
                Detayları görmek için bir mesaj seçin
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
