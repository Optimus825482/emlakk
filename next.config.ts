import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  images: {
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
      {
        protocol: "https",
        hostname: "cxeakfwtrlnjcjzvqdip.supabase.co",
        pathname: "/storage/**",
      },
    ],
  },
};

export default withWorkflow(nextConfig);
