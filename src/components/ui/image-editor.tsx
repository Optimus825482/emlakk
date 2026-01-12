"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "./icon";

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // width/height, örn: 4/3 = 1.33
}

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  shadows: number;
  highlights: number;
  sharpness: number;
}

const defaultAdjustments: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  shadows: 0,
  highlights: 0,
  sharpness: 0,
};

type EditorMode = "adjust" | "crop" | "rotate";

export function ImageEditor({
  imageUrl,
  onSave,
  onCancel,
  aspectRatio,
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<EditorMode>("adjust");
  const [adjustments, setAdjustments] =
    useState<Adjustments>(defaultAdjustments);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // Crop state
  const [cropArea, setCropArea] = useState({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropMode, setCropMode] = useState<"move" | "resize" | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      originalImageRef.current = img;
      setLoading(false);
      // Initialize crop area
      setCropArea({ x: 0, y: 0, width: img.width, height: img.height });
      renderCanvas();
    };
    img.onerror = () => {
      setLoading(false);
      alert("Resim yüklenemedi");
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Render canvas with adjustments
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Calculate dimensions with rotation
    const isRotated90 = rotation === 90 || rotation === 270;
    const displayWidth = isRotated90 ? img.height : img.width;
    const displayHeight = isRotated90 ? img.width : img.height;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply transformations
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // Apply CSS filters for adjustments
    const filters = [
      `brightness(${100 + adjustments.brightness + adjustments.exposure}%)`,
      `contrast(${100 + adjustments.contrast}%)`,
      `saturate(${100 + adjustments.saturation}%)`,
    ].join(" ");
    ctx.filter = filters;

    // Draw image centered
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    // Restore context
    ctx.restore();

    // Apply sharpness (unsharp mask simulation)
    if (adjustments.sharpness > 0) {
      applySharpness(ctx, canvas.width, canvas.height, adjustments.sharpness);
    }
  }, [adjustments, rotation, flipH, flipV]);

  // Re-render when adjustments change
  useEffect(() => {
    if (!loading) {
      renderCanvas();
    }
  }, [loading, renderCanvas]);

  // Apply sharpness using convolution
  const applySharpness = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    amount: number
  ) => {
    if (amount <= 0) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const factor = amount / 100;

    // Simple unsharp mask
    const kernel = [
      0,
      -factor,
      0,
      -factor,
      1 + 4 * factor,
      -factor,
      0,
      -factor,
      0,
    ];

    const tempData = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += tempData[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          const idx = (y * width + x) * 4 + c;
          data[idx] = Math.min(255, Math.max(0, sum));
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // Auto enhance
  const autoEnhance = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Calculate histogram
    let minR = 255,
      maxR = 0;
    let minG = 255,
      maxG = 0;
    let minB = 255,
      maxB = 0;
    let totalBrightness = 0;

    for (let i = 0; i < data.length; i += 4) {
      minR = Math.min(minR, data[i]);
      maxR = Math.max(maxR, data[i]);
      minG = Math.min(minG, data[i + 1]);
      maxG = Math.max(maxG, data[i + 1]);
      minB = Math.min(minB, data[i + 2]);
      maxB = Math.max(maxB, data[i + 2]);
      totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }

    const avgBrightness = totalBrightness / (data.length / 4);
    const contrastRange = Math.max(maxR - minR, maxG - minG, maxB - minB);

    // Calculate optimal adjustments
    const brightnessAdjust =
      avgBrightness < 100 ? 15 : avgBrightness > 180 ? -10 : 0;
    const contrastAdjust =
      contrastRange < 150 ? 20 : contrastRange > 230 ? -5 : 10;
    const saturationAdjust = 10; // Slight boost
    const sharpnessAdjust = 15; // Slight sharpening

    setAdjustments({
      brightness: brightnessAdjust,
      contrast: contrastAdjust,
      saturation: saturationAdjust,
      exposure: 0,
      shadows: 5,
      highlights: -5,
      sharpness: sharpnessAdjust,
    });
  };

  // Reset all
  const resetAll = () => {
    setAdjustments(defaultAdjustments);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    if (originalImageRef.current) {
      setCropArea({
        x: 0,
        y: 0,
        width: originalImageRef.current.width,
        height: originalImageRef.current.height,
      });
    }
  };

  // Rotate
  const rotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees + 360) % 360);
  };

  // Save edited image
  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSaving(true);

    try {
      // If crop mode, apply crop
      let finalCanvas = canvas;
      if (mode === "crop") {
        const croppedCanvas = document.createElement("canvas");
        const ctx = croppedCanvas.getContext("2d");
        if (ctx) {
          croppedCanvas.width = cropArea.width;
          croppedCanvas.height = cropArea.height;
          ctx.drawImage(
            canvas,
            cropArea.x,
            cropArea.y,
            cropArea.width,
            cropArea.height,
            0,
            0,
            cropArea.width,
            cropArea.height
          );
          finalCanvas = croppedCanvas;
        }
      }

      finalCanvas.toBlob(
        (blob) => {
          if (blob) {
            onSave(blob);
          }
          setSaving(false);
        },
        "image/jpeg",
        0.92
      );
    } catch (error) {
      console.error("Save error:", error);
      setSaving(false);
    }
  };

  // Adjustment slider component
  const AdjustmentSlider = ({
    label,
    value,
    onChange,
    min = -100,
    max = 100,
    icon,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    icon: string;
  }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name={icon} className="text-slate-400 text-sm" />
          <span className="text-xs text-slate-300">{label}</span>
        </div>
        <span className="text-xs text-slate-500 font-mono w-8 text-right">
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
      />
    </div>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Icon name="close" />
          </button>
          <h2 className="text-lg font-semibold text-white">
            Görsel Düzenleyici
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetAll}
            className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm transition-colors"
          >
            <Icon name="restart_alt" />
            Sıfırla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
          >
            <Icon name={saving ? "hourglass_empty" : "check"} />
            {saving ? "Kaydediliyor..." : "Uygula"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8 bg-slate-950">
          <div className="relative max-w-full max-h-full">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[calc(100vh-200px)] object-contain rounded-lg shadow-2xl"
            />

            {/* Crop overlay */}
            {mode === "crop" && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Darkened areas outside crop */}
                <div
                  className="absolute bg-black/60"
                  style={{
                    top: 0,
                    left: 0,
                    right: 0,
                    height: `${
                      (cropArea.y / (canvasRef.current?.height || 1)) * 100
                    }%`,
                  }}
                />
                {/* Crop handles would go here */}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
          {/* Mode Tabs */}
          <div className="flex border-b border-slate-800">
            {[
              { id: "adjust" as const, icon: "tune", label: "Ayarlar" },
              { id: "crop" as const, icon: "crop", label: "Kırp" },
              { id: "rotate" as const, icon: "rotate_right", label: "Döndür" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  mode === tab.id
                    ? "text-emerald-400 bg-slate-800"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Icon name={tab.icon} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mode Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {mode === "adjust" && (
              <div className="space-y-6">
                {/* Auto Enhance */}
                <button
                  onClick={autoEnhance}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl font-medium hover:from-emerald-500/30 hover:to-blue-500/30 transition-all"
                >
                  <Icon name="auto_fix_high" />
                  Otomatik İyileştir
                </button>

                {/* Light */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Işık
                  </h4>
                  <AdjustmentSlider
                    label="Parlaklık"
                    icon="brightness_6"
                    value={adjustments.brightness}
                    onChange={(v) =>
                      setAdjustments({ ...adjustments, brightness: v })
                    }
                  />
                  <AdjustmentSlider
                    label="Pozlama"
                    icon="exposure"
                    value={adjustments.exposure}
                    onChange={(v) =>
                      setAdjustments({ ...adjustments, exposure: v })
                    }
                  />
                  <AdjustmentSlider
                    label="Kontrast"
                    icon="contrast"
                    value={adjustments.contrast}
                    onChange={(v) =>
                      setAdjustments({ ...adjustments, contrast: v })
                    }
                  />
                  <AdjustmentSlider
                    label="Gölgeler"
                    icon="gradient"
                    value={adjustments.shadows}
                    onChange={(v) =>
                      setAdjustments({ ...adjustments, shadows: v })
                    }
                  />
                  <AdjustmentSlider
                    label="Aydınlıklar"
                    icon="wb_sunny"
                    value={adjustments.highlights}
                    onChange={(v) =>
                      setAdjustments({ ...adjustments, highlights: v })
                    }
                  />
                </div>

                {/* Color */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Renk
                  </h4>
                  <AdjustmentSlider
                    label="Doygunluk"
                    icon="palette"
                    value={adjustments.saturation}
                    onChange={(v) =>
                      setAdjustments({ ...adjustments, saturation: v })
                    }
                  />
                </div>

                {/* Detail */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Detay
                  </h4>
                  <AdjustmentSlider
                    label="Keskinlik"
                    icon="deblur"
                    value={adjustments.sharpness}
                    onChange={(v) =>
                      setAdjustments({ ...adjustments, sharpness: v })
                    }
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            )}

            {mode === "crop" && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Kırpma alanını seçmek için resim üzerinde sürükleyin.
                </p>

                {/* Aspect Ratio Presets */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    En-Boy Oranı
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Serbest", ratio: null },
                      { label: "1:1", ratio: 1 },
                      { label: "4:3", ratio: 4 / 3 },
                      { label: "3:4", ratio: 3 / 4 },
                      { label: "16:9", ratio: 16 / 9 },
                      { label: "9:16", ratio: 9 / 16 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {mode === "rotate" && (
              <div className="space-y-6">
                {/* Rotation */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Döndür
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => rotate(-90)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                      <Icon name="rotate_left" />
                      90° Sol
                    </button>
                    <button
                      onClick={() => rotate(90)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                      <Icon name="rotate_right" />
                      90° Sağ
                    </button>
                  </div>
                </div>

                {/* Flip */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Çevir
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFlipH(!flipH)}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                        flipH
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 hover:bg-slate-700 text-white"
                      }`}
                    >
                      <Icon name="flip" />
                      Yatay
                    </button>
                    <button
                      onClick={() => setFlipV(!flipV)}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                        flipV
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 hover:bg-slate-700 text-white"
                      }`}
                    >
                      <Icon name="flip" className="rotate-90" />
                      Dikey
                    </button>
                  </div>
                </div>

                {/* Current rotation display */}
                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Mevcut Açı</span>
                    <span className="text-lg font-bold text-white">
                      {rotation}°
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Features (Coming Soon) */}
          <div className="p-4 border-t border-slate-800">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="auto_awesome" className="text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase">
                  Yakında
                </span>
              </div>
              <p className="text-xs text-slate-400">
                AI ile obje silme, arka plan değiştirme ve daha fazlası...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
