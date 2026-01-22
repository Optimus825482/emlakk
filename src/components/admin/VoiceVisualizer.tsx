"use client";

import { useEffect, useRef } from "react";

interface VoiceVisualizerProps {
  isRecording: boolean;
}

export function VoiceVisualizer({ isRecording }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording) {
      startVisualizer();
    } else {
      stopVisualizer();
    }

    return () => {
      stopVisualizer();
    };
  }, [isRecording]);

  const startVisualizer = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const analyzer = audioContextRef.current.createAnalyser();
      analyzer.fftSize = 64; // Low resolution for chunky bars
      analyzerRef.current = analyzer;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyzer);
      sourceRef.current = source;

      const bufferLength = analyzer.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      draw();
    } catch (err) {
      console.error("Visualizer Error:", err);
    }
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    // Don't close AudioContext to reuse it
  };

  const draw = () => {
    if (!canvasRef.current || !analyzerRef.current || !dataArrayRef.current)
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const analyzer = analyzerRef.current;
    const dataArray = dataArrayRef.current;

    analyzer.getByteFrequencyData(dataArray as any);

    ctx.clearRect(0, 0, width, height);

    // Style
    const barWidth = (width / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;

    // Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#EAB308"); // Yellow-500
    gradient.addColorStop(1, "#CA8A04"); // Yellow-600

    for (let i = 0; i < dataArray.length; i++) {
      // Mirrored visualization for symmetry
      if (i > dataArray.length / 2) break; // Only draw half

      barHeight = (dataArray[i] / 255) * height;

      // Draw mirrored from center
      const centerX = width / 2;

      // Right side
      ctx.fillStyle = gradient;
      ctx.fillRect(
        centerX + x,
        height / 2 - barHeight / 2,
        barWidth - 1,
        barHeight,
      );

      // Left side
      ctx.fillRect(
        centerX - x - barWidth,
        height / 2 - barHeight / 2,
        barWidth - 1,
        barHeight,
      );

      x += barWidth;
    }

    animationFrameRef.current = requestAnimationFrame(draw);
  };

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className="w-full h-full opacity-80"
    />
  );
}
