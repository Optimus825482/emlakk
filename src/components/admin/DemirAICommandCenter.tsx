"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Mic,
  Send,
  X,
  Minimize2,
  Sparkles,
  Volume2,
  VolumeX,
  StopCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { AgentProcessLog, AgentLog } from "./AgentProcessLog";
import { VoiceVisualizer } from "./VoiceVisualizer";
import { playSound } from "@/lib/audio";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isThinking?: boolean;
}

export function DemirAICommandCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);

  // Voice State
  const [isAutoSpeakEnabled, setIsAutoSpeakEnabled] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null,
  );
  const [permissionError, setPermissionError] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // RAW SpeechRecognition Ref
  const recognitionRef = useRef<any>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, logs]);

  // Initial Message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Sistemler aktif. Şu an bulunduğunuz sayfayı analiz ediyorum. Size nasıl yardımcı olabilirim?",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  const getPageContext = () => {
    if (typeof window === "undefined") return {};
    return {
      url: window.location.href,
      title: document.title,
      // Try to get main content, fallback to body, truncate to avoid massive payload
      content: (
        document.querySelector("main")?.innerText ||
        document.body.innerText ||
        ""
      )
        .substring(0, 2000)
        .replace(/\s+/g, " ")
        .trim(),
    };
  };

  // Initialize Raw Voice API
  useEffect(() => {
    if (typeof window === "undefined") return;

    // TypeScript hack for Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Tarayıcınız sesli komutları desteklemiyor.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "tr-TR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      console.log("[RawSpeech] onstart");
      setIsRecording(true);
      setPermissionError(false);
      toast.info("Dinliyorum... (Parmağınızı basılı tutun)");
    };

    recognition.onend = () => {
      console.log("[RawSpeech] onend");
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      // Ignore not-allowed error as it is handled in UI
      if (
        event.error === "not-allowed" ||
        event.error === "permission-denied" ||
        event.error === "service-not-allowed"
      ) {
        console.warn("[RawSpeech] Microphone permission denied");
        setPermissionError(true);
        toast.error("Mikrofon izni reddedildi.");
      } else {
        console.error("[RawSpeech] onerror", event.error);
      }
      setIsRecording(false);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      // Fix: Iterate from 0 to capture full history, not just the new chunk
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      setInputValue(finalTranscript + interimTranscript);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Ses sistemi hazır değil.");
      playSound("error");
      return;
    }

    if (permissionError) {
      toast.error("Mikrofon izni reddedildi.");
      playSound("error");
      return;
    }

    if (isRecording) {
      // STOP
      playSound("stop");
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Stop error:", e);
      }
    } else {
      // START
      playSound("start");
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.log("Start error:", e);
      }
    }
  };

  const cleanTextForSpeech = (text: string) => {
    return (
      text
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, "")
        // Remove inline code
        .replace(/`[^`]*`/g, "")
        // Remove markdown bold/italic
        .replace(/[*_]{1,2}/g, "")
        // Remove brackets and parentheticals often used for technical IDs
        .replace(/[\[\]{}()]/g, "")
        // Remove list markers
        .replace(/^[\s-]*[-+*]\s+/gm, "")
        // Remove emojis
        .replace(
          /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu,
          "",
        )
        // Remove URLs
        .replace(/https?:\/\/[^\s]+/g, "")
        // Normalize whitespace
        .replace(/\s+/g, " ")
        .trim()
    );
  };

  const handleSpeakMessage = async (msg: Message) => {
    // Basic speech synthesis without class
    if (speakingMessageId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMessageId(msg.id);

    // Clean text for natural reading
    const spokenText = cleanTextForSpeech(msg.content);

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = "tr-TR";
    utterance.rate = 1.1;
    utterance.pitch = 0.9;

    // Find voice
    const voices = window.speechSynthesis.getVoices();
    const trVoice = voices.find(
      (v) => v.lang.startsWith("tr") || v.name.includes("Turkish"),
    );
    if (trVoice) utterance.voice = trVoice;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    window.speechSynthesis.speak(utterance);
  };

  // Clear logs when new message starts
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
    setLogs([]); // Reset logs
    playSound("processing");

    try {
      const pageInfo = getPageContext();

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
            pageTitle: pageInfo.title,
            pageUrl: pageInfo.url,
            pageContent: pageInfo.content,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) throw new Error("AI yanıt veremedi");
      if (!response.body) throw new Error("Stream desteklenmiyor");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const data = JSON.parse(line);

            if (data.type === "log") {
              setLogs((prev) => [
                ...prev,
                {
                  id: Date.now().toString() + Math.random(),
                  type: data.type,
                  agent: data.agent,
                  content: data.content,
                  timestamp: new Date(),
                },
              ]);
            } else if (data.type === "result") {
              finalContent = data.content;
            } else if (data.type === "error") {
              toast.error(`Hata: ${data.error}`);
            }
          } catch (e) {
            console.error("JSON Parse Error", e);
          }
        }
      }

      if (finalContent) {
        playSound("success");
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: finalContent,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);

        if (isAutoSpeakEnabled) {
          handleSpeakMessage(botMsg);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Bağlantı hatası");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
      {/* Draggable Area - Simplified as fixed but looks floating. Framer drag requires layout change or portal */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            // drag // Enabling drag would require more complex state management for position
            // dragConstraints={{ left: -1000, right: 0, top: -800, bottom: 0 }}
            className="mb-4 w-[400px] h-[600px] bg-zinc-950 border border-yellow-600/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto backdrop-blur-md shadow-yellow-900/20"
          >
            {/* Header */}
            <div className="h-14 bg-zinc-900/80 border-b border-yellow-600/20 flex items-center justify-between px-4 shrink-0 cursor-move">
              <div className="flex items-center gap-3 text-yellow-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-pulse" />
                  <Bot className="w-6 h-6 relative z-10" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-widest text-yellow-100/90 font-mono">
                    DEMIR AI
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-yellow-500/50" />
                    <span className="text-[10px] text-yellow-600/80 font-mono tracking-widest">
                      ONLINE
                    </span>
                  </div>
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

                {/* Refresh Chat */}
                <button
                  onClick={() => {
                    setMessages([]);
                    toast.success("Sohbet temizlendi.");
                  }}
                  className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  title="Sohbeti Temizle"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-red-900/20 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent bg-gradient-to-b from-zinc-950 to-black pb-4"
            >
              {/* Agent Logs (Matrix Style) */}
              <AgentProcessLog
                logs={logs}
                isVisible={isProcessing || logs.length > 0}
              />

              <div className="px-4">
                {permissionError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex flex-col gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-red-500/10 rounded-full shrink-0">
                        <X className="w-3 h-3" />
                      </div>
                      <span className="font-semibold">
                        Mikrofon erişimi engellendi.
                      </span>
                    </div>
                    <div className="pl-7 opacity-90 space-y-2">
                      <p>
                        Tarayıcı veya sistem ayarlarından mikrofon izni
                        verilmemiş.
                      </p>
                      <button
                        onClick={async () => {
                          try {
                            const stream =
                              await navigator.mediaDevices.getUserMedia({
                                audio: true,
                              });
                            stream.getTracks().forEach((t) => t.stop());
                            setPermissionError(false);
                            toast.success(
                              "İzin alındı! Şimdi konuşabilirsiniz.",
                            );
                          } catch (err) {
                            console.error(err);
                            toast.error(
                              "İzin hala alınamadı. Lütfen tarayıcı ayarlarını kontrol edin.",
                            );
                          }
                        }}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 w-fit"
                      >
                        <Mic className="w-3 h-3" />
                        İzni Tekrar İste
                      </button>
                      <div className="text-[10px] opacity-70 border-t border-red-500/20 pt-1 mt-1">
                        Hala çalışmıyorsa: Adres çubuğundaki 🔒 simgesine
                        tıklayın ve Mikrofon&apos;u &quot;İzin Ver&quot; yapın.
                      </div>
                    </div>
                  </div>
                )}
                {messages.map((msg) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id}
                    className={cn(
                      "flex w-full mb-4",
                      msg.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg backdrop-blur-sm",
                        msg.role === "user"
                          ? "bg-yellow-600/90 text-white rounded-br-none border border-yellow-500/20"
                          : "bg-zinc-900/90 text-zinc-200 border border-zinc-800 rounded-bl-none",
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                          <Sparkles className="w-3 h-3 text-yellow-500" />
                          <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                            System Response
                          </span>
                        </div>
                      )}
                      {msg.content}
                      <div
                        className={cn(
                          "text-[10px] mt-2 font-mono flex items-center justify-end gap-1 opacity-50",
                          msg.role === "user"
                            ? "text-yellow-100"
                            : "text-zinc-500",
                        )}
                      >
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}

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
                  </motion.div>
                ))}

                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1">
                      <span className="text-xs text-zinc-500 animate-pulse mr-2">
                        ANALYZING
                      </span>
                      <span className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-zinc-900 border-t border-yellow-600/10 shrink-0 backdrop-blur-md relative z-[100]">
              <div className="relative flex items-center gap-2">
                <button
                  onClick={toggleRecording}
                  className={cn(
                    "p-3 rounded-xl transition-all duration-300 relative group overflow-hidden pointer-events-auto cursor-pointer select-none",
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-105 active:scale-95"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border border-zinc-700 active:scale-95",
                  )}
                  title={isRecording ? "Durdur" : "Konuş"}
                  type="button"
                  disabled={isProcessing}
                >
                  {isRecording ? (
                    <StopCircle className="w-5 h-5 relative z-10 animate-pulse" />
                  ) : (
                    <Mic className="w-5 h-5 relative z-10" />
                  )}
                </button>

                <div className="flex-1 relative">
                  {isRecording && (
                    <div className="absolute inset-0 z-20 bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center border border-yellow-600/30">
                      <VoiceVisualizer isRecording={isRecording} />
                      <div className="absolute inset-0 flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                        <span className="text-xs text-yellow-500 font-mono tracking-[0.2em] font-bold drop-shadow-md">
                          DINLIYORUM...
                        </span>
                      </div>
                    </div>
                  )}
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Komut Girin..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-yellow-600/40 rounded-xl px-4 py-3 text-sm text-white shadow-inner focus:ring-1 focus:ring-yellow-600/20 focus:outline-none placeholder:text-zinc-700 font-medium z-10"
                  />
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isProcessing}
                  className="p-3 bg-gradient-to-br from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-900/20 active:scale-95 pointer-events-auto cursor-pointer z-10"
                  type="button"
                >
                  <Send className="w-5 h-5 pointer-events-none" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        layout
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className={cn(
          "pointer-events-auto flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 group border border-yellow-500/20 relative overflow-hidden backdrop-blur-sm",
          isOpen && !isMinimized
            ? "w-0 h-0 p-0 opacity-0"
            : "w-16 h-16 bg-zinc-900 text-yellow-500 hover:scale-110 hover:shadow-yellow-500/20 hover:border-yellow-500/50",
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {isMinimized ? (
          <div className="relative">
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <Bot className="w-8 h-8 relative z-10" />
          </div>
        ) : (
          <Bot className="w-8 h-8 relative z-10" />
        )}
      </motion.button>
    </div>
  );
}
