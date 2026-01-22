"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  X,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Crop,
  Sun,
  Contrast,
  Sparkles,
  Check,
} from "lucide-react";

interface Point {
  x: number;
  y: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
}

export function ImageEditorModal({
  isOpen,
  onClose,
  imageUrl,
  onSave,
}: ImageEditorModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);

  // Debug: Log image URL
  console.log("Image URL:", imageUrl);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      // CORS için crossOrigin ayarını kaldırıyoruz - same-origin images için gerekli değil
      // image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0,
    brightness = 100,
    contrast = 100,
    saturation = 100,
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas context not available");
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5,
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y),
    );

    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(canvas, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.95);
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(
        imageUrl,
        croppedAreaPixels,
        rotation,
        brightness,
        contrast,
        saturation,
      );
      onSave(croppedImage);
      onClose();
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Resim işlenirken hata oluştu");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setCrop({ x: 0, y: 0 });
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
          <div
            className="flex-1 relative bg-slate-950"
            style={{
              filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
            }}
          >
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={16 / 9}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              objectFit="contain"
              showGrid={true}
            />
          </div>

          {/* Controls Panel */}
          <div className="w-80 bg-slate-800 border-l border-slate-700 p-6 space-y-6 overflow-y-auto">
            {/* Crop Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Crop className="h-4 w-4 text-emerald-400" />
                <span>Kırpma</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Zoom</label>
                <div className="flex items-center gap-3">
                  <ZoomOut className="h-4 w-4 text-slate-400" />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <ZoomIn className="h-4 w-4 text-slate-400" />
                </div>
                <div className="text-xs text-slate-500 text-center">
                  {zoom.toFixed(1)}x
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-300">Döndür</label>
                <div className="flex items-center gap-3">
                  <RotateCw className="h-4 w-4 text-slate-400" />
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
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
