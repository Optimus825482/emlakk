import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Local uploads için optimization devre dışı
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/aida-public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "imaj.emlakjet.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
