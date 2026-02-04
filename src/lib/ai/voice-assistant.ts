/**
 * Advanced Voice Assistant
 * Enhanced speech recognition and synthesis with Turkish language support
 */

export interface VoiceConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  autoSpeak: boolean;
  voiceRate: number;
  voicePitch: number;
  voiceVolume: number;
}

export interface VoiceCommand {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: Date;
}

export class VoiceAssistant {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private config: VoiceConfig;
  private isListening = false;
  private isSpeaking = false;
  private shouldAutoRestart = false; // Voice chat mode için otomatik yeniden başlatma
  private restartAttempts = 0;
  private readonly MAX_RESTART_ATTEMPTS = 3;

  // Callbacks
  private onResultCallback?: (command: VoiceCommand) => void;
  private onInterimResultCallback?: (text: string) => void;
  private onSilenceDetectedCallback?: (text: string) => void;
  private onErrorCallback?: (error: string) => void;
  private onStartCallback?: () => void;
  private onEndCallback?: () => void;

  private silenceTimer: NodeJS.Timeout | null = null;

  // Adaptive VAD (Voice Activity Detection) System
  private readonly MIN_SILENCE_DURATION = 1200; // Minimum 1.2 saniye
  private readonly MAX_SILENCE_DURATION = 4000; // Maximum 4 saniye
  private readonly DEFAULT_SILENCE_DURATION = 2000; // Varsayılan 2 saniye

  // Speech pattern tracking for adaptive timing
  private speechStartTime: number = 0;
  private lastTranscriptLength: number = 0;
  private wordTimestamps: number[] = [];
  private pauseHistory: number[] = []; // Son duraklamaların süreleri

  constructor(config: Partial<VoiceConfig> = {}) {
    this.config = {
      language: "tr-TR",
      continuous: false, // For VAD, usually continuous=true is better, but we manage state manually
      interimResults: true,
      maxAlternatives: 1,
      autoSpeak: false,
      voiceRate: 1.1,
      voicePitch: 1.0,
      voiceVolume: 1.0,
      ...config,
    };

    this.initialize();
  }

  private initialize(): void {
    if (typeof window === "undefined") return;

    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.webkitSpeechRecognition || window.SpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = true; // Enable continuous to handle VAD manually
      this.recognition.interimResults = true;
      this.recognition.lang = this.config.language;
      this.recognition.maxAlternatives = this.config.maxAlternatives;

      this.recognition.onstart = () => {
        console.log("[VoiceAssistant] Speech recognition started");
        this.isListening = true;
        this.onStartCallback?.();
      };

      this.recognition.onend = () => {
        console.log("[VoiceAssistant] Speech recognition ended");
        const wasListening = this.isListening;
        this.isListening = false;

        // Voice chat mode aktifse ve konuşma yoksa otomatik yeniden başlat
        if (this.shouldAutoRestart && !this.isSpeaking && wasListening) {
          if (this.restartAttempts < this.MAX_RESTART_ATTEMPTS) {
            this.restartAttempts++;
            console.log(
              `[VoiceAssistant] Auto-restarting... (attempt ${this.restartAttempts})`,
            );
            setTimeout(() => {
              if (this.shouldAutoRestart && !this.isSpeaking) {
                this.startListeningInternal();
              }
            }, 300);
          } else {
            console.warn(
              "[VoiceAssistant] Max restart attempts reached, stopping auto-restart",
            );
            this.restartAttempts = 0;
          }
        }

        this.onEndCallback?.();
      };

      this.recognition.onresult = (event) => {
        if (this.silenceTimer) clearTimeout(this.silenceTimer);

        // Track speech timing for adaptive VAD
        const now = Date.now();
        if (this.speechStartTime === 0) {
          this.speechStartTime = now;
        }

        // Build FULL transcript from all results to avoid missing context in continuous mode
        let fullTranscript = "";
        let isFinalChunk = false;

        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript;
          if (event.results[i].isFinal) isFinalChunk = true;
        }

        // Track word timestamps for speech rate calculation
        const currentWordCount = fullTranscript
          .split(/\s+/)
          .filter((w) => w).length;
        if (currentWordCount > this.lastTranscriptLength) {
          this.wordTimestamps.push(now);
          this.lastTranscriptLength = currentWordCount;
        }

        // Emit interim for UI
        if (fullTranscript) {
          this.onInterimResultCallback?.(fullTranscript);
        }

        // Calculate adaptive silence duration
        const adaptiveSilence = this.calculateAdaptiveSilence(fullTranscript);

        // Silence Timer Strategy with Adaptive Duration
        this.silenceTimer = setTimeout(() => {
          if (fullTranscript.trim()) {
            console.log(
              `[VoiceAssistant] Silence detected (${adaptiveSilence}ms). Finalizing:`,
              fullTranscript,
            );

            // Reset speech tracking
            this.resetSpeechTracking();

            // 1. Emit as Final Result
            this.onResultCallback?.({
              transcript: fullTranscript,
              confidence: 1.0,
              isFinal: true,
              timestamp: new Date(),
            });

            // 2. Trigger Auto-Send Signal
            this.onSilenceDetectedCallback?.(fullTranscript);
          }
        }, adaptiveSilence);
      };

