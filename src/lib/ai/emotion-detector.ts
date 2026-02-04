/**
 * Emotion Detector
 * Free, client-side emotion detection from text and voice patterns
 * No external API required - uses heuristic analysis
 */

export type EmotionType =
  | "happy"
  | "sad"
  | "angry"
  | "fearful"
  | "surprised"
  | "disgusted"
  | "neutral"
  | "excited"
  | "frustrated"
  | "curious";

export interface EmotionResult {
  primary: EmotionType;
  confidence: number;
  secondary?: EmotionType;
  valence: number; // -1 (negative) to 1 (positive)
  arousal: number; // 0 (calm) to 1 (excited)
  dominance: number; // 0 (submissive) to 1 (dominant)
  details: EmotionDetails;
}

export interface EmotionDetails {
  textIndicators: string[];
  voiceIndicators: string[];
  punctuationScore: number;
  capsScore: number;
  lengthScore: number;
}

export interface VoiceMetrics {
  averagePitch?: number;
  pitchVariance?: number;
  speakingRate?: number;
  volume?: number;
  pauseDuration?: number;
}

// Turkish emotion keywords with weights
const EMOTION_KEYWORDS: Record<
  EmotionType,
  { keywords: string[]; weight: number }
> = {
  happy: {
    keywords: [
      "mutlu",
      "harika",
      "mükemmel",
      "süper",
      "güzel",
      "sevindim",
      "teşekkür",
      "muhteşem",
      "şahane",
      "efsane",
      "inanılmaz",
      "bayıldım",
      "çok iyi",
      "başarılı",
      "bravo",
      "aferin",
      "heyecanlı",
      "sevinç",
      "keyifli",
      "hoş",
      "😊",
      "😃",
      "🎉",
      "❤️",
      "👍",
      "🙏",
      "yaşasın",
      "oh",
      "vay",
    ],
    weight: 1.0,
  },
  excited: {
    keywords: [
      "heyecanlı",
      "sabırsız",
      "merak",
      "acele",
      "hemen",
      "şimdi",
      "çabuk",
      "inanılmaz",
      "vay",
      "oha",
      "ciddi mi",
      "gerçekten",
      "şaka mı",
      "wow",
      "!!!",
      "???",
      "aman",
      "yaa",
      "aynen",
      "kesinlikle",
      "tabii",
      "evet",
    ],
    weight: 0.9,
  },
  curious: {
    keywords: [
      "nasıl",
      "neden",
      "niçin",
      "ne zaman",
      "nerede",
      "kim",
      "ne",
      "merak",
      "öğrenmek",
      "anlamak",
      "açıkla",
      "anlat",
      "detay",
      "bilgi",
      "soru",
      "peki",
      "yani",
      "mesela",
      "örnek",
      "acaba",
      "?",
    ],
    weight: 0.7,
  },
  sad: {
    keywords: [
      "üzgün",
      "kötü",
      "maalesef",
      "ne yazık",
      "keşke",
      "pişman",
      "hayal kırıklığı",
      "moral",
      "bunalım",
      "depresyon",
      "ağlamak",
      "gözyaşı",
      "kaybetmek",
      "özlem",
      "yalnız",
      "mutsuz",
      "hüzün",
      "acı",
      "zor",
      "berbat",
      "sıkıntı",
      "😢",
      "😭",
      "💔",
      "yazık",
      "vah",
    ],
    weight: 1.0,
  },
  angry: {
    keywords: [
      "kızgın",
      "sinir",
      "öfke",
      "saçmalık",
      "rezalet",
      "skandal",
      "kabul edilemez",
      "iğrenç",
      "berbat",
      "felaket",
      "nefret",
      "tiksinmek",
      "lanet",
      "kahretsin",
      "yeter",
      "bıktım",
      "usandım",
      "sinir bozucu",
      "çıldırtıyor",
      "delirttiniz",
      "😠",
      "😤",
      "🤬",
      "saçma",
      "aptal",
    ],
    weight: 1.0,
  },
  frustrated: {
    keywords: [
      "sorun",
      "problem",
      "çalışmıyor",
      "hata",
      "başarısız",
      "olmadı",
      "yetmedi",
      "anlamadım",
      "karışık",
      "zor",
      "imkansız",
      "yapamıyorum",
      "beceremiyorum",
      "tekrar",
      "yine",
      "hala",
      "gene",
      "niye",
      "ama",
      "fakat",
      "ancak",
      "bozuk",
      "arızalı",
      "çökmüş",
    ],
    weight: 0.8,
  },
  fearful: {
    keywords: [
      "korku",
      "endişe",
      "kaygı",
      "panik",
      "tehlike",
      "risk",
      "tehdit",
      "emin değil",
      "bilmiyorum",
      "belirsiz",
      "şüphe",
      "tereddüt",
      "çekingen",
      "acil",
      "kritik",
      "önemli",
      "dikkat",
      "uyarı",
      "sakın",
      "yanlış",
    ],
    weight: 0.9,
  },
  surprised: {
    keywords: [
      "şaşırdım",
      "inanamıyorum",
      "beklemiyordum",
      "vay canına",
      "oha",
      "cidden",
      "gerçekten mi",
      "nasıl yani",
      "ne",
      "şok",
      "hayret",
      "şaşkın",
      "sürpriz",
      "😮",
      "😲",
      "🤯",
      "aaa",
      "eee",
    ],
    weight: 0.8,
  },
  disgusted: {
    keywords: [
      "iğrenç",
      "mide bulandırıcı",
      "tiksindirici",
      "rezil",
      "korkunç",
      "berbat",
      "kötü",
      "pis",
      "kirli",
      "çirkin",
      "utanç",
      "ayıp",
      "yakışmaz",
    ],
    weight: 0.9,
  },
  neutral: {
    keywords: [],
    weight: 0.3,
  },
};

