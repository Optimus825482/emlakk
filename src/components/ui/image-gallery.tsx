"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  title: string;
  mainImage?: string;
}

export function ImageGallery({ images, title, mainImage }: ImageGalleryProps) {
  const allImages = mainImage
    ? [mainImage, ...images.filter((img) => img !== mainImage)]
    : images;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!lightboxOpen) return;

      switch (e.key) {
        case "Escape":
          setLightboxOpen(false);
          break;
        case "ArrowLeft":
          setLightboxIndex((prev) =>
            prev > 0 ? prev - 1 : allImages.length - 1
          );
          break;
        case "ArrowRight":
          setLightboxIndex((prev) =>
            prev < allImages.length - 1 ? prev + 1 : 0
          );
          break;
      }
    },
    [lightboxOpen, allImages.length]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Body scroll lock when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const goToNext = () => {
    setLightboxIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  if (allImages.length === 0) {
    return (
      <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-gray-200 flex items-center justify-center">
        <Icon name="image" className="text-gray-400 text-6xl" />
      </div>
    );
  }

  return (
    <>
      {/* Main Image */}
      <div
        className="relative aspect-[16/10] rounded-3xl overflow-hidden shadow-lg cursor-pointer group"
        onClick={() => openLightbox(selectedIndex)}
      >
        <Image
          src={allImages[selectedIndex]}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority
        />
        {/* Zoom indicator */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-full p-3">
            <Icon
              name="zoom_in"
              className="text-[var(--demir-slate)] text-2xl"
            />
          </div>
        </div>
        {/* Image counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur text-white text-sm px-3 py-1.5 rounded-lg">
            {selectedIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {allImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 mt-4 scrollbar-thin">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                "relative w-24 h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200",
                selectedIndex === idx
                  ? "ring-3 ring-[var(--terracotta)] ring-offset-2"
                  : "opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={img}
                alt={`${title} ${idx + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <Icon name="close" className="text-white text-3xl" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-4 text-white/80 text-lg font-medium">
            {lightboxIndex + 1} / {allImages.length}
          </div>

          {/* Previous button */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <Icon name="chevron_left" className="text-white text-4xl" />
            </button>
          )}

          {/* Main lightbox image */}
          <div
            className="relative w-full h-full max-w-6xl max-h-[85vh] mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={allImages[lightboxIndex]}
              alt={`${title} ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Next button */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <Icon name="chevron_right" className="text-white text-4xl" />
            </button>
          )}

          {/* Thumbnail strip at bottom */}
          {allImages.length > 1 && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 backdrop-blur rounded-xl max-w-[90vw] overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={cn(
                    "relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all",
                    lightboxIndex === idx
                      ? "ring-2 ring-white"
                      : "opacity-50 hover:opacity-100"
                  )}
                >
                  <Image
                    src={img}
                    alt={`${title} ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Keyboard hint */}
          <div className="absolute bottom-4 right-4 text-white/50 text-sm hidden md:block">
            <span className="bg-white/10 px-2 py-1 rounded mr-2">←</span>
            <span className="bg-white/10 px-2 py-1 rounded mr-2">→</span>
            <span className="bg-white/10 px-2 py-1 rounded">ESC</span>
          </div>
        </div>
      )}
    </>
  );
}
