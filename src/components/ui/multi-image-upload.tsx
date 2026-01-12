"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Icon } from "./icon";

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  maxImages?: number;
  label?: string;
}

export function MultiImageUpload({
  value = [],
  onChange,
  folder = "listings",
  maxImages = 10,
  label = "İlan Görselleri",
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - value.length;
    if (remainingSlots <= 0) {
      setError(`Maksimum ${maxImages} görsel yükleyebilirsiniz`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);
    setError(null);

    const newUrls: string[] = [];

    for (const file of filesToUpload) {
      // Dosya tipi kontrolü
      if (!file.type.startsWith("image/")) {
        setError("Sadece görsel dosyaları yükleyebilirsiniz");
        continue;
      }

      // Boyut kontrolü (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Dosya boyutu 5MB'dan küçük olmalıdır");
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Yükleme başarısız");
        }

        const data = await response.json();
        if (data.url) {
          newUrls.push(data.url);
        }
      } catch (err) {
        console.error("Upload error:", err);
        setError("Görsel yüklenirken hata oluştu");
      }
    }

    if (newUrls.length > 0) {
      onChange([...value, ...newUrls]);
    }

    setUploading(false);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleUpload(e.dataTransfer.files);
    },
    [value, maxImages]
  );

  const removeImage = (index: number) => {
    const newImages = [...value];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= value.length) return;
    const newImages = [...value];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onChange(newImages);
  };

  const setAsThumbnail = (index: number) => {
    if (index === 0) return;
    const newImages = [...value];
    const [selectedImage] = newImages.splice(index, 1);
    newImages.unshift(selectedImage);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-300">
            {label}
          </label>
          <span className="text-xs text-slate-500">
            {value.length}/{maxImages} görsel
          </span>
        </div>
      )}

      {/* Yükleme Alanı */}
      {value.length < maxImages && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-slate-600 hover:border-slate-500"
          }`}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Icon
                    name="sync"
                    className="text-emerald-400 text-2xl animate-spin"
                  />
                </div>
                <p className="text-slate-400">Yükleniyor...</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                  <Icon
                    name="add_photo_alternate"
                    className="text-slate-400 text-2xl"
                  />
                </div>
                <div>
                  <p className="text-white font-medium">
                    Görselleri sürükleyin veya tıklayın
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    PNG, JPG, WebP • Maks. 5MB • {maxImages - value.length}{" "}
                    görsel daha ekleyebilirsiniz
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hata Mesajı */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <Icon name="error" />
          {error}
        </div>
      )}

      {/* Görsel Galerisi */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {value.map((url, index) => (
            <div
              key={url}
              className={`relative group aspect-[4/3] rounded-xl overflow-hidden bg-slate-700 ${
                index === 0 ? "ring-2 ring-emerald-500" : ""
              }`}
            >
              <Image
                src={url}
                alt={`Görsel ${index + 1}`}
                fill
                className="object-cover"
              />

              {/* Kapak Rozeti */}
              {index === 0 && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded">
                  Kapak
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {/* Sola Taşı */}
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, index - 1)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    title="Sola taşı"
                  >
                    <Icon name="chevron_left" className="text-white" />
                  </button>
                )}

                {/* Kapak Yap */}
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => setAsThumbnail(index)}
                    className="p-2 bg-emerald-500/80 hover:bg-emerald-500 rounded-lg transition-colors"
                    title="Kapak yap"
                  >
                    <Icon name="star" className="text-white" />
                  </button>
                )}

                {/* Sil */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
                  title="Sil"
                >
                  <Icon name="delete" className="text-white" />
                </button>

                {/* Sağa Taşı */}
                {index < value.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, index + 1)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    title="Sağa taşı"
                  >
                    <Icon name="chevron_right" className="text-white" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bilgi */}
      {value.length > 0 && (
        <p className="text-xs text-slate-500">
          💡 İlk görsel kapak fotoğrafı olarak kullanılır. Sıralamayı
          değiştirmek için görsellerin üzerine gelin.
        </p>
      )}
    </div>
  );
}
