import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  env: {
    // Expose server-side URL for middleware (Edge Runtime only sees NEXT_PUBLIC_ vars
    // and vars explicitly listed here — not arbitrary process.env at runtime).
    SUPABASE_INTERNAL_URL: process.env.SUPABASE_INTERNAL_URL,
  },
};

export default nextConfig;
