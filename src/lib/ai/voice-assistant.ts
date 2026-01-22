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

  // Callbacks
  private onResultCallback?: (command: VoiceCommand) => void;
  private onErrorCallback?: (error: string) => void;
  private onStartCallback?: () => void;
  private onEndCallback?: () => void;

  constructor(config: Partial<VoiceConfig> = {}) {
    this.config = {
      language: "tr-TR",
      continuous: false,
      interimResults: true,
      maxAlternatives: 3,
      autoSpeak: false,
      voiceRate: 1.1, // Faster for fluency
      voicePitch: 0.9, // Thicker tone
      voiceVolume: 1.0,
      ...config,
    };

    this.initialize();
  }

  /**
   * Initialize speech recognition and synthesis
   */
  private initialize(): void {
    if (typeof window === "undefined") return;

    // Initialize Speech Recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.webkitSpeechRecognition || window.SpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.lang = this.config.language;
      this.recognition.maxAlternatives = this.config.maxAlternatives;

      // Event handlers
      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStartCallback?.();
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onEndCallback?.();
      };

      this.recognition.onresult = (event) => {
        const result = event.results[event.resultIndex];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        const isFinal = result.isFinal;

        this.onResultCallback?.({
          transcript,
          confidence,
          isFinal,
          timestamp: new Date(),
        });
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        this.onErrorCallback?.(event.error);
      };
    }

    // Initialize Speech Synthesis
    if ("speechSynthesis" in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  /**
   * Start listening
   */
  startListening(): void {
    if (!this.recognition) {
      this.onErrorCallback?.("Speech recognition not supported");
      return;
    }

    if (this.isListening) {
      console.warn("Already listening");
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      this.onErrorCallback?.(
        error instanceof Error ? error.message : "Failed to start listening",
      );
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.stop();
    } catch (error) {
      console.error("Stop listening error:", error);
    }
  }

  /**
   * Speak text
   */
  speak(text: string, options: Partial<VoiceConfig> = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error("Speech synthesis not supported"));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.language || this.config.language;
      utterance.rate = options.voiceRate || this.config.voiceRate;
      utterance.pitch = options.voicePitch || this.config.voicePitch;
      utterance.volume = options.voiceVolume || this.config.voiceVolume;

      // Try to find Turkish voice
      const voices = this.synthesis.getVoices();
      const turkishVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("tr") ||
          voice.name.toLowerCase().includes("turkish"),
      );

      if (turkishVoice) {
        utterance.voice = turkishVoice;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        if (event.error === "interrupted" || event.error === "canceled") {
          resolve();
        } else {
          reject(new Error(event.error));
        }
      };

      this.synthesis.speak(utterance);
    });
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
