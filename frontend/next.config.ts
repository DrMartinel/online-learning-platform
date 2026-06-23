import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
    serverActions: {
      bodySizeLimit: '500mb',
    },
    proxyClientMaxBodySize: '500mb',
  },
  env: {
    // Expose server-side URL for middleware (Edge Runtime only sees NEXT_PUBLIC_ vars
    // and vars explicitly listed here — not arbitrary process.env at runtime).
    SUPABASE_INTERNAL_URL: process.env.SUPABASE_INTERNAL_URL,
  },
  async redirects() {
    return [
      {
        source: '/admin/exam-sessions',
        destination: '/admin/exams/sessions',
        permanent: true,
      },
      {
        source: '/admin/exam-sessions/:id/dashboard',
        destination: '/admin/exams/sessions/:id/dashboard',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
