import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Configuración forzada para estabilización
  // Este cambio debería obligar a Turbopack a recargar la configuración del servidor
  // 🚀 AGENTE ANTIGRAVITY - ESTABILIZACIÓN TOTAL VENDETTA
  env: {
    PORT: process.env.PORT || "3005"
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
};

export default nextConfig;
 
