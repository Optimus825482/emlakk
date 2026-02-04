/**
 * Emotion Indicator Component
 * Real-time visual display of detected emotions
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { EmotionType, EmotionResult } from '@/lib/ai/emotion-detector';

interface EmotionIndicatorProps {
    emotion: EmotionType;
    confidence: number;
    valence: number;
    arousal: number;
    showDetails?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

// Emotion to emoji/icon mapping
const EMOTION_VISUALS: Record<EmotionType, {
    emoji: string;
    color: string;
    bgColor: string;
    label: string;
}> = {
    happy: { emoji: '😊', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20', label: 'Mutlu' },
    excited: { emoji: '🤩', color: 'text-orange-500', bgColor: 'bg-orange-500/20', label: 'Heyecanlı' },
    curious: { emoji: '🤔', color: 'text-blue-400', bgColor: 'bg-blue-400/20', label: 'Meraklı' },
    surprised: { emoji: '😮', color: 'text-purple-500', bgColor: 'bg-purple-500/20', label: 'Şaşkın' },
    neutral: { emoji: '😐', color: 'text-gray-400', bgColor: 'bg-gray-400/20', label: 'Nötr' },
    sad: { emoji: '😢', color: 'text-blue-600', bgColor: 'bg-blue-600/20', label: 'Üzgün' },
    angry: { emoji: '😠', color: 'text-red-500', bgColor: 'bg-red-500/20', label: 'Kızgın' },
    frustrated: { emoji: '😤', color: 'text-orange-600', bgColor: 'bg-orange-600/20', label: 'Sinirli' },
    fearful: { emoji: '😰', color: 'text-purple-400', bgColor: 'bg-purple-400/20', label: 'Endişeli' },
    disgusted: { emoji: '🤢', color: 'text-green-600', bgColor: 'bg-green-600/20', label: 'Rahatsız' }
};

export function EmotionIndicator({
    emotion,
    confidence,
    valence: _valence, // prefixed to avoid unused warning
    arousal,
    showDetails = false,
    size = 'md',
    className
}: EmotionIndicatorProps) {
    const visual = EMOTION_VISUALS[emotion] || EMOTION_VISUALS.neutral;

    const sizeClasses = {
        sm: 'w-8 h-8 text-lg',
        md: 'w-12 h-12 text-2xl',
        lg: 'w-16 h-16 text-4xl'
    };

    return (
        <motion.div
            className={cn('flex items-center gap-2', className)}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
            {/* Emotion Face */}
            <motion.div
                className={cn(
                    'rounded-full flex items-center justify-center',
                    visual.bgColor,
                    sizeClasses[size]
                )}
                animate={{
                    scale: [1, 1.05, 1],
                    rotate: arousal > 0.7 ? [0, -5, 5, 0] : 0
                }}
                transition={{
                    duration: 0.5,
                    repeat: arousal > 0.7 ? Infinity : 0,
                    repeatDelay: 0.5
                }}
            >
                <span role="img" aria-label={visual.label}>
                    {visual.emoji}
                </span>
            </motion.div>

            {/* Details */}
            {showDetails && (
                <div className="flex flex-col gap-1">
                    <span className={cn('text-sm font-medium', visual.color)}>
                        {visual.label}
                    </span>

                    {/* Confidence Bar */}
                    <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                                className={cn('h-full rounded-full', visual.bgColor.replace('/20', ''))}
                                initial={{ width: 0 }}
                                animate={{ width: `${confidence * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                        <span className="text-xs text-gray-400">
                            {Math.round(confidence * 100)}%
                        </span>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

interface EmotionPulseProps {
    emotion: EmotionType;
    isActive: boolean;
    className?: string;
}

export function EmotionPulse({ emotion, isActive, className }: EmotionPulseProps) {
    const visual = EMOTION_VISUALS[emotion] || EMOTION_VISUALS.neutral;

    return (
        <div className={cn('relative', className)}>
            <AnimatePresence>
                {isActive && (
                    <>
                        {/* Pulse rings */}
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                className={cn(
                                    'absolute inset-0 rounded-full border-2',
                                    visual.color.replace('text-', 'border-')
                                )}
                                initial={{ scale: 1, opacity: 0.6 }}
                                animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
                                transition={{
                                    duration: 1.5,
                                    delay: i * 0.2,
                                    repeat: Infinity,
                                    ease: 'easeOut'
                                }}
                            />
                        ))}

                        {/* Center dot */}
                        <motion.div
                            className={cn(
                                'w-3 h-3 rounded-full',
                                visual.bgColor.replace('/20', '')
                            )}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        />
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

interface MoodIndicatorProps {
    mood: 'positive' | 'negative' | 'neutral';
    trend: 'improving' | 'declining' | 'stable';
    className?: string;
}

export function MoodIndicator({ mood, trend, className }: MoodIndicatorProps) {
    const moodConfig = {
        positive: { color: 'text-green-400', bg: 'bg-green-500/20', icon: '↑', label: 'Olumlu' },
        negative: { color: 'text-red-400', bg: 'bg-red-500/20', icon: '↓', label: 'Olumsuz' },
        neutral: { color: 'text-gray-400', bg: 'bg-gray-500/20', icon: '→', label: 'Nötr' }
    };

    const trendConfig = {
        improving: { icon: '📈', label: 'İyileşiyor' },
        declining: { icon: '📉', label: 'Düşüyor' },
        stable: { icon: '➡️', label: 'Stabil' }
    };

    const m = moodConfig[mood];
    const t = trendConfig[trend];

    return (
        <motion.div
            className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full',
                m.bg,
                className
            )}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
        >
            <span className={cn('text-sm font-medium', m.color)}>
                {m.label}
            </span>
            <span className="text-sm">{t.icon}</span>
        </motion.div>
    );
}

interface EmotionHistoryProps {
    emotions: EmotionResult[];
    className?: string;
}

export function EmotionHistory({ emotions, className }: EmotionHistoryProps) {
    const recentEmotions = emotions.slice(-5);

    return (
        <div className={cn('flex items-center gap-1', className)}>
            {recentEmotions.map((emotion, index) => {
                const visual = EMOTION_VISUALS[emotion.primary] || EMOTION_VISUALS.neutral;
                const opacity = 0.4 + (index / recentEmotions.length) * 0.6;

                return (
                    <motion.div
                        key={index}
                        className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-sm',
                            visual.bgColor
                        )}
                        style={{ opacity }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        {visual.emoji}
                    </motion.div>
                );
            })}
        </div>
    );
}

interface ValenceArousalMeterProps {
    valence: number; // -1 to 1
    arousal: number; // 0 to 1
    size?: number;
    className?: string;
}

export function ValenceArousalMeter({
    valence,
    arousal,
    size = 80,
    className
}: ValenceArousalMeterProps) {
    // Convert to pixel coordinates
    const x = ((valence + 1) / 2) * size;
    const y = (1 - arousal) * size;

    return (
        <div
            className={cn('relative rounded-lg overflow-hidden', className)}
            style={{ width: size, height: size }}
        >
            {/* Background gradient */}
            <div
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(to bottom, 
            rgba(239, 68, 68, 0.3) 0%, 
            rgba(59, 130, 246, 0.3) 100%
          )`
                }}
            />

            {/* Vertical gradient (valence) */}
            <div
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(to right, 
            rgba(239, 68, 68, 0.3) 0%, 
            rgba(34, 197, 94, 0.3) 100%
          )`,
                    mixBlendMode: 'overlay'
                }}
            />

            {/* Axes */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20" />

            {/* Point */}
            <motion.div
                className="absolute w-3 h-3 bg-white rounded-full shadow-lg"
                style={{
                    left: x - 6,
                    top: y - 6,
                    boxShadow: '0 0 10px rgba(255,255,255,0.5)'
                }}
                animate={{
                    scale: [1, 1.2, 1],
                }}
                transition={{ duration: 1, repeat: Infinity }}
            />

            {/* Labels */}
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] text-white/50">
                Valans
            </span>
            <span className="absolute top-1/2 -left-1 -rotate-90 origin-right text-[8px] text-white/50">
                Uyarılma
            </span>
        </div>
    );
}
