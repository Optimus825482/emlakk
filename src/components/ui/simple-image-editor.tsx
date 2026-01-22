"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import {
  X,
  RotateCw,
  Sun,
  Contrast,
  Sparkles,
  Check,
  RefreshCw,
} from "lucide-react";

interface SimpleImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
}

export function SimpleImageEditor({
  isOpen,
  onClose,
  imageUrl,
  onSave,
}: SimpleImageEditorProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleSave = useCallback(async () => {
    if (!imgRef.current || !completedCrop) {
      alert("Lütfen resmi kırpın");
      return;
    }

    setIsProcessing(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas context not available");
      }

      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;

      // Apply filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

      // Apply rotation
      if (rotation !== 0) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const base64Image = canvas.toDataURL("image/jpeg", 0.95);
      onSave(base64Image);
      onClose();
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Resim işlenirken hata oluştu");
    } finally {
      setIsProcessing(false);
    }
  }, [
    completedCrop,
    brightness,
    contrast,
    saturation,
    rotation,
    onSave,
    onClose,
  ]);

  const handleReset = () => {
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setCrop({
      unit: "%",
      width: 90,
      height: 90,
      x: 5,
      y: 5,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Resim Düzenle</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 relative bg-slate-950 overflow-auto flex items-center justify-center p-4">
            <div
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                transform: `rotate(${rotation}deg)`,
                transition: "all 0.3s ease",
              }}
            >
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={undefined}
              >
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Edit"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "70vh",
                  }}
                  onError={(e) => {
                    console.error("Image load error:", e);
                    alert("Resim yüklenemedi. URL: " + imageUrl);
                  }}
                />
              </ReactCrop>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-80 bg-slate-800 border-l border-slate-700 p-6 space-y-6 overflow-y-auto">
            {/* Rotation */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold">
                <RotateCw className="h-4 w-4 text-emerald-400" />
                <span>Döndür</span>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="text-xs text-slate-500 text-center">
                  {rotation}°
                </div>
              </div>
            </div>

            {/* Brightness */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Sun className="h-4 w-4 text-emerald-400" />
                <span>Parlaklık</span>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min={50}
                  max={150}
                  step={1}
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="text-xs text-slate-500 text-center">
                  {brightness}%
                </div>
              </div>
            </div>

            {/* Contrast */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Contrast className="h-4 w-4 text-emerald-400" />
                <span>Kontrast</span>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min={50}
                  max={150}
                  step={1}
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="text-xs text-slate-500 text-center">
                  {contrast}%
                </div>
              </div>
            </div>

            {/* Saturation */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span>Doygunluk</span>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min={0}
                  max={200}
                  step={1}
                  value={saturation}
                  onChange={(e) => setSaturation(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="text-xs text-slate-500 text-center">
                  {saturation}%
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sıfırla
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700 bg-slate-800">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            İptal
          </Button>
          <Button
            onClick={handleSave}
            disabled={isProcessing}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                İşleniyor...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Kaydet
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
