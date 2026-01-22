"use client";

import Image, { ImageProps } from "next/image";

interface SafeImageProps extends Omit<ImageProps, "src"> {
  src: string | null | undefined;
  fallbackIcon?: string;
}

/**
 * External URL'ler için unoptimized kullanan güvenli Image component
 * External storage ve CDN URL'leri için 400 hatasını önler
 */
export function SafeImage({
  src,
  alt,
  fallbackIcon,
  ...props
}: SafeImageProps) {
  // src yoksa veya boşsa fallback göster
  if (!src) {
    return null;
  }

  // External URL kontrolü
  const isExternal = src.startsWith("http://") || src.startsWith("https://");

  return <Image src={src} alt={alt} unoptimized={isExternal} {...props} />;
}