// Voice pattern indicators
const VOICE_EMOTION_PATTERNS = {
  happy: {
    pitchRange: [180, 300],
    rateRange: [1.1, 1.4],
    volumeRange: [0.7, 1.0],
  },
  excited: {
    pitchRange: [200, 350],
    rateRange: [1.3, 1.8],
    volumeRange: [0.8, 1.0],
  },
  sad: {
    pitchRange: [100, 160],
    rateRange: [0.6, 0.9],
    volumeRange: [0.3, 0.6],
  },
  angry: {
    pitchRange: [150, 280],
    rateRange: [1.2, 1.6],
    volumeRange: [0.9, 1.0],
  },
  fearful: {
    pitchRange: [180, 320],
    rateRange: [1.1, 1.5],
    volumeRange: [0.4, 0.7],
  },
  neutral: {
    pitchRange: [140, 200],
    rateRange: [0.9, 1.1],
    volumeRange: [0.5, 0.8],
  },
};

export class EmotionDetector {
  private lastEmotions: EmotionResult[] = [];
  private emotionHistory: EmotionType[] = [];

  /**
   * Analyze text for emotional content
   */
  analyzeText(text: string): EmotionResult {
    const normalizedText = text.toLowerCase();
    const scores: Record<EmotionType, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      surprised: 0,
      disgusted: 0,
      neutral: 0,
      excited: 0,
      frustrated: 0,
      curious: 0,
    };

    const foundIndicators: string[] = [];

    // Keyword matching
    for (const [emotion, config] of Object.entries(EMOTION_KEYWORDS)) {
      for (const keyword of config.keywords) {
        if (normalizedText.includes(keyword.toLowerCase())) {
          scores[emotion as EmotionType] += config.weight;
          foundIndicators.push(keyword);
        }
      }
    }

    // Punctuation analysis
    const exclamations = (text.match(/!/g) || []).length;
    const questions = (text.match(/\?/g) || []).length;
    const ellipsis = (text.match(/\.\.\./g) || []).length;

    if (exclamations > 2) {
      scores.excited += 0.5;
      scores.angry += 0.3;
    }
    if (questions > 1) {
      scores.curious += 0.5;
      scores.frustrated += 0.2; // confusion often leads to frustration
    }
    if (ellipsis > 0) {
      scores.sad += 0.3;
      scores.frustrated += 0.2;
    }

    // Caps analysis
    const capsRatio = (text.match(/[A-ZÇĞİÖŞÜ]/g) || []).length / text.length;
    if (capsRatio > 0.5 && text.length > 5) {
      scores.angry += 0.6;
      scores.excited += 0.4;
    }

    // Length analysis (very short = frustrated, very long = detailed/neutral)
    const wordCount = text.split(/\s+/).length;
    if (wordCount <= 2) {
      scores.frustrated += 0.2;
    }

    // Find primary and secondary emotions
    const sortedEmotions = Object.entries(scores).sort(([, a], [, b]) => b - a);

    const primaryEmotion = sortedEmotions[0][0] as EmotionType;
    const primaryScore = sortedEmotions[0][1];
    const secondaryEmotion = sortedEmotions[1]?.[0] as EmotionType;

    // Calculate VAD (Valence-Arousal-Dominance)
    const valence = this.calculateValence(primaryEmotion, primaryScore);
    const arousal = this.calculateArousal(primaryEmotion, text);
    const dominance = this.calculateDominance(primaryEmotion);

