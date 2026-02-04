/**
 * Emotional Voice Assistant
 * Real-time voice assistant with emotion detection and empathetic responses
 * Uses Web Speech API (FREE) - No external services required
 */

import { VoiceAssistant, VoiceConfig } from "./voice-assistant";
import {
  EmotionDetector,
  EmotionResult,
  EmotionType,
  VoiceMetrics,
  getEmotionDetector,
} from "./emotion-detector";

export interface EmotionalVoiceConfig extends VoiceConfig {
  enableEmotionDetection: boolean;
  adaptiveVoice: boolean; // Adjust TTS based on detected emotion
  empathyLevel: "low" | "medium" | "high";
  showEmotionFeedback: boolean;
}

export interface EmotionalVoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  currentEmotion: EmotionType;
  emotionConfidence: number;
  conversationMood: "positive" | "negative" | "neutral";
  voiceMetrics: VoiceMetrics;
}

export interface EmotionalResponse {
  text: string;
  emotion: EmotionResult;
  suggestedTone: string;
  voiceSettings: { rate: number; pitch: number; volume: number };
}

export class EmotionalVoiceAssistant extends VoiceAssistant {
  private emotionDetector: EmotionDetector;
  private emotionalConfig: EmotionalVoiceConfig;
  private currentState: EmotionalVoiceState;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;

  // Additional callbacks for emotional events
  private onEmotionChangeCallback?: (emotion: EmotionResult) => void;
  private onMoodChangeCallback?: (
    mood: "positive" | "negative" | "neutral",
  ) => void;
  private onVoiceMetricsCallback?: (metrics: VoiceMetrics) => void;

  constructor(config: Partial<EmotionalVoiceConfig> = {}) {
    super({
      language: config.language || "tr-TR",
      continuous: true,
      interimResults: true,
      maxAlternatives: 1,
      autoSpeak: config.autoSpeak ?? false,
      voiceRate: config.voiceRate ?? 1.0,
      voicePitch: config.voicePitch ?? 1.0,
      voiceVolume: config.voiceVolume ?? 0.8,
      ...config,
    });

    this.emotionalConfig = {
      language: "tr-TR",
      continuous: true,
      interimResults: true,
      maxAlternatives: 1,
      autoSpeak: false,
      voiceRate: 1.0,
      voicePitch: 1.0,
      voiceVolume: 0.8,
      enableEmotionDetection: true,
      adaptiveVoice: true,
      empathyLevel: "high",
      showEmotionFeedback: true,
      ...config,
    };

    this.emotionDetector = getEmotionDetector();

    this.currentState = {
      isListening: false,
      isSpeaking: false,
      currentEmotion: "neutral",
      emotionConfidence: 0,
      conversationMood: "neutral",
      voiceMetrics: {},
    };

    this.initializeAudioAnalysis();
  }

