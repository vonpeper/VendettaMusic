import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    PORT: process.env.PORT || "3005"
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    // SVG optimization stays off (GHSA-2464-fhr4-w9xw / CVE-2026-96889).
    dangerouslyAllowSVG: false,
    // Block optimizer fetches that resolve to private IPs (GHSA-cjq9-62q9-8jv4).
    dangerouslyAllowLocalIP: false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/repertorio',
        destination: '/',
        permanent: false,
      },
    ];
  },
  async headers() {
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: blob: https://images.unsplash.com https://img.youtube.com https://i.ytimg.com https://*.google-analytics.com https://www.googletagmanager.com https://*.stripe.com;
      font-src 'self' data: https://fonts.gstatic.com;
      connect-src 'self' https://*.google-analytics.com https://analytics.google.com https://www.google-analytics.com https://stats.g.doubleclick.net https://api.stripe.com https://maps.googleapis.com https://*.vendetta.mx http://localhost:* https://localhost:* ws: wss:;
      frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://js.stripe.com https://hooks.stripe.com;
      media-src 'self' blob: data:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ],
      },
    ];
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
 