    // Default to neutral if no strong signals
    const finalEmotion: EmotionType =
      primaryScore > 0.3 ? primaryEmotion : "neutral";

    const result: EmotionResult = {
      primary: finalEmotion,
      confidence: Math.min(primaryScore / 2, 1),
      secondary:
        secondaryEmotion !== finalEmotion ? secondaryEmotion : undefined,
      valence,
      arousal,
      dominance,
      details: {
        textIndicators: foundIndicators,
        voiceIndicators: [],
        punctuationScore: exclamations + questions,
        capsScore: capsRatio,
        lengthScore: wordCount / 50,
      },
    };

    // Store in history
    this.lastEmotions.push(result);
    this.emotionHistory.push(finalEmotion);
    if (this.emotionHistory.length > 10) {
      this.emotionHistory.shift();
      this.lastEmotions.shift();
    }

    return result;
  }

  /**
   * Analyze voice metrics for emotional patterns
   */
  analyzeVoice(metrics: VoiceMetrics): Partial<EmotionResult> {
    const indicators: string[] = [];
    let suggestedEmotion: EmotionType = "neutral";
    let confidence = 0.5;

    if (metrics.speakingRate) {
      if (metrics.speakingRate > 1.3) {
        indicators.push("hızlı konuşma");
        suggestedEmotion = "excited";
        confidence += 0.1;
      } else if (metrics.speakingRate < 0.8) {
        indicators.push("yavaş konuşma");
        suggestedEmotion = "sad";
        confidence += 0.1;
      }
    }

    if (metrics.volume) {
      if (metrics.volume > 0.8) {
        indicators.push("yüksek ses");
        if (suggestedEmotion === "excited") confidence += 0.1;
        else suggestedEmotion = "angry";
      } else if (metrics.volume < 0.4) {
        indicators.push("düşük ses");
        suggestedEmotion = "sad";
        confidence += 0.1;
      }
    }

    if (metrics.pitchVariance && metrics.pitchVariance > 50) {
      indicators.push("değişken ton");
      confidence += 0.1;
    }

    return {
      primary: suggestedEmotion,
      confidence,
      details: {
        textIndicators: [],
        voiceIndicators: indicators,
        punctuationScore: 0,
        capsScore: 0,
        lengthScore: 0,
      },
    };
  }

  /**
   * Combine text and voice analysis
   */
  analyze(text: string, voiceMetrics?: VoiceMetrics): EmotionResult {
    const textResult = this.analyzeText(text);

    if (voiceMetrics) {
      const voiceResult = this.analyzeVoice(voiceMetrics);

      // Combine results - text has 70% weight, voice has 30%
      textResult.confidence =
        textResult.confidence * 0.7 + (voiceResult.confidence || 0.5) * 0.3;
      textResult.details.voiceIndicators =
        voiceResult.details?.voiceIndicators || [];
    }

    return textResult;
  }

  /**
   * Get emotional trend from recent history
   */
  getEmotionalTrend(): {
    trend: "improving" | "declining" | "stable";
    dominant: EmotionType;
  } {
    if (this.emotionHistory.length < 3) {
      return { trend: "stable", dominant: "neutral" };
    }

    const recent = this.lastEmotions.slice(-5);
    const avgValence =
      recent.reduce((sum, e) => sum + e.valence, 0) / recent.length;
    const firstHalfValence =
      this.lastEmotions
        .slice(0, Math.floor(this.lastEmotions.length / 2))
        .reduce((sum, e) => sum + e.valence, 0) /
      Math.floor(this.lastEmotions.length / 2);

    // Find dominant emotion
    const emotionCounts: Record<string, number> = {};
    this.emotionHistory.forEach((e) => {
      emotionCounts[e] = (emotionCounts[e] || 0) + 1;
    });
    const dominant = Object.entries(emotionCounts).sort(
      ([, a], [, b]) => b - a,
    )[0][0] as EmotionType;

    let trend: "improving" | "declining" | "stable" = "stable";
    if (avgValence - firstHalfValence > 0.2) trend = "improving";
    else if (firstHalfValence - avgValence > 0.2) trend = "declining";

    return { trend, dominant };
  }

  /**
   * Get empathetic response suggestion based on emotion
   */
  getEmpatheticResponse(emotion: EmotionType): {
    tone: string;
    suggestions: string[];
    voiceSettings: { rate: number; pitch: number; volume: number };
  } {
    const responses: Record<
      EmotionType,
      {
        tone: string;
        suggestions: string[];
        voiceSettings: { rate: number; pitch: number; volume: number };
      }
    > = {
      happy: {
        tone: "enthusiastic",
        suggestions: ["Harika!", "Çok sevindim!", "Mükemmel bir haber!"],
        voiceSettings: { rate: 1.15, pitch: 1.1, volume: 0.9 },
      },
      excited: {
        tone: "energetic",
        suggestions: ["Vay!", "İnanılmaz!", "Bu çok heyecan verici!"],
        voiceSettings: { rate: 1.2, pitch: 1.15, volume: 0.95 },
      },
      sad: {
        tone: "gentle",
        suggestions: ["Anlıyorum...", "Üzgünüm...", "Yanınızdayım."],
        voiceSettings: { rate: 0.9, pitch: 0.9, volume: 0.7 },
      },
      angry: {
        tone: "calm",
        suggestions: ["Sizi anlıyorum.", "Haklısınız.", "Hemen bakalım."],
        voiceSettings: { rate: 0.95, pitch: 0.95, volume: 0.8 },
      },
      frustrated: {
        tone: "supportive",
        suggestions: [
          "Yardımcı olayım.",
          "Beraber çözelim.",
          "Endişelenmeyin.",
        ],
        voiceSettings: { rate: 0.95, pitch: 1.0, volume: 0.85 },
      },
      fearful: {
        tone: "reassuring",
        suggestions: [
          "Merak etmeyin.",
          "Her şey yolunda.",
          "Size yardımcı olurum.",
        ],
        voiceSettings: { rate: 0.9, pitch: 1.0, volume: 0.8 },
      },
      surprised: {
        tone: "engaging",
        suggestions: [
          "Evet, gerçekten!",
          "Şaşırtıcı değil mi?",
          "Beklenmedik!",
        ],
        voiceSettings: { rate: 1.1, pitch: 1.1, volume: 0.9 },
      },
      disgusted: {
        tone: "understanding",
        suggestions: ["Anlıyorum.", "Haklısınız.", "Kabul edilemez."],
        voiceSettings: { rate: 1.0, pitch: 0.95, volume: 0.85 },
      },
      curious: {
        tone: "informative",
        suggestions: [
          "Şöyle açıklayayım...",
          "İyi soru!",
          "Detaylı anlatayım.",
        ],
        voiceSettings: { rate: 1.05, pitch: 1.05, volume: 0.85 },
      },
      neutral: {
        tone: "professional",
        suggestions: ["Tabii.", "Elbette.", "Hemen bakıyorum."],
        voiceSettings: { rate: 1.0, pitch: 1.0, volume: 0.8 },
      },
    };

    return responses[emotion] || responses.neutral;
  }

  private calculateValence(emotion: EmotionType, score: number): number {
    const valenceMap: Record<EmotionType, number> = {
      happy: 0.8,
      excited: 0.7,
      curious: 0.3,
      surprised: 0.2,
      neutral: 0,
      frustrated: -0.3,
      fearful: -0.5,
      sad: -0.7,
      angry: -0.6,
      disgusted: -0.8,
    };
    return valenceMap[emotion] * Math.min(score, 1);
  }

  private calculateArousal(emotion: EmotionType, text: string): number {
    const arousalMap: Record<EmotionType, number> = {
      excited: 0.9,
      angry: 0.8,
      fearful: 0.7,
      surprised: 0.7,
      happy: 0.6,
      frustrated: 0.5,
      curious: 0.4,
      disgusted: 0.4,
      neutral: 0.3,
      sad: 0.2,
    };
    // Boost for punctuation
    const punctBoost = Math.min((text.match(/[!?]/g) || []).length * 0.05, 0.2);
    return Math.min(arousalMap[emotion] + punctBoost, 1);
  }

  private calculateDominance(emotion: EmotionType): number {
    const dominanceMap: Record<EmotionType, number> = {
      angry: 0.8,
      excited: 0.7,
      happy: 0.6,
      curious: 0.5,
      neutral: 0.5,
      surprised: 0.4,
      frustrated: 0.4,
      disgusted: 0.3,
      sad: 0.2,
      fearful: 0.2,
    };
    return dominanceMap[emotion];
  }

  /**
   * Reset emotion history
   */
  reset(): void {
    this.lastEmotions = [];
    this.emotionHistory = [];
  }
}

// Singleton instance
let emotionDetectorInstance: EmotionDetector | null = null;

export function getEmotionDetector(): EmotionDetector {
  if (!emotionDetectorInstance) {
    emotionDetectorInstance = new EmotionDetector();
  }
  return emotionDetectorInstance;
}
