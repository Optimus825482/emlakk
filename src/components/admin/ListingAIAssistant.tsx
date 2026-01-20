"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ListingData = Record<string, any>;

interface ListingAIAssistantProps {
  listingData: ListingData;
  onUpdateField?: (name: string, value: string) => void;
}

export function ListingAIAssistant({
  listingData,
  onUpdateField,
}: ListingAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([
    {
      role: "assistant",
      content:
        "Merhaba! Ben Demir-AI. Bu ilanı mükemmelleştirmek için buradayım. Başlığı optimize edeyim mi yoksa pazar analizi mi yapalım?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const response = await fetch("/api/ai/listing-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          chatHistory,
          listingData,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      label: "Başlığı Optimize Et",
      icon: "title",
      message: "Bu ilan için daha çekici 3 başlık önerir misin?",
    },
    {
      label: "Açıklamayı Geliştir",
      icon: "description",
      message:
        "İlan açıklamasını SEO uyumlu ve ikna edici şekilde yeniden yazar mısın?",
    },
    {
      label: "Fiyat Analizi",
      icon: "payments",
      message: "Bu fiyat bölge ortalamasına göre nasıl? Analiz eder misin?",
    },
    {
      label: "Eksikleri Bul",
      icon: "rule",
      message:
        "Bu ilanda alıcıyı kaçırabilecek eksik veya hatalı yerler var mı?",
    },
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-8 transition-all duration-500 ease-in-out flex items-center justify-center shadow-2xl z-50 group",
          isOpen
            ? "right-[420px] w-12 h-12 bg-slate-900 rotate-90 rounded-2xl border border-white/10"
            : "right-8 w-14 h-14 bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 rounded-full hover:scale-110",
        )}
      >
        <div className="absolute inset-0 rounded-full bg-cyan-400 blur-md opacity-20 group-hover:opacity-40 animate-pulse transition-opacity" />
        <Icon
          name={isOpen ? "close" : "auto_awesome"}
          className={cn(
            "text-white text-2xl transition-all",
            isOpen ? "scale-90" : "animate-pulse",
          )}
        />
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500 border-2 border-slate-900"></span>
          </span>
        )}
      </button>

      {/* Sidebar Panel */}
      <div
        className={cn(
          "fixed top-4 bottom-4 right-4 w-[400px] max-w-[calc(100vw-2rem)] bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-40 transition-all duration-500 ease-out flex flex-col overflow-hidden",
          isOpen
            ? "translate-x-0 opacity-100"
            : "translate-x-[120%] opacity-0 pointer-events-none",
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-violet-500/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Icon name="smart_toy" className="text-white text-2xl" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Demir-AI
              </h3>
              <p className="text-xs text-cyan-400 font-medium uppercase tracking-widest">
                İlan Asistanı
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col gap-2 max-w-[85%]",
                m.role === "user" ? "ml-auto items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                  m.role === "user"
                    ? "bg-cyan-600 text-white rounded-tr-none"
                    : "bg-slate-800 text-slate-200 rounded-tl-none border border-white/5",
                )}
              >
                {m.content}
              </div>
              <span className="text-[10px] text-slate-500 font-medium px-1">
                {m.role === "assistant" ? "DEMIR-AI" : "SİZ"}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-2 max-w-[85%]">
              <div className="p-4 bg-slate-800 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions Panel */}
        <div className="px-6 py-2 border-t border-white/5 bg-slate-900/50">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Hızlı İşlemler
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(action.message);
                  // Otomatik gönderim için timeout
                  setTimeout(() => {
                    const fakeEvent = {
                      preventDefault: () => {},
                    } as React.FormEvent;
                    handleSendMessage(fakeEvent);
                  }, 100);
                }}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/5 transition-colors text-left group"
              >
                <Icon
                  name={action.icon}
                  className="text-cyan-400 text-sm opacity-70 group-hover:opacity-100"
                />
                <span className="text-[11px] text-slate-300 font-medium">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer / Input */}
        <div className="p-6 bg-slate-900/80 border-t border-white/10">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Asistana bir şey sor..."
              className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600 shadow-inner"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 w-10 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-cyan-500/10"
            >
              <Icon name="send" className="text-sm" />
            </button>
          </form>
          <p className="text-[10px] text-slate-600 text-center mt-3">
            Demir AI tarafından güçlendirildi • 2026 Edition
          </p>
        </div>
      </div>
    </>
  );
}
