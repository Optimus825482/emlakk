"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Icon } from "./icon";
import { ImageEditor } from "./image-editor";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  aspectRatio?: string; // "3:4", "16:9", "1:1" etc.
  recommendedSize?: string; // "600x800", "1920x1080" etc.
  label?: string;
  className?: string;
  enableEditor?: boolean; // Görsel düzenleyiciyi etkinleştir
}

export function ImageUpload({
  value,
  onChange,
  folder = "images",
  aspectRatio = "3:4",
  recommendedSize = "600x800",
  label = "Fotoğraf",
  className = "",
  enableEditor = true,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File | Blob, skipEditor = false) => {
      setError(null);

      // Eğer editor etkinse ve skip değilse, önce editörü aç
      if (enableEditor && !skipEditor && file instanceof File) {
        setPendingFile(file);
        setEditingUrl(URL.createObjectURL(file));
        setShowEditor(true);
        return;
      }

      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Yükleme hatası");
        }

        onChange(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Yükleme hatası");
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange, enableEditor]
  );

  // Editor'dan gelen düzenlenmiş resmi yükle
  const handleEditorSave = async (blob: Blob) => {
    setShowEditor(false);
    setEditingUrl(null);
    setPendingFile(null);
    await handleUpload(blob, true);
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
    if (editingUrl) {
      URL.revokeObjectURL(editingUrl);
    }
    setEditingUrl(null);
    setPendingFile(null);
  };

  // Mevcut resmi düzenle
  const handleEditExisting = () => {
    if (value) {
      setEditingUrl(value);
      setShowEditor(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleUpload(file);
    } else {
      setError("Lütfen bir resim dosyası sürükleyin");
    }
  };

  const handleRemove = () => {
    onChange("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  // Sabit yükseklik kullan, aspect ratio sadece bilgi amaçlı
  const containerHeight = "300px";

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label ve Boyut Bilgisi */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="px-2 py-0.5 bg-slate-700 rounded">
            En-Boy: {aspectRatio}
          </span>
          <span className="px-2 py-0.5 bg-slate-700 rounded">
            Önerilen: {recommendedSize}px
          </span>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`relative rounded-xl border-2 border-dashed transition-all overflow-hidden ${
          dragActive
            ? "border-emerald-500 bg-emerald-500/10"
            : value
            ? "border-slate-600 bg-slate-900"
            : "border-slate-600 hover:border-slate-500 bg-slate-900"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Container with max height */}
        <div style={{ height: containerHeight }} className="relative">
          {value ? (
            // Preview - resmin tamamı görünsün
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
              <Image
                src={value}
                alt="Preview"
                fill
                className="object-contain"
                unoptimized={value.startsWith("/uploads")}
              />
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {enableEditor && (
                  <button
                    type="button"
                    onClick={handleEditExisting}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-500/80 hover:bg-emerald-500 text-white rounded-lg backdrop-blur-sm transition-colors"
                  >
                    <Icon name="tune" />
                    Düzenle
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-colors"
                >
                  <Icon name="refresh" />
                  Değiştir
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  <Icon name="delete" />
                  Kaldır
                </button>
              </div>
            </div>
          ) : (
            // Upload prompt
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  <p className="text-sm text-slate-400">Yükleniyor...</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                    <Icon
                      name="cloud_upload"
                      className="text-3xl text-slate-400"
                    />
                  </div>
                  <p className="text-sm text-slate-300 mb-1">
                    Resmi sürükleyip bırakın veya
                  </p>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    dosya seçin
                  </button>
                  <p className="text-xs text-slate-500 mt-3">
                    JPG, PNG, WebP • Maks. 5MB
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <Icon name="error" className="text-base" />
          {error}
        </div>
      )}

      {/* Hidden Input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* URL Input (alternatif) */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="veya URL yapıştırın..."
            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Image Editor Modal */}
      {showEditor && editingUrl && (
        <ImageEditor
          imageUrl={editingUrl}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}
    </div>
  );
}
