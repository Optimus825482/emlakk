"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Mic,
  Send,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  ChevronDown,
  Volume2,
  VolumeX,
  StopCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { VoiceAssistant } from "@/lib/ai/voice-assistant";

// Types
interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isThinking?: boolean;
}

export function DemirAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Voice Settings
  const [isAutoSpeakEnabled, setIsAutoSpeakEnabled] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null,
  );
  const voiceAssistantRef = useRef<VoiceAssistant | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize Voice Assistant
  useEffect(() => {
    const assistant = new VoiceAssistant({
      language: "tr-TR",
      voiceRate: 1.1,
      voicePitch: 0.9,
    });

    assistant.onResult((cmd) => {
      setInputValue(cmd.transcript);
      // Auto send if final and silence? Maybe just let user click send for now.
    });

    assistant.onError((err) => {
      if (
        err !== "no-speech" &&
        err !== "not-allowed" &&
        err !== "permission-denied"
      ) {
        toast.error("Ses hatası: " + err);
      }
      setIsRecording(false);
    });

    voiceAssistantRef.current = assistant;

    return () => {
      assistant.destroy();
    };
  }, []);

  // Handle Recording Toggle
  useEffect(() => {
    if (isRecording) {
      voiceAssistantRef.current?.startListening();
    } else {
      voiceAssistantRef.current?.stopListening();
    }
  }, [isRecording]);

  // Handle Message Speaking
  const handleSpeakMessage = async (msg: Message) => {
    if (speakingMessageId === msg.id) {
      voiceAssistantRef.current?.stopSpeaking();
      setSpeakingMessageId(null);
      return;
    }

    voiceAssistantRef.current?.stopSpeaking();
    setSpeakingMessageId(msg.id);

    try {
      await voiceAssistantRef.current?.speak(msg.content);
    } catch (e) {
      console.error(e);
    } finally {
      if (speakingMessageId === msg.id) {
        // Only clear if we haven't switched messages
        setSpeakingMessageId(null);
      }
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initial Greeting
  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Merhaba Mustafa Bey. Ben Demir AI. Size nasıl yardımcı olabilirim? Piyasa analizi, ilan verileri veya mevzuat hakkında sorularınızı bekliyorum.",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsProcessing(true);
    setIsRecording(false); // Stop recording on send

    try {
      const response = await fetch("/api/ai/command-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.concat(userMsg).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: {
            currentPath: pathname,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) throw new Error("AI yanıt veremedi");

      const data = await response.json();

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Auto Speak if Enabled
      if (isAutoSpeakEnabled) {
        handleSpeakMessage(botMsg);
      }
    } catch (error) {
      console.error(error);
      toast.error("Bir hata oluştu. Bağlantınızı kontrol edin.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Main Chat Window */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[400px] h-[600px] bg-zinc-900 border border-yellow-600/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto backdrop-blur-sm shadow-yellow-900/10"
          >
            {/* Header */}
            <div className="h-14 bg-zinc-950 border-b border-yellow-600/20 flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-2 text-yellow-500">
                <div className="relative">
                  <Bot className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">DEMIR AI</h3>
                  <span className="text-[10px] text-zinc-500 font-mono tracking-widest">
                    COMMAND CENTER
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Auto Speak Toggle */}
                <button
                  onClick={() => setIsAutoSpeakEnabled(!isAutoSpeakEnabled)}
                  className={cn(
                    "p-2 rounded-lg transition-colors mr-1",
                    isAutoSpeakEnabled
                      ? "text-green-500 hover:bg-green-500/10" // Green when enabled
                      : "text-red-500 hover:bg-red-500/10", // Red when disabled
                  )}
                  title={
                    isAutoSpeakEnabled
                      ? "Otomatik Okuma Açık"
                      : "Otomatik Okuma Kapalı"
                  }
                >
                  {isAutoSpeakEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-red-900/30 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex w-full mb-4",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed relative group",
                      msg.role === "user"
                        ? "bg-yellow-600 text-white rounded-br-none"
                        : "bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-bl-none",
                    )}
                  >
                    {msg.content}

                    <div className="flex items-center justify-between mt-2">
                      <div
                        className={cn(
                          "text-[10px] opacity-50",
                          msg.role === "user"
                            ? "text-yellow-200"
                            : "text-zinc-500",
                        )}
                      >
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>

                      {/* Individual Message Speaker */}
                      {msg.role === "assistant" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpeakMessage(msg);
                          }}
                          className={cn(
                            "p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity ml-2",
                            speakingMessageId === msg.id
                              ? "text-yellow-400 bg-yellow-400/10"
                              : "text-zinc-400 hover:bg-zinc-700",
                          )}
                          title="Seslendir"
                        >
                          {speakingMessageId === msg.id ? (
                            <StopCircle className="w-3 h-3 animate-pulse" />
                          ) : (
                            <Volume2 className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-zinc-950 border-t border-yellow-600/20 shrink-0">
              <div className="relative flex items-center gap-2">
                <button
                  className={cn(
                    "p-3 rounded-xl transition-all duration-200 border",
                    isRecording
                      ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white",
                  )}
                  onClick={() => setIsRecording(!isRecording)}
                  title="Sesli Komut"
                >
                  <Mic className="w-5 h-5" />
                </button>

                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Bir komut verin..."
                  className="flex-1 bg-zinc-900 border-zinc-700 focus:border-yellow-600/50 rounded-xl px-4 py-3 text-sm text-white resize-none h-[46px] max-h-[100px] scrollbar-hide focus:ring-0 focus:outline-none placeholder:text-zinc-600"
                  rows={1}
                />

                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isProcessing}
                  className="p-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-yellow-900/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        layout
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className={cn(
          "pointer-events-auto flex items-center justify-center p-4 rounded-full shadow-2xl transition-all duration-300 group border relative overflow-hidden",
          isOpen && !isMinimized
            ? "w-0 h-0 p-0 opacity-0"
            : "w-16 h-16 bg-zinc-900 border-yellow-500/50 hover:border-yellow-400 text-yellow-500 hover:shadow-yellow-500/20",
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {isMinimized ? (
          <div className="relative">
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-900" />
            <Bot className="w-8 h-8 relative z-10" />
          </div>
        ) : (
          <Bot className="w-8 h-8 relative z-10" />
        )}

        {/* Helper Badge */}
        {!isOpen && !isMinimized && (
          <div className="absolute right-full mr-4 bg-white text-zinc-900 px-3 py-1.5 rounded-lg text-sm font-medium shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Demir AI Asistan
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-white transform rotate-45 -translate-y-1/2" />
          </div>
        )}
      </motion.button>
    </div>
  );
}