  /**
   * Initialize Web Audio API for voice analysis
   */
  private async initializeAudioAnalysis(): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as unknown as Record<string, any>).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
    } catch (e) {
      console.warn("[EmotionalVoice] Audio analysis not available:", e);
    }
  }

  /**
   * Start listening with emotion detection
   */
  async startEmotionalListening(): Promise<void> {
    // Request microphone access for audio analysis
    if (this.audioContext && !this.mediaStream) {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const source = this.audioContext.createMediaStreamSource(
          this.mediaStream,
        );
        if (this.analyser) {
          source.connect(this.analyser);
        }
        // Start monitoring voice metrics
        this.startVoiceMetricsMonitoring();
      } catch (e) {
        console.warn("[EmotionalVoice] Microphone access denied:", e);
      }
    }

    this.currentState.isListening = true;
    this.startListening();
  }

  /**
   * Monitor voice metrics in real-time
   */
  private startVoiceMetricsMonitoring(): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const updateMetrics = () => {
      if (!this.currentState.isListening || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);

      // Calculate volume (RMS)
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const volume = Math.sqrt(sum / dataArray.length) / 255;

      // Estimate pitch from frequency bins (simplified)
      let maxIndex = 0;
      let maxValue = 0;
      for (let i = 0; i < dataArray.length / 4; i++) {
        if (dataArray[i] > maxValue) {
          maxValue = dataArray[i];
          maxIndex = i;
        }
      }
      const sampleRate = this.audioContext?.sampleRate || 44100;
      const pitch = (maxIndex * sampleRate) / (this.analyser.fftSize * 2);

      this.currentState.voiceMetrics = {
        volume,
        averagePitch: pitch,
        speakingRate: 1.0, // Would need more complex analysis
      };

      this.onVoiceMetricsCallback?.(this.currentState.voiceMetrics);

      requestAnimationFrame(updateMetrics);
    };

    updateMetrics();
  }

  /**
   * Process transcript with emotion detection
   */
  processWithEmotion(transcript: string): EmotionalResponse {
    const emotion = this.emotionDetector.analyze(
      transcript,
      this.currentState.voiceMetrics,
    );

    this.currentState.currentEmotion = emotion.primary;
    this.currentState.emotionConfidence = emotion.confidence;

    // Update conversation mood
    const trend = this.emotionDetector.getEmotionalTrend();
    if (emotion.valence > 0.2) {
      this.currentState.conversationMood = "positive";
    } else if (emotion.valence < -0.2) {
      this.currentState.conversationMood = "negative";
    } else {
      this.currentState.conversationMood = "neutral";
    }

    // Get empathetic response settings
    const empathy = this.emotionDetector.getEmpatheticResponse(emotion.primary);

    // Notify listeners
    this.onEmotionChangeCallback?.(emotion);
    // Notify mood change
    this.onMoodChangeCallback?.(this.currentState.conversationMood);

    return {
      text: transcript,
      emotion,
      suggestedTone: empathy.tone,
      voiceSettings: empathy.voiceSettings,
    };
  }

  /**
   * Speak with emotional adaptation
   */
  async speakWithEmotion(
    text: string,
    responseToEmotion?: EmotionType,
  ): Promise<void> {
    const emotion = responseToEmotion || this.currentState.currentEmotion;
    const empathy = this.emotionDetector.getEmpatheticResponse(emotion);

    // Store original settings
    const originalRate = this.emotionalConfig.voiceRate;
    const originalPitch = this.emotionalConfig.voicePitch;
    const originalVolume = this.emotionalConfig.voiceVolume;

    // Apply emotional voice settings if adaptive voice is enabled
    if (this.emotionalConfig.adaptiveVoice) {
      this.updateConfig({
        voiceRate: empathy.voiceSettings.rate,
        voicePitch: empathy.voiceSettings.pitch,
        voiceVolume: empathy.voiceSettings.volume,
      });
    }

    this.currentState.isSpeaking = true;

    try {
      await this.speakEnhanced(text, empathy.voiceSettings);
    } finally {
      this.currentState.isSpeaking = false;

      // Restore original settings
      if (this.emotionalConfig.adaptiveVoice) {
        this.updateConfig({
          voiceRate: originalRate,
          voicePitch: originalPitch,
          voiceVolume: originalVolume,
        });
      }
    }
  }

  /**
   * Enhanced speak with custom voice settings
   */
  private speakEnhanced(
    text: string,
    settings: { rate: number; pitch: number; volume: number },
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        reject(new Error("Speech synthesis not available"));
        return;
      }

      const wasListening = this.getIsListening();
      if (wasListening) this.stopListening();

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.emotionalConfig.language;
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;

      // Get best Turkish voice
      const voices = window.speechSynthesis.getVoices();
      const trVoice = voices.find(
        (v) =>
          v.lang.startsWith("tr") || v.name.toLowerCase().includes("turkish"),
      );
      if (trVoice) utterance.voice = trVoice;

      utterance.onend = () => {
        if (wasListening) {
          setTimeout(() => this.startListening(), 300);
        }
        resolve();
      };

      utterance.onerror = () => {
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Get current emotional state
   */
  getEmotionalState(): EmotionalVoiceState {
    return { ...this.currentState };
  }

  /**
   * Get emotion detector for direct access
   */
  getEmotionDetector(): EmotionDetector {
    return this.emotionDetector;
  }

  /**
   * Set emotion change callback
   */
  onEmotionChange(callback: (emotion: EmotionResult) => void): void {
    this.onEmotionChangeCallback = callback;
  }

  /**
   * Set mood change callback
   */
  onMoodChange(
    callback: (mood: "positive" | "negative" | "neutral") => void,
  ): void {
    this.onMoodChangeCallback = callback;
  }

  /**
   * Set voice metrics callback
   */
  onVoiceMetrics(callback: (metrics: VoiceMetrics) => void): void {
    this.onVoiceMetricsCallback = callback;
  }

  /**
   * Generate empathetic system prompt based on detected emotion
   */
  getEmpatheticSystemPrompt(userEmotion: EmotionType): string {
    const prompts: Record<EmotionType, string> = {
      happy: `Kullanıcı mutlu görünüyor. Enerjik ve olumlu bir tonla yanıt ver. Onların coşkusunu paylaş.`,
      excited: `Kullanıcı heyecanlı! Aynı enerjiyle karşılık ver, hızlı ve dinamik ol.`,
      sad: `Kullanıcı üzgün görünüyor. Nazik ve destekleyici ol. Empati kur, acele etme.`,
      angry: `Kullanıcı sinirli. Sakin ve anlayışlı ol. Onları dinlediğini göster, savunmaya geçme.`,
      frustrated: `Kullanıcı hayal kırıklığına uğramış. Çözüm odaklı ol, yardım teklif et.`,
      fearful: `Kullanıcı endişeli. Güven verici ol, telaşlandırma. Adım adım yardım et.`,
      surprised: `Kullanıcı şaşkın. Açıklayıcı ol, detay ver, merakını gider.`,
      disgusted: `Kullanıcı rahatsız. Anlayış göster, onaylamadan dinle.`,
      curious: `Kullanıcı meraklı! Bilgilendirici ol, detaylı açıkla.`,
      neutral: `Normal bir sohbet. Profesyonel ve yardımcı ol.`,
    };

    return prompts[userEmotion] || prompts.neutral;
  }

  /**
   * Get conversation summary with emotional insights
   */
  getConversationInsights(): {
    dominantEmotion: EmotionType;
    moodTrend: "improving" | "declining" | "stable";
    suggestions: string[];
  } {
    const trend = this.emotionDetector.getEmotionalTrend();

    let suggestions: string[] = [];

    if (trend.trend === "declining") {
      suggestions = [
        "Konuşma tonu daha sıcak olabilir",
        "Daha fazla empati gösterin",
        "Somut çözümler sunun",
      ];
    } else if (trend.trend === "improving") {
      suggestions = ["İyi gidiyorsunuz!", "Olumlu etkileşimi sürdürün"];
    }

    return {
      dominantEmotion: trend.dominant,
      moodTrend: trend.trend,
      suggestions,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    super.destroy();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.emotionDetector.reset();
  }
}

// Singleton instance
let emotionalVoiceInstance: EmotionalVoiceAssistant | null = null;

export function getEmotionalVoiceAssistant(
  config?: Partial<EmotionalVoiceConfig>,
): EmotionalVoiceAssistant {
  if (!emotionalVoiceInstance) {
    emotionalVoiceInstance = new EmotionalVoiceAssistant(config);
  }
  return emotionalVoiceInstance;
}

export function destroyEmotionalVoiceAssistant(): void {
  if (emotionalVoiceInstance) {
    emotionalVoiceInstance.destroy();
    emotionalVoiceInstance = null;
  }
}
