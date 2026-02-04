"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface SpeakingVisualizerProps {
    isSpeaking: boolean;
    size?: "sm" | "md" | "lg";
}

/**
 * Animated visualizer that shows when AI is speaking
 * Creates a pulsing wave effect similar to audio output visualization
 */
export function SpeakingVisualizer({
    isSpeaking,
    size = "md",
}: SpeakingVisualizerProps) {
    const bars = size === "sm" ? 3 : size === "md" ? 5 : 7;
    const barHeights = useRef<number[]>(Array(bars).fill(0.3));

    // Generate random heights for speaking animation
    useEffect(() => {
        if (!isSpeaking) {
            barHeights.current = Array(bars).fill(0.3);
            return;
        }

        const interval = setInterval(() => {
            barHeights.current = Array(bars)
                .fill(0)
                .map(() => 0.3 + Math.random() * 0.7);
        }, 100);

        return () => clearInterval(interval);
    }, [isSpeaking, bars]);

    const sizeClasses = {
        sm: "h-3 gap-0.5",
        md: "h-4 gap-1",
        lg: "h-6 gap-1.5",
    };

    const barWidth = {
        sm: "w-0.5",
        md: "w-1",
        lg: "w-1.5",
    };

    if (!isSpeaking) return null;

    return (
        <div
            className={`flex items-center justify-center ${sizeClasses[size]}`}
            role="status"
            aria-label="AI konuşuyor"
        >
            {Array.from({ length: bars }).map((_, i) => (
                <motion.div
                    key={i}
                    className={`${barWidth[size]} bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-full`}
                    animate={{
                        scaleY: isSpeaking ? [0.3, 0.8, 0.5, 1, 0.4] : 0.3,
                    }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.1,
                        ease: "easeInOut",
                    }}
                    style={{
                        height: "100%",
                        originY: 0.5,
                    }}
                />
            ))}
        </div>
    );
}

/**
 * Circular pulsing indicator for speaking state
 */
export function SpeakingPulse({ isSpeaking }: { isSpeaking: boolean }) {
    if (!isSpeaking) return null;

    return (
        <div className="relative flex items-center justify-center">
            {/* Outer pulse */}
            <motion.div
                className="absolute w-10 h-10 rounded-full bg-yellow-500/20"
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            {/* Middle pulse */}
            <motion.div
                className="absolute w-8 h-8 rounded-full bg-yellow-500/30"
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.6, 0.2, 0.6],
                }}
                transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2,
                }}
            />
            {/* Inner solid */}
            <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/50">
                <motion.div
                    className="w-2 h-2 rounded-full bg-white"
                    animate={{
                        scale: [1, 0.8, 1],
                    }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>
        </div>
    );
}
