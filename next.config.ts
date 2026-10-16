import type { NextConfig } from 'next';

function hostnameFromUrl(value: string | undefined) {
  if (!value) return null;
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

const supabaseHostname = hostnameFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const developmentTunnelHostname = hostnameFromUrl(process.env.MP_WEBHOOK_URL);

const nextConfig: NextConfig = {
  ...(process.env.PAYMENT_SANDBOX === 'true' || process.env.STORE_TUNNEL === 'true' ? { distDir: '.next-sandbox' } : {}),
  ...(developmentTunnelHostname?.endsWith('.trycloudflare.com')
    ? { allowedDevOrigins: [developmentTunnelHostname] }
    : {}),
  images: {
    qualities: [25, 50, 75, 90, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname ?? '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // --- ADICIONADO: Permissão para as fotos de perfil da Google/Microsoft ---
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          ...(process.env.PAYMENT_SANDBOX === 'true' ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }] : []),
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "base-uri 'self'; frame-ancestors 'none'; object-src 'none'",
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