      this.recognition.onerror = (event) => {
        if (event.error === "no-speech") return;
        console.error("[VoiceAssistant] Error:", event.error);
        this.isListening = false;
        this.onErrorCallback?.(event.error);
      };
    }

    if ("speechSynthesis" in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  /**
   * Adaptive silence duration calculation based on speech patterns
   * Considers: speech rate, sentence completion, question marks, etc.
   */
  private calculateAdaptiveSilence(transcript: string): number {
    const text = transcript.trim();
    if (!text) return this.DEFAULT_SILENCE_DURATION;

    let duration = this.DEFAULT_SILENCE_DURATION;
    const factors: string[] = [];

    // 1. Sentence completion check - shorter wait if sentence seems complete
    const endsWithPunctuation = /[.!?]$/.test(text);
    const endsWithComma = /,$/.test(text);

    if (endsWithPunctuation) {
      duration -= 400; // Cümle tamamlanmış, daha kısa bekle
      factors.push("punctuation");
    } else if (endsWithComma) {
      duration += 300; // Virgül var, devam edebilir
      factors.push("comma");
    }

    // 2. Question detection - questions usually complete
    const isQuestion =
      /\?$/.test(text) ||
      /^(ne|nasıl|neden|nerede|kim|hangi|kaç|mi|mı|mu|mü)/i.test(text);
    if (isQuestion && endsWithPunctuation) {
      duration -= 300;
      factors.push("question");
    }

    // 3. Speech rate analysis - fast speakers need less wait
    if (this.wordTimestamps.length >= 3) {
      const recentTimestamps = this.wordTimestamps.slice(-5);
      const avgInterval =
        recentTimestamps.reduce((sum, ts, i) => {
          if (i === 0) return 0;
          return sum + (ts - recentTimestamps[i - 1]);
        }, 0) /
        (recentTimestamps.length - 1);

      // Fast speaker (< 400ms per word) = shorter silence
      // Slow speaker (> 800ms per word) = longer silence
      if (avgInterval < 400) {
        duration -= 300;
        factors.push("fast-speaker");
      } else if (avgInterval > 800) {
        duration += 500;
        factors.push("slow-speaker");
      }
    }

    // 4. Short vs Long utterance
    const wordCount = text.split(/\s+/).length;
    if (wordCount <= 3) {
      // Very short - might be incomplete thought, wait longer
      duration += 400;
      factors.push("short-utterance");
    } else if (wordCount >= 15) {
      // Long utterance - probably complete
      duration -= 200;
      factors.push("long-utterance");
    }

    // 5. Incomplete sentence patterns (Turkish)
    const incompletePatterns = [
      /\s(ve|veya|ama|fakat|ancak|çünkü|için|ile|de|da|ki)$/i,
      /\s(bir|bu|şu|o)$/i,
      /\s(daha|en|çok|az)$/i,
    ];

    for (const pattern of incompletePatterns) {
      if (pattern.test(text)) {
        duration += 600; // Incomplete, wait more
        factors.push("incomplete-pattern");
        break;
      }
    }

    // 6. Numbers or listing - might continue
    if (
      /\d+[.,]?\s*$/.test(text) ||
      /birinci|ikinci|üçüncü|ilk|son/i.test(text)
    ) {
      duration += 300;
      factors.push("numbering");
    }

    // Clamp to min/max bounds
    duration = Math.max(
      this.MIN_SILENCE_DURATION,
      Math.min(this.MAX_SILENCE_DURATION, duration),
    );

    console.log(
      `[VAD] Adaptive silence: ${duration}ms (factors: ${factors.join(", ") || "none"})`,
    );
    return duration;
  }

  /**
   * Reset speech tracking for next utterance
   */
  private resetSpeechTracking(): void {
    this.speechStartTime = 0;
    this.lastTranscriptLength = 0;
    this.wordTimestamps = [];
  }

  /**
   * Internal start method without changing auto-restart flag
   */
  private startListeningInternal(): void {
    if (!this.recognition) return;
    if (this.isListening) return;

    try {
      this.recognition.start();
      this.restartAttempts = 0; // Reset on successful start
    } catch (e) {
      console.warn("[VoiceAssistant] Start failed:", e);
    }
  }

  /**
   * Start listening - call this for normal start
   */
  startListening(): void {
    this.startListeningInternal();
  }

  /**
   * Enable voice chat mode - continuous listening with auto-restart
   */
  enableVoiceChatMode(): void {
    console.log("[VoiceAssistant] Voice chat mode ENABLED");
    this.shouldAutoRestart = true;
    this.restartAttempts = 0;
    this.startListeningInternal();
  }

  /**
   * Disable voice chat mode
   */
  disableVoiceChatMode(): void {
    console.log("[VoiceAssistant] Voice chat mode DISABLED");
    this.shouldAutoRestart = false;
    this.restartAttempts = 0;
    this.stopListening();
  }

  /**
   * Check if voice chat mode is active
   */
  isVoiceChatModeActive(): boolean {
    return this.shouldAutoRestart;
  }

  stopListening(): void {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (!this.recognition) return;
    this.recognition.stop();
  }

  speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error("No synthesis support"));
        return;
      }

      // 1. Mute Mic
      const wasListening = this.isListening;
      if (wasListening) this.stopListening();

      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "tr-TR";

      // Voice selection logic (simplified)
      const voices = this.synthesis.getVoices();
      const trVoice = voices.find((v) => v.lang.startsWith("tr"));
      if (trVoice) utterance.voice = trVoice;

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        // 2. Unmute Mic - voice chat mode aktifse veya önceden dinliyorduysa
        if (this.shouldAutoRestart || wasListening) {
          // Small delay to prevent catching system audio
          console.log(
            "[VoiceAssistant] Speech ended, restarting microphone...",
          );
          setTimeout(() => {
            if (!this.isSpeaking) {
              this.startListeningInternal();
            }
          }, 500);
        }
        resolve();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        // Hata durumunda da mikrofonu yeniden başlat
        if (this.shouldAutoRestart) {
          setTimeout(() => this.startListeningInternal(), 500);
        }
        resolve(); // Resolve anyway to not break flow
      };

      this.synthesis.speak(utterance);
    });
  }

  onInterimResult(cb: (text: string) => void) {
    this.onInterimResultCallback = cb;
  }

  onSilenceDetected(cb: (text: string) => void) {
    this.onSilenceDetectedCallback = cb;
  }

  /**
   * Stop speaking
   */
  stopSpeaking(): void {
    if (!this.synthesis) return;
    this.synthesis.cancel();
    this.isSpeaking = false;
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Check if currently speaking
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Set callbacks
   */
  onResult(callback: (command: VoiceCommand) => void): void {
    this.onResultCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  onStart(callback: () => void): void {
    this.onStartCallback = callback;
  }

  onEnd(callback: () => void): void {
    this.onEndCallback = callback;
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  /**
   * Get Turkish voices
   */
  getTurkishVoices(): SpeechSynthesisVoice[] {
    return this.getAvailableVoices().filter(
      (voice) =>
        voice.lang.startsWith("tr") ||
        voice.name.toLowerCase().includes("turkish"),
    );
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.recognition) {
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.lang = this.config.language;
      this.recognition.maxAlternatives = this.config.maxAlternatives;
    }
  }

  /**
   * Check browser support
   */
  static isSupported(): {
    recognition: boolean;
    synthesis: boolean;
  } {
    if (typeof window === "undefined") {
      return { recognition: false, synthesis: false };
    }

    return {
      recognition:
        "webkitSpeechRecognition" in window || "SpeechRecognition" in window,
      synthesis: "speechSynthesis" in window,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopListening();
    this.stopSpeaking();
    this.recognition = null;
    this.synthesis = null;
  }
}

// Voice command patterns for Turkish
export const TURKISH_VOICE_COMMANDS = {
  // Navigation
  navigation: {
    patterns: [/git|aç|göster/i, /sayfaya git/i, /menüyü aç/i],
    examples: [
      "İlanlar sayfasına git",
      "Randevular menüsünü aç",
      "Ayarları göster",
    ],
  },

  // Queries
  queries: {
    patterns: [/kaç|ne kadar|sayı/i, /listele|göster|bul/i, /ara|sorgula/i],
    examples: ["Kaç ilan var?", "Aktif ilanları listele", "Hendek'te arsa ara"],
  },

  // Actions
  actions: {
    patterns: [/oluştur|ekle|yeni/i, /sil|kaldır/i, /güncelle|değiştir/i],
    examples: ["Yeni ilan oluştur", "Bu ilanı sil", "Fiyatı güncelle"],
  },

  // Analysis
  analysis: {
    patterns: [/analiz|rapor|istatistik/i, /trend|değişim/i, /karşılaştır/i],
    examples: [
      "Fiyat trendlerini analiz et",
      "Aylık rapor oluştur",
      "Bölgeleri karşılaştır",
    ],
  },

  // Memory
  memory: {
    patterns: [/hatırla|kaydet|not/i, /geçmiş|önceki/i, /ne konuştuk/i],
    examples: [
      "Bunu hatırla",
      "Geçen hafta ne konuştuk?",
      "Önceki konuşmayı göster",
    ],
  },
};

/**
 * Detect command type from transcript
 */
export function detectCommandType(
  transcript: string,
): keyof typeof TURKISH_VOICE_COMMANDS | null {
  for (const [type, config] of Object.entries(TURKISH_VOICE_COMMANDS)) {
    if (config.patterns.some((pattern) => pattern.test(transcript))) {
      return type as keyof typeof TURKISH_VOICE_COMMANDS;
    }
  }
  return null;
}
