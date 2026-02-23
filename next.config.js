// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "igavhuyqninnqluenvnn.supabase.co",
      },
    ],
  },
  experimental: {
    serverActions: {},
  },
};

module.exports = nextConfig;
