"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  Radio,
  Heart,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { AgentProcessLog, AgentLog } from "./AgentProcessLog";
import { VoiceVisualizer } from "./VoiceVisualizer";
import { SpeakingVisualizer } from "./SpeakingVisualizer";
import { playSound } from "@/lib/audio";
import { VoiceAssistant } from "@/lib/ai/voice-assistant";
import {
  EmotionalVoiceAssistant,
  getEmotionalVoiceAssistant,
  EmotionalVoiceState
} from "@/lib/ai/emotional-voice-assistant";
import {
  EmotionType,
  EmotionResult,
  getEmotionDetector
} from "@/lib/ai/emotion-detector";
import {
  EmotionIndicator,
  MoodIndicator,
  EmotionPulse
} from "@/components/ui/emotion-indicator";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isThinking?: boolean;
  emotion?: EmotionType;
}

export function DemirAICommandCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [thinkingStatus, setThinkingStatus] = useState<string>("Düşünüyorum...");

  // Voice State
  const [isAutoSpeakEnabled, setIsAutoSpeakEnabled] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null,
  );

  // Emotional Voice State
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>("neutral");
  const [emotionConfidence, setEmotionConfidence] = useState(0);
  const [conversationMood, setConversationMood] = useState<'positive' | 'negative' | 'neutral'>('neutral');
  const [isEmotionalModeEnabled, setIsEmotionalModeEnabled] = useState(true);
  const [emotionHistory, setEmotionHistory] = useState<EmotionResult[]>([]);
  const emotionalVoiceRef = useRef<EmotionalVoiceAssistant | null>(null);
  const emotionDetectorRef = useRef(getEmotionDetector());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceChatMode, setIsVoiceChatMode] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const voiceAssistantRef = useRef<VoiceAssistant | null>(null);

  // Refs to track current values for async callbacks
  const isAutoSpeakEnabledRef = useRef(isAutoSpeakEnabled);
  const isVoiceChatModeRef = useRef(isVoiceChatMode);

  // Keep refs in sync with state
  useEffect(() => {
    isAutoSpeakEnabledRef.current = isAutoSpeakEnabled;
  }, [isAutoSpeakEnabled]);

  useEffect(() => {
    isVoiceChatModeRef.current = isVoiceChatMode;
  }, [isVoiceChatMode]);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, logs, interimTranscript]);

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

  // Initialize Voice Assistant Class
  useEffect(() => {
    const assistant = new VoiceAssistant({
      language: "tr-TR",
      voiceRate: 1.1,
      voicePitch: 0.9,
    });

    assistant.onStart(() => {
      setIsRecording(true);
      setPermissionError(false);
      toast.info("Dinliyorum...");
    });

    assistant.onEnd(() => {
      setIsRecording(false);
    });

    assistant.onError((err) => {
      console.error("Voice Error:", err);
      if (
        err === "not-allowed" ||
        err === "permission-denied" ||
        err === "service-not-allowed"
      ) {
        setPermissionError(true);
        toast.error("Mikrofon izni reddedildi.");
      }
      setIsRecording(false);
      setInterimTranscript("");
    });

    assistant.onResult((cmd) => {
      setInputValue(cmd.transcript);
      setInterimTranscript("");
    });

    assistant.onInterimResult((text) => {
      setInterimTranscript(text);
    });

    assistant.onSilenceDetected((text) => {
      console.log("[CommandCenter] Silence detected, sending:", text);
      const trimmedText = text.trim().toLowerCase();

      // Sesli komutları kontrol et
      const closeCommands = [
        "sohbeti kapat",
        "sohbeti sonlandır",
        "kapat",
        "çık",
        "görüşürüz",
        "hoşça kal",
        "bye",
        "kapan",
        "modal kapat"
      ];

      const isCloseCommand = closeCommands.some(cmd =>
        trimmedText.includes(cmd) || trimmedText === cmd
      );

      if (isCloseCommand) {
        console.log("[CommandCenter] Close command detected, closing modal");
        // Sesli sohbeti kapat
        voiceAssistantRef.current?.disableVoiceChatMode();
        setIsVoiceChatMode(false);
        setIsAutoSpeakEnabled(false);
        setInterimTranscript("");
        // Veda mesajı söyle ve kapat
        if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance("Görüşmek üzere!");
          utterance.lang = "tr-TR";
          utterance.onend = () => setIsOpen(false);
          window.speechSynthesis.speak(utterance);
        } else {
          setIsOpen(false);
        }
        return;
      }

      if (trimmedText) {
        handleSendMessage(text);
      }
    });

    voiceAssistantRef.current = assistant;

    return () => {
      assistant.destroy();
    };
  }, []); // Remove dependencies to avoid re-init

  // Manage Recording State Sync
  useEffect(() => {
    // Only used if external logic triggers startListening/stopListening?
    // Actually, we control it via toggleRecording below.
  }, [isRecording]);

  // Helper function to generate user-friendly thinking status messages
  const getThinkingStatusMessage = (agent: string, content: string): string => {
    const lowerContent = content.toLowerCase();

    // SQL / Database queries
    if (lowerContent.includes("sql") || lowerContent.includes("sorgu") || lowerContent.includes("veritabanı")) {
      return "🔍 Veritabanını sorguluyorum...";
    }

    // Web research
    if (lowerContent.includes("web") || lowerContent.includes("araştır") || lowerContent.includes("internet")) {
      return "🌐 Web'de araştırma yapıyorum...";
    }

    // Law / Regulations
    if (lowerContent.includes("mevzuat") || lowerContent.includes("kanun") || lowerContent.includes("yönetmelik") || lowerContent.includes("hukuk")) {
      return "📜 Mevzuatları inceliyorum...";
    }

    // Memory operations
    if (lowerContent.includes("hafıza") || lowerContent.includes("hatır") || lowerContent.includes("memory")) {
      return "🧠 Hafızamı kontrol ediyorum...";
    }

    // Navigation
    if (lowerContent.includes("navigasyon") || lowerContent.includes("yönlendir") || lowerContent.includes("sayfa")) {
      return "📍 Yönlendirme hazırlanıyor...";
    }

    // Client/Contact info
    if (lowerContent.includes("müşteri") || lowerContent.includes("iletişim") || lowerContent.includes("client")) {
      return "👤 Müşteri bilgilerini getiriyorum...";
    }

    // Listing search
    if (lowerContent.includes("ilan") || lowerContent.includes("listing") || lowerContent.includes("portföy")) {
      return "🏠 İlanları tarıyorum...";
    }

    // Agent delegation
    if (agent === "Miner Agent" || lowerContent.includes("miner") || lowerContent.includes("analiz")) {
      return "⛏️ Pazar verilerini analiz ediyorum...";
    }

    if (agent === "Content Agent" || lowerContent.includes("content") || lowerContent.includes("içerik")) {
      return "✍️ İçerik hazırlanıyor...";
    }

    // Emotion detection
    if (agent === "EmotionAI" || lowerContent.includes("duygu") || lowerContent.includes("empat")) {
      return "💭 Empatik yanıt hazırlıyorum...";
    }

    // Default thinking states
    if (lowerContent.includes("düşün")) {
      return "🤔 Düşünüyorum...";
    }

    if (lowerContent.includes("hazır") || lowerContent.includes("yanıt")) {
      return "✨ Yanıt hazırlanıyor...";
    }

    // Agent-based defaults
    if (agent === "Maestro") {
      return "🎯 İşleniyor...";
    }

    return "💡 Analiz ediyorum...";
  };

  // Clean text function preserved below...

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

  const handleSpeakMessage = async (msg: Message, emotionOverride?: EmotionType) => {
    if (!voiceAssistantRef.current) return;

    // Stop if already speaking this message
    if (speakingMessageId === msg.id) {
      voiceAssistantRef.current.stopSpeaking();
      setSpeakingMessageId(null);
      setIsSpeaking(false);
      return;
    }

    // Stop any other current speech and listening during speech
    voiceAssistantRef.current.stopSpeaking();
    voiceAssistantRef.current.stopListening();
    setSpeakingMessageId(msg.id);
    setIsSpeaking(true);

    // Clean text for natural reading
    const spokenText = cleanTextForSpeech(msg.content);

    // Get emotional voice settings
    const emotion = emotionOverride || msg.emotion || currentEmotion;
    const emotionSettings = isEmotionalModeEnabled
      ? emotionDetectorRef.current.getEmpatheticResponse(emotion)
      : null;

    // Helper function to restart listening after speech ends
    const restartListeningIfNeeded = () => {
      // Use refs to get current values (not stale state)
      if (isVoiceChatModeRef.current) {
        console.log('[DemirAI] Restarting microphone after speech ended');
        setTimeout(() => {
          if (voiceAssistantRef.current && !voiceAssistantRef.current.getIsSpeaking()) {
            voiceAssistantRef.current.startListening();
          }
        }, 400);
      }
    };

    try {
      if (emotionSettings && window.speechSynthesis) {
        // Use emotional voice settings
        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.lang = "tr-TR";
        utterance.rate = emotionSettings.voiceSettings.rate;
        utterance.pitch = emotionSettings.voiceSettings.pitch;
        utterance.volume = emotionSettings.voiceSettings.volume;

        // Get Turkish voice
        const voices = window.speechSynthesis.getVoices();
        const trVoice = voices.find(v => v.lang.startsWith('tr'));
        if (trVoice) utterance.voice = trVoice;

        window.speechSynthesis.cancel();

        await new Promise<void>((resolve) => {
          utterance.onend = () => {
            setSpeakingMessageId(null);
            setIsSpeaking(false);
            restartListeningIfNeeded();
            resolve();
          };
          utterance.onerror = () => {
            setSpeakingMessageId(null);
            setIsSpeaking(false);
            restartListeningIfNeeded();
            resolve();
          };
          window.speechSynthesis.speak(utterance);
        });
      } else {
        // Use voice assistant's speak method (also handles restart internally)
        await voiceAssistantRef.current.speak(spokenText);
        setSpeakingMessageId(null);
        setIsSpeaking(false);
        restartListeningIfNeeded();
      }
    } catch (e) {
      console.error("Speech error:", e);
      setSpeakingMessageId(null);
      setIsSpeaking(false);
      restartListeningIfNeeded();
    }
  };

  // Toggle voice chat mode (continuous listening)
  const toggleVoiceChatMode = useCallback(() => {
    if (isVoiceChatMode) {
      // Turning off voice chat mode
      setIsVoiceChatMode(false);
      setIsAutoSpeakEnabled(false);
      voiceAssistantRef.current?.disableVoiceChatMode();
      voiceAssistantRef.current?.stopSpeaking();
      toast.info("Sesli sohbet modu kapatıldı");
    } else {
      // Turning on voice chat mode
      setIsVoiceChatMode(true);
      setIsAutoSpeakEnabled(true);
      voiceAssistantRef.current?.enableVoiceChatMode();
      toast.success("🎤 Sesli sohbet modu aktif! Konuşmaya başlayın...");
    }
  }, [isVoiceChatMode]);

  // Mikrofon butonu - basınca voice chat mode aktif olsun
  const toggleRecording = () => {
    if (!voiceAssistantRef.current) return;

    if (isRecording) {
      // Kapatırken voice chat mode'u da kapat
      voiceAssistantRef.current.disableVoiceChatMode();
      setIsVoiceChatMode(false);
      setIsAutoSpeakEnabled(false);
    } else {
      // Açarken voice chat mode'u da aç
      voiceAssistantRef.current.enableVoiceChatMode();
      setIsVoiceChatMode(true);
      setIsAutoSpeakEnabled(true);
      toast.success("🎤 Sesli sohbet aktif! Konuşmaya başlayın...");
    }
  };

  const handleSendMessage = async (
    textOverride?: string | React.MouseEvent,
  ) => {
    // Handle both direct text call and event click
    const textToSend =
      typeof textOverride === "string" ? textOverride : inputValue;

    if (!textToSend.trim()) return;

    // Detect emotion from user message
    let detectedEmotion: EmotionType = "neutral";
    if (isEmotionalModeEnabled) {
      const emotionResult = emotionDetectorRef.current.analyzeText(textToSend);
      detectedEmotion = emotionResult.primary;
      setCurrentEmotion(detectedEmotion);
      setEmotionConfidence(emotionResult.confidence);
      setEmotionHistory(prev => [...prev.slice(-9), emotionResult]);

      // Update conversation mood
      if (emotionResult.valence > 0.2) {
        setConversationMood('positive');
      } else if (emotionResult.valence < -0.2) {
        setConversationMood('negative');
      } else {
        setConversationMood('neutral');
      }
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
      emotion: detectedEmotion,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setInterimTranscript(""); // Clear interim
    setIsProcessing(true);
    setThinkingStatus("🤔 Düşünüyorum..."); // Reset thinking status
    setLogs([]); // Reset logs
    playSound("processing");

    // Force scroll to bottom immediately
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    try {
      const pageInfo = getPageContext();

      // Get empathetic system prompt based on detected emotion
      const emotionPrompt = isEmotionalModeEnabled
        ? emotionDetectorRef.current.getEmpatheticResponse(detectedEmotion)
        : null;

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
            // Emotion context for empathetic responses
            userEmotion: isEmotionalModeEnabled ? detectedEmotion : undefined,
            emotionTone: emotionPrompt?.tone,
            conversationMood,
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
              // Update thinking status based on action type
              const statusMessage = getThinkingStatusMessage(data.agent, data.content);
              setThinkingStatus(statusMessage);

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

        // Detect emotion in AI response for adaptive voice
        let responseEmotion: EmotionType = "neutral";
        if (isEmotionalModeEnabled) {
          const responseEmotionResult = emotionDetectorRef.current.analyzeText(finalContent);
          responseEmotion = responseEmotionResult.primary;
        }

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: finalContent,
          timestamp: new Date(),
          emotion: responseEmotion,
        };
        setMessages((prev) => [...prev, botMsg]);

        // Sesli sohbet modunda veya otomatik okuma açıksa seslendir
        // Ref kullan çünkü async callback'te state eski kalabilir
        console.log('[DemirAI] Auto-speak check:', { isAutoSpeakEnabled: isAutoSpeakEnabledRef.current, isVoiceChatMode: isVoiceChatModeRef.current, emotion: responseEmotion });
        if (isAutoSpeakEnabledRef.current || isVoiceChatModeRef.current) {
          // Use emotional voice settings based on the response emotion
          handleSpeakMessage(botMsg, responseEmotion);
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
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999] flex flex-col items-end pointer-events-none">
      {/* Draggable Area - Simplified as fixed but looks floating. Framer drag requires layout change or portal */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[calc(100vw-2rem)] max-w-[400px] h-[calc(100vh-8rem)] max-h-[600px] md:w-[400px] md:h-[600px] bg-zinc-950 border border-yellow-600/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto backdrop-blur-md shadow-yellow-900/20"
          >
            {/* Header */}
            <div className="h-14 bg-zinc-900/80 border-b border-yellow-600/20 flex items-center justify-between px-3 md:px-4 shrink-0 cursor-move">
              <div className="flex items-center gap-2 md:gap-3 text-yellow-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-pulse" />
                  <Bot className="w-5 h-5 md:w-6 md:h-6 relative z-10" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs md:text-sm tracking-widest text-yellow-100/90 font-mono">
                      DEMIR AI
                    </h3>
                    {/* Emotion Indicator in Header */}
                    {isEmotionalModeEnabled && currentEmotion !== 'neutral' && (
                      <EmotionIndicator
                        emotion={currentEmotion}
                        confidence={emotionConfidence}
                        valence={0}
                        arousal={0}
                        size="sm"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isSpeaking ? (
                      <>
                        <SpeakingVisualizer isSpeaking={isSpeaking} size="sm" />
                        <span className="text-[9px] md:text-[10px] text-yellow-400 font-mono tracking-widest animate-pulse">
                          KONUŞUYOR
                        </span>
                      </>
                    ) : isRecording ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        <span className="text-[9px] md:text-[10px] text-red-400 font-mono tracking-widest animate-pulse">
                          DİNLİYOR
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-1 h-1 rounded-full bg-yellow-500/50" />
                        <span className="text-[9px] md:text-[10px] text-yellow-600/80 font-mono tracking-widest">
                          {isEmotionalModeEnabled ? 'EMPATİK MOD' : 'ONLINE'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5 md:gap-1">
                {/* Emotional Mode Toggle */}
                <button
                  onClick={() => {
                    setIsEmotionalModeEnabled(!isEmotionalModeEnabled);
                    toast.info(isEmotionalModeEnabled ? "Empatik mod kapatıldı" : "Empatik mod açıldı! 💕");
                  }}
                  className={cn(
                    "p-1.5 md:p-2 rounded-lg transition-all mr-0.5 md:mr-1 touch-manipulation relative",
                    isEmotionalModeEnabled
                      ? "text-pink-400 bg-pink-500/20 hover:bg-pink-500/30"
                      : "text-zinc-400 hover:bg-zinc-700 hover:text-white",
                  )}
                  title={isEmotionalModeEnabled ? "Empatik Mod Açık" : "Empatik Mod Kapalı"}
                  aria-label={isEmotionalModeEnabled ? "Empatik modu kapat" : "Empatik modu aç"}
                  aria-pressed={isEmotionalModeEnabled || undefined}
                >
                  <Heart className={cn("w-3.5 h-3.5 md:w-4 md:h-4", isEmotionalModeEnabled && "fill-pink-400")} />
                </button>

                {/* Voice Chat Mode Toggle */}
                <button
                  onClick={toggleVoiceChatMode}
                  className={cn(
                    "p-1.5 md:p-2 rounded-lg transition-all mr-0.5 md:mr-1 touch-manipulation relative",
                    isVoiceChatMode
                      ? "text-yellow-400 bg-yellow-500/20 hover:bg-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.3)]"
                      : "text-zinc-400 hover:bg-zinc-700 hover:text-white",
                  )}
                  title={isVoiceChatMode ? "Sesli Sohbeti Kapat" : "Sesli Sohbet Başlat"}
                  aria-label={isVoiceChatMode ? "Sesli sohbeti kapat" : "Sesli sohbet başlat"}
                  aria-pressed={isVoiceChatMode || undefined}
                >
                  <Radio className={cn("w-3.5 h-3.5 md:w-4 md:h-4", isVoiceChatMode && "animate-pulse")} />
                  {isVoiceChatMode && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
                  )}
                </button>

                {/* Auto Speak Toggle */}
                <button
                  onClick={() => setIsAutoSpeakEnabled(!isAutoSpeakEnabled)}
                  className={cn(
                    "p-1.5 md:p-2 rounded-lg transition-colors mr-0.5 md:mr-1 touch-manipulation",
                    isAutoSpeakEnabled
                      ? "text-green-500 hover:bg-green-500/10"
                      : "text-red-500 hover:bg-red-500/10",
                  )}
                  title={
                    isAutoSpeakEnabled
                      ? "Otomatik Okuma Açık"
                      : "Otomatik Okuma Kapalı"
                  }
                  aria-label={isAutoSpeakEnabled ? "Otomatik okumayı kapat" : "Otomatik okumayı aç"}
                  aria-pressed={isAutoSpeakEnabled || undefined}
                >
                  {isAutoSpeakEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  )}
                </button>

                {/* Refresh Chat */}
                <button
                  onClick={() => {
                    setMessages([]);
                    setEmotionHistory([]);
                    emotionDetectorRef.current.reset();
                    setCurrentEmotion('neutral');
                    setConversationMood('neutral');
                    toast.success("Sohbet temizlendi.");
                  }}
                  className="p-1.5 md:p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors touch-manipulation"
                  title="Sohbeti Temizle"
                  aria-label="Sohbeti temizle"
                >
                  <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>

                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 md:p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors touch-manipulation"
                  aria-label="Sohbeti küçült"
                >
                  <Minimize2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 md:p-2 hover:bg-red-900/20 rounded-lg text-zinc-400 hover:text-red-400 transition-colors touch-manipulation"
                  aria-label="Sohbeti kapat"
                >
                  <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-3 md:space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent bg-gradient-to-b from-zinc-950 to-black pb-3 md:pb-4"
            >
              {/* Agent Logs (Matrix Style) */}
              <AgentProcessLog
                logs={logs}
                isVisible={isProcessing || logs.length > 0}
              />

              <div className="px-3 md:px-4">
                {permissionError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 md:p-3 rounded-xl text-[11px] md:text-xs flex flex-col gap-2 mb-3 md:mb-4">
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
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 w-fit touch-manipulation"
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
                      "flex w-full mb-3 md:mb-4",
                      msg.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[90%] md:max-w-[85%] rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm leading-relaxed shadow-lg backdrop-blur-sm relative",
                        msg.role === "user"
                          ? "bg-yellow-600/90 text-white rounded-br-none border border-yellow-500/20"
                          : "bg-zinc-900/90 text-zinc-200 border border-zinc-800 rounded-bl-none",
                      )}
                    >
                      {/* Emotion badge for user messages */}
                      {isEmotionalModeEnabled && msg.role === "user" && msg.emotion && msg.emotion !== 'neutral' && (
                        <div className="absolute -top-2 -right-2">
                          <EmotionIndicator
                            emotion={msg.emotion}
                            confidence={1}
                            valence={0}
                            arousal={0}
                            size="sm"
                          />
                        </div>
                      )}

                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                          <Sparkles className="w-3 h-3 text-yellow-500" />
                          <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-zinc-500">
                            {isEmotionalModeEnabled && msg.emotion && msg.emotion !== 'neutral'
                              ? `Empathetic Response`
                              : 'System Response'}
                          </span>
                          {/* AI response emotion indicator */}
                          {isEmotionalModeEnabled && msg.emotion && msg.emotion !== 'neutral' && (
                            <EmotionIndicator
                              emotion={msg.emotion}
                              confidence={1}
                              valence={0}
                              arousal={0}
                              size="sm"
                            />
                          )}
                        </div>
                      )}
                      <div className="break-words">{msg.content}</div>
                      <div
                        className={cn(
                          "text-[9px] md:text-[10px] mt-2 font-mono flex items-center justify-end gap-1 opacity-50",
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
                              "p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity ml-2 touch-manipulation",
                              speakingMessageId === msg.id
                                ? "text-yellow-400 bg-yellow-400/10"
                                : "text-zinc-400 hover:bg-zinc-700",
                            )}
                            title="Seslendir"
                            aria-label={speakingMessageId === msg.id ? "Seslendirmeyi durdur" : "Mesajı seslendir"}
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
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="bg-zinc-900/70 border border-yellow-600/30 rounded-2xl rounded-bl-none px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2 backdrop-blur-sm shadow-lg">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" />
                      </div>
                      <motion.span
                        key={thinkingStatus}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[11px] md:text-xs text-yellow-200/90 font-medium"
                      >
                        {thinkingStatus}
                      </motion.span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className={cn(
              "p-3 md:p-4 border-t shrink-0 backdrop-blur-md relative z-[100] transition-colors",
              isVoiceChatMode
                ? "bg-yellow-900/20 border-yellow-600/30"
                : "bg-zinc-900 border-yellow-600/10"
            )}>
              {/* Voice Chat Mode Active Banner - Animasyon üstte */}
              {isVoiceChatMode && (isRecording || isSpeaking) && (
                <div className="mb-3 relative">
                  <div className="flex items-center justify-center gap-3 py-2 px-4 bg-zinc-900/80 border border-yellow-500/30 rounded-xl overflow-hidden">
                    {/* Arka plan animasyonu */}
                    <div className="absolute inset-0 z-0">
                      <VoiceVisualizer isRecording={isRecording && !isSpeaking} />
                    </div>

                    {/* İçerik */}
                    <div className="relative z-10 flex items-center gap-2">
                      {isSpeaking ? (
                        <>
                          <SpeakingVisualizer isSpeaking={isSpeaking} size="md" />
                          <span className="text-sm text-yellow-400 font-mono uppercase tracking-widest animate-pulse">
                            AI KONUŞUYOR
                          </span>
                          <SpeakingVisualizer isSpeaking={isSpeaking} size="md" />
                        </>
                      ) : isRecording ? (
                        <>
                          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                          <span className="text-sm text-red-400 font-mono uppercase tracking-widest">
                            DİNLİYORUM
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              {/* Sesli sohbet banner (dinleme/konuşma yokken) */}
              {isVoiceChatMode && !isRecording && !isSpeaking && (
                <div className="mb-2 flex items-center justify-center gap-2 py-1.5 px-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <Radio className="w-3 h-3 text-yellow-400 animate-pulse" />
                  <span className="text-[10px] text-yellow-400 font-mono uppercase tracking-widest">
                    Sesli Sohbet Aktif
                  </span>
                </div>
              )}

              <div className="relative flex items-center gap-1.5 md:gap-2">
                <button
                  onClick={isVoiceChatMode ? toggleVoiceChatMode : toggleRecording}
                  className={cn(
                    "p-2.5 md:p-3 rounded-xl transition-all duration-300 relative group overflow-hidden pointer-events-auto cursor-pointer select-none touch-manipulation",
                    isVoiceChatMode
                      ? "bg-yellow-500 hover:bg-yellow-600 text-white shadow-[0_0_20px_rgba(234,179,8,0.5)] scale-105 active:scale-95"
                      : isRecording
                        ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-105 active:scale-95"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border border-zinc-700 active:scale-95",
                  )}
                  title={isVoiceChatMode ? "Sesli Sohbeti Kapat" : isRecording ? "Durdur" : "Konuş"}
                  type="button"
                  disabled={isProcessing}
                  aria-label={isVoiceChatMode ? "Sesli sohbeti kapat" : isRecording ? "Ses kaydını durdur" : "Sesli komut ver"}
                  aria-pressed={isRecording || isVoiceChatMode || undefined}
                >
                  {isVoiceChatMode ? (
                    <Radio className="w-4 h-4 md:w-5 md:h-5 relative z-10 animate-pulse" />
                  ) : isRecording ? (
                    <StopCircle className="w-4 h-4 md:w-5 md:h-5 relative z-10 animate-pulse" />
                  ) : (
                    <Mic className="w-4 h-4 md:w-5 md:h-5 relative z-10" />
                  )}
                </button>

                <div className="flex-1 relative">
                  {/* Input - konuşurken anlık önizleme göster */}
                  <input
                    value={isRecording && interimTranscript ? interimTranscript : inputValue}
                    onChange={(e) => !isRecording && setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={isRecording ? "Konuşun..." : "Komut Girin..."}
                    readOnly={isRecording}
                    className={cn(
                      "w-full rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm shadow-inner focus:ring-1 focus:outline-none font-medium z-10 transition-all",
                      isRecording
                        ? "bg-zinc-900 border-2 border-yellow-500/50 text-yellow-300 italic animate-pulse placeholder:text-yellow-600/50"
                        : "bg-zinc-950 border border-zinc-800 focus:border-yellow-600/40 text-white focus:ring-yellow-600/20 placeholder:text-zinc-700"
                    )}
                    aria-label="AI komut girişi"
                  />
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isProcessing}
                  className="p-2.5 md:p-3 bg-gradient-to-br from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-900/20 active:scale-95 pointer-events-auto cursor-pointer z-10 touch-manipulation"
                  type="button"
                  aria-label="Mesaj gönder"
                >
                  <Send className="w-4 h-4 md:w-5 md:h-5 pointer-events-none" />
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
          "pointer-events-auto flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 group border border-yellow-500/20 relative overflow-hidden backdrop-blur-sm touch-manipulation",
          isOpen && !isMinimized
            ? "w-0 h-0 p-0 opacity-0"
            : "w-14 h-14 md:w-16 md:h-16 bg-zinc-900 text-yellow-500 hover:scale-110 hover:shadow-yellow-500/20 hover:border-yellow-500/50 active:scale-95",
        )}
        aria-label="Demir AI asistanı aç"
        aria-expanded={isOpen && !isMinimized}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {isMinimized ? (
          <div className="relative">
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <Bot className="w-7 h-7 md:w-8 md:h-8 relative z-10" />
          </div>
        ) : (
          <Bot className="w-7 h-7 md:w-8 md:h-8 relative z-10" />
        )}
      </motion.button>
    </div>
  );
}
